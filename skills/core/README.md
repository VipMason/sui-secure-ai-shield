# SecureAI Shield

Multi-layer security protection framework for AI Agents. Provides complete defense from input detection to execution monitoring with blockchain-backed audit logging.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/openclaw/secure-ai-shield)

## Overview

SecureAI Shield implements a 7-layer security architecture designed specifically for AI Agent environments. It detects, intercepts, and logs malicious operations while providing flexible permission management and automatic threat response.

## Features

- **7-Layer Security Architecture** - Comprehensive protection from input to execution
- **Permission Management** - L0-L4 hierarchical access control with JIT authorization
- **Runtime Sandbox** - Command validation and system call restrictions
- **Network Firewall** - Domain/IP whitelist/blacklist filtering
- **Behavior Monitoring** - Anomaly detection and risk scoring
- **Auto-Response** - Multi-level alerts and automatic containment
- **Blockchain Audit** - Tamper-proof hash chain with Sui blockchain attestation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SecureAI Shield                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────┐           │
│  │  Input (Prompt) │───▶│ Injection Hunter │           │
│  │                 │    │                  │           │
│  └─────────────────┘    └────────┬─────────┘           │
│                                  │                      │
│                                  ▼                      │
│                         ┌──────────────────┐           │
│                         │  Risk Assessment  │           │
│                         │    (0-100)       │           │
│                         └────────┬─────────┘           │
│                                  │                      │
│         ┌───────────────────────┼───────────────────┐   │
│         │                       │                    │ │
│         ▼                       ▼                    ▼ │
│  ┌─────────────┐       ┌──────────────┐      ┌───────────┐ │
│  │    Pass     │       │    Warn      │      │   Block   │ │
│  └─────────────┘       └──────────────┘      └───────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │            Self-Hardening v2.0                       │     │
│  │  🔥 Firewall │ 📒 Git │ 🔐 Encrypt │ 📋 Audit │ 🚫 Blacklist │ │
│  └─────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐                 │
│  │  Sui Contract  │◀───│   Audit Logs    │                 │
│  │  (On-Chain)    │    │   (Local/Walrus) │                 │
│  └─────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Clone the SecureAI Shield repository
git clone https://github.com/VipMason/sui-secure-ai-shield.git
cd sui-secure-ai-shield

# Install dependencies
npm install

# Initialize configuration
npm run init
```

## Quick Start

```javascript
const shield = require('./index.js');

const secure = new shield.SecureAIShield({
  enabled: true,
  onConfirmation: async (req) => {
    // Send confirmation request to external system
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

## Permission Levels

| Level | Name | Operations | Confirmation Required |
|-------|------|------------|----------------------|
| L0 | Public | Read public information | No |
| L1 | Basic | Read user data | First time only |
| L2 | Standard | Write operations | Yes |
| L3 | Sensitive | File operations, messaging | Yes + Cooldown |
| L4 | Critical | Shell execution, config changes, transfers | Multiple confirmations |

## Configuration

```javascript
const secure = new shield.SecureAIShield({
  enabled: true,
  
  permission: {
    defaultLevel: 'L2',
    cooldown: 60000,
    maxRetries: 3
  },
  
  sandbox: {
    enabled: true,
    maxMemory: '512m',
    blockedSyscalls: ['kill', 'reboot', 'mount', 'umount', 'setuid']
  },
  
  firewall: {
    enabled: true,
    allowedDomains: ['api.openai.com', 'api.sui.io'],
    blockedDomains: ['evil.com', 'malware.net']
  },
  
  audit: {
    localEnabled: true,
    chainEnabled: false,
    walrusEnabled: false
  }
});
```

## Sui Blockchain Integration

The audit system uses Sui blockchain for tamper-proof logging:

```
Operation → SHA-256 Hash → Merkle Root → Sui Object (On-Chain)
```

**Gas Calculation:**
```
1 SUI = 1,000,000,000 MIST (10^9)

Typical audit transaction: ~5000-10000 MIST
```

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

# Verify integrity
secure-ai-shield verify --chain
```

## Related Projects

This project is part of the OpenClaw Security Suite:

| Project | Description |
|---------|-------------|
| [injection-hunter](https://github.com/openclaw/injection-hunter) | Detect and filter malicious prompt injection attacks |
| [self-hardening](https://github.com/openclaw/self-hardening) | Host security hardening script |
| [wallet-airgap](https://github.com/openclaw/wallet-airgap) | Hardware wallet middleware for hot wallet protection |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
