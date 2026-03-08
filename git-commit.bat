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
git commit -m "feat: add compression risk detection and enhanced smart detection

New Features:
- Compression Risk Detection: Monitor context usage from openclaw.json
- Enhanced Smart Detection: Semantic analysis via OpenClaw API
- Triple judgment: keyword(40%) + semantic(40%) + title(20%)
- Zero API calls for compression detection (pure local calculation)
- Priority-based config file search (home dir > current > parent)

Files Changed:
- lib/compression-detector.js (new)
- lib/smart-detector.js (modified)
- index.js (integrated new features)
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
