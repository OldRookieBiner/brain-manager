# 🌍 多语言支持 / Multilingual Support

Brain Manager 现已支持多语言！/ Brain Manager now supports multiple languages!

## 📋 支持的语言 / Supported Languages

| 语言代码 | 语言名称 | Language Name |
|---------|---------|---------------|
| `zh` | 中文 | Chinese |
| `en` | English | English |

## 🚀 使用方法 / Usage

### 方式 1：自动检测（推荐）/ Automatic Detection (Recommended)

系统会自动检测标题的语言并使用相应的语言输出：

```bash
# 中文标题 - 输出中文文档
/knowledge_summarize --title "爬虫引擎架构设计" --category "架构"

# 英文标题 - 输出英文文档
/knowledge_summarize --title "Crawler Engine Architecture" --category "Architecture"
```

### 方式 2：手动指定语言 / Manual Language Specification

强制使用特定语言输出：

```bash
# 即使使用中文标题，也强制输出英文文档
/knowledge_summarize --title "爬虫引擎架构设计" --category "架构" --lang en

# 即使使用英文标题，也强制输出中文文档
/knowledge_summarize --title "Crawler Engine Architecture" --category "Architecture" --lang zh
```

### 方式 3：配置默认语言 / Configure Default Language

在 `.env` 文件中设置默认语言：

```bash
# .env
DEFAULT_LANGUAGE=en  # 默认使用英文
```

## 📝 功能特性 / Features

### 1. 智能语言检测 / Intelligent Language Detection

系统会自动分析标题中的字符特征：
- 中文字符比例 > 20% → 中文
- 其他情况 → 英文

### 2. 多语言提示词系统 / Multilingual Prompt System

所有 AI 提示词都已翻译成 2 种语言：
- ✅ 系统提示词（System Prompt）
- ✅ 提炼提示词（Extraction Prompt）
- ✅ 语义分析提示词（Semantic Analysis Prompt）
- ✅ 错误消息（Error Messages）

### 3. 一致的输出质量 / Consistent Output Quality

无论使用哪种语言，都能生成：
- 流畅自然的技术文档
- 结构化的知识卡片
- 准确的语义分析

## 🔧 技术实现 / Technical Implementation

### 核心模块 / Core Modules

1. **lib/i18n.js** - 国际化管理理器
   - `getPrompt(type, key, language)` - 获取指定语言的提示词
   - `detectLanguage(text)` - 自动检测语言
   - `isValidLanguage(language)` - 验证语言代码

2. **lib/extractor.js** - 多语言提炼器
   - 接收 `language` 参数
   - 自动检测或手动指定
   - 使用对应语言的提示词

3. **lib/smart-detector.js** - 多语言智能检测器
   - 语义分析支持多语言
   - 跨语言相似度检测

4. **index.js** - 主入口
   - 工具参数支持 `--lang`
   - 传递语言到各个模块

## 📚 示例输出 / Example Output

### 中文示例

```markdown
# 爬虫引擎架构设计

> **摘要**：本文档记录了基于 aiohttp 的高性能爬虫引擎架构设计...

## 📋 背景
在大规模数据采集场景中...
```

### English Example

```markdown
# Crawler Engine Architecture

> **Abstract**: This document records the architecture design of a high-performance crawler engine based on aiohttp...

## 📋 Background
In large-scale data collection scenarios...
```

## 🔮 未来计划 / Future Plans

- [ ] 支持更多语言（法语、德语、西班牙语等）
- [ ] 跨语言检索（用中文检索英文文档）
- [ ] 多语言知识卡片关联
- [ ] 自动翻译已有文档

## 🤝 贡献 / Contribution

如果您想添加新的语言支持，请：

1. 在 `lib/i18n.js` 中添加新的语言模板
2. 翻译所有提示词和错误消息
3. 测试语言检测准确性
4. 提交 Pull Request

---

**最后更新**: 2026-03-08  
**版本**: v1.1.0
