# 配置快速指南

## 1. 基础配置（必需）

### 仅使用本地存储（最简单）

无需任何配置，直接使用！

```bash
# 安装 Skill
clawhub install knowledge

# 开始使用
/knowledge_summarize --title "我的第一篇笔记" --category "架构"
```

所有知识会自动保存到 `./docs/knowledge-base/` 目录。

---

## 2. 进阶配置（可选）

### 启用思源笔记同步

#### 步骤 1: 获取思源笔记 API Token

1. 打开思源笔记
2. 进入 `设置` → `关于` → `API Token`
3. 复制 Token

#### 步骤 2: 配置环境变量

创建 `.env` 文件：

```bash
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=你的 API Token
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库
```

#### 步骤 3: 测试连接

```bash
/knowledge_list --source siyuan
```

如果看到思源笔记中的文档列表，说明配置成功！

---

## 3. 自定义配置（可选）

### 修改存储路径

编辑 `config.yaml`：

```yaml
knowledge:
  storage:
    local_path: /your/custom/path/knowledge-base
```

### 修改默认分类

编辑 `index.js`，在 `knowledge_summarize` 工具中添加自定义分类：

```javascript
category: {
  type: "string",
  description: "知识分类",
  enum: ["架构", "模块", "规范", "问题", "决策", "教程", "你的自定义分类"],
  required: true
}
```

---

## 4. 常见问题

### Q1: 思源笔记连接失败？

**A**: 检查以下几点：
1. 思源笔记是否在运行
2. API Token 是否正确
3. API 端口是否为 6806（可在思源笔记设置中查看）

### Q2: 本地文件保存在哪里？

**A**: 默认在 `./docs/knowledge-base/` 目录（相对于 OpenClaw 工作目录）

### Q3: 可以只使用本地存储吗？

**A**: 可以！不配置思源笔记相关环境变量即可，所有功能正常使用。

### Q4: 如何备份知识库？

**A**: 直接备份 `docs/knowledge-base/` 目录即可，所有 Markdown 文件都是纯文本格式。

---

## 5. 最佳实践

### 命名规范

- **标题**: 简洁明确，例如 "爬虫引擎架构" 而非 "关于爬虫的一些想法"
- **分类**: 保持一致性，不要混用 "架构" 和 "Architecture"
- **标签**: 使用技术关键词，便于检索

### 提炼时机

- ✅ 完成一个功能模块后
- ✅ 解决一个复杂问题后
- ✅ 做出重要技术决策后
- ✅ 结束一个话题前

### 检索技巧

- 使用具体技术关键词，例如 "aiohttp" 而非 "那个 HTTP 库"
- 可以组合多个关键词，例如 "爬虫 并发 连接池"
- 使用分类过滤缩小范围，例如 `--category "问题"`

---

## 6. 高级用法

### 批量导出

```bash
# 导出所有架构类知识
/knowledge_list --category "架构" --source all

# 导出为 Markdown 文件（手动操作）
# 直接复制 docs/knowledge-base/ 目录即可
```

### 知识图谱

在思源笔记中：
1. 打开 "OpenClaw 知识库" 笔记本
2. 点击 "关系图谱"
3. 查看知识卡片之间的关联

### 自动化工作流

可以结合 OpenClaw 的自动化功能：
1. 设置话题结束触发器
2. 自动调用 `knowledge_summarize`
3. 定期调用 `knowledge_search` 复习旧知识

---

## 7. 故障排除

### 日志查看

```bash
# OpenClaw 日志
openclaw logs

# 查看 Skill 特定日志
openclaw logs --skill knowledge
```

### 重置配置

```bash
# 删除配置
rm .env
rm config.yaml

# 重新安装
clawhub uninstall knowledge
clawhub install knowledge
```

### 报告问题

如果问题无法解决，请：
1. 收集错误日志
2. 记录复现步骤
3. 提交到 https://github.com/your-repo/openclaw-knowledge/issues
