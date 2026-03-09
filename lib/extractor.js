/**
 * Knowledge Extractor - 会话提炼器
 * 
 * 负责从 OpenClaw 会话中自动提取结构化知识
 * 识别技术决策、代码实现、问题记录等关键信息
 * 
 * 支持多语言：中文、英文
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
   * @param {Array} params.aiKeywords - AI 提取的关键词（可选）
   * @returns {Promise<Object>} 提炼的知识卡片
   */
  async extractCurrentConversation({ title, category, conversationHistory = [], language, aiKeywords = [] }) {
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
    
    // 添加超时控制（60 秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('[Extractor] API 请求超时（60 秒）');
    }, 60000);
    
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
        }),
        signal: controller.signal  // 添加超时控制
      });

      // 清理超时定时器
      clearTimeout(timeoutId);

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
        tags: this.extractTags(extractedContent, category, aiKeywords)
      };
    } catch (error) {
      // 清理超时定时器
      clearTimeout(timeoutId);
      
      // 处理超时错误
      if (error.name === 'AbortError') {
        const timeoutMsg = '提炼请求超时（60 秒），请稍后重试';
        console.error(`[Extractor] ${timeoutMsg}`);
        throw new Error(timeoutMsg);
      }
      
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
   * 从内容中提取标签（优化版）
   * @param {string} content - 文章内容
   * @param {string} category - 分类
   * @param {Array} aiKeywords - AI 提取的关键词（可选）
   * @returns {Array} 标签数组
   */
  extractTags(content, category, aiKeywords = []) {
    const tags = new Set();
    
    // 1. 添加分类作为第一个标签
    tags.add(category);
    
    // 2. 优先使用 AI 提取的关键词（前 5 个）
    if (aiKeywords && aiKeywords.length > 0) {
      aiKeywords.slice(0, 5).forEach(keyword => {
        const trimmed = keyword.trim();
        if (trimmed && trimmed.length > 0) {
          tags.add(trimmed);
        }
      });
    }
    
    // 3. 扩展的技术关键词库（分类管理）
    const techKeywordsByCategory = {
      // Web 开发
      web: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Koa', 'Next.js', 'Nuxt.js', 'Webpack', 'Vite'],
      
      // API & 网络
      api: ['REST', 'GraphQL', 'WebSocket', 'gRPC', 'API', 'HTTP', 'HTTPS', 'CORS', 'AJAX', 'Fetch'],
      
      // 数据库
      database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', '数据库', 'SQL', 'NoSQL', 'ORM', 'Prisma'],
      
      // Python
      python: ['Python', 'Django', 'Flask', 'FastAPI', 'aiohttp', 'requests', 'async', 'asyncio', 'pandas', 'numpy'],
      
      // JavaScript/TypeScript
      javascript: ['JavaScript', 'TypeScript', 'ES6', 'Promise', 'async', 'await', 'Node.js', 'npm', 'yarn'],
      
      // 架构 & 设计
      architecture: ['微服务', '单体', '分布式', '云原生', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps', '架构', '设计模式'],
      
      // 测试 & 质量
      testing: ['测试', '单元测试', '集成测试', 'E2E', 'Jest', 'Mocha', 'Cypress', '覆盖率', 'TDD'],
      
      // 安全
      security: ['安全', '认证', '授权', 'JWT', 'OAuth', '加密', 'HTTPS', 'XSS', 'CSRF', 'SQL注入'],
      
      // 性能
      performance: ['性能', '优化', '缓存', 'CDN', '负载均衡', '并发', '异步', '性能监控'],
      
      // 其他
      other: ['日志', '监控', '错误处理', '配置', '环境变量', 'Git', '版本控制']
    };
    
    // 4. 智能匹配关键词
    const contentLower = content.toLowerCase();
    
    Object.values(techKeywordsByCategory).forEach(keywords => {
      keywords.forEach(keyword => {
        // 使用正则表达式匹配（更准确）
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
        if (regex.test(contentLower)) {
          tags.add(keyword);
        }
      });
    });
    
    // 5. 提取代码相关标签
    const codePatterns = [
      { pattern: /```[\s\S]*?```/g, tag: '代码示例' },
      { pattern: /`[^`]+`/g, tag: '代码片段' },
      { pattern: /function\s+\w+/g, tag: '函数' },
      { pattern: /class\s+\w+/g, tag: '类' },
      { pattern: /interface\s+\w+/g, tag: '接口' },
      { pattern: /const\s+\w+/g, tag: '常量' },
      { pattern: /import\s+.+/g, tag: '模块导入' }
    ];
    
    codePatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(content)) {
        tags.add(tag);
      }
    });
    
    // 6. 转换为数组并按重要性排序
    const tagsArray = Array.from(tags);
    
    // 排序：分类 > AI 关键词 > 技术关键词 > 代码标签
    const sortedTags = tagsArray.sort((a, b) => {
      // 分类始终在最前面
      if (a === category) return -1;
      if (b === category) return 1;
      
      // AI 关键词优先
      const aIsAI = aiKeywords.includes(a);
      const bIsAI = aiKeywords.includes(b);
      if (aIsAI && !bIsAI) return -1;
      if (!aIsAI && bIsAI) return 1;
      
      // 其他按字母排序
      return a.localeCompare(b);
    });
    
    // 7. 限制数量（最多 10 个）
    return sortedTags.slice(0, 10);
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
