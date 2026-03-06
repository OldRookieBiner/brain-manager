/**
 * Knowledge Extractor - 会话提炼器
 * 
 * 负责从 OpenClaw 会话中自动提取结构化知识
 * 识别技术决策、代码实现、问题记录等关键信息
 */

import fetch from 'node-fetch';

export class KnowledgeExtractor {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENCLAW_API_KEY;
    this.apiEndpoint = options.apiEndpoint || 'https://api.openclaw.ai/v1';
  }

  /**
   * 从当前会话中提取知识
   * @param {Object} params - 参数
   * @param {string} params.title - 知识卡片标题
   * @param {string} params.category - 分类（架构/模块/规范/问题）
   * @param {Array} params.conversationHistory - 会话历史
   * @returns {Promise<Object>} 提炼的知识卡片
   */
  async extractCurrentConversation({ title, category, conversationHistory = [] }) {
    if (!conversationHistory || conversationHistory.length === 0) {
      throw new Error('会话历史为空，无法提炼知识');
    }

    const prompt = this.buildExtractionPrompt(title, category, conversationHistory);
    
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
              content: this.getSystemPrompt()
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
      console.error('知识提炼失败:', error);
      throw error;
    }
  }

  /**
   * 构建提炼提示词 - 优化为生成人可读的流畅文章
   */
  buildExtractionPrompt(title, category, conversationHistory) {
    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
      .join('\n\n');

    return `请从以下会话对话中提炼一篇高质量的技术知识文档。

## 要求
1. **人可读优先**：使用流畅的技术语言，像写技术博客一样
2. **结构化呈现**：便于后续检索和复用
3. **内容完整**：突出技术决策、代码实现、问题解决方案
4. **可读性强**：逻辑清晰，便于人类阅读理解

## 输出格式
请严格按照以下 Markdown 格式输出：

\`\`\`markdown
# ${title}

> **摘要**：[用 1-2 句话概括本文档的核心内容，便于快速了解]

## 📋 背景
[描述这个知识产生的背景，为什么要讨论这个话题，解决了什么问题]

## 🎯 核心内容

### 技术决策
[详细描述重要的技术选型和决策，说明原因和对比分析]

### 代码实现
[提取关键代码片段，附带详细注释和使用说明]

### 问题记录
[记录遇到的问题和解决方案，包括现象、原因、解决过程]

### 最佳实践
[总结出的经验教训和最佳实践建议]

### 待办事项
[列出后续需要完成的任务]

## 📚 参考资料
[相关链接、文档等]

## 🏷️ 标签
#[category} #[关键词 1] #[关键词 2]

---
**文档版本**: v1.0  
**创建时间**: ${new Date().toISOString().split('T')[0]}  
**最后更新**: ${new Date().toISOString().split('T')[0]}  
**作者**: OpenClaw 知识提炼
\`\`\`

## 会话内容
${conversationText}
`;
  }

  /**
   * 系统提示词 - 优化为生成人可读的流畅文章
   */
  getSystemPrompt() {
    return `你是一个专业的技术文档撰写专家，擅长从技术对话中创作高质量的知识文档。

你的职责：
1. 识别关键的技术决策和实现细节
2. 提取有价值的代码片段和解决方案
3. 记录问题排查过程和经验教训
4. 生成清晰、结构化、可读性强的技术文档

写作要求：
- 使用流畅的技术语言，像写技术博客一样
- 逻辑清晰，便于人类阅读理解
- 结构完整，包含背景、决策、实现、总结
- 代码规范，附带注释和说明
- 客观准确，不添加个人意见
- 遵循 Markdown 格式，便于阅读和检索

注意事项：
- 保持专业但不枯燥
- 详细但不啰嗦
- 结构化但不僵化
- 可以直接作为团队文档使用
- 保持客观准确，不添加个人意见`;
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
