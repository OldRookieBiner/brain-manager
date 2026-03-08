/**
 * i18n - Internationalization Module
 * 
 * 多语言提示词系统
 * 支持中文、英文、日文、韩文等多种语言
 */

export const SUPPORTED_LANGUAGES = {
  zh: '中文',
  en: 'English'
};

export const DEFAULT_LANGUAGE = 'zh';

/**
 * 多语言提示词模板
 */
export const prompts = {
  // ==================== Extractor Prompts ====================
  extractor: {
    zh: {
      systemPrompt: `你是一个专业的技术文档撰写专家，擅长从技术对话中创作高质量的知识文档。

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
- 保持客观准确，不添加个人意见`,

      extractionPrompt: (title, category) => `请从以下会话对话中提炼一篇高质量的技术知识文档。

## 要求
1. **人可读优先**：使用流畅的技术语言，像写技术博客一样
2. **结构化呈现**：便于后续检索和复用
3. **内容完整**：突出技术决策、代码实现、问题记录
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
{conversationText}
`
    },
    en: {
      systemPrompt: `You are a professional technical documentation expert, skilled in creating high-quality knowledge documents from technical conversations.

Your responsibilities:
1. Identify key technical decisions and implementation details
2. Extract valuable code snippets and solutions
3. Document troubleshooting processes and lessons learned
4. Generate clear, structured, and readable technical documents

Writing requirements:
- Use fluent technical language, like writing a technical blog
- Clear logic, easy for humans to read and understand
- Complete structure, including background, decisions, implementation, and summary
- Code standards with comments and explanations
- Objective and accurate, no personal opinions
- Follow Markdown format for easy reading and retrieval

Notes:
- Professional but not dry
- Detailed but not verbose
- Structured but not rigid
- Can be used directly as team documentation
- Stay objective and accurate, no personal opinions`,

      extractionPrompt: (title, category) => `Please extract a high-quality technical knowledge document from the following conversation.

## Requirements
1. **Human-readable first**: Use fluent technical language, like writing a technical blog
2. **Structured presentation**: Easy for subsequent retrieval and reuse
3. **Complete content**: Highlight technical decisions, code implementations, and issue records
4. **Strong readability**: Clear logic, easy for human understanding

## Output Format
Please strictly follow this Markdown format:

\`\`\`markdown
# ${title}

> **Abstract**: [Summarize the core content of this document in 1-2 sentences for quick understanding]

## 📋 Background
[Describe the background of this knowledge, why this topic was discussed, and what problems were solved]

## 🎯 Core Content

### Technical Decisions
[Describe important technical selections and decisions in detail, with reasons and comparative analysis]

### Code Implementation
[Extract key code snippets with detailed comments and usage instructions]

### Issue Records
[Record encountered problems and solutions, including symptoms, causes, and resolution processes]

### Best Practices
[Summarized lessons learned and best practice recommendations]

### Action Items
[List follow-up tasks to be completed]

## 📚 References
[Related links, documentation, etc.]

## 🏷️ Tags
#[category} #[keyword1] #[keyword2]

---
**Document Version**: v1.0  
**Created**: ${new Date().toISOString().split('T')[0]}  
**Last Updated**: ${new Date().toISOString().split('T')[0]}  
**Author**: OpenClaw Knowledge Extractor
\`\`\`

## Conversation Content
{conversationText}
`
    }
  },

  // ==================== Smart Detector Prompts ====================
  smartDetector: {
    zh: {
      semanticAnalysis: `请判断以下两个文档标题的语义相似度。

标题 1: {title1}
标题 2: {title2}

请从技术内容的角度判断这两个标题是否指向相同或相似的主题。
返回一个 0 到 1 之间的数字，1 表示完全相同，0 表示完全不同。

只返回数字，不要返回其他任何内容。`
    },
    en: {
      semanticAnalysis: `Please judge the semantic similarity of the following two document titles.

Title 1: {title1}
Title 2: {title2}

Please determine whether these two titles point to the same or similar topics from a technical content perspective.
Return a number between 0 and 1, where 1 means exactly the same and 0 means completely different.

Return only the number, nothing else.`
    }
  },

  // ==================== Error Messages ====================
  errors: {
    zh: {
      emptyConversation: '会话历史为空，无法提炼知识',
      apiFailed: 'API 调用失败',
      extractionFailed: '知识提炼失败',
      retrievalFailed: '知识检索失败',
      syncFailed: '思源同步失败',
      permissionDenied: '权限不足：无法写入只读笔记本'
    },
    en: {
      emptyConversation: 'Conversation history is empty, cannot extract knowledge',
      apiFailed: 'API call failed',
      extractionFailed: 'Knowledge extraction failed',
      retrievalFailed: 'Knowledge retrieval failed',
      syncFailed: 'SiYuan sync failed',
      permissionDenied: 'Permission denied: Cannot write to read-only notebook'
    }
  }
};

/**
 * 获取指定语言的提示词
 * @param {string} type - 提示词类型 (extractor, smartDetector, errors)
 * @param {string} key - 提示词键名
 * @param {string} language - 语言代码 (zh, en, ja, ko)
 * @returns {string|Object} 提示词内容
 */
export function getPrompt(type, key, language = DEFAULT_LANGUAGE) {
  const lang = prompts[type]?.[language];
  if (!lang) {
    console.warn(`Language '${language}' not found, using default '${DEFAULT_LANGUAGE}'`);
    return prompts[type]?.[DEFAULT_LANGUAGE]?.[key] || '';
  }
  return lang[key] || '';
}

/**
 * 自动检测语言
 * @param {string} text - 输入文本
 * @returns {string} 语言代码 (zh, en)
 */
export function detectLanguage(text) {
  if (!text) return DEFAULT_LANGUAGE;

  // 检测中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseMatch = text.match(chineseRegex);
  const chineseCount = chineseMatch ? chineseMatch.length : 0;

  // 判断主要语言
  const totalChars = text.length;
  const chineseRatio = chineseCount / totalChars;

  if (chineseRatio > 0.2) return 'zh';
  
  // 默认返回英文
  return 'en';
}

/**
 * 验证语言代码是否有效
 * @param {string} language - 语言代码
 * @returns {boolean} 是否有效
 */
export function isValidLanguage(language) {
  return Object.keys(SUPPORTED_LANGUAGES).includes(language);
}
