# OpenClaw Skill - Brain Manager

🧠 **Intelligent Knowledge Management Plugin** - Automatically extract session content, sync to SiYuan Notes, intelligently retrieve knowledge base

[![Version](https://img.shields.io/npm/v/@openclaw/brain)](https://www.npmjs.com/package/@openclaw/brain)
[![License](https://img.shields.io/npm/l/@openclaw/brain)](LICENSE)
[![Node](https://img.shields.io/node/v/@openclaw/brain)](https://nodejs.org)

---

**🌐 Choose Language / 选择语言:**

[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)

---

## 🌟 Features

### ✨ Core Features

- **📝 Session Summarization** - Automatically extract structured knowledge cards from OpenClaw conversations
- **📒 SiYuan Sync** - Seamlessly sync to SiYuan Notes with category management and tagging system
- **🔍 Intelligent Search** - Retrieve relevant knowledge from local files and SiYuan Notes
- **📂 Auto Classification** - Support for Architecture, Module, Specification, Issue, Decision, Tutorial and more
- **💾 Local Backup** - All knowledge automatically saved with Markdown backup, never lost
- **🔗 Bidirectional Links** - Automatically establish connections between knowledge cards

### 🆕 v1.3.0 New Features

- **🧠 Smart Mode** - AI automatically analyzes sessions, generates title suggestions and category recommendations
- **🔍 Topic Detection** - Automatically identify single/multiple topics, avoid content omission
- **⚡ Parallel Extraction** - Parallel processing in multi-topic scenarios, speed improved by 50-75%
- **💾 Smart Cache** - Analysis result caching, cost reduced by 30-50%
- **🌍 Bilingual Support** - Chinese/English auto-detection, any Chinese character means Chinese document
- **🔒 Security Hardening** - Complete boundary condition handling and timeout protection

### 🎯 Use Cases

1. **After Development** - Extract technical documentation and architecture decisions
2. **After Problem Solving** - Record troubleshooting processes and lessons learned
3. **When Starting New Topics** - Retrieve existing knowledge for consistency
4. **During Team Collaboration** - Share knowledge assets, reduce communication costs
5. **For Personal Growth** - Build technical notes, form knowledge system

---

## 📦 Installation

### Method 1: Install from ClawHub (Recommended)

```bash
clawhub install brain
```

### Method 2: Local Installation

```bash
# Clone or download this repository
git clone https://github.com/your-repo/brain-manager.git

# Copy to OpenClaw skills directory
cp -r brain-manager ~/.openclaw/workspace/skills/brain
```

### Method 3: Development Mode

```bash
# Install dependencies
npm install

# Link to OpenClaw
npm link

# Test run
npm test
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```bash
# SiYuan Notes Configuration (optional, leave empty if not using SiYuan)
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=your_siyuan_api_token
SIYUAN_NOTEBOOK_NAME=OpenClaw Knowledge Base

# OpenClaw API Configuration (usually auto-detected)
OPENCLAW_API_KEY=your_openclaw_api_key
OPENCLAW_API_ENDPOINT=https://api.openclaw.ai/v1

# Default Language (zh=Chinese, en=English)
DEFAULT_LANGUAGE=zh
```

### Configuration File (Optional)

Create `config.yaml` to customize default behavior:

```yaml
knowledge:
  storage:
    local_path: ./docs/knowledge-base
    siyuan_enabled: true
    siyuan_notebook: "OpenClaw Knowledge Base"
  
  extraction:
    auto_tag: true
    include_code: true
    max_content_length: 5000
  
  search:
    default_limit: 5
    min_relevance: 10
```

---

## 🚀 Usage

### Tool 1: `knowledge_summarize` - Session Summarization

**Function**: Automatically extract current session content into knowledge cards

#### Smart Mode (Recommended)

**Parameters**:
- `--smart` (optional): Enable smart mode, AI automatically generates title and category suggestions
- Or call directly without providing title (automatically uses smart mode)

**Example**:

```
User: /knowledge_summarize --smart

OpenClaw: 🧠 AI analysis complete, detected 1 topic:
         
         Recommended Titles:
         1. Crawler Engine Architecture Design
         2. High-Performance Crawler Implementation
         3. Crawler System Architecture Summary
         
         Recommended Category: Architecture
         
         Keywords: crawler engine, architecture design, concurrency control, performance optimization
         
         Please select:
         [1] Use recommendation 1 + Architecture
         [2] Use recommendation 2 + Architecture
         [3] Use recommendation 3 + Architecture
         [4] Custom title
```

#### Traditional Mode

**Parameters**:
- `title` (required): Knowledge card title
- `category` (required): Category (Architecture/Module/Specification/Issue/Decision/Tutorial)
- `syncToSiYuan` (optional): Whether to sync to SiYuan Notes, default `true`
- `language` (optional): Output language (zh/en, default auto-detect)

**Example**:

```
User: /knowledge_summarize --title "Crawler Engine Architecture" --category "Architecture"

OpenClaw: ✅ Knowledge card extracted: Crawler Engine Architecture
         📁 Category: Architecture
         🏷️ Tags: ['architecture', 'aiohttp', 'crawler', 'async']
         💾 Local backup: docs/knowledge-base/Crawler Engine Architecture.md
         📒 SiYuan sync: Success - OpenClaw Knowledge Base/Architecture/Crawler Engine Architecture
         
         Preview:
         # Crawler Engine Architecture
         
         ## Session Metadata
         - Extraction time: 2026-03-06
         - Category: Architecture
         - Involved modules: Crawler Engine, HTTP Client
         ...
```

#### Multi-Topic Scenario

When multiple independent topics are detected:

```
User: /knowledge_summarize --smart

OpenClaw: 🔍 Detected 2 independent topics, recommend separate extraction:
         
         Topic 1 (Rounds 1-10):
         Recommended title: Crawler Engine Architecture Design
         Recommended category: Architecture
         
         Topic 2 (Rounds 11-20):
         Recommended title: Database Connection Pool Optimization
         Recommended category: Optimization
         
         Please select operation:
         [1] Extract Topic 1
         [2] Extract Topic 2
         [3] Extract all topics in parallel
         [4] Custom
```

**Parallel Extraction Performance**:
- 2 topics: 50% faster
- 3 topics: 67% faster
- 4 topics: 75% faster

### Tool 2: `knowledge_search` - Knowledge Search

**Function**: Search for relevant information from knowledge base

**Parameters**:
- `query` (required): Search keyword
- `limit` (optional): Number of results, default `5`
- `category` (optional): Category filter
- `source` (optional): Search source (all/local/siyuan), default `all`

**Example**:

```
User: Search knowledge base for "aiohttp async request"

OpenClaw: 🔍 Found 3 relevant notes:

         1️⃣ Crawler Engine Architecture Design
            📂 Category: Architecture
            📁 Source: 📒 SiYuan Notes
            🔗 Relevance: 85%
            📝 Summary: Using **aiohttp** for async HTTP requests, 3x performance improvement...
            🏷️ Tags: ['architecture', 'aiohttp', 'crawler']

         2️⃣ Technology Selection Decision
            📂 Category: Decision
            📁 Source: 📁 Local
            🔗 Relevance: 72%
            📝 Summary: Reasons for choosing **aiohttp** over requests: 1. Native async support 2. Connection pool management...
            🏷️ Tags: ['decision', 'aiohttp']

         3️⃣ Concurrent Connection Limit Issue
            📂 Category: Issue
            📁 Source: 📒 SiYuan Notes
            🔗 Relevance: 68%
            📝 Summary: Encountered aiohttp concurrent connection limit, resolved by adjusting Connector parameters...
            🏷️ Tags: ['issue', 'aiohttp', 'concurrency']
```

### Tool 3: `knowledge_list` - List Knowledge Base

**Function**: List all saved knowledge cards

**Parameters**:
- `category` (optional): Category filter
- `source` (optional): Source (all/local/siyuan), default `all`

**Example**:

```
User: List all architecture-related knowledge cards

OpenClaw: 📚 Knowledge Base List (Category: Architecture)
         
         Found 5 documents:
         
         1. 📒 Crawler Engine Architecture Design
         2. 📁 High-Performance Crawler Implementation
         3. 📒 HTTP Client Selection Decision
         4. 📁 Error Handling Specification
         5. 📒 Database Connection Pool Architecture
```

### Tool 4: `knowledge_get` - Get Document Details

**Function**: Get full content of a specific knowledge card

**Parameters**:
- `id` (required): Document ID or title

**Example**:

```
User: /knowledge_get --id "Crawler Engine Architecture Design"

OpenClaw: 📖 Crawler Engine Architecture Design
         
         ## Background
         In large-scale data collection scenarios...
         
         ## Technical Decisions
         Choosing aiohttp reasons...
         
         ## Code Implementation
         ```python
         import aiohttp
         ...
         ```
```

---

## 📊 Performance

### Smart Mode Performance

| Scenario | AI Calls | Cost | Time |
|----------|----------|------|------|
| Single topic (first time) | 2 | $0.043 | ~8s |
| Single topic (cached) | 1 | $0.035 | ~0.1s |
| Multi-topic (2 topics) | 3 | $0.078 | ~8s (parallel) |
| Multi-topic (3 topics) | 4 | $0.113 | ~8s (parallel) |

### Cache Benefits

- **Cache hit rate**: 60-80% (same session re-analysis scenarios)
- **Cost savings**: 30-50%
- **Response speed**: From 8s to 0.1s when cached

---

## 🔧 Advanced Features

### Language Detection

The system automatically detects the language based on the title:
- **Any Chinese character** → Chinese document
- **No Chinese characters** → English document

Examples:
- `"爬虫引擎"` → Chinese (contains Chinese characters)
- `"Crawler Engine"` → English (no Chinese characters)
- `"Python 爬虫"` → Chinese (contains Chinese characters)
- `"HTTP 请求优化"` → Chinese (contains Chinese characters)

### Smart Cache

Analysis results are automatically cached:
- **Cache size**: Up to 100 entries
- **Cache TTL**: 10 minutes
- **Strategy**: LRU (Least Recently Used)

### Parallel Extraction

In multi-topic scenarios, topics can be extracted in parallel:
```bash
# Extract all topics in parallel
/extract-all --analysis-cache-key "cache_key"
```

---

## 📝 Changelog

### v1.3.0 (2026-03-08) - Smart Mode

**New Features**:
- 🧠 **Smart Mode** - AI automatically analyzes sessions, generates title suggestions and category recommendations
- 🔍 **Topic Detection** - Automatically identify single/multiple topics, avoid content omission
- ⚡ **Parallel Extraction** - Parallel processing in multi-topic scenarios, speed improved by 50-75%
- 💾 **Smart Cache** - Analysis result caching, cost reduced by 30-50%
- 🌍 **Bilingual Support** - Chinese/English auto-detection, any Chinese character means Chinese document
- 🔒 **Security Hardening** - Complete boundary condition handling and timeout protection

**Performance Optimizations**:
- ✅ Add empty topic list handling
- ✅ Add empty title suggestions handling
- ✅ Add message range boundary checks
- ✅ Add API call timeout control (30 seconds)
- ✅ Improve JSON validation logic, auto-fix missing fields

**Code Quality**:
- ✅ Add processExtraction function documentation
- ✅ Improve JSDoc comments
- ✅ Add document security warnings

### v1.2.0 (2026-03-07) - Multilingual Support

- 🌍 Support Chinese/English bilingual (auto-detection)
- 📚 Add multilingual prompt system
- 🔧 Optimize language detection logic

### v1.1.0 (2026-03-06) - Smart Detection

- 🔍 Implement smart detector
- 📊 Implement compression risk detection
- ⚡ Triple judgment: keyword + semantic + title

### v1.0.0 (2026-03-06)

- ✨ Initial release
- 📝 Implement session summarization
- 📒 Implement SiYuan Notes sync
- 🔍 Implement intelligent search
- 📂 Implement category management

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- [OpenClaw](https://openclaw.ai) - Powerful AI agent framework
- [SiYuan Notes](https://b3log.org/siyuan/) - Local-first knowledge base tool
- [ClawHub](https://clawhub.ai) - OpenClaw skill marketplace

---

## 📮 Contact

- **Author**: OldRookieBiner
- **Email**: 6822358@qq.com
- **Repository**: https://github.com/your-repo/brain-manager
- **Issues**: https://github.com/your-repo/brain-manager/issues
- **Discussions**: https://github.com/your-repo/brain-manager/discussions

---

**🎉 Happy Knowledge Building!**
