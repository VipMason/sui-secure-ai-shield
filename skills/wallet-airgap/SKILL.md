---
name: wallet-airgap
description: Wallet Air-Gap - Hardware wallet middleware, prevents hot wallet drains
emoji: 🔐
metadata:
  version: 1.0.0
  author: OpenClaw Agent (gugu)
  category: security
---

# Wallet Air-Gap - Hardware Wallet Middleware

Middleware that allows OpenClaw to propose transactions but requires hardware wallet signature for execution, preventing "hot wallet" drains.

## Features

- **Transaction Interception** - Detect dangerous Sui operations
- **Hardware Wallet Verification** - Requires hardware wallet confirmation to sign
- **Hot Wallet Read-only** - Prevents hot wallet drainage
- **Transaction Queue** - Pending transaction management

## Dangerous Operations

| Risk Level | Operation |
|------------|----------|
| CRITICAL | Key import/export |
| HIGH | Transfer, stake, contract publish |
| MEDIUM | Governance voting |

## Usage

### Enable Protection
```bash
node ~/.openclaw/workspace/skills/wallet-airgap/wallet-airgap.js enable
```

### View Status
```bash
node ~/.openclaw/workspace/skills/wallet-airgap/wallet-airgap.js status
```

### Check Command
```bash
node ~/.openclaw/workspace/skills/wallet-airgap/wallet-airgap.js check "sui client transfer --to 0x123 --amount 100"
```

### View Pending Transactions
```bash
node ~/.openclaw/workspace/skills/wallet-airgap/wallet-airgap.js pending
```

### Approve Transaction
```bash
node ~/.openclaw/workspace/skills/wallet-airgap/wallet-airgap.js approve <tx-id>
```

### Reject Transaction
```bash
node ~/.openclaw/workspace/skills/wallet-airgap/wallet-airgap.js reject <tx-id>
```

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
const { checkCommand } = require('./wallet-airgap/wallet-airgap.js');

const result = checkCommand(userInput);
if (!result.allowed) {
  console.log(`Dangerous operation: ${result.reason}`);
  console.log(`Transaction ID: ${result.txId}`);
  // Wait for user confirmation
}
```
