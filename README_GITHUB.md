<div align="center">

# 📚 OpenClaw Knowledge Skill

**智能知识管理插件** - 自动提炼会话内容、同步思源笔记、智能检索知识库

[![Version](https://img.shields.io/npm/v/@openclaw/knowledge)](https://www.npmjs.com/package/@openclaw/knowledge)
[![License](https://img.shields.io/npm/l/@openclaw/knowledge)](LICENSE)
[![Node](https://img.shields.io/node/v/@openclaw/knowledge)](https://nodejs.org)
[![ClawHub](https://img.shields.io/badge/ClawHub-published-blue)](https://clawhub.ai/skills/knowledge)

[English](README_EN.md) | [简体中文](README.md)

</div>

---

## ✨ 核心特性

<div align="center">

| 📝 会话提炼 | 🔍 智能检索 | 📒 思源同步 | 🧠 智能检测 |
|:----------:|:----------:|:----------:|:----------:|
| 自动生成结构化知识卡片 | 本地 + 思源双重检索 | 无缝同步到思源笔记 | 相似度检测避免重复 |

| 💡 智能建议 | 🔐 权限控制 | 📂 笔记本管理 | 🌐 多服务器支持 |
|:----------:|:----------:|:----------:|:----------:|
| 关键词触发检索建议 | 写入前权限检查 | 专用 + 只读笔记本 | 支持跨服务器部署 |

</div>

---

## 🚀 快速开始

### 安装

```bash
# 方式 1: 从 ClawHub 安装（推荐）
clawhub install knowledge

# 方式 2: 本地安装
git clone https://github.com/YOUR_USERNAME/openclaw-knowledge.git
cd openclaw-knowledge
npm install
npm run install:skill
```

### 配置

```bash
# 编辑 .env 文件
cp .env.example .env

# 配置思源笔记 API（可选）
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=your_token
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库 - 服务器 A
SIYUAN_READ_ONLY_NOTEBOOKS=项目管理，技术文档
```

### 使用

```bash
# 提炼会话
/knowledge_summarize --title "爬虫引擎架构" --category "架构"

# 检索知识
/knowledge_search --query "aiohttp 异步请求"

# 列出知识库
/knowledge_list

# 获取详情
/knowledge_get --id "爬虫引擎架构"
```

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 完整使用文档 |
| [CONFIG.md](CONFIG.md) | 配置指南 |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 快速参考 |
| [GITHUB_GUIDE.md](GITHUB_GUIDE.md) | GitHub 发布指南 |
| [MULTI_SERVER_DEPLOYMENT.md](MULTI_SERVER_DEPLOYMENT.md) | 多服务器部署 |
| [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) | v2.0 优化总结 |

---

## 🎯 使用场景

### 场景 1：完成功能开发后

```bash
/knowledge_summarize --title "数据存储模块设计" --category "模块"
# ✅ 自动生成结构化技术文档
# ✅ 保存到本地和思源笔记
# ✅ 建立索引和标签
```

### 场景 2：开始新功能前

```bash
/knowledge_search --query "aiohttp 连接池" --limit 3
# 🔍 检索相关知识
# 💡 基于既有知识继续开发
```

### 场景 3：解决复杂问题后

```bash
/knowledge_summarize --title "并发问题解决" --category "问题"
# 📝 记录排查过程
# 🎯 总结经验教训
```

---

## 🌟 v1.0.0 特性

### 1. 人可读的流畅文章

**优化前**：
```markdown
# 标题
## 技术决策
[内容]
```

**优化后**：
```markdown
# 爬虫引擎架构设计

> **摘要**：本文档记录了基于 aiohttp 的高性能爬虫引擎架构设计...

## 📋 背景
在大规模数据采集场景中...

## 🎯 核心内容
### 技术决策
相比传统的 requests 库，aiohttp 具有以下优势...

### 最佳实践
[经验教训总结]
```

### 2. 智能检测

```
相似度 > 80%  → 自动更新老文章
相似度 50-80% → 询问用户选择
相似度 < 50%  → 创建新文章
```

### 3. 智能建议

检测关键词自动建议检索：
- "检索"、"查找"、"相关知识"
- "之前讨论"、"记得"、"历史"

### 4. 权限控制

- ✅ 只能写入专用笔记本
- ❌ 禁止写入只读笔记本
- 🔒 写入前自动验证

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────┐
│     OpenClaw Knowledge Skill        │
├─────────────────────────────────────┤
│  4 个核心工具                        │
│  - knowledge_summarize              │
│  - knowledge_search                 │
│  - knowledge_list                   │
│  - knowledge_get                    │
├─────────────────────────────────────┤
│  3 个核心模块                        │
│  - KnowledgeExtractor (提炼器)      │
│  - KnowledgeRetriever (检索器)      │
│  - SiYuanSync (同步器)              │
├─────────────────────────────────────┤
│  1 个智能模块                        │
│  - SmartDetector (智能检测器)       │
└─────────────────────────────────────┘
```

---

## 📊 性能指标

| 操作 | 平均耗时 |
|------|---------|
| 会话提炼 | 2-5 秒 |
| 知识检索 | < 100ms |
| 思源同步 | 200-500ms |
| 列出知识库 | < 50ms |

---

## 🔐 安全性

- ✅ **本地优先**：所有数据默认存储在本地
- ✅ **可选同步**：思源笔记同步完全可选
- ✅ **权限控制**：写入前自动验证
- ✅ **透明操作**：所有操作都有明确反馈
- ✅ **开源可审查**：代码完全公开

---

## 🤝 贡献

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/openclaw-knowledge.git
cd openclaw-knowledge

# 安装依赖
npm install

# 链接到 OpenClaw
npm link

# 运行测试
npm test
```

### 提交代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 更新日志

### v1.0.0 (2026-03-06)

**新特性**:
- ✨ 生成人可读的流畅技术文档
- 🧠 智能检测：相似度检测避免重复
- 💡 智能建议：关键词触发检索
- 🔐 权限控制：写入前验证
- 📒 多笔记本支持：专用 + 只读
- 📝 会话提炼
- 🔍 知识检索
- 📒 思源同步

**改进**:
- 📝 优化提炼提示词
- ⚡ 性能优化
- 📚 完善文档

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [OpenClaw](https://openclaw.ai) - 强大的 AI 代理框架
- [思源笔记](https://b3log.org/siyuan/) - 本地优先的知识库工具
- [ClawHub](https://clawhub.ai) - OpenClaw 技能市场

---

## 📮 联系方式

- **作者**: Your Name
- **邮箱**: your.email@example.com
- **GitHub**: https://github.com/YOUR_USERNAME
- **Issues**: https://github.com/YOUR_USERNAME/openclaw-knowledge/issues

---

<div align="center">

**🎉 Happy Knowledge Building!**

如果这个项目对您有帮助，请给一个 ⭐ Star！

</div>
