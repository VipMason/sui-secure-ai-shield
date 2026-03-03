/**
 * SecureAI Shield - Main Entry
 * 多层防护系统整合
 * 
 * 集成:
 * - Walrus Storage (链上存证)
 * - Seal Encryption (敏感数据加密)
 */

const { WalrusStore } = require('./src/audit/walrus');
const { SealEncryption } = require('./src/audit/seal');

const PERMISSION_LEVELS = {
  L0: { name: '公开读取', risk: 0, confirmRequired: false, cooldown: 0 },
  L1: { name: '用户数据读取', risk: 1, confirmRequired: true, cooldown: 0 },
  L2: { name: '写入操作', risk: 2, confirmRequired: true, cooldown: 60000 },
  L3: { name: '敏感操作', risk: 3, confirmRequired: true, cooldown: 600000, confirmations: 2 },
  L4: { name: '高危操作', risk: 4, confirmRequired: true, cooldown: 1800000, confirmations: 3 }
};

const OPERATION_PERMISSIONS = {
  'config:read': { level: 'L2', category: 'core' },
  'config:write': { level: 'L3', category: 'core' },
  'shell:execute': { level: 'L4', category: 'core' },
  'file:read': { level: 'L1', category: 'core' },
  'file:write': { level: 'L2', category: 'core' },
  'file:delete': { level: 'L3', category: 'core' },
  'env:read': { level: 'L3', category: 'core' },
  'message:send': { level: 'L2', category: 'messaging' },
  'message:read': { level: 'L1', category: 'messaging' },
  'group:operation': { level: 'L3', category: 'messaging' },
  'group:操作': { level: 'L3', category: 'messaging' },
  'broadcast': { level: 'L4', category: 'messaging' },
  'wallet:query': { level: 'L2', category: 'financial' },
  'wallet:transfer': { level: 'L4', category: 'financial' },
  'contract:deploy': { level: 'L4', category: 'financial' },
  'contract:call': { level: 'L3', category: 'financial' },
  'network:api': { level: 'L1', category: 'network' },
  'network:browser': { level: 'L2', category: 'network' },
  'network:webhook': { level: 'L3', category: 'network' },
  'device:camera': { level: 'L4', category: 'device' },
  'device:microphone': { level: 'L4', category: 'device' },
  'device:screen': { level: 'L3', category: 'device' },
  'device:location': { level: 'L3', category: 'device' }
};

class SecureAIShield {
  constructor(options = {}) {
    this.config = options;
    this.enabled = options.enabled !== false;
    this.operationHistory = new Map();
    this.confirmationCallback = options.onConfirmation || (async () => true);
    this.alertCallback = options.alertCallback || console.log;
    this.stats = { requestsProcessed: 0, blocked: 0, warnings: 0 };
    
    // 集成 Walrus 存储 (Layer 7)
    this.walrus = new WalrusStore({
      enabled: options.walrus !== false,
      network: options.walrusNetwork || 'testnet'
    });
    
    // 集成 Seal 加密
    this.seal = new SealEncryption({
      enabled: options.seal !== false,
      network: options.sealNetwork || 'testnet'
    });
  }

  async process(operation, context = {}) {
    if (!this.enabled) return { allowed: true, bypassed: true };
    
    this.stats.requestsProcessed++;
    const permConfig = OPERATION_PERMISSIONS[operation];
    
    if (!permConfig) {
      return { allowed: false, reason: `未定义操作: ${operation}`, level: 'L4' };
    }

    const levelConfig = PERMISSION_LEVELS[permConfig.level];
    const now = Date.now();
    
    // 检查冷却期
    const lastOp = this.operationHistory.get(operation);
    if (lastOp && (now - lastOp.timestamp) < levelConfig.cooldown) {
      this.stats.blocked++;
      return { 
        allowed: false, 
        reason: `操作冷却中，还需等待 ${Math.ceil((levelConfig.cooldown - (now - lastOp.timestamp)) / 1000)} 秒`,
        cooldownRemaining: levelConfig.cooldown - (now - lastOp.timestamp)
      };
    }

    // 确认检查
    if (levelConfig.confirmRequired && !context.bypassed) {
      const confirmed = await this.confirmationCallback({
        operation,
        level: permConfig.level,
        context
      });
      
      if (!confirmed) {
        this.stats.blocked++;
        return { allowed: false, reason: '用户未确认', requiresConfirmation: true };
      }
    }

    // 危险命令检测
    if (operation === 'shell:execute' && context.command) {
      const dangerous = [
        { pattern: /rm\s+-rf/, reason: '递归删除' },
        { pattern: /rm\s+-rf\s+\//, reason: '递归删除' },
        { pattern: /dd\s+if=/, reason: '磁盘写入' },
        { pattern: /mkfs/, reason: '格式化' },
        { pattern: /mount\s+/, reason: '挂载' },
        { pattern: /curl.*\|.*bash/, reason: '管道执行' },
        { pattern: /wget.*\|.*sh/, reason: '管道执行' },
        { pattern: /nc\s+-e/, reason: '反弹shell' },
        { pattern: /bash.*\/dev\/tcp/, reason: '反弹shell' },
        { pattern: /\/etc\/passwd/, reason: '系统文件' },
        { pattern: /\/etc\/shadow/, reason: '密码文件' },
        { pattern: /\/etc\/sudoers/, reason: 'Sudo配置' },
        { pattern: /sudo\s+su/, reason: '提权' },
        { pattern: /sudo\s+-i/, reason: '提权' },
        { pattern: /su\s+root/, reason: '提权' },
        { pattern: /chmod\s+\+s/, reason: 'SUID提权' },
        { pattern: /chmod\s+-R\s+777/, reason: '权限修改' },
        { pattern: /chown\s+-R/, reason: '权限修改' },
        { pattern: /format\s+[a-z]:/, reason: '格式化' },
        { pattern: /del\s+\/F\s+\/Q/, reason: '删除' },
        { pattern: /\$\(/, reason: '命令替换' },
        { pattern: /`/, reason: '命令替换' }
      ];
      
      for (const check of dangerous) {
        if (check.pattern.test(context.command)) {
          this.stats.blocked++;
          this.alertCallback({ type: 'DANGEROUS_COMMAND', operation, reason: check.reason });
          return { allowed: false, reason: `危险命令: ${check.reason}` };
        }
      }
    }

    // 记录操作
    this.operationHistory.set(operation, { timestamp: now, context, allowed: true });

    return {
      allowed: true,
      operation,
      level: permConfig.level,
      risk: levelConfig.risk,
      category: permConfig.category
    };
  }

  getStatus() {
    return {
      enabled: this.enabled,
      stats: this.stats,
      recentOperations: Array.from(this.operationHistory.entries()).slice(-10),
      walrus: this.walrus.getStats(),
      seal: this.seal.getStats()
    };
  }
  
  /**
   * 存储审计日志到 Walrus
   */
  async storeAuditToWalrus(logEntry) {
    return this.walrus.storeAuditLog(logEntry);
  }
  
  /**
   * 加密敏感数据
   */
  async encryptSensitive(data) {
    return this.seal.encrypt(data);
  }
  
  /**
   * 解密敏感数据
   */
  async decryptSensitive(encryptedData, key) {
    return this.seal.decrypt(encryptedData, key);
  }
  
  /**
   * 加密配置文件
   */
  async encryptConfig(config) {
    return this.seal.encryptConfig(config);
  }
}

module.exports = { SecureAIShield, PERMISSION_LEVELS, OPERATION_PERMISSIONS, WalrusStore, SealEncryption };
