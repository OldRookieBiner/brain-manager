# 智能会话提炼策略

## 📋 设计思路

### 问题：新开文章 vs 更新老文章？

**答案**：根据内容智能决策

---

## 🎯 智能决策流程

```
1. 用户触发提炼
   ↓
2. 提取会话关键词
   ↓
3. 检索知识库中相似文章
   ↓
4. 计算相似度
   ↓
5. 根据阈值决策：
   - 相似度 > 80% → 更新老文章
   - 相似度 50-80% → 用户选择
   - 相似度 < 50% → 创建新文章
```

---

## 🔧 实现方案

### 方案 1：基于关键词匹配

```javascript
async shouldUpdateExisting(title, category, conversationHistory) {
  // 1. 提取当前会话关键词
  const currentKeywords = this.extractKeywords(conversationHistory);
  
  // 2. 检索相似文章
  const similarDocs = await retriever.search(title, 5, { category });
  
  // 3. 计算相似度
  for (const doc of similarDocs) {
    const docKeywords = this.extractKeywords(doc.content);
    const similarity = this.calculateSimilarity(currentKeywords, docKeywords);
    
    if (similarity > 0.8) {
      return { action: 'update', docId: doc.id, similarity };
    } else if (similarity > 0.5) {
      return { action: 'ask_user', docId: doc.id, similarity };
    }
  }
  
  return { action: 'create_new', similarity: 0 };
}

// 关键词提取
extractKeywords(text) {
  // 使用 TF-IDF 或简单的词频统计
  const words = text.toLowerCase().split(/\s+/);
  const keywords = words.filter(w => w.length > 3);
  return [...new Set(keywords)];
}

// 相似度计算（Jaccard 相似度）
calculateSimilarity(keywords1, keywords2) {
  const intersection = keywords1.filter(k => keywords2.includes(k));
  const union = [...new Set([...keywords1, ...keywords2])];
  return intersection.length / union.length;
}
```

---

### 方案 2：基于向量相似度（更准确）

```javascript
// 使用向量数据库（如：Chroma、Pinecone）
async shouldUpdateExisting(title, category, conversationHistory) {
  // 1. 将当前会话转换为向量
  const currentVector = await this.embed(conversationHistory);
  
  // 2. 在向量数据库中检索相似文档
  const similarDocs = await vectorDB.search({
    vector: currentVector,
    filter: { category },
    limit: 5
  });
  
  // 3. 根据相似度决策
  if (similarDocs[0].score > 0.8) {
    return { action: 'update', docId: similarDocs[0].id };
  } else if (similarDocs[0].score > 0.5) {
    return { action: 'ask_user', options: similarDocs };
  } else {
    return { action: 'create_new' };
  }
}
```

---

## 📊 用户交互设计

### 场景 1：高相似度（>80%）→ 自动更新

```
用户：/knowledge_summarize --title "爬虫引擎架构优化" --category "架构"

系统：🔍 检测到相似文章：
     📄 爬虫引擎架构设计（相似度：92%）
     📅 创建时间：2026-03-05
     
     ✅ 已自动更新该文章
     - 保留原有内容
     - 追加新的优化点
     - 标记版本：v2
     
     查看历史版本：/knowledge_get --id "爬虫引擎架构" --version history
```

---

### 场景 2：中等相似度（50-80%）→ 用户选择

```
用户：/knowledge_summarize --title "爬虫并发优化" --category "架构"

系统：🔍 检测到相似文章：
     
     1️⃣ 爬虫引擎架构设计（相似度：75%）
        📅 创建时间：2026-03-05
        📝 摘要：使用 aiohttp 实现异步请求...
     
     2️⃣ 并发连接数优化（相似度：68%）
        📅 创建时间：2026-03-04
        📝 摘要：调整连接池大小...
     
     请选择：
     - 更新文章 1：/knowledge_update --id 1
     - 更新文章 2：/knowledge_update --id 2
     - 创建新文章：/knowledge_create_new
     - 合并到文章 1：/knowledge_merge --id 1
```

---

### 场景 3：低相似度（<50%）→ 创建新文章

```
用户：/knowledge_summarize --title "数据存储模块设计" --category "架构"

系统：✅ 未检测到相似文章，创建新文章
     📁 保存到：docs/knowledge-base/数据存储模块设计.md
     📒 同步到：思源笔记/架构/数据存储模块设计
```

---

## 🔄 更新策略

### 策略 A：追加模式（默认）

```javascript
async updateDocument(docId, newContent) {
  // 1. 获取原文档
  const oldDoc = await retriever.getKnowledgeCard(docId);
  
  // 2. 追加新内容到对应章节
  const updatedContent = this.appendContent(oldDoc.content, newContent);
  
  // 3. 更新文档
  await siyuanSync.updateDoc(docId, updatedContent);
  
  // 4. 记录版本
  await this.saveVersion(docId, oldDoc.content, 'append');
}
```

**效果**：
```markdown
# 爬虫引擎架构设计

## 原始内容（2026-03-05）
[原有内容]

## 更新内容（2026-03-06）
[新增内容 - 标记为 v2]

## 更新历史
- v2 (2026-03-06): 添加并发优化
- v1 (2026-03-05): 初始版本
```

---

### 策略 B：合并模式

```javascript
async mergeContent(docId, newContent) {
  // 1. 获取原文档
  const oldDoc = await retriever.getKnowledgeCard(docId);
  
  // 2. 智能合并（使用 LLM）
  const mergedContent = await llm.merge(oldDoc.content, newContent, {
    strategy: 'intelligent',
    preserveHistory: true
  });
  
  // 3. 更新文档
  await siyuanSync.updateDoc(docId, mergedContent);
}
```

**LLM 合并提示词**：
```
请合并以下两篇文档的内容：

【原文档】
{old_content}

【新内容】
{new_content}

要求：
1. 保留原文档的核心结构
2. 将新内容整合到对应章节
3. 如果有冲突，保留最新版本
4. 标记变更部分
5. 更新"更新历史"章节
```

---

### 策略 C：版本控制模式

```javascript
async updateWithVersion(docId, newContent) {
  // 1. 保存当前版本
  const oldDoc = await retriever.getKnowledgeCard(docId);
  await this.saveVersion(docId, oldDoc.content);
  
  // 2. 更新文档
  await siyuanSync.updateDoc(docId, newContent);
  
  // 3. 创建版本记录
  await this.createVersionRecord({
    docId,
    version: 'v2',
    timestamp: new Date(),
    changes: '添加并发优化内容',
    previousVersion: 'v1'
  });
}
```

**版本历史**：
```bash
# 查看版本历史
/knowledge_get --id "爬虫引擎架构" --version history

# 输出：
📜 版本历史：
- v3 (2026-03-07): 添加错误处理
- v2 (2026-03-06): 添加并发优化
- v1 (2026-03-05): 初始版本

# 查看特定版本
/knowledge_get --id "爬虫引擎架构" --version v2
```

---

## 🎯 推荐实现

### 综合方案（智能 + 用户选择）

```javascript
async summarizeConversation(title, category, conversationHistory, options = {}) {
  // 1. 检查是否强制更新
  if (options.updateExisting) {
    return await this.updateSpecificDoc(options.docId, conversationHistory);
  }
  
  // 2. 智能检测相似文档
  const decision = await this.shouldUpdateExisting(title, category, conversationHistory);
  
  // 3. 根据决策执行
  switch (decision.action) {
    case 'update':
      // 自动更新
      return await this.updateDocument(decision.docId, conversationHistory);
    
    case 'ask_user':
      // 询问用户
      return await this.askUserForDecision(decision.options);
    
    case 'create_new':
    default:
      // 创建新文章
      return await this.createNewArticle(title, category, conversationHistory);
  }
}
```

---

## 📋 用户命令设计

### 新增命令

```bash
# 智能提炼（默认）
/knowledge_summarize --title "标题" --category "分类"

# 强制更新指定文章
/knowledge_summarize --title "标题" --category "分类" --update-existing --doc-id "xxx"

# 强制创建新文章
/knowledge_summarize --title "标题" --category "分类" --force-new

# 合并到指定文章
/knowledge_merge --doc-id "xxx" --conversation-id "yyy"

# 查看版本历史
/knowledge_get --id "标题" --version history

# 回滚到指定版本
/knowledge_rollback --id "标题" --version v2
```

---

## 🔧 配置文件

### 提炼策略配置

```yaml
# config.yaml
knowledge:
  extraction:
    # 相似度阈值
    similarity_threshold:
      auto_update: 0.8      # >80% 自动更新
      ask_user: 0.5         # 50-80% 询问用户
      create_new: 0.5       # <50% 创建新文章
    
    # 更新策略
    update_strategy: 'append'  # append | merge | versioned
    
    # 版本控制
    version_control:
      enabled: true
      max_versions: 10
      auto_cleanup: true
    
    # 关键词提取
    keyword_extraction:
      method: 'tfidf'  # tfidf | vector | simple
      min_length: 3
      max_keywords: 20
```

---

## 📊 对比总结

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **总是新开** | ✅ 保持历史<br>✅ 避免冲突<br>✅ 简单可靠 | ❌ 文章碎片化<br>❌ 难以找到最新 | 初期、多服务器 |
| **智能更新** | ✅ 知识集中<br>✅ 易于维护<br>✅ 用户友好 | ❌ 实现复杂<br>❌ 可能误判 | 成熟期、单服务器 |
| **混合策略** | ✅ 灵活<br>✅ 可控<br>✅ 平衡 | ❌ 需要配置 | 推荐 ✅ |

---

## 🎯 我的建议

### 阶段 1：总是新开（当前实现）
- 快速上线
- 积累数据
- 观察模式

### 阶段 2：添加智能检测
- 实现相似度计算
- 添加用户选择
- 收集反馈

### 阶段 3：智能更新
- 基于数据优化阈值
- 实现自动合并
- 版本控制

---

## 💡 立即可以做的优化

### 1. 添加标题相似度检测

```javascript
// 简单的标题匹配
async findSimilarByTitle(title, category) {
  const docs = await retriever.search(title, 5, { category });
  return docs.filter(doc => {
    const similarity = this.stringSimilarity(title, doc.title);
    return similarity > 0.7;
  });
}
```

### 2. 添加更新时间标记

```javascript
// 在文档末尾添加更新记录
## 更新历史
- 2026-03-06: 初始创建
- 2026-03-07: 添加并发优化内容
```

### 3. 添加相关文档链接

```javascript
// 在文档末尾添加相关链接
## 相关文档
- [[爬虫引擎实现]]
- [[并发连接数优化]]
```

---

**您觉得这个智能策略如何？需要我实现哪个方案？**
