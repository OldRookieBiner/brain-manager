@echo off
REM GitHub 提交脚本

echo ========================================
echo OpenClaw Knowledge Skill - GitHub 提交
echo ========================================
echo.

cd /d "%~dp0"

echo 步骤 1: 检查 Git 状态...
git status
echo.

echo 步骤 2: 添加所有文件...
git add .
echo.

echo 步骤 3: 提交代码...
git commit -m "feat: OpenClaw Knowledge Skill v1.0.0

Core Features:
- Session summarization: Auto-generate structured knowledge cards
- Knowledge retrieval: Intelligent search local and SiYuan notes
- SiYuan sync: Seamless synchronization to SiYuan Notes
- Notebook management: Dedicated notebook + read-only sharing

v2.0 New Features:
- Human-readable articles: Generate publishable technical documentation
- Smart detection: Auto-update if similarity >80%, ask user if 50-80%
- Smart suggestions: Keyword-triggered retrieval suggestions
- Permission control: Pre-write validation to prevent mistakes
- Multi-notebook support: Search multiple read-only notebooks

Technical Improvements:
- Optimized extraction prompts for human readability
- Implemented SmartDetector for intelligent decisions
- Enhanced permission validation mechanism
- Support for multi-server independent deployment

Complete Documentation:
- Comprehensive usage guides and configuration
- Multi-server deployment guide
- Intelligent extraction strategy
- Publishing guide for ClawHub
"
echo.

echo 步骤 4: 查看提交历史...
git log --oneline -5
echo.

echo ========================================
echo 提交完成！
echo ========================================
echo.
echo 下一步：
echo 1. 在 GitHub 创建新仓库
echo 2. 运行以下命令：
echo    git remote add origin https://github.com/YOUR_USERNAME/openclaw-knowledge.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 或者使用 GitHub Desktop 推送代码
echo.

pause
