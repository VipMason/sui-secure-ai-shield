# Wallet Air-Gap

Hardware wallet middleware for AI Agents. Prevents hot wallet drains by requiring hardware wallet signature for dangerous operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/VipMason/sui-secure-ai-shield/wallet-airgap)

## Overview

Wallet Air-Gap is middleware that allows OpenClaw Agent to propose transactions but requires hardware wallet signature for execution. This prevents "hot wallet" drains and ensures security for blockchain operations.

## Features

- **Transaction Interception** - Detect dangerous Sui operations
- **Hardware Wallet Verification** - Requires hardware wallet confirmation to sign
- **Hot Wallet Read-only** - Prevents hot wallet drainage
- **Transaction Queue** - Pending transaction management
- **Risk-based Controls** - Different levels for different operations

## Installation

```bash
# Clone the SecureAI Shield repository
git clone https://github.com/VipMason/sui-secure-ai-shield.git
cd sui-secure-ai-shield/skills/wallet-airgap
```

## Usage

```bash
# Enable protection
node wallet-airgap.js enable
```

### View Status

```bash
node wallet-airgap.js status
```

### Check Command

```bash
node wallet-airgap.js check "sui client transfer --to 0x123 --amount 100"
```

### View Pending Transactions

```bash
node wallet-airgap.js pending
```

### Approve Transaction

```bash
node wallet-airgap.js approve <tx-id>
```

### Reject Transaction

```bash
node wallet-airgap.js reject <tx-id>
```

## Dangerous Operations

| Risk Level | Operation |
|------------|----------|
| CRITICAL | Key import/export |
| HIGH | Transfer, stake, contract publish |
| MEDIUM | Governance voting |

## Configuration

Config file: `~/.openclaw/airgap/config.json`

```json
{
  "enabled": true,
  "requireHardwareWallet": true,
  "hotWalletReadOnly": true,
  "maxTransferAmount": 1,
  "whitelist": [],
  "blacklist": []
}
```

## Workflow

```
1. User inputs transfer command
2. Wallet Air-Gap intercepts
3. Detected as dangerous operation
4. Create pending transaction
5. User confirms via hardware wallet
6. Execute after approval
```

## Integration with Injection Hunter

Can call Wallet Air-Gap after injection-hunter detection:

```javascript
const { checkCommand } = require('./wallet-airgap.js');

const result = checkCommand(userInput);
if (!result.allowed) {
  console.log(`Dangerous operation: ${result.reason}`);
  console.log(`Transaction ID: ${result.txId}`);
  // Wait for user confirmation
}
```

## Related Projects

| Project | Description |
|---------|-------------|
| [injection-hunter](https://github.com/VipMason/sui-secure-ai-shield/injection-hunter) | Detect and filter malicious prompt injection |
| [secure-ai-shield](https://github.com/VipMason/sui-secure-ai-shield/secure-ai-shield) | Multi-layer security protection for AI Agents |
| [self-hardening](https://github.com/VipMason/sui-secure-ai-shield/self-hardening) | Host security hardening script |

## License

MIT License - see [LICENSE](LICENSE) for details.
