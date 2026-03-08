/**
 * Compression Detector - 压缩风险检测器
 * 
 * 功能：
 * 1. 从 openclaw.json 读取上下文限制（优先用户主目录）
 * 2. 纯本地估算 tokens，零 API 调用
 * 3. 检测会话压缩风险并给出建议
 */

import fs from 'fs/promises';
import path from 'path';

export class CompressionDetector {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENCLAW_API_KEY;
  }

  /**
   * 查找 openclaw.json 配置文件
   * 优先级：用户主目录 > 当前目录 > 上级目录
   */
  async findConfigFile() {
    const possiblePaths = [
      // 优先级 1: 用户主目录（最高优先级）
      path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'openclaw.json'),
      
      // 优先级 2: 当前工作目录
      path.join(process.cwd(), 'openclaw.json'),
      
      // 优先级 3: 上级目录（可能是项目根目录）
      path.join(process.cwd(), '..', 'openclaw.json'),
      
      // 优先级 4: 上上级目录（Skill 在 skills/brain/ 目录下）
      path.join(process.cwd(), '..', '..', 'openclaw.json'),
      
      // 优先级 5: .openclaw 目录（当前）
      path.join(process.cwd(), '.openclaw', 'openclaw.json'),
      
      // 优先级 6: .openclaw 目录（上级）
      path.join(process.cwd(), '..', '.openclaw', 'openclaw.json')
    ];

    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath);
        console.log(`[CompressionDetector] 📁 找到配置文件：${filePath}`);
        return filePath;
      } catch (error) {
        // 文件不存在，继续查找下一个
      }
    }

    console.warn('[CompressionDetector] ⚠️ 未找到 openclaw.json');
    return null;
  }

  /**
   * 从 openclaw.json 读取上下文限制
   * @returns {Promise<number>} 上下文长度限制
   */
  async getContextLimit() {
    const configPath = await this.findConfigFile();

    if (!configPath) {
      console.warn('[CompressionDetector] ⚠️ 使用默认上下文限制：128000');
      return 128000; // 默认值
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      if (config.contextWindow && typeof config.contextWindow === 'number') {
        console.log(`[CompressionDetector] ✅ 从配置读取上下文限制：${config.contextWindow}`);
        return config.contextWindow;
      } else {
        console.warn('[CompressionDetector] ⚠️ 配置中未找到 contextWindow，使用默认值：128000');
        return 128000;
      }
    } catch (error) {
      console.error('[CompressionDetector] ❌ 读取配置文件失败:', error.message);
      return 128000;
    }
  }

  /**
   * 估算 tokens 数量（纯本地计算）
   * @param {Array} conversationHistory - 会话历史
   * @returns {number} 估算的 tokens 数量
   */
  estimateTokens(conversationHistory) {
    // 合并所有消息内容
    const text = conversationHistory.map(msg => msg.content).join('\n');

    // 分类型统计字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/\b\w+\b/g) || []).length;
    const codeLines = (text.match(/\n/g) || []).length;
    const specialChars = (text.match(/[{}[\]();<>=]/g) || []).length;

    // 估算 tokens（使用保守系数 1.1，高估 10% 以避免漏报）
    const base = chineseChars * 1.5 + englishWords * 1.3 + codeLines * 5.0;
    const special = specialChars * 0.5;
    const tokens = Math.floor((base + special) * 1.1);

    return tokens;
  }

  /**
   * 检测压缩风险
   * @param {Array} conversationHistory - 会话历史
   * @returns {Promise<Object>} 风险检测结果
   */
  async detectRisk(conversationHistory) {
    // 1. 获取上下文限制
    const contextLimit = await this.getContextLimit();

    // 2. 估算当前 tokens
    const tokens = this.estimateTokens(conversationHistory);

    // 3. 计算使用率
    const usageRate = tokens / contextLimit;
    const usageRatePercent = (usageRate * 100).toFixed(1);

    // 4. 判定风险等级
    let riskLevel, suggestion, color;
    if (usageRate > 0.8) {
      riskLevel = 'critical';
      suggestion = '⚠️ 立即提炼知识，避免内容丢失';
      color = '🔴';
    } else if (usageRate > 0.6) {
      riskLevel = 'warning';
      suggestion = '💡 建议尽快提炼知识';
      color = '🟡';
    } else {
      riskLevel = 'safe';
      suggestion = '✅ 上下文充足';
      color = '🟢';
    }

    // 5. 返回检测结果
    return {
      tokens,
      limit: contextLimit,
      usageRate: `${usageRatePercent}%`,
      riskLevel,
      suggestion,
      color,
      source: 'openclaw.json'
    };
  }

  /**
   * 检测模型切换风险（可选功能）
   * @param {number} newModelLimit - 新模型的上下文限制
   * @param {Array} conversationHistory - 会话历史
   * @returns {Promise<Object>} 切换风险评估
   */
  async detectModelSwitchRisk(newModelLimit, conversationHistory) {
    const tokens = this.estimateTokens(conversationHistory);
    const usageRate = tokens / newModelLimit;

    if (usageRate > 1.0) {
      return {
        willExceed: true,
        severity: 'critical',
        tokens,
        newLimit: newModelLimit,
        usageRate: (usageRate * 100).toFixed(1) + '%',
        message: '⚠️ 切换模型后会话超限！',
        suggestion: '当前会话已超过新模型的上下文限制，建议先提炼知识再切换模型'
      };
    } else if (usageRate > 0.8) {
      return {
        willExceed: false,
        severity: 'warning',
        tokens,
        newLimit: newModelLimit,
        usageRate: (usageRate * 100).toFixed(1) + '%',
        message: '⚠️ 切换模型后上下文紧张',
        suggestion: `切换到新模型后，上下文使用率将达到 ${(usageRate * 100).toFixed(1)}%`
      };
    } else {
      return {
        willExceed: false,
        severity: 'safe',
        tokens,
        newLimit: newModelLimit,
        usageRate: (usageRate * 100).toFixed(1) + '%',
        message: '✅ 切换模型后上下文充足'
      };
    }
  }
}
