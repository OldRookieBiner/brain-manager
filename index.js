/**
 * OpenClaw Brain Manager
 * 
 * 大脑管家 - 自动提炼会话内容、同步思源笔记、智能检索知识库
 * 
 * 支持多语言：中文、英文
 */

import { Tool } from "@openclaw/tool";
import { KnowledgeExtractor } from "./lib/extractor.js";
import { KnowledgeRetriever } from "./lib/retriever.js";
import { SiYuanSync } from "./lib/siyuan-sync.js";
import { SmartDetector } from "./lib/smart-detector.js";
import { CompressionDetector } from "./lib/compression-detector.js";
import { IntelligentAnalyzer } from "./lib/intelligent-analyzer.js";

// 初始化模块（支持多语言）
const extractor = new KnowledgeExtractor({
  language: process.env.DEFAULT_LANGUAGE || 'zh'
});
const retriever = new KnowledgeRetriever({
  notebookName: process.env.SIYUAN_NOTEBOOK_NAME,
  readOnlyNotebooks: process.env.SIYUAN_READ_ONLY_NOTEBOOKS
});
const siyuanSync = new SiYuanSync({
  notebookName: process.env.SIYUAN_NOTEBOOK_NAME
});
const smartDetector = new SmartDetector({
  language: process.env.DEFAULT_LANGUAGE || 'zh'
});
const compressionDetector = new CompressionDetector();
const analyzer = new IntelligentAnalyzer({
  language: process.env.DEFAULT_LANGUAGE || 'zh'
});

/**
 * 分析结果缓存（LRU 缓存，最多 100 条，10 分钟过期）
 */
const analysisCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟
const MAX_CACHE_SIZE = 100;

/**
 * 相似文档检测缓存（LRU 缓存，最多 50 条，5 分钟过期）
 */
const duplicateCheckCache = new Map();
const DUPLICATE_CACHE_TTL = 5 * 60 * 1000; // 5 分钟
const MAX_DUPLICATE_CACHE_SIZE = 50;

/**
 * 从缓存获取分析结果
 */
function getCachedAnalysis(cacheKey) {
  const cached = analysisCache.get(cacheKey);
  if (!cached) return null;
  
  // 检查是否过期
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    analysisCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

/**
 * 缓存分析结果
 */
function cacheAnalysisResult(cacheKey, data) {
  // 如果缓存已满，删除最旧的条目
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  
  analysisCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 从缓存获取相似文档检测结果
 */
function getCachedDuplicateCheck(title, category) {
  const cacheKey = `${category}:${title}`;
  const cached = duplicateCheckCache.get(cacheKey);
  
  if (!cached) return null;
  
  // 检查是否过期
  if (Date.now() - cached.timestamp > DUPLICATE_CACHE_TTL) {
    duplicateCheckCache.delete(cacheKey);
    return null;
  }
  
  return cached.result;
}

/**
 * 缓存相似文档检测结果
 */
function cacheDuplicateCheck(title, category, result) {
  const cacheKey = `${category}:${title}`;
  
  // 如果缓存已满，删除最旧的条目
  if (duplicateCheckCache.size >= MAX_DUPLICATE_CACHE_SIZE) {
    const firstKey = duplicateCheckCache.keys().next().value;
    duplicateCheckCache.delete(firstKey);
  }
  
  duplicateCheckCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
}

/**
 * 执行知识提炼流程
 * 
 * @param {string} title - 知识卡片标题
 * @param {string} category - 知识分类（架构/模块/规范/问题/决策/教程）
 * @param {Array} conversationHistory - 会话历史数组
 * @param {boolean} syncToSiYuan - 是否同步到思源笔记（默认：true）
 * @param {boolean} forceNew - 强制创建新文档，不检测相似文档（默认：false）
 * @param {boolean} updateExisting - 强制更新已有文档（默认：false）
 * @param {string} specifiedDocId - 指定的文档 ID（更新模式）
 * @param {string} language - 输出语言（zh/en，默认自动检测）
 * @param {Object} analysisResult - 智能分析结果（可选，智能模式时使用）
 * @returns {Promise<Object>} 提炼结果对象
 * 
 * 返回结果包含：
 * - success: 是否成功
 * - action: 操作类型（created/updated）
 * - title: 知识卡片标题
 * - category: 知识分类
 * - preview: 内容预览
 * - sync: 思源同步结果
 * - detection: 相似度检测结果
 * - compressionRisk: 压缩风险信息
 * - analysis: 智能分析结果（如果有）
 */
async function processExtraction({
  title,
  category,
  customPath,
  conversationHistory,
  syncToSiYuan = true,
  forceNew = false,
  updateExisting = false,
  specifiedDocId = null,
  language,
  analysisResult = null,
  skipDuplicateCheck = false  // 新增：跳过相似文档检测
}) {
  // 压缩风险检测
  const compressionRisk = await compressionDetector.detectRisk(conversationHistory);

  // 方案 A：如果检测到高风险，提示用户
  if (compressionRisk.riskLevel === 'critical') {
    console.warn('[Compression] 检测到压缩风险：', compressionRisk.suggestion);
    
    // 返回警告给用户
    return {
      success: false,
      action: 'compression_warning',
      message: '⚠️ 检测到会话内容可能被压缩，提炼质量可能受影响',
      compressionRisk: {
        level: compressionRisk.riskLevel,
        usageRate: compressionRisk.usageRate,
        tokens: compressionRisk.tokens,
        limit: compressionRisk.limit,
        suggestion: compressionRisk.suggestion
      },
      options: [
        {
          label: '继续提炼',
          description: '忽略警告，继续提炼知识',
          action: 'continue'
        },
        {
          label: '取消',
          description: '取消提炼，检查会话内容',
          action: 'cancel'
        }
      ]
    };
  }

  // 智能检测：是否应该更新已有文档
  let targetDocId = specifiedDocId;
  let shouldUpdate = false;
  let detectionResult = null;

  // 优化：只在必要时检测，并使用缓存
  if (!forceNew && !specifiedDocId && !skipDuplicateCheck) {
    // 1. 检查缓存
    const cachedResult = getCachedDuplicateCheck(title, category);
    
    if (cachedResult) {
      console.log('[DuplicateCheck] 使用缓存的检测结果');
      detectionResult = cachedResult;
    } else {
      // 2. 执行检测
      console.log('[DuplicateCheck] 执行相似文档检测...');
      const startTime = Date.now();
      
      detectionResult = await smartDetector.shouldUpdateExisting(
        title,
        category,
        conversationHistory,
        retriever
      );
      
      const duration = Date.now() - startTime;
      console.log(`[DuplicateCheck] 检测完成，耗时 ${duration}ms`);
      
      // 3. 缓存结果
      cacheDuplicateCheck(title, category, detectionResult);
    }

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

  // 提炼知识（支持多语言）
  // 提取 AI 关键词（如果有）
  const aiKeywords = analysisResult?.data?.topics?.[0]?.keywords || [];
  
  const knowledgeCard = await extractor.extractCurrentConversation({
    title,
    category,
    conversationHistory,
    language,
    aiKeywords  // 传递 AI 提取的关键词
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
        // 创建新文档（支持自定义路径）
        syncResult = await siyuanSync.syncToNotebook(knowledgeCard, customPath);
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
    } : null,
    // 压缩风险信息
    compressionRisk: compressionRisk.riskLevel === 'critical' ? {
      level: compressionRisk.riskLevel,
      color: compressionRisk.color,
      usageRate: compressionRisk.usageRate,
      tokens: compressionRisk.tokens,
      limit: compressionRisk.limit,
      message: compressionRisk.suggestion
    } : null,
    // 智能分析结果（如果有）
    analysis: analysisResult ? {
      topics: analysisResult.data.topics,
      recommendedAction: analysisResult.data.recommendedAction
    } : null
  };

  return result;
}

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
            description: "知识卡片标题，例如：'爬虫引擎架构设计' / Title for knowledge card",
            required: true
          },
          category: {
            type: "string",
            description: "知识分类 / Category",
            enum: ["架构", "模块", "规范", "问题", "决策", "教程"],
            required: true
          },
          customPath: {
            type: "string",
            description: "自定义路径（支持多层级，如：/项目A/模块B/功能C），不指定则使用默认 /分类/标题",
            required: false
          },
          syncToSiYuan: {
            type: "boolean",
            description: "是否同步到思源笔记（默认：true）/ Sync to SiYuan Notes",
            required: false,
            default: true
          },
          skipDuplicateCheck: {
            type: "boolean",
            description: "跳过相似文档检测（提升性能，默认：false）/ Skip duplicate check",
            required: false,
            default: false
          },
          language: {
            type: "string",
            description: "输出语言（zh/en，默认自动检测）/ Output language",
            enum: ["zh", "en"],
            required: false
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { 
              title, 
              category, 
              customPath,
              syncToSiYuan = true,
              skipDuplicateCheck = false,  // 新增：跳过相似文档检测
              forceNew = false,
              updateExisting = false,
              docId: specifiedDocId,
              language,
              smart = false
            } = args;
            
            // 获取会话历史（从 OpenClaw 上下文）
            const conversationHistory = options.conversationHistory || [];
            
            if (conversationHistory.length === 0) {
              return {
                success: false,
                error: "当前会话为空，无法提炼知识"
              };
            }

            // 智能模式：先分析会话内容
            let analysisResult = null;
            if (smart || !title) {
              // 生成缓存键
              const cacheKey = JSON.stringify({
                conversationLength: conversationHistory.length,
                firstMessage: conversationHistory[0]?.content?.substring(0, 50) || '',
                lastMessage: conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 50) || ''
              });
              
              // 尝试从缓存获取
              let cachedData = getCachedAnalysis(cacheKey);
              
              if (cachedData) {
                console.log('使用缓存的分析结果');
                analysisResult = {
                  success: true,
                  data: cachedData,
                  language: cachedData.language || 'zh',
                  fromCache: true
                };
              } else {
                // 调用智能分析器
                analysisResult = await analyzer.analyze(conversationHistory);
                
                if (!analysisResult.success) {
                  // 分析失败，使用降级方案
                  console.warn('智能分析失败，使用降级方案:', analysisResult.error);
                  analysisResult = {
                    success: true,
                    data: analysisResult.fallback,
                    language: 'zh'
                  };
                } else {
                  // 缓存分析结果
                  cacheAnalysisResult(cacheKey, {
                    ...analysisResult.data,
                    language: analysisResult.language
                  });
                }
              }
              
              // 边界条件检查：话题列表为空
              if (!analysisResult.data.topics || analysisResult.data.topics.length === 0) {
                return {
                  success: false,
                  error: "AI 分析未检测到任何话题，请检查会话内容"
                };
              }
              
              // 如果分析结果显示有多个话题，返回建议给用户选择
              if (analysisResult.data.topics.length > 1 && analysisResult.data.recommendedAction === 'separate') {
                // 生成缓存键用于并行提炼
                const cacheKey = JSON.stringify({
                  conversationLength: conversationHistory.length,
                  firstMessage: conversationHistory[0]?.content?.substring(0, 50) || '',
                  lastMessage: conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 50) || ''
                });
                
                return {
                  success: true,
                  action: 'multiple_topics_detected',
                  message: `检测到 ${analysisResult.data.topics.length} 个独立话题，建议分别提炼`,
                  analysis: analysisResult.data,
                  displayText: analyzer.formatForDisplay(analysisResult.data, analysisResult.language),
                  cacheKey: cacheKey,  // 缓存键用于并行提炼
                  options: analysisResult.data.topics.map((topic, index) => {
                    // 边界条件检查：消息范围
                    const safeStart = Math.max(0, topic.messageRange?.start || 0);
                    const safeEnd = Math.min(conversationHistory.length - 1, topic.messageRange?.end || conversationHistory.length - 1);
                    
                    return {
                      topicId: topic.id,
                      title: topic.titleSuggestions?.[0] || '未命名知识',
                      category: topic.category,
                      summary: topic.summary,
                      messageRange: `${safeStart + 1}-${safeEnd + 1}`,
                      action: `/knowledge_summarize --topic ${topic.id} --title "${topic.titleSuggestions?.[0] || '未命名知识'}" --category "${topic.category}"`
                    };
                  }),
                  extractAllAction: `/extract-all --analysis-cache-key "${cacheKey}"`
                };
              }
              
              // 边界条件检查：标题建议为空
              const firstTopic = analysisResult.data.topics[0];
              if (!firstTopic.titleSuggestions || firstTopic.titleSuggestions.length === 0) {
                firstTopic.titleSuggestions = ['未命名知识'];
              }
              
              // 边界条件检查：分类为空
              if (!firstTopic.category) {
                firstTopic.category = '架构';
              }
              
              // 如果用户没有提供标题，使用 AI 推荐的第一个标题
              const autoTitle = !title ? firstTopic.titleSuggestions[0] : title;
              const autoCategory = !category ? firstTopic.category : category;
              
              // 使用自动填充的标题和分类继续提炼
              return await processExtraction({
                title: autoTitle,
                category: autoCategory,
                customPath,
                conversationHistory,
                syncToSiYuan,
                skipDuplicateCheck,
                forceNew,
                updateExisting,
                specifiedDocId,
                language: language || analysisResult.language,
                analysisResult
              });
            }
            
            // 非智能模式：直接提炼（保持原有逻辑）
            return await processExtraction({
              title,
              category,
              customPath,
              conversationHistory,
              syncToSiYuan,
              skipDuplicateCheck,
              forceNew,
              updateExisting,
              specifiedDocId,
              language,
              analysisResult: null
            });
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
       * 工具 1.5: extract-all - 并行提炼所有话题
       * 并行提炼所有检测到的话题（多话题场景）
       */
      new Tool({
        name: "extract-all",
        description: "并行提炼所有检测到的话题（多话题场景）/ Extract all topics in parallel",
        parameters: {
          analysisCacheKey: {
            type: "string",
            description: "分析结果的缓存键 / Cache key for analysis results",
            required: true
          },
          skipDuplicateCheck: {
            type: "boolean",
            description: "跳过相似文档检测（批量提炼时推荐，默认：true）/ Skip duplicate check",
            required: false,
            default: true
          }
        },
        execute: async (toolCallId, args) => {
          try {
            const { analysisCacheKey, skipDuplicateCheck = true } = args;  // 默认跳过
            
            // 从缓存获取分析结果
            const cachedData = getCachedAnalysis(analysisCacheKey);
            if (!cachedData) {
              return {
                success: false,
                error: "分析结果已过期，请重新分析 / Analysis results expired, please re-analyze"
              };
            }
            
            const topics = cachedData.topics;
            const language = cachedData.language || 'zh';
            
            // 并行提炼所有话题
            const extractPromises = topics.map(async (topic) => {
              // 边界条件检查：消息范围
              const safeStart = Math.max(0, topic.messageRange?.start || 0);
              const safeEnd = Math.min(conversationHistory.length - 1, topic.messageRange?.end || conversationHistory.length - 1);
              
              // 提取该话题的会话历史
              const topicHistory = conversationHistory.slice(safeStart, safeEnd + 1);
              
              // 边界条件检查：标题和分类
              const topicTitle = topic.titleSuggestions?.[0] || '未命名知识';
              const topicCategory = topic.category || '架构';
              
              // 执行提炼（批量提炼时跳过相似文档检测）
              return await processExtraction({
                title: topicTitle,
                category: topicCategory,
                conversationHistory: topicHistory,
                syncToSiYuan: true,
                skipDuplicateCheck,  // 传递参数
                language,
                analysisResult: { data: { topics: [topic] } }
              });
            });
            
            // 等待所有提炼完成
            const results = await Promise.all(extractPromises);
            
            return {
              success: true,
              action: 'extract_all_completed',
              message: `成功提炼 ${results.length} 个话题 / Successfully extracted ${results.length} topics`,
              results: results.map((result, index) => ({
                topicId: topics[index].id,
                title: result.title,
                category: result.category,
                action: result.action,
                preview: result.preview?.substring(0, 100) + '...'
              })),
              totalTopics: topics.length,
              successfulExtractions: results.filter(r => r.success).length
            };
          } catch (error) {
            console.error('并行提炼失败:', error);
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
