/**
 * SecureAI Shield - Seal Encryption Integration
 * 敏感数据加密模块
 * 
 * 使用 Seal 进行去中心化密钥管理和敏感数据加密
 */

const crypto = require('crypto');

// Seal 配置 (来自 sui-stack)
const SEAL_CONFIG = {
  testnet: {
    rpc: 'https://fullnode.testnet.sui.io:443',
    packageId: '0x2::seal::'
  },
  mainnet: {
    rpc: 'https://fullnode.mainnet.sui.io:443',
    packageId: '0x2::seal::'
  }
};

class SealEncryption {
  constructor(options = {}) {
    this.network = options.network || 'testnet';
    this.config = SEAL_CONFIG[this.network];
    this.enabled = options.enabled !== false;
    this.keys = new Map();
    this.encryptedData = new Map();
  }

  /**
   * 生成加密密钥
   */
  generateKey() {
    return crypto.randomBytes(32); // 256-bit AES key
  }

  /**
   * 从密码派生密钥
   */
  async deriveKeyFromPassword(password, salt = null) {
    const useSalt = salt || crypto.randomBytes(16);
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, useSalt, 100000, 32, 'sha256', (err, key) => {
        if (err) reject(err);
        else resolve({ key, salt: useSalt });
      });
    });
  }

  /**
   * 加密数据 (对称加密)
   */
  async encrypt(data, key) {
    try {
      // 生成 IV
      const iv = crypto.randomBytes(16);
      
      // 创建 cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      // 加密
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // 获取 auth tag
      const authTag = cipher.getAuthTag();
      
      const result = {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: 'aes-256-gcm',
        timestamp: new Date().toISOString()
      };

      // 存储加密数据
      const dataId = this.generateDataId(data);
      this.encryptedData.set(dataId, result);

      return {
        success: true,
        dataId,
        ...result
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedData, key) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      // 创建 decipher
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
      );
      
      // 设置 auth tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // 解密
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        success: true,
        data: JSON.parse(decrypted)
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 加密敏感配置
   */
  async encryptConfig(config) {
    const sensitiveFields = ['apiKey', 'apikey', 'password', 'token', 'secret', 'privateKey'];
    
    const encryptedConfig = { ...config };
    const key = this.generateKey();
    const keyId = crypto.randomBytes(8).toString('hex');
    
    // 找出需要加密的字段
    const toEncrypt = {};
    for (const [field, value] of Object.entries(config)) {
      if (sensitiveFields.some(f => field.toLowerCase().includes(f.toLowerCase())) && value) {
        toEncrypt[field] = value;
        encryptedConfig[field] = '[ENCRYPTED]';
      }
    }

    // 加密敏感字段
    if (Object.keys(toEncrypt).length > 0) {
      const result = await this.encrypt(toEncrypt, key);
      if (result.success) {
        this.keys.set(keyId, key.toString('hex'));
        encryptedConfig._encrypted = {
          keyId,
          dataId: result.dataId,
          fields: Object.keys(toEncrypt)
        };
      }
    }

    return {
      success: true,
      config: encryptedConfig,
      keyId
    };
  }

  /**
   * 解密敏感配置
   */
  async decryptConfig(encryptedConfig, keyId) {
    const key = this.keys.get(keyId);
    if (!key) {
      return { success: false, error: 'Key not found' };
    }

    const keyBuffer = Buffer.from(key, 'hex');
    const encryptedData = this.encryptedData.get(encryptedConfig._encrypted?.dataId);
    
    if (!encryptedData) {
      return { success: false, error: 'Encrypted data not found' };
    }

    const decrypted = await this.decrypt(encryptedData, keyBuffer);
    if (!decrypted.success) {
      return decrypted;
    }

    // 还原配置
    const config = { ...encryptedConfig };
    for (const field of encryptedConfig._encrypted?.fields || []) {
      config[field] = decrypted.data[field];
    }
    delete config._encrypted;

    return { success: true, config };
  }

  /**
   * 加密审计日志
   */
  async encryptAuditLog(logEntry) {
    const key = this.generateKey();
    const keyId = crypto.randomBytes(8).toString('hex');
    
    const result = await this.encrypt(logEntry, key);
    
    if (result.success) {
      this.keys.set(keyId, key.toString('hex'));
      return {
        success: true,
        blobId: result.dataId, // 可存到 Walrus
        keyId, // 用于解密
        encrypted: result.encrypted
      };
    }
    
    return result;
  }

  /**
   * 创建 Seal 策略 (模拟 Sui 合约调用)
   */
  createAccessPolicy(policy) {
    const policyData = {
      id: crypto.randomBytes(8).toString('hex'),
      ...policy,
      createdAt: new Date().toISOString(),
      network: this.network
    };

    console.log('[Seal] 访问策略已创建:', policyData.id);
    
    return {
      success: true,
      policy: policyData,
      // 实际部署时需要调用 Sui 合约
      // tx: await sealContract.createPolicy(policy)
    };
  }

  /**
   * 验证访问权限
   */
  async verifyAccess(policyId, requester) {
    // 模拟策略验证
    console.log('[Seal] 验证访问权限:', policyId, requester);
    
    return {
      success: true,
      policyId,
      requester,
      access: 'granted',
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * 生成数据ID
   */
  generateDataId(data) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 64);
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      enabled: this.enabled,
      network: this.network,
      keysStored: this.keys.size,
      dataEncrypted: this.encryptedData.size,
      config: this.config
    };
  }

  /**
   * 安全的密钥存储 (生产环境应使用 KMS)
   */
  storeKeySecurely(keyId, key) {
    // 模拟安全存储
    // 生产环境应使用: AWS KMS, HashiCorp Vault, 或硬件安全模块
    this.keys.set(keyId, key);
    return { success: true, keyId };
  }
}

// 导出
module.exports = { SealEncryption, SEAL_CONFIG };
