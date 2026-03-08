/**
 * i18n - Internationalization Module
 * 
 * 多语言提示词系统
 * 支持中文、英文、日文、韩文等多种语言
 */

export const SUPPORTED_LANGUAGES = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어'
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
    },
    ja: {
      systemPrompt: `あなたは専門的な技術文書作成の専門家であり、技術的な会話から高品質の知識文書を作成することが得意です。

あなたの責任：
1. 重要な技術的決定と実装詳細を識別する
2. 価値のあるコードスニペットとソリューションを抽出する
3. トラブルシューティングのプロセスと教訓を記録する
4. 明確で構造化された、読みやすい技術文書を生成する

執筆要件：
- 技術ブログを書くように、流暢な技術言語を使用する
- 論理が明確で、人間が読んで理解しやすい
- 背景、決定、実装、要約を含む完全な構造
- コメントと説明付きのコード標準
- 客観的で正確、個人的な意見を追加しない
- 読みやすく検索しやすい Markdown フォーマットに従う

注意事項：
- プロフェッショナルだが堅すぎない
- 詳細だが冗長ではない
- 構造化されているが柔軟
- チーム文書として直接使用可能
- 客観的で正確に保ち、個人的な意見を追加しない`,

      extractionPrompt: (title, category) => `以下の会話から高品質の技術知識文書を抽出してください。

## 要件
1. **人間が読みやすい**：技術ブログを書くように、流暢な技術言語を使用する
2. **構造化された提示**：後続の検索と再利用が容易
3. **完全なコンテンツ**：技術的決定、コード実装、問題記録を強調
4. **高い可読性**：論理が明確で、人間の理解が容易

## 出力フォーマット
以下の Markdown フォーマットに厳密に従ってください：

\`\`\`markdown
# ${title}

> **概要**：[この文書の核心内容を 1-2 文で要約]

## 📋 背景
[この知識が生まれた背景、なぜこのトピックが議論されたか、什么问题を解決したか]

## 🎯 核心内容

### 技術的決定
[重要な技術的選択と決定を詳細に記述し、理由と比較分析を説明]

### コード実装
[主要なコードスニペットを抽出し、詳細なコメントと使用方法の説明を付帯]

### 問題記録
[遭遇した問題と解決策を記録し、現象、原因、解決プロセスを含む]

### ベストプラクティス
[教訓とベストプラクティスの推奨を要約]

### ToDo
[後続で完了する必要があるタスクをリスト]

## 📚 参考文献
[関連リンク、文書など]

## 🏷️ タグ
#[category} #[キーワード 1] #[キーワード 2]

---
**文書バージョン**: v1.0  
**作成日**: ${new Date().toISOString().split('T')[0]}  
**最終更新**: ${new Date().toISOString().split('T')[0]}  
**著者**: OpenClaw 知識抽出
\`\`\`

## 会話内容
{conversationText}
`
    },
    ko: {
      systemPrompt: `당신은 전문 기술 문서 작성 전문가로，기술 대화에서 고품질 지식 문서를 작성하는 데 능숙합니다.

당신의 책임:
1. 주요 기술 결정 및 구현 세부 사항 식별
2. 가치 있는 코드 스니펫 및 솔루션 추출
3. 문제 해결 과정 및 교훈 기록
4. 명확하고 구조화되며 읽기 쉬운 기술 문서 생성

작성 요구사항:
- 기술 블로그를 작성하는 것처럼 유창한 기술 언어 사용
- 논리가 명확하고 인간이 읽고 이해하기 쉬움
- 배경, 결정, 구현, 요약을 포함한 완전한 구조
- 주석 및 설명이 포함된 코드 표준
- 객관적이고 정확하며 개인적인 의견 추가 금지
- 읽기 및 검색이 쉬운 Markdown 형식 준수

주의사항:
- 전문적이지만 지루하지 않음
- 상세하지만 장황하지 않음
- 구조화되었지만 경직되지 않음
- 팀 문서로 직접 사용 가능
- 객관적이고 정확하게 유지，개인적인 의견 추가 금지`,

      extractionPrompt: (title, category) => `다음 대화에서 고품질 기술 지식 문서를 추출해주세요.

## 요구사항
1. **인간 가독성 우선**: 기술 블로그를 작성하는 것처럼 유창한 기술 언어 사용
2. **구조화된 프레젠테이션**: 후속 검색 및 재사용 용이
3. **완전한 콘텐츠**: 기술 결정, 코드 구현, 문제 기록 강조
4. **높은 가독성**: 논리가 명확하고 인간의 이해가 용이

## 출력 형식
다음 Markdown 형식을 엄격히 준수해주세요:

\`\`\`markdown
# ${title}

> **요약**: [이 문서의 핵심 내용을 1-2 문장으로 요약]

## 📋 배경
[이 지식이 생성된 배경, 왜 이 주제가 논의되었는지, 어떤 문제를 해결했는지]

## 🎯 핵심 내용

### 기술 결정
[중요한 기술 선택 및 결정을 자세히 설명하고 이유와 비교 분석 포함]

### 코드 구현
[주요 코드 스니펫을 추출하고 자세한 주석 및 사용 방법 설명 포함]

### 문제 기록
[발생된 문제와 해결 방법을 기록하고 현상, 원인, 해결 과정 포함]

### 모범 사례
[교훈과 모범 사례 권장사항 요약]

### 할 일
[후속으로 완료해야 할 작업 나열]

## 📚 참고 자료
[관련 링크, 문서 등]

## 🏷️ 태그
#[category} #[키워드 1] #[키워드 2]

---
**문서 버전**: v1.0  
**생성일**: ${new Date().toISOString().split('T')[0]}  
**최종 업데이트**: ${new Date().toISOString().split('T')[0]}  
**저자**: OpenClaw 지식 추출
\`\`\`

## 대화 내용
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
    },
    ja: {
      semanticAnalysis: `以下の 2 つの文書タイトルの意味的類似度を判断してください。

タイトル 1: {title1}
タイトル 2: {title2}

技術コンテンツの観点から、これら 2 つのタイトルが同じまたは類似のトピックを指しているかどうかを判断してください。
0 から 1 の間の数値を返してください。1 は完全に同じ、0 は完全に異なることを意味します。

数値のみを返し、他の内容は返さないでください。`
    },
    ko: {
      semanticAnalysis: `다음 두 문서 제목의 의미적 유사도를 판단해주세요.

제목 1: {title1}
제목 2: {title2}

기술 콘텐츠 관점에서 이 두 제목이 동일하거나 유사한 주제를 가리키는지 판단해주세요.
0 에서 1 사이의 숫자를 반환해주세요. 1 은 완전히 같음, 0 은 완전히 다름을 의미합니다.

숫자만 반환하고 다른 내용은 반환하지 마세요.`
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
    },
    ja: {
      emptyConversation: '会話履歴が空です。知識を抽出できません',
      apiFailed: 'API コールが失敗しました',
      extractionFailed: '知識の抽出に失敗しました',
      retrievalFailed: '知識の検索に失敗しました',
      syncFailed: '思源の同期に失敗しました',
      permissionDenied: '権限がありません：読み取り専用ノートブックに書き込めません'
    },
    ko: {
      emptyConversation: '대화 기록이 비어있습니다. 지식을 추출할 수 없습니다',
      apiFailed: 'API 호출 실패',
      extractionFailed: '지식 추출 실패',
      retrievalFailed: '지식 검색 실패',
      syncFailed: '思源 동기화 실패',
      permissionDenied: '권한 없음：읽기 전용 노트북에 쓸 수 없습니다'
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
 * @returns {string} 语言代码 (zh, en, ja, ko)
 */
export function detectLanguage(text) {
  if (!text) return DEFAULT_LANGUAGE;

  // 检测中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseMatch = text.match(chineseRegex);
  const chineseCount = chineseMatch ? chineseMatch.length : 0;

  // 检测日文字符（平假名、片假名）
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/g;
  const japaneseMatch = text.match(japaneseRegex);
  const japaneseCount = japaneseMatch ? japaneseMatch.length : 0;

  // 检测韩文字符
  const koreanRegex = /[\uac00-\ud7af]/g;
  const koreanMatch = text.match(koreanRegex);
  const koreanCount = koreanMatch ? koreanMatch.length : 0;

  // 判断主要语言
  const totalChars = text.length;
  const chineseRatio = chineseCount / totalChars;
  const japaneseRatio = japaneseCount / totalChars;
  const koreanRatio = koreanCount / totalChars;

  if (koreanRatio > 0.3) return 'ko';
  if (japaneseRatio > 0.3) return 'ja';
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
