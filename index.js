/**
 * OpenClaw Brain Manager
 * 
 * 大脑管家 - 自动提炼会话内容、同步思源笔记、智能检索知识库
 */

import { Tool } from "@openclaw/tool";
import { KnowledgeExtractor } from "./lib/extractor.js";
import { KnowledgeRetriever } from "./lib/retriever.js";
import { SiYuanSync } from "./lib/siyuan-sync.js";
import { SmartDetector } from "./lib/smart-detector.js";

// 初始化模块
const extractor = new KnowledgeExtractor();
const retriever = new KnowledgeRetriever({
  notebookName: process.env.SIYUAN_NOTEBOOK_NAME,
  readOnlyNotebooks: process.env.SIYUAN_READ_ONLY_NOTEBOOKS
});
const siyuanSync = new SiYuanSync({
  notebookName: process.env.SIYUAN_NOTEBOOK_NAME
});
const smartDetector = new SmartDetector();

// 辅助方法：从用户输入中提取检索关键词
function extractQueryFromUserInput(userInput) {
  // 移除常见的检索关键词
  const stopWords = [
    '检索', '查找', '相关知识', '之前讨论', '记得',
    '以前说过', '历史', '之前提到', '之前写', '之前记录',
    '关于', '的', '有没有', '看看', '帮我'
  ];
  
  let query = userInput;
  stopWords.forEach(word => {
    query = query.replace(new RegExp(word, 'g'), '');
  });
  
  // 提取引号中的内容（如果有）
  const quoteMatch = query.match(/[""]([^""]+)[""]/);
  if (quoteMatch) {
    return quoteMatch[1];
  }
  
  // 否则返回清理后的内容
  return query.trim();
}

// 导出 Skill 定义
export default {
  create: (options) => {
    return [
      /**
       * 工具 1: knowledge_summarize - 会话提炼
       * 自动将当前会话提炼为结构化知识卡片
       */
      new Tool({
        name: "knowledge_summarize",
        description: "自动提炼当前会话内容，生成结构化知识卡片并保存到本地和思源笔记",
        parameters: {
          title: {
            type: "string",
            description: "知识卡片标题，例如：'爬虫引擎架构设计'",
            required: true
          },
          category: {
            type: "string",
            description: "知识分类",
            enum: ["架构", "模块", "规范", "问题", "决策", "教程"],
            required: true
          },
          syncToSiYuan: {
            type: "boolean",
            description: "是否同步到思源笔记（默认：true）",
            required: false,
            default: true
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { 
              title, 
              category, 
              syncToSiYuan = true,
              forceNew = false,
              updateExisting = false,
              docId: specifiedDocId
            } = args;
            
            // 获取会话历史（从 OpenClaw 上下文）
            const conversationHistory = options.conversationHistory || [];
            
            if (conversationHistory.length === 0) {
              return {
                success: false,
                error: "当前会话为空，无法提炼知识"
              };
            }

            // 智能检测：是否应该更新已有文档
            let targetDocId = specifiedDocId;
            let shouldUpdate = false;
            let detectionResult = null;

            if (!forceNew && !specifiedDocId) {
              detectionResult = await smartDetector.shouldUpdateExisting(
                title,
                category,
                conversationHistory,
                retriever
              );

              if (detectionResult.action === 'auto_update' || updateExisting) {
                shouldUpdate = true;
                targetDocId = detectionResult.docId;
              } else if (detectionResult.action === 'ask_user') {
                // 返回建议给用户选择
                return {
                  success: true,
                  action: 'ask_user',
                  message: `检测到 ${detectionResult.suggestions.length} 篇相似文章，请选择：`,
                  suggestions: detectionResult.suggestions.map(s => ({
                    title: s.title,
                    similarity: Math.round(s.similarity * 100) + '%',
                    action: `/knowledge_update --id "${s.docId}" --title "${title}" --category "${category}"`
                  })),
                  createNewAction: `/knowledge_summarize --title "${title}" --category "${category}" --force-new`
                };
              }
            }

            // 提炼知识
            const knowledgeCard = await extractor.extractCurrentConversation({
              title,
              category,
              conversationHistory
            });

            // 同步到思源笔记
            let syncResult = null;
            if (syncToSiYuan) {
              try {
                if (shouldUpdate && targetDocId) {
                  // 更新已有文档
                  syncResult = await siyuanSync.updateExistingDoc(
                    targetDocId,
                    knowledgeCard.content
                  );
                } else {
                  // 创建新文档
                  syncResult = await siyuanSync.syncToNotebook(knowledgeCard);
                }
              } catch (syncError) {
                console.error('思源笔记同步失败，但本地备份已保存:', syncError);
                syncResult = {
                  success: false,
                  error: syncError.message,
                  localBackup: true
                };
              }
            }

            // 格式化返回结果
            const result = {
              success: true,
              action: shouldUpdate ? 'updated' : 'created',
              title: knowledgeCard.title,
              category: knowledgeCard.category,
              tags: knowledgeCard.tags,
              createdAt: knowledgeCard.createdAt,
              preview: knowledgeCard.content.substring(0, 500) + '...',
              sync: syncResult,
              detection: detectionResult ? {
                similarity: Math.round(detectionResult.similarity * 100) + '%',
                action: detectionResult.action
              } : null
            };

            return result;
          } catch (error) {
            console.error('知识提炼失败:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      }),

      /**
       * 工具 2: knowledge_search - 知识检索
       * 从本地知识库和思源笔记检索相关信息
       */
      new Tool({
        name: "knowledge_search",
        description: "从知识库检索相关信息，支持本地文件和思源笔记",
        parameters: {
          query: {
            type: "string",
            description: "检索关键词，例如：'aiohttp 异步请求'",
            required: true
          },
          limit: {
            type: "number",
            description: "返回结果数量（默认：5）",
            required: false,
            default: 5
          },
          category: {
            type: "string",
            description: "分类过滤",
            enum: ["架构", "模块", "规范", "问题", "决策", "教程"],
            required: false
          },
          source: {
            type: "string",
            description: "检索来源",
            enum: ["all", "local", "siyuan"],
            required: false,
            default: "all"
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { query, limit = 5, category, source = "all" } = args;

            const options = {
              searchLocal: source === "all" || source === "local",
              searchSiYuan: source === "all" || source === "siyuan",
              category: category || null
            };

            const results = await retriever.search(query, limit, options);

            if (results.length === 0) {
              return {
                success: true,
                query,
                count: 0,
                message: "未找到相关知识",
                results: []
              };
            }

            // 格式化结果
            const formattedResults = results.map((result, index) => ({
              rank: index + 1,
              title: result.title,
              category: result.category,
              source: result.source === 'local' ? '📁 本地' : '📒 思源笔记',
              relevance: `${Math.round(result.relevance)}%`,
              excerpt: result.excerpt,
              tags: result.tags || []
            }));

            return {
              success: true,
              query,
              count: results.length,
              results: formattedResults
            };
          } catch (error) {
            console.error('知识检索失败:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      }),

      /**
       * 工具 3: knowledge_list - 列出知识库
       * 列出所有已保存的知识卡片
       */
      new Tool({
        name: "knowledge_list",
        description: "列出知识库中所有知识卡片，支持按分类过滤",
        parameters: {
          category: {
            type: "string",
            description: "分类过滤",
            enum: ["架构", "模块", "规范", "问题", "决策", "教程"],
            required: false
          },
          source: {
            type: "string",
            description: "来源",
            enum: ["all", "local", "siyuan"],
            required: false,
            default: "all"
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { category, source = "all" } = args;

            let documents = [];

            if (source === "all" || source === "siyuan") {
              try {
                const siyuanDocs = await siyuanSync.listDocuments(category);
                documents.push(...siyuanDocs.map(doc => ({
                  ...doc,
                  source: 'siyuan'
                })));
              } catch (error) {
                console.error('获取思源笔记列表失败:', error);
              }
            }

            if (source === "all" || source === "local") {
              // 从本地文件系统获取
              try {
                const localDocs = await retriever.search('*', 100, {
                  searchLocal: true,
                  searchSiYuan: false,
                  category
                });
                documents.push(...localDocs.map(doc => ({
                  id: doc.id,
                  title: doc.title,
                  path: doc.path,
                  updated: doc.createdAt,
                  source: 'local'
                })));
              } catch (error) {
                console.error('获取本地文件列表失败:', error);
              }
            }

            // 去重
            const uniqueDocs = Array.from(
              new Map(documents.map(doc => [`${doc.source}-${doc.id}`, doc])).values()
            );

            return {
              success: true,
              count: uniqueDocs.length,
              documents: uniqueDocs.map(doc => ({
                title: doc.title,
                category: doc.category || '未分类',
                source: doc.source === 'local' ? '📁 本地' : '📒 思源笔记',
                path: doc.path || doc.hpath
              }))
            };
          } catch (error) {
            console.error('列出知识库失败:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      }),

      /**
       * 工具 4: knowledge_suggest - 智能检索建议
       * 检测用户输入，智能建议是否检索知识库
       */
      new Tool({
        name: "knowledge_suggest",
        description: "检测用户输入，智能建议是否检索知识库",
        parameters: {
          userInput: {
            type: "string",
            description: "用户的输入内容",
            required: true
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { userInput } = args;
            
            // 检测是否包含知识相关关键词
            const knowledgeKeywords = [
              '检索', '查找', '相关知识', '之前讨论', '记得',
              '以前说过', '历史', '之前提到', '之前写', '之前记录'
            ];
            
            const shouldSuggest = knowledgeKeywords.some(keyword => 
              userInput.includes(keyword)
            );
            
            if (shouldSuggest) {
              // 提取检索关键词
              const query = this.extractQueryFromUserInput(userInput);
              
              // 执行检索
              const results = await retriever.search(query, 3);
              
              if (results.length > 0) {
                return {
                  success: true,
                  suggestion: true,
                  message: `找到 ${results.length} 篇相关笔记：`,
                  results: results.map((r, i) => ({
                    rank: i + 1,
                    title: r.title,
                    category: r.category,
                    source: r.source === 'local' ? '本地' : '思源笔记',
                    relevance: Math.round(r.relevance) + '%',
                    excerpt: r.excerpt
                  })),
                  actions: [
                    { label: '查看详情', action: `/knowledge_get --id "${results[0].title}"` },
                    { label: '继续检索', action: `/knowledge_search --query "${query}"` }
                  ]
                };
              }
            }
            
            return {
              success: true,
              suggestion: false
            };
          } catch (error) {
            console.error('智能建议失败:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      }),

      /**
       * 工具 5: knowledge_get - 获取知识卡片详情
       * 获取指定知识卡片的完整内容
       */
      new Tool({
        name: "knowledge_get",
        description: "获取指定知识卡片的完整内容",
        parameters: {
          id: {
            type: "string",
            description: "知识卡片 ID 或标题",
            required: true
          },
          source: {
            type: "string",
            description: "来源",
            enum: ["local", "siyuan"],
            required: false,
            default: "local"
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { id, source = "local" } = args;

            const knowledgeCard = await retriever.getKnowledgeCard(id, source);

            return {
              success: true,
              id: knowledgeCard.id,
              title: knowledgeCard.metadata?.title || id,
              category: knowledgeCard.metadata?.category || '未分类',
              tags: knowledgeCard.metadata?.tags || [],
              content: knowledgeCard.content
            };
          } catch (error) {
            console.error('获取知识卡片失败:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      })
    ];
  }
};
