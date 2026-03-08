/**
 * Smart Detector - 智能检测器（增强版）
 * 
 * 功能：
 * 1. 使用 OpenClaw API 进行语义相似度分析
 * 2. 综合判断：关键词匹配 + 语义理解 + 标题对比
 * 3. 智能决策：创建新文章 or 更新老文章
 * 
 * 支持多语言：中文、英文、日文、韩文
 */

import fetch from 'node-fetch';
import { getPrompt, detectLanguage } from './i18n.js';

export class SmartDetector {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENCLAW_API_KEY;
    this.apiEndpoint = options.apiEndpoint || 'https://api.openclaw.ai/v1';
    this.language = options.language || process.env.DEFAULT_LANGUAGE || 'zh';
    
    this.thresholds = options.thresholds || {
      autoUpdate: 0.8,    // >80% 自动更新
      askUser: 0.5,       // 50-80% 询问用户
      createNew: 0.5      // <50% 创建新文章
    };
  }

  /**
   * 检测是否应该更新已有文档
   * @param {string} title - 文章标题
   * @param {string} category - 分类
   * @param {Array} conversationHistory - 会话历史
   * @param {Object} retriever - 检索器实例
   * @returns {Promise<Object>} 检测结果
   */
  async shouldUpdateExisting(title, category, conversationHistory, retriever) {
    // 1. 提取当前会话关键词
    const currentKeywords = this.extractKeywords(conversationHistory);
    
    // 2. 检索相似文章
    const similarDocs = await retriever.search(title, 5, { 
      category,
      searchLocal: true,
      searchSiYuan: true
    });
    
    if (similarDocs.length === 0) {
      return { action: 'create_new', similarity: 0 };
    }
    
    // 3. 对每篇文章计算综合相似度
    const results = [];
    for (const doc of similarDocs) {
      const similarity = await this.calculateComprehensiveSimilarity(
        title,
        currentKeywords,
        doc
      );
      
      results.push({
        docId: doc.id,
        title: doc.title,
        category: doc.category,
        excerpt: doc.excerpt,
        similarity: similarity.final,
        breakdown: {
          keyword: similarity.keyword,
          semantic: similarity.semantic,
          title: similarity.title
        }
      });
    }
    
    // 4. 按相似度排序
    results.sort((a, b) => b.similarity - a.similarity);
    
    const bestMatch = results[0];
    
    // 5. 根据阈值决策
    if (bestMatch.similarity >= this.thresholds.autoUpdate) {
      return {
        action: 'auto_update',
        docId: bestMatch.docId,
        title: bestMatch.title,
        similarity: bestMatch.similarity,
        suggestions: results.slice(0, 3)
      };
    } else if (bestMatch.similarity >= this.thresholds.askUser) {
      return {
        action: 'ask_user',
        suggestions: results.slice(0, 5),
        bestMatch
      };
    } else {
      return {
        action: 'create_new',
        similarity: bestMatch.similarity,
        closestMatch: bestMatch
      };
    }
  }

  /**
   * 计算综合相似度（关键词 + 语义 + 标题）
   */
  async calculateComprehensiveSimilarity(currentTitle, currentKeywords, existingDoc) {
    // 1. 关键词匹配（40%）
    const keywordScore = this.calculateKeywordSimilarity(currentKeywords, existingDoc.excerpt);
    
    // 2. 语义相似度（40%）- 使用 OpenClaw API
    const semanticScore = await this.calculateSemanticSimilarityWithAPI(
      currentTitle,
      existingDoc.title
    );
    
    // 3. 标题字符串相似度（20%）
    const titleScore = this.stringSimilarity(currentTitle, existingDoc.title);
    
    // 综合得分
    const finalScore = keywordScore * 0.4 + semanticScore * 0.4 + titleScore * 0.2;
    
    return {
      final: finalScore,
      keyword: keywordScore,
      semantic: semanticScore,
      title: titleScore
    };
  }

  /**
   * 使用 OpenClaw API 计算语义相似度（支持多语言）
   */
  async calculateSemanticSimilarityWithAPI(title1, title2) {
    try {
      // 从 i18n 获取对应语言的提示词
      let prompt = getPrompt('smartDetector', 'semanticAnalysis', this.language);
      
      // 替换模板中的变量
      prompt = prompt
        .replace(/{title1}/g, title1)
        .replace(/{title2}/g, title2);

      const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'openclaw-v1',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的语义分析助手，擅长判断文本之间的语义相似度。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,  // 低温度，确保输出稳定
          max_tokens: 10
        })
      });

      if (!response.ok) {
        throw new Error(`API 返回 ${response.status}`);
      }

      const data = await response.json();
      const scoreText = data.choices[0].message.content.trim();
      
      // 解析返回的数字
      const score = parseFloat(scoreText);
      
      if (isNaN(score)) {
        console.warn('[SmartDetector] 语义分析返回格式异常，使用默认值 0.5');
        return 0.5;
      }
      
      // 确保在 0-1 范围内
      return Math.min(Math.max(score, 0), 1);
    } catch (error) {
      console.error('[SmartDetector] 语义分析失败:', error.message);
      // 失败时返回默认值
      return 0.5;
    }
  }

  /**
   * 关键词匹配相似度
   */
  calculateKeywordSimilarity(keywords, text) {
    const textWords = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    const textSet = new Set(textWords);
    const intersection = keywords.filter(k => textSet.has(k));
    const union = new Set([...keywords, ...textWords]);
    
    // Jaccard 相似度
    const jaccard = intersection.length / union.size;
    
    // 考虑关键词覆盖率
    const coverage = intersection.length / keywords.length;
    
    // 综合得分（Jaccard 占 60%，覆盖率占 40%）
    const score = jaccard * 0.6 + coverage * 0.4;
    
    return Math.min(score, 1.0);
  }

  /**
   * 提取关键词
   */
  extractKeywords(conversationHistory) {
    const text = conversationHistory
      .map(msg => msg.content)
      .join(' ');
    
    // 简单的关键词提取
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // 统计词频
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 返回高频词
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
    
    return keywords;
  }

  /**
   * 字符串相似度（用于标题匹配）
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
