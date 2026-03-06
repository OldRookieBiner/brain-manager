# OpenClaw Brain Manager

🧠 **强大的大脑管家** - 自动提炼会话内容、同步思源笔记、智能检索知识库

[![Version](https://img.shields.io/npm/v/@openclaw/brain)](https://www.npmjs.com/package/@openclaw/brain)
[![License](https://img.shields.io/npm/l/@openclaw/brain)](LICENSE)
[![Node](https://img.shields.io/node/v/@openclaw/brain)](https://nodejs.org)

---

## 🌟 功能特性

### ✨ 核心功能

- **📝 会话提炼** - 自动将 OpenClaw 对话内容提炼为结构化知识卡片
- **📒 思源同步** - 无缝同步到思源笔记，支持分类管理和标签系统
- **🔍 智能检索** - 从本地文件和思源笔记检索相关知识
- **📂 自动分类** - 支持架构、模块、规范、问题、决策、教程等多种分类
- **💾 本地备份** - 所有知识自动保存本地 Markdown 备份，永不丢失
- **🔗 双向链接** - 自动建立知识卡片之间的关联

### 🎯 使用场景

1. **开发完成后** - 提炼技术文档和架构决策
2. **问题解决后** - 记录排查过程和经验教训
3. **新话题开始时** - 检索既有知识保持一致性
4. **团队协作时** - 共享知识资产，降低沟通成本
5. **个人成长** - 积累技术笔记，形成知识体系

---

## 📦 安装

### 方式 1：从 ClawHub 安装（推荐）

```bash
clawhub install knowledge
```

### 方式 2：本地安装

```bash
# 克隆或下载本仓库
git clone https://github.com/your-repo/openclaw-knowledge.git

# 复制到 OpenClaw skills 目录
cp -r openclaw-knowledge ~/.openclaw/workspace/skills/knowledge

# 重启 OpenClaw Gateway
openclaw gateway restart
```

### 方式 3：开发模式

```bash
# 安装依赖
npm install

# 链接到 OpenClaw
npm link

# 测试运行
npm test
```

---

## ⚙️ 配置

### 环境变量

在项目根目录创建 `.env` 文件（可选）：

```bash
# 思源笔记配置（可选，不使用思源笔记可不填）
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=your_siYuan_api_token
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库

# OpenClaw API 配置（通常自动获取）
OPENCLAW_API_KEY=your_openclaw_api_key
OPENCLAW_API_ENDPOINT=https://api.openclaw.ai/v1
```

### 配置文件（可选）

创建 `config.yaml` 自定义默认行为：

```yaml
knowledge:
  storage:
    local_path: ./docs/knowledge-base
    siyuan_enabled: true
    siyuan_notebook: "OpenClaw 知识库"
  
  extraction:
    auto_tag: true
    include_code: true
    max_content_length: 5000
  
  search:
    default_limit: 5
    min_relevance: 10
```

---

## 🚀 使用方法

### 工具 1: `knowledge_summarize` - 会话提炼

**功能**: 自动提炼当前会话内容为知识卡片

**参数**:
- `title` (必需): 知识卡片标题
- `category` (必需): 分类（架构/模块/规范/问题/决策/教程）
- `syncToSiYuan` (可选): 是否同步到思源笔记，默认 `true`

**示例**:

```
用户：/knowledge_summarize --title "爬虫引擎架构设计" --category "架构"

OpenClaw: ✅ 已提炼知识卡片：爬虫引擎架构设计
         📁 分类：架构
         🏷️ 标签：['架构', 'aiohttp', '爬虫', '异步']
         💾 本地备份：docs/knowledge-base/爬虫引擎架构设计.md
         📒 思源同步：成功 - OpenClaw 知识库/架构/爬虫引擎架构设计
         
         预览：
         # 爬虫引擎架构设计
         
         ## 会话元数据
         - 提炼时间：2026-03-06
         - 分类：架构
         - 涉及模块：爬虫引擎、HTTP 客户端
         ...
```

### 工具 2: `knowledge_search` - 知识检索

**功能**: 从知识库检索相关信息

**参数**:
- `query` (必需): 检索关键词
- `limit` (可选): 返回结果数量，默认 `5`
- `category` (可选): 分类过滤
- `source` (可选): 检索来源（all/local/siyuan），默认 `all`

**示例**:

```
用户：检索知识库中关于"aiohttp 异步请求"的内容

OpenClaw: 🔍 已检索到 3 篇相关笔记：

         1️⃣ 爬虫引擎架构设计
            📂 分类：架构
            📁 来源：📒 思源笔记
            🔗 相关性：85%
            📝 摘要：使用 **aiohttp** 实现异步 HTTP 请求，相比 requests 性能提升 3 倍...
            🏷️ 标签：['架构', 'aiohttp', '爬虫']

         2️⃣ 技术选型决策
            📂 分类：决策
            📁 来源：📁 本地
            🔗 相关性：72%
            📝 摘要：选择 **aiohttp** 而非 requests 的原因：1. 原生异步支持 2. 连接池管理...
            🏷️ 标签：['决策', 'aiohttp']

         3️⃣ 并发连接数限制问题
            📂 分类：问题
            📁 来源：📒 思源笔记
            🔗 相关性：68%
            📝 摘要：遇到 aiohttp 并发连接数限制，通过调整 Connector 参数解决...
            🏷️ 标签：['问题', 'aiohttp', '并发']
```

### 工具 3: `knowledge_list` - 列出知识库

**功能**: 列出所有已保存的知识卡片

**参数**:
- `category` (可选): 分类过滤
- `source` (可选): 来源（all/local/siyuan），默认 `all`

**示例**:

```
用户：列出所有架构相关的知识卡片

OpenClaw: 📚 知识库列表（分类：架构）
         
         共找到 5 篇文档：
         
         1. 爬虫引擎架构设计
            📂 架构 | 📒 思源笔记
            📁 /OpenClaw 知识库/架构/爬虫引擎架构设计

         2. 数据存储模块设计
            📂 架构 | 📁 本地
            📁 docs/knowledge-base/数据存储模块设计.md

         3. API 接口规范
            📂 架构 | 📒 思源笔记
            📁 /OpenClaw 知识库/架构/API 接口规范
         
         ...
```

### 工具 4: `knowledge_get` - 获取详情

**功能**: 获取指定知识卡片的完整内容

**参数**:
- `id` (必需): 知识卡片 ID 或标题
- `source` (可选): 来源（local/siyuan），默认 `local`

**示例**:

```
用户：获取"爬虫引擎架构设计"的完整内容

OpenClaw: 📄 知识卡片：爬虫引擎架构设计
         
         # 爬虫引擎架构设计
         
         ## 会话元数据
         - 提炼时间：2026-03-06
         - 分类：架构
         - 涉及模块：爬虫引擎、HTTP 客户端
         - 相关文件：src/crawler/engine.py, src/crawler/fetcher.py
         
         ## 核心内容
         
         ### 技术决策
         1. 选择 aiohttp 作为 HTTP 客户端库
            - 原因：原生异步支持，性能优异
            - 替代方案：requests（同步，性能较差）
         
         ### 代码实现
         ```python
         class CrawlerEngine:
             async def fetch(self, url):
                 async with aiohttp.ClientSession() as session:
                     async with session.get(url) as response:
                         return await response.text()
         ```
         
         ### 问题记录
         - 问题：并发连接数限制
         - 解决：调整 Connector 参数，设置合理的连接池大小
         
         ### 待办事项
         - [ ] 添加重试机制
         - [ ] 实现速率限制
         - [ ] 优化内存占用
         
         ## 参考资料
         - [aiohttp 官方文档](https://docs.aiohttp.org/)
         - [异步爬虫最佳实践](...)
```

---

## 📖 完整工作流示例

### 场景 1：完成功能开发后提炼知识

```bash
# 1. 完成爬虫引擎开发后
/knowledge_summarize --title "爬虫引擎实现" --category "模块"

# 2. 系统自动：
#    - 提炼会话中的关键技术点
#    - 保存本地 Markdown 文件
#    - 同步到思源笔记
#    - 建立索引和标签

# 3. 查看提炼结果
/knowledge_get --id "爬虫引擎实现"
```

### 场景 2：新话题开始时检索知识

```bash
# 1. 准备开发新功能，先检索相关知识
/knowledge_search --query "aiohttp 连接池" --limit 3

# 2. 系统返回相关笔记作为上下文

# 3. 基于既有知识继续开发
# （OpenClaw 会自动结合检索结果提供建议）
```

### 场景 3：定期整理知识库

```bash
# 1. 列出所有知识卡片
/knowledge_list --category "架构"

# 2. 查看特定卡片详情
/knowledge_get --id "数据存储模块设计"

# 3. 发现过时的内容，更新它
# （重新提炼或手动编辑 Markdown 文件）
```

---

## 🏗️ 架构设计

```
openclaw-knowledge/
├── index.js                  # Skill 主入口，定义 4 个工具
├── lib/
│   ├── extractor.js          # 会话提炼器（LLM 调用）
│   ├── retriever.js          # 知识检索器（全文检索）
│   └── siyuan-sync.js        # 思源同步器（API 集成）
├── package.json              # 依赖和版本
├── SKILL.md                  # Skill 元信息
└── README.md                 # 本文档
```

### 数据流

```
OpenClaw 会话
    ↓
[KnowledgeExtractor] 提炼
    ↓
知识卡片 (Markdown)
    ↓
┌──────────────┬──────────────┐
│   本地备份   │  思源笔记同步 │
│  (docs/)     │  (API)       │
└──────────────┴──────────────┘
    ↓
[KnowledgeRetriever] 检索
    ↓
返回相关知识作为上下文
```

---

## 🔧 开发指南

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/your-repo/openclaw-knowledge.git
cd openclaw-knowledge

# 2. 安装依赖
npm install

# 3. 链接到 OpenClaw
npm link

# 4. 运行测试
npm test

# 5. 代码检查
npm run lint
```

### 测试

```bash
# 单元测试
npm test

# 集成测试（需要运行中的 OpenClaw）
npm run test:integration
```

### 构建

```bash
# 打包（如果需要）
npm run build
```

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循 ESLint 代码规范
- 为所有公共函数编写 JSDoc 注释
- 添加单元测试覆盖新功能
- 更新 README.md 文档

---

## 📝 更新日志

### v1.0.0 (2026-03-06)

- ✨ 首次发布
- 📝 实现会话提炼功能
- 📒 实现思源笔记同步
- 🔍 实现智能检索
- 📂 实现分类管理

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

- **作者**: OpenClaw Community
- **仓库**: https://github.com/your-repo/openclaw-knowledge
- **问题反馈**: https://github.com/your-repo/openclaw-knowledge/issues
- **讨论区**: https://github.com/your-repo/openclaw-knowledge/discussions

---

**🎉 Happy Knowledge Building!**
