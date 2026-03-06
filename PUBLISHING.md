# 发布到 ClawHub 指南

## 📦 发布前准备

### 1. 检查清单

在发布之前，请确保：

- [ ] 所有功能已测试通过
- [ ] README.md 完整且准确
- [ ] package.json 版本正确
- [ ] 代码通过 ESLint 检查
- [ ] 测试覆盖率 >= 80%
- [ ] 无敏感信息（API Token、密码等）
- [ ] .gitignore 配置正确
- [ ] LICENSE 文件存在

### 2. 本地测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 本地安装测试
npm run install:skill
```

---

## 🚀 发布流程

### 方式 1: 使用 ClawHub CLI（推荐）

#### 步骤 1: 安装 ClawHub CLI

```bash
npm install -g @openclaw/clawhub-cli
```

#### 步骤 2: 登录 ClawHub

```bash
clawhub login
```

按提示输入：
- ClawHub 账号（或注册新账号）
- 邮箱验证
- 创建开发者 Token

#### 步骤 3: 初始化 Skill 包

```bash
cd openclaw-knowledge
clawhub init
```

这会创建 `clawhub.json` 配置文件：

```json
{
  "name": "@openclaw/knowledge",
  "version": "1.0.0",
  "description": "知识管理插件 - 自动提炼会话内容、同步思源笔记、智能检索知识库",
  "author": "OpenClaw Community",
  "license": "MIT",
  "repository": "https://github.com/your-repo/openclaw-knowledge",
  "keywords": [
    "knowledge-management",
    "siyuan-note",
    "documentation",
    "ai-assistant"
  ],
  "main": "index.js",
  "files": [
    "index.js",
    "lib/",
    "SKILL.md",
    "README.md",
    "CONFIG.md",
    ".env.example"
  ]
}
```

#### 步骤 4: 发布

```bash
clawhub publish
```

如果成功，会看到：

```
✅ Published @openclaw/knowledge@1.0.0 to ClawHub
🔗 View on ClawHub: https://clawhub.ai/skills/@openclaw/knowledge
```

---

### 方式 2: 手动发布

#### 步骤 1: 打包

```bash
# 创建发布包
tar -czf openclaw-knowledge-1.0.0.tgz \
  index.js \
  lib/ \
  package.json \
  SKILL.md \
  README.md \
  CONFIG.md \
  LICENSE
```

#### 步骤 2: 上传到 ClawHub

访问 https://clawhub.ai/developers/publish

填写信息：
- Skill 名称：knowledge
- 版本：1.0.0
- 描述：知识管理插件
- 上传打包文件
- 提交审核

#### 步骤 3: 等待审核

ClawHub 团队会在 1-3 个工作日内审核：
- 代码安全性
- 功能完整性
- 文档质量
- 许可证合规

审核通过后会邮件通知。

---

## 📝 ClawHub 规范要求

### SKILL.md 规范

```yaml
---
name: knowledge                    # 必须：小写字母，连字符分隔
description: 知识管理插件            # 必须：简洁描述（< 100 字符）
version: 1.0.0                     # 必须：语义化版本
author: OpenClaw Community         # 必须：作者名
keywords: 知识管理，思源笔记         # 推荐：逗号分隔的关键词
license: MIT                       # 推荐：开源许可证
repository: https://...            # 可选：代码仓库
homepage: https://...              # 可选：项目主页
---
```

### 目录结构规范

```
openclaw-knowledge/
├── index.js           # 必须：Skill 入口
├── package.json       # 必须：包信息
├── SKILL.md           # 必须：Skill 元信息
├── README.md          # 必须：使用文档
├── lib/               # 推荐：模块目录
├── test/              # 推荐：测试目录
└── .gitignore         # 推荐：Git 忽略
```

### 代码规范

```javascript
// ✅ 正确：使用 ES Modules
import { Tool } from "@openclaw/tool";

export default {
  create: (options) => {
    return [/* tools */];
  }
};

// ❌ 错误：使用 CommonJS
const { Tool } = require("@openclaw/tool");
module.exports = { /* ... */ };
```

### 安全规范

- ❌ 禁止：硬编码 API Token 或密码
- ❌ 禁止：未经用户同意的数据上传
- ❌ 禁止：恶意代码或后门
- ✅ 必须：所有外部调用需用户授权
- ✅ 必须：敏感数据加密存储
- ✅ 必须：明确的隐私政策

---

## 🎯 提高审核通过率

### 1. 完善文档

- README.md 包含完整使用示例
- CONFIG.md 说明所有配置项
- 添加常见问题解答（FAQ）
- 提供故障排除指南

### 2. 代码质量

- 通过 ESLint 检查
- 测试覆盖率 >= 80%
- 使用语义化命名
- 添加 JSDoc 注释

### 3. 用户体验

- 清晰的错误提示
- 友好的安装向导
- 详细的日志输出
- 快速响应问题

### 4. 安全性

- 无外部依赖漏洞
- 明确的权限说明
- 数据本地存储优先
- 透明的网络请求

---

## 📊 发布后运营

### 监控指标

```bash
# 查看下载量
clawhub stats @openclaw/knowledge

# 查看用户评价
clawhub reviews @openclaw/knowledge

# 查看问题反馈
clawhub issues @openclaw/knowledge
```

### 版本更新

```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1 (bug 修复)
npm version minor  # 1.0.0 -> 1.1.0 (新功能)
npm version major  # 1.0.0 -> 2.0.0 (破坏性变更)

# 发布新版本
clawhub publish
```

### 用户反馈处理

1. **及时响应**: 24 小时内回复用户问题
2. **记录问题**: 使用 GitHub Issues 跟踪
3. **定期更新**: 每月至少一次小版本更新
4. **收集建议**: 在 Discussions 中收集功能建议

---

## 🔧 常见问题

### Q1: 发布失败 "Skill name already exists"

**A**: Skill 名称已被占用，请：
1. 使用不同的名称（如 `knowledge-manager`）
2. 或联系 ClawHub 团队协调

### Q2: 审核被拒绝 "Missing documentation"

**A**: 补充缺失的文档：
- 确保 README.md 包含使用示例
- 添加 CONFIG.md 配置说明
- 提供故障排除指南

### Q3: 用户反馈 "Installation failed"

**A**: 检查：
1. package.json 依赖是否完整
2. install.js 是否兼容多平台
3. 提供详细的安装指南

### Q4: 如何撤回已发布的版本？

**A**: 
```bash
# 撤回最新版本
clawhub unpublish @openclaw/knowledge@1.0.0

# 注意：只能撤回发布 24 小时内的版本
```

---

## 📈 推广建议

### 1. 社交媒体

- Twitter/X: 发布发布通知
- 微博：中文用户群体
- LinkedIn: 专业网络
- 知乎：技术分享

### 2. 技术社区

- GitHub Trending
- Hacker News
- Reddit (r/programming)
- V2EX
- 掘金

### 3. 内容营销

- 撰写技术博客（使用教程）
- 录制演示视频
- 制作示例项目
- 举办线上分享

### 4. 社区互动

- 回复用户问题
- 收集功能建议
- 贡献者激励计划
- 定期发布更新日志

---

## 🏆 成功案例

### 案例 1: weather-skill

**策略**: 
- 简洁易用的设计
- 完整的使用文档
- 快速响应用户反馈

**结果**: 
- 首周下载量 1000+
- 评分 4.8/5.0
- ClawHub 首页推荐

### 案例 2: github-tools

**策略**:
- 解决实际问题
- 持续迭代更新
- 活跃的社区运营

**结果**:
- 月下载量 5000+
- 贡献者 20+
- 被官方收录为"精选 Skill"

---

## 📞 获取帮助

### ClawHub 官方资源

- [开发者文档](https://clawhub.ai/docs/developers)
- [Skill 开发教程](http://m.toutiao.com/group/7613781926331974159/)
- [开发者论坛](https://github.com/openclaw/clawhub/discussions)
- [官方 Discord](https://discord.gg/openclaw)

### 联系方式

- 开发者支持：developers@clawhub.ai
- 审核问题：review@clawhub.ai
- 商务合作：partnerships@clawhub.ai

---

## 🎉 发布检查清单

发布前最后确认：

- [ ] ✅ 代码测试通过
- [ ] ✅ 文档完整准确
- [ ] ✅ 无敏感信息
- [ ] ✅ 版本号正确
- [ ] ✅ LICENSE 文件
- [ ] ✅ README 美观
- [ ] ✅ 本地安装测试
- [ ] ✅ 准备发布文案
- [ ] ✅ 准备推广计划

**准备好了吗？开始发布吧！** 🚀

```bash
clawhub publish
```
