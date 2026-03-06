/**
 * SiYuan Sync - 思源笔记同步器
 * 
 * 负责将知识卡片同步到思源笔记
 * 支持文档创建、更新、分类管理
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

export class SiYuanSync {
  constructor(options = {}) {
    this.api = options.api || {
      url: options.siYuanApiUrl || process.env.SIYUAN_API_URL || 'http://127.0.0.1:6806',
      token: options.siYuanApiToken || process.env.SIYUAN_API_TOKEN || ''
    };
    
    // 专用笔记本（只能写入这个）
    this.dedicatedNotebook = options.notebookName || process.env.SIYUAN_NOTEBOOK_NAME || 'OpenClaw 知识库';
    this.notebookId = null;
    this.localBackupPath = options.localBackupPath || './docs/knowledge-base';
    
    // 权限控制
    this.permissions = {
      denyWrite: options.denyWrite || [],
      denyRead: options.denyRead || []
    };
  }

  /**
   * 同步知识卡片到思源笔记
   * @param {Object} knowledgeCard - 知识卡片
   * @returns {Promise<Object>} 同步结果
   */
  async syncToNotebook(knowledgeCard) {
    const { title, category, content, tags, createdAt } = knowledgeCard;

    try {
      // 权限检查：确保只写入专用笔记本
      await this.validateWritePermission(this.dedicatedNotebook);

      // 1. 获取笔记本 ID
      if (!this.notebookId) {
        this.notebookId = await this.getNotebookId(this.dedicatedNotebook);
      }

      // 2. 创建或更新文档
      const docPath = `/${category}/${title}`;
      const docId = await this.createOrUpdateDoc(docPath, content);

      // 3. 设置文档属性（标签等）
      if (tags && tags.length > 0) {
        await this.setDocAttributes(docId, { tags: tags.join(','), category, createdAt });
      }

      // 4. 本地备份
      await this.saveLocalBackup(knowledgeCard);

      // 5. 更新索引
      await this.updateIndex(category, title, docId);

      return {
        success: true,
        docId,
        docPath,
        notebook: this.dedicatedNotebook,
        localBackup: path.join(this.localBackupPath, `${title}.md`)
      };
    } catch (error) {
      console.error('思源笔记同步失败:', error);
      
      // 即使思源笔记失败，也要保存本地备份
      await this.saveLocalBackup(knowledgeCard);
      
      throw error;
    }
  }

  /**
   * 验证写入权限
   * @param {string} notebookName - 笔记本名称
   */
  async validateWritePermission(notebookName) {
    // 检查是否在禁止写入列表中
    if (this.permissions.denyWrite.includes(notebookName)) {
      throw new Error(`权限错误：禁止写入笔记本 "${notebookName}"`);
    }

    // 检查是否是专用笔记本
    if (notebookName !== this.dedicatedNotebook) {
      throw new Error(
        `权限错误：只能写入专用笔记本 "${this.dedicatedNotebook}"，` +
        `尝试写入 "${notebookName}"`
      );
    }
  }

  /**
   * 获取笔记本 ID
   */
  async getNotebookId(notebookName) {
    try {
      const response = await fetch(`${this.api.url}/api/notebook/lsNotebooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.api.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取笔记本列表失败：${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 0) {
        const notebook = data.data.notebooks.find(nb => nb.name === notebookName);
        
        if (notebook) {
          return notebook.id;
        }

        // 笔记本不存在，创建它
        return await this.createNotebook(notebookName);
      } else {
        throw new Error(`思源笔记 API 错误：${data.msg}`);
      }
    } catch (error) {
      console.error('获取笔记本 ID 失败:', error);
      throw error;
    }
  }

  /**
   * 创建笔记本
   */
  async createNotebook(notebookName) {
    const response = await fetch(`${this.api.url}/api/notebook/createNotebook`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: notebookName })
    });

    if (!response.ok) {
      throw new Error(`创建笔记本失败：${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === 0) {
      return data.data.id;
    } else {
      throw new Error(`创建笔记本失败：${data.msg}`);
    }
  }

  /**
   * 创建或更新文档
   */
  async createOrUpdateDoc(docPath, content) {
    try {
      // 先尝试创建文档
      const response = await fetch(`${this.api.url}/api/filetree/createDocWithMd`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.api.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notebook: this.notebookId,
          path: docPath,
          markdown: content
        })
      });

      if (!response.ok) {
        throw new Error(`创建文档失败：${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 0) {
        return data.data.id;
      } else if (data.code === 404) {
        // 文档已存在，尝试更新
        return await this.updateDoc(docPath, content);
      } else {
        throw new Error(`创建文档失败：${data.msg}`);
      }
    } catch (error) {
      // 如果创建失败，尝试更新
      if (error.message.includes('已存在')) {
        return await this.updateDoc(docPath, content);
      }
      throw error;
    }
  }

  /**
   * 更新文档
   */
  async updateDoc(docPath, content) {
    // 先获取文档 ID
    const docId = await this.getDocIdByPath(docPath);
    
    if (!docId) {
      throw new Error(`文档不存在：${docPath}`);
    }

    // 更新文档内容
    const response = await fetch(`${this.api.url}/api/block/updateBlock`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataType: 'markdown',
        data: content,
        id: docId
      })
    });

    if (!response.ok) {
      throw new Error(`更新文档失败：${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`更新文档失败：${data.msg}`);
    }

    return docId;
  }

  /**
   * 通过路径获取文档 ID
   */
  async getDocIdByPath(docPath) {
    const response = await fetch(`${this.api.url}/api/filetree/getHPathByPath`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notebook: this.notebookId,
        path: docPath
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 0 && data.data) {
        return data.data.id;
      }
    }

    return null;
  }

  /**
   * 设置文档属性
   */
  async setDocAttributes(docId, attributes) {
    const attrs = {};
    
    // 思源笔记自定义属性
    Object.entries(attributes).forEach(([key, value]) => {
      attrs[`custom-${key}`] = value.toString();
    });

    const response = await fetch(`${this.api.url}/api/attr/setBlockAttrs`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: docId,
        attrs
      })
    });

    if (!response.ok) {
      console.error('设置文档属性失败:', response.status);
    }
  }

  /**
   * 更新已有文档
   */
  async updateExistingDoc(docId, newContent) {
    try {
      // 获取原文档信息
      const docInfo = await this.getDocInfo(docId);
      
      if (!docInfo) {
        throw new Error(`文档不存在：${docId}`);
      }

      // 权限检查
      await this.validateWritePermission(docInfo.notebook);

      // 更新文档内容（追加模式）
      const updatedContent = await this.appendUpdateHistory(docInfo.content, newContent);
      
      // 调用思源 API 更新
      const response = await fetch(`${this.api.url}/api/block/updateBlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.api.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: 'markdown',
          data: updatedContent,
          id: docId
        })
      });

      if (!response.ok) {
        throw new Error(`更新文档失败：${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`更新文档失败：${data.msg}`);
      }

      // 本地备份
      await this.saveLocalBackup({
        title: docInfo.title,
        content: updatedContent
      });

      return {
        success: true,
        docId,
        action: 'updated',
        notebook: docInfo.notebook
      };
    } catch (error) {
      console.error('更新文档失败:', error);
      throw error;
    }
  }

  /**
   * 获取文档信息
   */
  async getDocInfo(docId) {
    const response = await fetch(`${this.api.url}/api/block/getBlockKramdown`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: docId })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 0) {
        return {
          id: docId,
          content: data.data,
          title: 'Unknown',  // 需要解析 content 获取标题
          notebook: 'Unknown' // 需要额外查询
        };
      }
    }

    return null;
  }

  /**
   * 追加更新历史
   */
  async appendUpdateHistory(oldContent, newContent) {
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否已有更新历史章节
    const hasHistorySection = oldContent.includes('## 更新历史');
    
    if (hasHistorySection) {
      // 追加到更新历史
      const updateEntry = `- ${today}: 更新内容\n`;
      return oldContent.replace(
        /(## 更新历史\n)/,
        `$1${updateEntry}`
      );
    } else {
      // 添加更新历史章节
      const historySection = `\n## 更新历史\n- ${today}: 初始创建\n- ${today}: 更新内容\n`;
      return oldContent + historySection;
    }
  }

  /**
   * 保存本地备份
   */
  async saveLocalBackup(knowledgeCard) {
    const { title, content } = knowledgeCard;
    
    // 确保目录存在
    await fs.mkdir(this.localBackupPath, { recursive: true });
    
    const filePath = path.join(this.localBackupPath, `${title}.md`);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 更新索引文档
   */
  async updateIndex(category, title, docId) {
    const indexDocPath = `/${category}/索引`;
    
    // 索引内容
    const indexContent = `- [${title}](((${docId} "${title}")))\n`;
    
    try {
      // 尝试追加到索引文档
      await this.appendToDoc(indexDocPath, indexContent);
    } catch (error) {
      // 如果索引文档不存在，创建它
      await this.createOrUpdateDoc(indexDocPath, `# ${category} 知识库索引\n\n${indexContent}`);
    }
  }

  /**
   * 追加内容到文档
   */
  async appendToDoc(docPath, content) {
    const docId = await this.getDocIdByPath(docPath);
    
    if (!docId) {
      throw new Error(`文档不存在：${docPath}`);
    }

    const response = await fetch(`${this.api.url}/api/block/appendBlock`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataType: 'markdown',
        data: content,
        parentID: docId
      })
    });

    if (!response.ok) {
      throw new Error(`追加内容失败：${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`追加内容失败：${data.msg}`);
    }
  }

  /**
   * 列出所有可访问的笔记本
   */
  async listAccessibleNotebooks() {
    const accessible = {
      dedicated: this.dedicatedNotebook,
      readOnly: this.readOnlyNotebooks.filter(nb => !this.permissions.denyRead.includes(nb))
    };
    
    return accessible;
  }

  /**
   * 列出所有同步的文档
   */
  async listDocuments(category = null, notebook = null) {
    // 如果指定了笔记本，列出该笔记本的文档
    if (notebook) {
      const notebookId = await this.getNotebookId(notebook);
      return await this.listDocumentsInNotebook(notebookId, category);
    }

    // 否则列出专用笔记本的文档
    if (!this.notebookId) {
      this.notebookId = await this.getNotebookId(this.dedicatedNotebook);
    }

    return await this.listDocumentsInNotebook(this.notebookId, category);
  }

  /**
   * 列出指定笔记本中的文档
   */
  async listDocumentsInNotebook(notebookId, category = null) {
    const response = await fetch(`${this.api.url}/api/filetree/getDocs`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notebook: notebookId })
    });

    if (!response.ok) {
      throw new Error(`获取文档列表失败：${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === 0) {
      let docs = data.data || [];
      
      // 按分类过滤
      if (category) {
        docs = docs.filter(doc => doc.hpath.includes(category));
      }
      
      return docs.map(doc => ({
        id: doc.id,
        title: doc.name,
        path: doc.hpath,
        updated: doc.updated
      }));
    } else {
      throw new Error(`获取文档列表失败：${data.msg}`);
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(docId) {
    const response = await fetch(`${this.api.url}/api/block/removeBlock`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.api.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: docId })
    });

    if (!response.ok) {
      throw new Error(`删除文档失败：${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`删除文档失败：${data.msg}`);
    }
  }
}
