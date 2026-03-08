# 多服务器部署指南

## 📋 场景说明

**需求**：多台 OpenClaw 服务器共享同一个知识库

**方案**：本地部署 + S3 同步

```
┌──────────┐         ┌──────────┐
│ 服务器 A  │         │ 服务器 B  │
│ OpenClaw │         │ OpenClaw │
│ + 思源   │         │ + 思源   │
└────┬─────┘         └────┬─────┘
     │                    │
     │   S3 同步          │
     └──────┬─────────────┘
            │
            ▼
      ┌──────────┐
      │   S3     │
      │  云端存储 │
      └──────────┘
```

---

## 🚀 部署步骤

### 步骤 1：配置思源笔记 S3 同步

**在每台服务器上执行**：

1. 打开思源笔记
2. 设置 → 导出 → S3 同步配置
3. 填写 S3 信息：

```yaml
# S3 配置
端点：https://s3.amazonaws.com
区域：ap-northeast-1
存储桶：siyuan-knowledge-base
路径：siyuan-data/
Access Key: AKIAXXXXXXXXXXXXXXXX  # 示例占位符，请替换为您的真实密钥
Secret Key: XXXXXXXXXXXXXXXXXXXXXXXXXXXX  # 示例占位符，请替换为您的真实密钥
```

⚠️ **安全警告**：
- **请勿将真实密钥提交到版本控制系统！**
- 建议使用环境变量或密钥管理服务（如 AWS Secrets Manager）
- 定期轮换密钥
- 限制密钥的访问权限（最小权限原则）

4. 启用自动同步
   - ✅ 启动时自动同步
   - ✅ 关闭时自动保存
   - ✅ 定时同步（5 分钟）

---

### 步骤 2：配置 OpenClaw Skill

**在每台服务器上分别配置**：

#### 服务器 A
```bash
# .env 文件
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=server_a_token_abc123
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库
```

#### 服务器 B
```bash
# .env 文件
SIYUAN_API_URL=http://127.0.0.1:6806
SIYUAN_API_TOKEN=server_b_token_def456
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库
```

---

### 步骤 3：验证同步

**在服务器 A 上**：
```bash
# 提炼知识
/knowledge_summarize --title "测试笔记" --category "测试"
```

**在服务器 B 上**：
```bash
# 等待 S3 同步（约 5 分钟）
# 然后检索
/knowledge_search --query "测试笔记"
```

**预期结果**：
- ✅ 服务器 B 可以找到服务器 A 创建的笔记
- ✅ 思源笔记中显示两条同步记录

---

## 🔧 高级配置

### 1. 自定义同步策略

**思源笔记配置文件** (`data/sync/config.json`)：

```json
{
  "s3": {
    "endpoint": "https://s3.amazonaws.com",
    "bucket": "siyuan-knowledge-base",
    "path": "siyuan-data/",
    "accessKey": "AKIAXXXXXXXXXXXXXXXX",
    "secretKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "region": "ap-northeast-1"
  },
  "sync": {
    "autoSync": true,
    "syncInterval": 300,  // 5 分钟
    "syncOnLaunch": true,
    "syncOnClose": true
  }
}
```

---

### 2. 冲突解决策略

**问题**：如果两台服务器同时修改同一篇笔记怎么办？

**思源笔记的冲突处理**：
- 自动检测冲突
- 保留两个版本
- 手动选择保留哪个

**建议**：
- 为不同服务器设置不同的分类
- 例如：服务器 A 用 `项目 A/`，服务器 B 用 `项目 B/`

```bash
# 服务器 A 配置
KNOWLEDGE_CATEGORY_PREFIX=项目 A

# 服务器 B 配置
KNOWLEDGE_CATEGORY_PREFIX=项目 B
```

---

### 3. 性能优化

**S3 同步优化**：

```bash
# 1. 使用 CloudFront CDN 加速
S3_ENDPOINT=https://d1234567890.cloudfront.net

# 2. 启用 S3 Transfer Acceleration
# 在 AWS 控制台开启

# 3. 使用私有网络（如果在同一云厂商）
# 例如：AWS VPC Endpoint
```

---

### 4. 监控和告警

**监控脚本** (`monitor_sync.sh`)：

```bash
#!/bin/bash

# 检查思源笔记 API 是否正常
curl -X POST http://127.0.0.1:6806/api/system/version

# 检查 S3 同步状态
# 查看思源笔记日志
tail -n 100 /path/to/siyuan/log/siyuan.log | grep "S3 sync"

# 检查最后同步时间
# 如果超过 10 分钟未同步，发送告警
```

---

## 📊 同步策略对比

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **S3 同步** | ✅ 官方支持<br>✅ 自动冲突检测<br>✅ 增量同步 | ❌ 依赖云存储<br>❌ 有延迟（5 分钟） | 多服务器共享知识库 |
| **Git 同步** | ✅ 版本控制<br>✅ 完全可控<br>✅ 无延迟 | ❌ 需要手动配置<br>❌ 冲突处理复杂 | 技术团队 |
| **rsync 同步** | ✅ 快速<br>✅ 简单<br>✅ 本地优先 | ❌ 无冲突检测<br>❌ 需要定时任务 | 双机热备 |
| **实时 API** | ✅ 实时同步<br>✅ 无延迟 | ❌ 网络风险<br>❌ 配置复杂 | 不推荐 |

**推荐**：使用 S3 同步（思源自带功能）

---

## 🔐 安全加固

### 1. S3 权限最小化

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::siyuan-knowledge-base/siyuan-data/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": [
            "A 服务器 IP",
            "B 服务器 IP"
          ]
        },
        "StringEquals": {
          "aws:username": [
            "server-a",
            "server-b"
          ]
        }
      }
    }
  ]
}
```

---

### 2. 加密存储

**S3 服务器端加密**：
```bash
# 启用 SSE-S3（AES-256 加密）
aws s3api put-bucket-encryption \
  --bucket siyuan-knowledge-base \
  --server-side-encryption-configuration \
  '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'
```

---

### 3. 备份策略

**3-2-1 备份原则**：
- 3 份数据副本
- 2 种不同存储介质
- 1 份异地备份

**实施方案**：
```bash
# 1. S3 主存储
# 2. 本地备份（思源笔记自带）
# 3. 定期导出到另一云存储（例如：Backblaze B2）
```

---

## 📈 性能优化建议

### 1. 减少同步延迟

```bash
# 缩短同步间隔（默认 5 分钟）
# 修改思源笔记配置
"syncInterval": 60  # 1 分钟同步一次
```

### 2. 增量同步优化

思源笔记默认增量同步，只传输变更部分。

### 3. 本地缓存

```bash
# 增加本地缓存大小
# 减少 S3 请求次数
```

---

## 🎯 最佳实践

### 1. 分类管理

为不同服务器设置不同的分类前缀：

```bash
# 服务器 A
/knowledge_summarize --title "笔记" --category "服务器 A/架构"

# 服务器 B
/knowledge_summarize --title "笔记" --category "服务器 B/架构"
```

### 2. 标签规范

统一标签命名：

```bash
# 推荐
标签：['架构', 'aiohttp', '服务器 A']

# 不推荐
标签：['架构', '服务器 A-架构']
```

### 3. 定期清理

```bash
# 每月检查一次
/knowledge_list --category "测试"
# 删除测试数据
```

---

## 🐛 故障排除

### 问题 1：同步冲突

**现象**：思源笔记提示"同步冲突"

**解决**：
1. 打开思源笔记
2. 查看冲突文件
3. 手动选择保留版本
4. 删除冲突副本

**预防**：
- 为不同服务器设置不同分类
- 避免同时编辑同一篇笔记

---

### 问题 2：S3 同步失败

**现象**：思源笔记显示"S3 同步失败"

**排查步骤**：
```bash
# 1. 检查 S3 凭证
aws s3 ls s3://siyuan-knowledge-base

# 2. 检查网络连接
ping s3.amazonaws.com

# 3. 查看思源笔记日志
tail -f /path/to/siyuan/log/siyuan.log
```

**常见原因**：
- S3 凭证过期
- 网络不通
- S3 权限不足

---

### 问题 3：知识检索不到

**现象**：服务器 A 创建的笔记，服务器 B 检索不到

**排查**：
```bash
# 1. 确认 S3 同步正常
# 在服务器 B 的思源笔记中查看是否有该笔记

# 2. 确认笔记本名称一致
SIYUAN_NOTEBOOK_NAME=OpenClaw 知识库

# 3. 手动触发同步
# 在思源笔记中点击"同步"按钮
```

---

## 📝 总结

### 方案优势

- ✅ **安全性高**：本地 API 调用，无网络风险
- ✅ **数据共享**：S3 同步实现多服务器共享
- ✅ **官方支持**：思源自带 S3 同步功能
- ✅ **易于扩展**：可随时添加新服务器
- ✅ **容错性好**：单台服务器故障不影响其他

### 注意事项

- ⚠️ **同步延迟**：默认 5 分钟，可调整
- ⚠️ **冲突处理**：需要手动解决
- ⚠️ **S3 成本**：根据存储量和请求次数计费

### 推荐配置

- S3 同步间隔：5 分钟
- 本地备份：启用
- 分类管理：按服务器分类
- 监控告警：同步失败时告警

---

**🎉 这是企业级最佳实践！**
