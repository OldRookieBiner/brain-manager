#!/usr/bin/env node

/**
 * OpenClaw Knowledge Skill - 快速安装脚本
 * 
 * 使用方法：
 * node install.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🚀 OpenClaw Knowledge Skill 安装程序\n', 'blue');

  try {
    // 步骤 1: 检查 Node.js 版本
    log('📋 检查 Node.js 版本...', 'yellow');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      log(`❌ Node.js 版本过低，需要 18.0.0 或更高版本。当前版本：${nodeVersion}`, 'red');
      process.exit(1);
    }
    log(`✅ Node.js 版本：${nodeVersion}`, 'green');

    // 步骤 2: 安装依赖
    log('\n📦 安装依赖...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    log('✅ 依赖安装完成', 'green');

    // 步骤 3: 获取 OpenClaw 工作目录
    log('\n📂 配置 OpenClaw 工作目录...', 'yellow');
    
    let openclawSkillsDir;
    
    // 尝试常见路径
    const possiblePaths = [
      path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'workspace', 'skills'),
      path.join(process.env.APPDATA || '', 'openclaw', 'workspace', 'skills'),
      './skills'
    ];

    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        openclawSkillsDir = possiblePath;
        break;
      } catch {
        continue;
      }
    }

    if (!openclawSkillsDir) {
      // 询问用户或创建默认路径
      openclawSkillsDir = path.join(process.cwd(), 'skills');
      log(`⚠️  未找到 OpenClaw skills 目录，将创建到：${openclawSkillsDir}`, 'yellow');
      await fs.mkdir(openclawSkillsDir, { recursive: true });
    }

    log(`✅ OpenClaw skills 目录：${openclawSkillsDir}`, 'green');

    // 步骤 4: 复制 Skill 文件
    log('\n📋 复制 Skill 文件...', 'yellow');
    const targetDir = path.join(openclawSkillsDir, 'knowledge');
    
    try {
      await fs.mkdir(targetDir, { recursive: true });
      
      const filesToCopy = [
        'index.js',
        'package.json',
        'SKILL.md',
        'README.md',
        'CONFIG.md',
        '.env.example'
      ];

      for (const file of filesToCopy) {
        const src = path.join(__dirname, file);
        const dest = path.join(targetDir, file);
        await fs.copyFile(src, dest);
        log(`  ✓ ${file}`, 'green');
      }

      // 复制 lib 目录
      const libSrc = path.join(__dirname, 'lib');
      const libDest = path.join(targetDir, 'lib');
      await fs.mkdir(libDest, { recursive: true });
      
      const libFiles = await fs.readdir(libSrc);
      for (const file of libFiles) {
        await fs.copyFile(path.join(libSrc, file), path.join(libDest, file));
        log(`  ✓ lib/${file}`, 'green');
      }

      log(`✅ Skill 文件复制完成`, 'green');
    } catch (error) {
      log(`❌ 复制文件失败：${error.message}`, 'red');
      process.exit(1);
    }

    // 步骤 5: 创建配置目录
    log('\n⚙️  创建配置目录...', 'yellow');
    const configDir = path.join(process.cwd(), 'docs', 'knowledge-base');
    await fs.mkdir(configDir, { recursive: true });
    log(`✅ 知识库目录：${configDir}`, 'green');

    // 步骤 6: 创建环境配置文件
    log('\n📝 创建环境配置文件...', 'yellow');
    const envFile = path.join(targetDir, '.env');
    
    try {
      await fs.access(envFile);
      log(`⚠️  .env 文件已存在，跳过创建`, 'yellow');
    } catch {
      const envExample = path.join(targetDir, '.env.example');
      await fs.copyFile(envExample, envFile);
      log(`✅ 已创建 .env 文件，请根据实际情况修改配置`, 'green');
    }

    // 步骤 7: 完成安装
    log('\n' + '='.repeat(50), 'blue');
    log('🎉 安装完成！', 'green');
    log('='.repeat(50), 'blue');
    
    log('\n📋 下一步：\n', 'yellow');
    log('1. 编辑 .env 文件，配置思源笔记 API（可选）', 'blue');
    log('2. 重启 OpenClaw Gateway:', 'blue');
    log('   openclaw gateway restart', 'blue');
    log('3. 开始使用:', 'blue');
    log('   /knowledge_summarize --title "我的笔记" --category "架构"', 'blue');
    
    log('\n📖 详细文档请查看：README.md', 'blue');
    log('🔧 配置指南请查看：CONFIG.md\n', 'blue');

  } catch (error) {
    log(`\n❌ 安装失败：${error.message}`, 'red');
    log('请检查错误信息后重试，或提交 issue 到 GitHub', 'yellow');
    process.exit(1);
  }
}

main();
