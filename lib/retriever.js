/**
 * Knowledge Retriever - 知识检索器
 * 
 * 负责从本地知识库和思源笔记中检索相关信息
 * 支持关键词检索和简单的语义匹配
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

export class KnowledgeRetriever {
  constructor(options = {}) {
    this.storagePath = options.storagePath || './docs/knowledge-base';
    this.siYuanApiUrl = options.siYuanApiUrl || process.env.SIYUAN_API_URL;
    this.siYuanApiToken = options.siYuanApiToken || process.env.SIYUAN_API_TOKEN;
    
    // 专用笔记本（可写）
    this.dedicatedNotebook = options.notebookName || process.env.SIYUAN_NOTEBOOK_NAME || 'OpenClaw 知识库';
    
    // 只读笔记本列表（可选，逗号分隔）
    this.readOnlyNotebooks = options.readOnlyNotebooks 
      ? options.readOnlyNotebooks.split(',').map(n => n.trim())
      : (process.env.SIYUAN_READ_ONLY_NOTEBOOKS || '').split(',').map(n => n.trim()).filter(n => n);
    
    // 权限控制
    this.permissions = {
      denyWrite: options.denyWrite || [],
      denyRead: options.denyRead || []
    };
  }

  /**
   * 检索知识库 - 支持多笔记本检索
   * @param {string} query - 检索关键词
   * @param {number} limit - 返回结果数量
   * @param {Object} options - 检索选项
   * @returns {Promise<Array>} 检索结果
   */
  async search(query, limit = 5, options = {}) {
    const {
      searchLocal = true,
      searchSiYuan = true,
      category = null,
      notebook = null,  // 指定笔记本检索
      includeReadOnly = true  // 是否包含只读笔记本
    } = options;

    const results = [];

    // 并行检索本地和思源笔记
    const promises = [];

    if (searchLocal) {
      promises.push(this.searchLocal(query, category));
    }

    if (searchSiYuan && this.siYuanApiUrl) {
      // 如果指定了笔记本，只检索该笔记本
      if (notebook) {
        promises.push(this.searchSiYuanInNotebook(query, notebook, category));
      } else {
        // 否则检索所有可访问的笔记本
        promises.push(this.searchSiYuanAllNotebooks(query, category, includeReadOnly));
      }
    }

    const searchResults = await Promise.all(promises);
    
    // 合并结果
    searchResults.forEach(result => {
      results.push(...result);
    });

    // 按相关性排序
    results.sort((a, b) => b.relevance - a.relevance);

    // 返回前 N 个结果
    return results.slice(0, limit);
  }

  /**
   * 检索本地知识库
   */
  async searchLocal(query, category = null) {
    const results = [];
    const queryLower = query.toLowerCase();

    try {
      // 确保存储目录存在
      await fs.access(this.storagePath);
      
      // 读取所有 Markdown 文件
      const files = await fs.readdir(this.storagePath);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        const filePath = path.join(this.storagePath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // 检查分类过滤
        if (category && !content.includes(`category: ${category}`)) {
          continue;
        }

        // 计算相关性分数
        const relevance = this.calculateRelevance(content, queryLower);
        
        if (relevance > 0) {
          // 提取摘要
          const excerpt = this.extractExcerpt(content, queryLower);
          
          // 解析元数据
          const metadata = this.parseMetadata(content);
          
          results.push({
            id: file.replace('.md', ''),
            title: metadata.title || file.replace('.md', ''),
            category: metadata.category || '未分类',
            tags: metadata.tags || [],
            excerpt,
            relevance,
            source: 'local',
            path: filePath,
            createdAt: metadata.created
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('本地检索失败:', error);
      }
    }

    return results;
  }

  /**
   * 检索思源笔记 - 检索所有可访问的笔记本
   */
  async searchSiYuanAllNotebooks(query, category = null, includeReadOnly = true) {
    const results = [];

    // 1. 检索专用笔记本
    const dedicatedResults = await this.searchSiYuanInNotebook(
      query, 
      this.dedicatedNotebook, 
      category
    );
    results.push(...dedicatedResults);

    // 2. 检索只读笔记本（如果启用）
    if (includeReadOnly && this.readOnlyNotebooks.length > 0) {
      for (const notebook of this.readOnlyNotebooks) {
        // 检查是否在禁止列表中
        if (this.permissions.denyRead.includes(notebook)) {
          continue;
        }

        const readOnlyResults = await this.searchSiYuanInNotebook(
          query,
          notebook,
          category
        );
        results.push(...readOnlyResults);
      }
    }

    return results;
  }

  /**
   * 检索思源笔记 - 检索指定笔记本
   */
  async searchSiYuanInNotebook(query, notebookName, category = null) {
    const results = [];

    if (!this.siYuanApiUrl || !this.siYuanApiToken) {
      return results;
    }

    try {
      // 使用思源笔记 SQL 查询
      const sqlQuery = `
        SELECT * FROM blocks 
        WHERE type = 'd' 
        AND content LIKE '%${query}%'
        AND notebook = '${notebookName}'
        ${category ? `AND hpath LIKE '%/${category}/%'` : ''}
        LIMIT 20
      `;

      const response = await fetch(`${this.siYuanApiUrl}/api/query/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.siYuanApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stmt: sqlQuery })
      });

      if (!response.ok) {
        throw new Error(`思源笔记 API 调用失败：${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        for (const block of data.data) {
          const content = block.content || '';
          const relevance = this.calculateRelevance(content, query.toLowerCase());
          
          if (relevance > 0) {
            results.push({
              id: block.id,
              title: this.extractTitle(content),
              category: category || '思源笔记',
              excerpt: this.truncate(content, 200),
              relevance,
              source: 'siyuan',
              notebook: notebookName,
              path: block.hpath
            });
          }
        }
      }
    } catch (error) {
      console.error(`思源笔记检索失败（笔记本：${notebookName}）:`, error);
    }

    return results;
  }

  /**
   * 计算相关性分数
   */
  calculateRelevance(content, query) {
    const contentLower = content.toLowerCase();
    let score = 0;

    // 完全匹配
    if (contentLower.includes(query)) {
      score += 10;
    }

    // 关键词匹配（按空格分割）
    const keywords = query.split(/\s+/);
    keywords.forEach(keyword => {
      if (keyword.length > 1 && contentLower.includes(keyword)) {
        score += 5;
      }
    });

    // 标题匹配（权重更高）
    const titleMatch = content.match(/^# (.+)$/m);
    if (titleMatch && titleMatch[1].toLowerCase().includes(query)) {
      score += 20;
    }

    // 标签匹配
    const tagMatch = content.match(/tags: \[(.+?)\]/);
    if (tagMatch) {
      const tags = tagMatch[1].split(',').map(t => t.trim().toLowerCase());
      if (tags.some(tag => tag.includes(query))) {
        score += 15;
      }
    }

    return score;
  }

  /**
   * 提取摘要（包含关键词的片段）
   */
  extractExcerpt(content, query, contextLength = 100) {
    const index = content.toLowerCase().indexOf(query);
    
    if (index === -1) {
      return this.truncate(content, contextLength * 2);
    }

    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + query.length + contextLength);
    
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt += '...';

    // 高亮关键词
    excerpt = excerpt.replace(new RegExp(query, 'gi'), '**$&**');

    return excerpt;
  }

  /**
   * 解析元数据
   */
  parseMetadata(content) {
    const metadata = {};
    
    // 解析 YAML front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
    if (frontMatterMatch) {
      const lines = frontMatterMatch[1].split('\n');
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          if (key === 'tags') {
            metadata[key] = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim());
          } else {
            metadata[key] = value;
          }
        }
      });
    }

    return metadata;
  }

  /**
   * 提取标题
   */
  extractTitle(content) {
    const match = content.match(/^# (.+)$/m);
    return match ? match[1] : '无标题';
  }

  /**
   * 截断文本
   */
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 获取知识卡片详情
   */
  async getKnowledgeCard(id, source = 'local') {
    if (source === 'local') {
      const filePath = path.join(this.storagePath, `${id}.md`);
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        id,
        content,
        metadata: this.parseMetadata(content)
      };
    } else if (source === 'siyuan') {
      // 从思源笔记获取完整内容
      const response = await fetch(`${this.siYuanApiUrl}/api/block/getBlockKramdown`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.siYuanApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          return {
            id,
            content: data.data,
            metadata: {}
          };
        }
      }
    }

    throw new Error(`无法获取知识卡片：${id}`);
  }
}
