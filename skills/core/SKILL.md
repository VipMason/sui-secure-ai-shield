---
name: secure-ai-shield
description: Multi-layer security protection framework for AI Agents. Provides complete defense from input detection to execution monitoring with blockchain-backed audit logging.
version: 1.0.0
metadata:
  author: OpenClaw
  category: security
  tags: security, shield, protection, audit, blockchain, agent, sandbox, firewall
  requires:
    bins: [node, openssl]
  install:
    - id: node
      kind: system
      label: Node.js runtime
    - id: openssl
      kind: system
      label: OpenSSL for cryptographic hashing
---

# SecureAI Shield

Comprehensive multi-layer security protection system for AI Agents. Provides complete defense from input detection to execution monitoring with tamper-proof blockchain audit trails.

**GitHub:** <https://github.com/VipMason/sui-secure-ai-shield>

## Overview

SecureAI Shield implements a 7-layer security architecture designed specifically for AI Agent environments. It detects, intercepts, and logs malicious operations while providing flexible permission management and automatic threat response.

## Architecture

### Security Layers

| Layer | Component | Function |
|-------|-----------|----------|
| 1 | Input Detection | Prompt injection detection, PII filtering |
| 2 | Permission Manager | L0-L4 access levels, JIT authorization, cooldowns |
| 3 | Runtime Sandbox | Command validation, system call restrictions |
| 4 | Network Firewall | Domain/IP whitelist/blacklist, DNS filtering |
| 5 | Behavior Monitor | Anomaly detection, baseline analysis, risk scoring |
| 6 | Auto-Responder | Multi-level alerts, automatic containment |
| 7 | Audit Logger | Tamper-proof hash chain, Sui blockchain attestation |

## Installation

```bash
# Clone the repository
git clone https://github.com/VipMason/sui-secure-ai-shield.git
cd secure-ai-shield

# Install dependencies
npm install

# Initialize configuration
npm run init
```

## Key Concepts

### Permission Levels

The system uses 5 hierarchical permission levels:

| Level | Name | Operations | Confirmation Required |
|-------|------|------------|----------------------|
| L0 | Public | Read public information | No |
| L1 | Basic | Read user data | First time only |
| L2 | Standard | Write operations | Yes |
| L3 | Sensitive | File operations, messaging | Yes + Cooldown |
| L4 | Critical | Shell execution, config changes, transfers | Multiple confirmations |

### Sui Blockchain Audit

The audit system uses Sui blockchain for tamper-proof logging:

```
Operation → SHA-256 Hash → Merkle Root → Sui Object (On-Chain)
```

**Gas Calculation:**
```
1 SUI = 1,000,000,000 MIST (10^9)

Typical audit transaction: ~5000-10000 MIST (~0.000005-0.00001 SUI)
```

⚠️ **Note:** Sui CLI output displays in MIST. Always convert: MIST / 10^9 = SUI

## Configuration

### Basic Configuration

```javascript
const shield = require('./index.js');

const secure = new shield.SecureAIShield({
  enabled: true,
  
  // Permission settings
  permission: {
    defaultLevel: 'L2',
    cooldown: 60000,        // 60 second cooldown for L3+
    maxRetries: 3
  },
  
  // Sandbox settings
  sandbox: {
    enabled: true,
    maxMemory: '512m',
    maxCpu: 0.5,
    blockedSyscalls: ['kill', 'reboot', 'mount', 'umount', 'setuid'],
    allowedCommands: ['ls', 'cat', 'grep', 'find', 'git', 'npm', 'node']
  },
  
  // Firewall settings
  firewall: {
    enabled: true,
    allowedDomains: ['api.openai.com', 'api.sui.io'],
    blockedDomains: ['evil.com', 'malware.net']
  },
  
  // Audit settings
  audit: {
    localEnabled: true,
    chainEnabled: false,
    walrusEnabled: false
  }
});
```

### Advanced Configuration

```javascript
const secure = new shield.SecureAIShield({
  enabled: true,
  
  permission: {
    defaultLevel: 'L2',
    cooldown: 60000,
    maxRetries: 3,
    levels: {
      L0: ['config:read', 'file:read:public'],
      L1: ['file:read', 'env:read', 'wallet:query'],
      L2: ['file:write', 'message:send', 'message:read', 'network:api'],
      L3: ['file:delete', 'contract:call', 'network:webhook'],
      L4: ['config:write', 'shell:execute', 'wallet:transfer', 'contract:deploy']
    }
  },
  
  sandbox: {
    enabled: true,
    maxMemory: '512m',
    maxCpu: 0.5,
    maxExecTime: 30000,
    blockedSyscalls: [
      'kill', 'reboot', 'mount', 'umount', 
      'setuid', 'setgid', 'chroot'
    ],
    allowedCommands: [
      'ls', 'cat', 'grep', 'find', 'git', 
      'npm', 'node', 'cargo', 'rustc'
    ],
    blockedPatterns: ['rm -rf', 'curl | sh', 'wget -O-']
  },
  
  firewall: {
    enabled: true,
    allowedDomains: [
      'api.openai.com',
      'api.sui.io',
      'api.github.com'
    ],
    blockedDomains: [
      'evil.com',
      'malware.net',
      'phishing.com'
    ],
    blockedIPs: [
      '192.168.1.100'
    ],
    dlpEnabled: true,
    dlpPatterns: ['api_key', 'password', 'secret', 'token']
  },
  
  behavior: {
    enabled: true,
    baselineWindow: 300000,  // 5 minutes
    anomalyThreshold: 0.8,
    riskScoreWeights: {
      frequency: 0.3,
      deviation: 0.4,
      category: 0.3
    }
  },
  
  audit: {
    localEnabled: true,
    chainEnabled: true,
    walrusEnabled: false,
    chainConfig: {
      network: 'testnet',
      packageId: '0x...',
      auditObjectId: '0x...',
      gasBudget: 10000000  // 0.01 SUI in MIST
    }
  }
});
```

## Usage

### Checking Operation Permissions

```javascript
const shield = require('./index.js');

const secure = new shield.SecureAIShield({
  enabled: true,
  onConfirmation: async (req) => {
    // Send confirmation request to external system
    // Return true to allow, false to deny
    return true;
  }
});

// Check and process an operation
const result = await secure.process('wallet:transfer', {
  amount: 100,
  recipient: '0x123...',
  sessionId: 'session_abc'
});

console.log(result);
```

### Response Formats

**Operation Allowed:**
```javascript
{
  allowed: true,
  operation: 'wallet:transfer',
  level: 'L4',
  duration: 5,
  sandboxed: false,
  auditId: 'audit_1709481600000_abc123'
}
```

**Operation Blocked:**
```javascript
{
  allowed: false,
  reason: 'Operation requires confirmation',
  requiredLevel: 'L3',
  currentLevel: 'L2',
  cooldownRemaining: 30000
}
```

**Confirmation Required:**
```javascript
{
  allowed: false,
  reason: 'Confirmation required',
  confirmationId: 'confirm_abc123',
  expiresIn: 300,
  details: {
    operation: 'wallet:transfer',
    amount: 100,
    recipient: '0x123...'
  }
}
```

## Operation Categories

### Core Permissions

| Operation | Description | Level |
|-----------|-------------|-------|
| `config:read` | Read configuration | L0 |
| `config:write` | Modify configuration | L4 |
| `shell:execute` | Execute shell commands | L4 |
| `file:read` | Read files | L1 |
| `file:write` | Write files | L2 |
| `file:delete` | Delete files | L3 |
| `env:read` | Read environment variables | L1 |

### Financial Permissions

| Operation | Description | Level |
|-----------|-------------|-------|
| `wallet:query` | Query wallet balance | L1 |
| `wallet:transfer` | Transfer funds | L4 |
| `contract:deploy` | Deploy smart contract | L4 |
| `contract:call` | Call contract function | L3 |

### Messaging Permissions

| Operation | Description | Level |
|-----------|-------------|-------|
| `message:send` | Send message | L2 |
| `message:read` | Read messages | L1 |
| `group:action` | Group operations | L2 |
| `broadcast` | Broadcast to multiple channels | L3 |

### Network Permissions

| Operation | Description | Level |
|-----------|-------------|-------|
| `network:api` | External API calls | L2 |
| `network:browser` | Browser automation | L2 |
| `network:webhook` | Webhook operations | L3 |

## CLI Commands

```bash
# Initialize shield
secure-ai-shield init

# Check status
secure-ai-shield status

# Enable/disable
secure-ai-shield enable
secure-ai-shield disable

# View logs
secure-ai-shield logs --today
secure-ai-shield logs --operation wallet:transfer
secure-ai-shield logs --level L3

# Verify integrity
secure-ai-shield verify --chain
secure-ai-shield verify --local --date 2026-03-03

# Update configuration
secure-ai-shield config set permission.cooldown 30000
secure-ai-shield config get permission
```

## Workflow

When handling security-sensitive operations:

1. **Identify operation category** - Determine required permission level
2. **Validate with shield** - Pass through `secure.process()`
3. **Handle response** - Allow, block, or request confirmation
4. **Execute operation** - If allowed, proceed
5. **Log result** - Audit entry created automatically
6. **Verify if needed** - Check chain or local integrity

## OpenClaw Integration

### Plugin Usage

```javascript
const { SecureAIPlugin } = require('./plugin.js');

const security = new SecureAIPlugin(claw, {
  enabled: true,
  interceptCommands: true,
  interceptMessages: true,
  onConfirmation: async (req) => {
    // Send to Feishu/Discord for confirmation
    return true;
  }
});

await security.init();
```

### Middleware Usage

```javascript
const { shieldMiddleware } = require('./middleware.js');

claw.use(shieldMiddleware({
  permission: {
    defaultLevel: 'L2',
    cooldown: 30000
  }
}));
```

## Audit Logging

### Local Logs

Default location: `/var/log/secure-ai-shield/`

```bash
# View today's logs
tail -f /var/log/secure-ai-shield/audit_2026-03-03.log

# Search logs by operation
grep "wallet:transfer" /var/log/secure-ai-shield/audit_2026-03-03.log

# Verify log integrity
node scripts/verify-log.js --date 2026-03-03
```

### Log Format

```json
{
  "timestamp": 1709481600000,
  "operation": "wallet:transfer",
  "level": "L4",
  "sessionId": "session_123",
  "hash": "sha256:a1b2c3d4...",
  "previousHash": "sha256:e5f6g7h8...",
  "result": "allowed",
  "duration": 5,
  "metadata": {
    "amount": 100,
    "recipient": "0x123..."
  }
}
```

## Behavior Monitoring

### Risk Scoring

The behavior monitor calculates risk scores based on:

- **Frequency** (30%) - How often similar operations occur
- **Deviation** (40%) - How far from baseline behavior
- **Category** (30%) - Inherent risk of operation type

### Anomaly Detection

```javascript
const secure = new shield.SecureAIShield({
  behavior: {
    enabled: true,
    baselineWindow: 600000,  // 10 minutes
    anomalyThreshold: 0.7,
    notifyOnAnomaly: true
  }
});
```

### Auto-Response Levels

| Level | Action | Description |
|-------|--------|-------------|
| 1 | Log | Record operation only |
| 2 | Alert | Notify administrator |
| 3 | Challenge | Require additional verification |
| 4 | Block | Deny operation immediately |
| 5 | Isolate | Suspend session |

## Related Skills

This skill is part of the OpenClaw security suite:

| Skill | Description |
|-------|-------------|
| **secure-ai-shield** | Multi-layer security protection for AI Agents |

**Security Workflow:**
```
injection-hunter → secure-ai-shield → wallet-airgap
   Input Filter    Agent Shield      Wallet Protection
```

All skills: <https://github.com/VipMason/sui-secure-ai-shield/openclaw>

## Notes

- Default cooldown period: 60 seconds for L3 operations
- L4 operations require multiple confirmations
- Chain attestation requires SUI tokens for gas (use testnet for development)
- Walrus storage recommended for large audit log archives
- Behavior monitoring requires baseline learning period (~5 minutes after startup)
- Always test in sandbox mode before production deployment
