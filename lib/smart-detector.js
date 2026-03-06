/**
 * Smart Detector - 智能检测器
 * 
 * 负责检测相似文档，智能决策是创建新文章还是更新老文章
 */

export class SmartDetector {
  constructor(options = {}) {
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
    
    // 3. 计算相似度
    const results = similarDocs.map(doc => ({
      docId: doc.id,
      title: doc.title,
      category: doc.category,
      excerpt: doc.excerpt,
      similarity: this.calculateSimilarity(currentKeywords, doc.excerpt)
    }));
    
    // 按相似度排序
    results.sort((a, b) => b.similarity - a.similarity);
    
    const bestMatch = results[0];
    
    // 4. 根据阈值决策
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
   * 提取关键词
   */
  extractKeywords(conversationHistory) {
    const text = conversationHistory
      .map(msg => msg.content)
      .join(' ');
    
    // 简单的关键词提取（可以优化为 TF-IDF 或更复杂的算法）
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // 移除标点
      .split(/\s+/)
      .filter(w => w.length > 3);  // 过滤短词
    
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
   * 计算相似度（Jaccard 相似度）
   */
  calculateSimilarity(keywords, text) {
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
    
    return Math.min(score, 1.0);  // 确保不超过 1
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
