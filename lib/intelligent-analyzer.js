/**
 * Intelligent Analyzer - 智能会话分析器
 * 
 * 功能：
 * 1. 检测会话中的话题数量（单话题/多话题）
 * 2. 为每个话题生成标题建议
 * 3. 为每个话题推荐分类
 * 4. 提取关键词
 * 5. 评估话题重要性
 * 
 * 支持多语言：中文、英文
 */

import fetch from 'node-fetch';
import { getPrompt, detectLanguage } from './i18n.js';

export class IntelligentAnalyzer {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENCLAW_API_KEY;
    this.apiEndpoint = options.apiEndpoint || 'https://api.openclaw.ai/v1';
    this.language = options.language || process.env.DEFAULT_LANGUAGE || 'zh';
  }

  /**
   * 深度分析会话内容
   * @param {Array} conversationHistory - 会话历史
   * @returns {Promise<Object>} 分析结果
   */
  async analyze(conversationHistory) {
    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // 检测语言
    const language = detectLanguage(conversationText);

    // 构建分析提示词
    const prompt = this.buildAnalysisPrompt(conversationText, language);

    try {
      // 添加超时控制（30 秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('AI 分析请求超时（30 秒）');
      }, 30000);

      const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openclaw-v1',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(language)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,  // 较低温度，保证稳定性
          max_tokens: 1500
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      // 解析 JSON 结果
      const analysis = this.parseAnalysisResult(content);

      return {
        success: true,
        data: analysis,
        language
      };
    } catch (error) {
      console.error('智能分析失败:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.createFallbackAnalysis(conversationHistory)
      };
    }
  }

  /**
   * 构建分析提示词
   */
  buildAnalysisPrompt(conversationText, language) {
    const templates = {
      zh: `请作为技术知识管理专家，深度分析以下技术会话对话。

## 任务
1. **检测话题数量**
   - 识别会话中讨论了几个独立的技术话题
   - 判断标准：话题转换、上下文变化、关键词改变

2. **对每个话题进行分析**
   - 生成 3 个标题建议（每个不超过 15 字）
   - 推荐知识分类（架构/模块/规范/问题/决策/教程）
   - 提取 5-8 个核心关键词
   - 标注涉及的对话轮次范围（从第几轮到第几轮）
   - 写一个简要描述

3. **评估话题重要性**
   - main：主要话题（深入讨论，>5 轮对话）
   - minor：次要话题（简单提及，≤5 轮对话）

4. **给出推荐操作**
   - single：只有一个话题，直接提炼
   - separate：多个独立话题，建议分别提炼
   - merge：多个相关话题，可以合并提炼

## 输出格式
请严格返回 JSON 格式：
{
  "topics": [
    {
      "id": 1,
      "importance": "main",
      "titleSuggestions": ["标题 1", "标题 2", "标题 3"],
      "category": "架构",
      "keywords": ["关键词 1", "关键词 2", "关键词 3", "关键词 4", "关键词 5"],
      "messageRange": {
        "start": 0,
        "end": 20
      },
      "summary": "这个主题的简要描述（50 字以内）"
    }
  ],
  "recommendedAction": "single",
  "reason": "检测到 1 个主题，建议直接提炼"
}

## 会话内容
${conversationText}`,

      en: `Please act as a technical knowledge management expert and deeply analyze the following technical conversation.

## Tasks
1. **Detect Number of Topics**
   - Identify how many independent technical topics are discussed
   - Criteria: topic transitions, context changes, keyword shifts

2. **Analyze Each Topic**
   - Generate 3 title suggestions (each ≤15 characters)
   - Recommend knowledge category (Architecture/Module/Specification/Issue/Decision/Tutorial)
   - Extract 5-8 core keywords
   - Mark message range (from which round to which round)
   - Write a brief summary

3. **Evaluate Topic Importance**
   - main: Primary topic (in-depth discussion, >5 rounds)
   - minor: Secondary topic (brief mention, ≤5 rounds)

4. **Recommend Action**
   - single: Only one topic, extract directly
   - separate: Multiple independent topics, recommend separate extraction
   - merge: Multiple related topics, can merge extraction

## Output Format
Please return strict JSON format:
{
  "topics": [
    {
      "id": 1,
      "importance": "main",
      "titleSuggestions": ["Title 1", "Title 2", "Title 3"],
      "category": "Architecture",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "messageRange": {
        "start": 0,
        "end": 20
      },
      "summary": "Brief description of this topic (≤50 words)"
    }
  ],
  "recommendedAction": "single",
  "reason": "Detected 1 topic, recommend direct extraction"
}

## Conversation Content
${conversationText}`
    };

    return templates[language] || templates.zh;
  }

  /**
   * 系统提示词
   */
  getSystemPrompt(language) {
    const prompts = {
      zh: `你是一个专业的技术知识管理专家，擅长从技术对话中：
1. 识别独立的技术话题
2. 生成专业、简洁的标题
3. 准确分类知识
4. 提取核心关键词

要求：
- 标题简洁明了，突出技术核心
- 分类准确，符合技术文档规范
- 关键词具有代表性和检索价值
- 只返回 JSON 格式，不要其他内容`,

      en: `You are a professional technical knowledge management expert, skilled in:
1. Identifying independent technical topics
2. Generating professional, concise titles
3. Accurately categorizing knowledge
4. Extracting core keywords

Requirements:
- Titles are concise and highlight technical core
- Accurate categorization following technical documentation standards
- Keywords are representative and valuable for retrieval
- Return only JSON format, nothing else`
    };

    return prompts[language] || prompts.zh;
  }

  /**
   * 解析 AI 分析结果
   * @param {string} content - AI 返回的原始内容
   * @returns {Object} 解析后的分析结果
   * 
   * 解析策略：
   * 1. 尝试直接解析 JSON
   * 2. 验证必需字段（topics 数组）
   * 3. 验证每个话题的必需字段
   * 4. 解析失败时降级到文本提取
   */
  parseAnalysisResult(content) {
    try {
      // 尝试直接解析 JSON
      const json = JSON.parse(content);
      
      // 验证数据结构
      if (!json.topics || !Array.isArray(json.topics)) {
        throw new Error('Invalid structure: missing topics array');
      }

      // 验证每个话题的必需字段并修复缺失字段
      for (const topic of json.topics) {
        // 验证必需字段
        if (!topic.id) {
          topic.id = json.topics.indexOf(topic) + 1;
        }
        
        if (!topic.titleSuggestions || topic.titleSuggestions.length === 0) {
          topic.titleSuggestions = ['未命名知识'];
          console.warn(`话题 ${topic.id} 缺少标题建议，使用默认值`);
        }
        
        if (!topic.category) {
          topic.category = '架构';
          console.warn(`话题 ${topic.id} 缺少分类，使用默认值`);
        }
        
        if (!topic.keywords || topic.keywords.length === 0) {
          topic.keywords = ['技术', '知识'];
          console.warn(`话题 ${topic.id} 缺少关键词，使用默认值`);
        }
        
        if (!topic.messageRange) {
          topic.messageRange = { start: 0, end: 10 };
          console.warn(`话题 ${topic.id} 缺少消息范围，使用默认值`);
        }
        
        if (!topic.importance) {
          topic.importance = 'main';
          console.warn(`话题 ${topic.id} 缺少重要性标记，使用默认值`);
        }
        
        if (!topic.summary) {
          topic.summary = '技术话题';
          console.warn(`话题 ${topic.id} 缺少摘要，使用默认值`);
        }
      }

      // 验证 recommendedAction
      if (!json.recommendedAction) {
        json.recommendedAction = json.topics.length === 1 ? 'single' : 'separate';
      }
      
      if (!json.reason) {
        json.reason = json.topics.length === 1 
          ? '检测到 1 个主题，建议直接提炼' 
          : `检测到 ${json.topics.length} 个独立话题，建议分别提炼`;
      }

      return json;
    } catch (parseError) {
      console.error('JSON 解析失败，尝试从文本中提取:', parseError);
      
      // 尝试从非标准 JSON 中提取信息
      return this.extractFromText(content);
    }
  }

  /**
   * 从文本中提取分析结果（降级方案）
   */
  extractFromText(text) {
    // 简化的降级处理
    return {
      topics: [
        {
          id: 1,
          importance: 'main',
          titleSuggestions: ['技术知识总结'],
          category: '架构',
          keywords: ['技术', '知识', '总结'],
          messageRange: { start: 0, end: 10 },
          summary: '技术会话内容总结'
        }
      ],
      recommendedAction: 'single',
      reason: '解析失败，使用默认分析结果'
    };
  }

  /**
   * 创建降级分析结果（当 API 失败时）
   */
  createFallbackAnalysis(conversationHistory) {
    const messageCount = conversationHistory.length;
    
    return {
      topics: [
        {
          id: 1,
          importance: messageCount > 10 ? 'main' : 'minor',
          titleSuggestions: ['会话知识总结'],
          category: '架构',
          keywords: ['技术', '知识'],
          messageRange: {
            start: 0,
            end: messageCount - 1
          },
          summary: '技术会话内容总结'
        }
      ],
      recommendedAction: 'single',
      reason: 'API 调用失败，使用降级分析'
    };
  }

  /**
   * 格式化分析结果用于展示
   */
  formatForDisplay(analysis, language = 'zh') {
    const messages = {
      zh: {
        topic: '话题',
        importance: {
          main: '主要',
          minor: '次要'
        },
        titleSuggestions: '推荐标题',
        category: '推荐分类',
        keywords: '关键词',
        messageRange: '对话轮次',
        summary: '简要描述',
        recommendedAction: {
          single: '直接提炼',
          separate: '分别提炼',
          merge: '合并提炼'
        },
        reason: '建议原因'
      },
      en: {
        topic: 'Topic',
        importance: {
          main: 'Primary',
          minor: 'Secondary'
        },
        titleSuggestions: 'Title Suggestions',
        category: 'Recommended Category',
        keywords: 'Keywords',
        messageRange: 'Message Range',
        summary: 'Summary',
        recommendedAction: {
          single: 'Extract Directly',
          separate: 'Extract Separately',
          merge: 'Merge and Extract'
        },
        reason: 'Reason'
      }
    };

    const t = messages[language] || messages.zh;
    
    let output = '';
    
    if (analysis.topics.length === 1) {
      // 单话题展示
      const topic = analysis.topics[0];
      output += `${t.topic} ${topic.id}: ${topic.summary}\n`;
      output += `${t.importance[topic.importance]}\n\n`;
      output += `${t.titleSuggestions}:\n`;
      topic.titleSuggestions.forEach((title, i) => {
        output += `  ${i + 1}. ${title}\n`;
      });
      output += `\n${t.category}: ${topic.category}\n`;
      output += `\n${t.keywords}: ${topic.keywords.join(', ')}\n`;
      output += `\n${t.messageRange}: ${topic.messageRange.start + 1} - ${topic.messageRange.end + 1}\n`;
    } else {
      // 多话题展示
      output += `${t.recommendedAction[analysis.recommendedAction]}: ${analysis.reason}\n\n`;
      
      analysis.topics.forEach((topic, index) => {
        output += `---\n`;
        output += `${t.topic} ${index + 1} (${t.importance[topic.importance]}): ${topic.summary}\n`;
        output += `${t.titleSuggestions}:\n`;
        topic.titleSuggestions.forEach((title, i) => {
          output += `  ${i + 1}. ${title}\n`;
        });
        output += `${t.category}: ${topic.category}\n`;
        output += `${t.keywords}: ${topic.keywords.join(', ')}\n`;
        output += `${t.messageRange}: ${topic.messageRange.start + 1} - ${topic.messageRange.end + 1}\n`;
      });
    }

    return output;
  }
}
