/**
 * Knowledge Extractor - 会话提炼器
 * 
 * 负责从 OpenClaw 会话中自动提取结构化知识
 * 识别技术决策、代码实现、问题记录等关键信息
 * 
 * 支持多语言：中文、英文、日文、韩文
 */

import fetch from 'node-fetch';
import { getPrompt, detectLanguage, isValidLanguage, DEFAULT_LANGUAGE } from './i18n.js';

export class KnowledgeExtractor {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENCLAW_API_KEY;
    this.apiEndpoint = options.apiEndpoint || 'https://api.openclaw.ai/v1';
    this.language = options.language || process.env.DEFAULT_LANGUAGE || DEFAULT_LANGUAGE;
  }

  /**
   * 从当前会话中提取知识
   * @param {Object} params - 参数
   * @param {string} params.title - 知识卡片标题
   * @param {string} params.category - 分类（架构/模块/规范/问题）
   * @param {Array} params.conversationHistory - 会话历史
   * @param {string} params.language - 语言代码（可选，自动检测）
   * @returns {Promise<Object>} 提炼的知识卡片
   */
  async extractCurrentConversation({ title, category, conversationHistory = [], language }) {
    if (!conversationHistory || conversationHistory.length === 0) {
      const errorMsg = getPrompt('errors', 'emptyConversation', this.language);
      throw new Error(errorMsg);
    }

    // 自动检测语言或手动指定
    const targetLanguage = language || detectLanguage(title);
    if (!isValidLanguage(targetLanguage)) {
      console.warn(`Invalid language '${targetLanguage}', using default '${this.language}'`);
    }

    const prompt = this.buildExtractionPrompt(title, category, conversationHistory, targetLanguage);
    
    try {
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
              content: this.getSystemPrompt(targetLanguage)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API 调用失败：${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const extractedContent = data.choices[0].message.content;

      return {
        title,
        category,
        content: extractedContent,
        createdAt: new Date().toISOString(),
        tags: this.extractTags(extractedContent, category)
      };
    } catch (error) {
      const errorMsg = getPrompt('errors', 'extractionFailed', this.language);
      console.error(`${errorMsg}:`, error);
      throw error;
    }
  }

  /**
   * 构建提炼提示词 - 支持多语言
   * @param {string} title - 标题
   * @param {string} category - 分类
   * @param {Array} conversationHistory - 会话历史
   * @param {string} language - 语言代码
   */
  buildExtractionPrompt(title, category, conversationHistory, language = this.language) {
    // 获取会话文本
    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // 从 i18n 获取对应语言的提示词
    const systemPrompt = getPrompt('extractor', 'systemPrompt', language);
    let extractionPrompt = getPrompt('extractor', 'extractionPrompt', language);
    
    // 替换模板中的变量
    extractionPrompt = extractionPrompt
      .replace(/\${title}/g, title)
      .replace(/\${category}/g, category)
      .replace(/{conversationText}/g, conversationText);

    return extractionPrompt;
  }

  /**
   * 系统提示词 - 支持多语言
   * @param {string} language - 语言代码
   */
  getSystemPrompt(language = this.language) {
    return getPrompt('extractor', 'systemPrompt', language);
  }

  /**
   * 从内容中提取标签
   */
  extractTags(content, category) {
    const tags = [category];
    
    // 从内容中提取技术关键词
    const techKeywords = [
      'aiohttp', 'requests', 'async', 'XPath', 'JSON',
      'API', '数据库', '爬虫', '解析器'
    ];
    
    techKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    });
    
    return [...new Set(tags)];
  }

  /**
   * 格式化知识卡片为 Markdown
   */
  formatToMarkdown(knowledgeCard) {
    const { title, category, content, createdAt, tags } = knowledgeCard;
    
    return `---
title: ${title}
category: ${category}
tags: [${tags.join(', ')}]
created: ${createdAt}
---

${content}
`;
  }
}
