# OpenClaw Knowledge Skill - 快速参考卡片

## 🚀 快速开始（3 分钟）

```bash
# 1. 安装
clawhub install knowledge

# 2. 配置（可选）
cp .env.example .env
# 编辑 .env 添加思源笔记 API

# 3. 使用
/knowledge_summarize --title "我的笔记" --category "架构"
```

---

## 📋 4 个核心工具

| 工具 | 功能 | 示例 |
|------|------|------|
| `knowledge_summarize` | 提炼会话 | `/knowledge_summarize --title "爬虫引擎" --category "架构"` |
| `knowledge_search` | 检索知识 | `/knowledge_search --query "aiohttp 异步"` |
| `knowledge_list` | 列出所有 | `/knowledge_list --category "架构"` |
| `knowledge_get` | 获取详情 | `/knowledge_get --id "爬虫引擎"` |

---

## 📁 6 个分类

- **架构** - 系统架构设计
- **模块** - 功能模块实现
- **规范** - 代码和技术规范
- **问题** - 问题和解决方案
- **决策** - 技术选型决策
- **教程** - 使用教程和指南

---

## 🔧 配置选项

### 环境变量（.env）
```bash
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=your_token
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库
```

### 默认行为
- 本地存储：`./docs/knowledge-base/`
- 思源同步：默认开启
- 检索数量：默认 5 条

---

## 💡 使用场景

### 场景 1: 完成开发后
```
/knowledge_summarize --title "数据存储模块" --category "模块"
```

### 场景 2: 开始新功能前
```
/knowledge_search --query "aiohttp 连接池" --limit 3
```

### 场景 3: 复习旧知识
```
/knowledge_list --category "决策"
/knowledge_get --id "技术选型"
```

---

## ⚠️ 常见问题

### Q: 思源笔记连接失败？
A: 检查 API Token 和端口，或仅使用本地存储

### Q: 知识保存在哪里？
A: 本地：`docs/knowledge-base/`，思源：`OpenClaw 知识库` 笔记本

### Q: 如何备份？
A: 直接备份 `docs/knowledge-base/` 目录

---

## 📚 文档导航

- **README.md** - 完整使用文档
- **CONFIG.md** - 配置指南
- **PUBLISHING.md** - 发布指南
- **PROJECT_OVERVIEW.md** - 项目概览
- **SUMMARY.md** - 项目总结

---

## 🎯 快速命令

```bash
# 安装
clawhub install knowledge

# 提炼会话
/knowledge_summarize -t "标题" -c "架构"

# 检索知识
/knowledge_search -q "关键词" -l 5

# 列出所有
/knowledge_list

# 获取详情
/knowledge_get -i "标题"
```

---

## 🆘 获取帮助

1. 查看 README.md
2. 查看 CONFIG.md
3. 提交 GitHub Issue
4. 联系 OpenClaw 社区

---

**🎉 Happy Knowledge Building!**
