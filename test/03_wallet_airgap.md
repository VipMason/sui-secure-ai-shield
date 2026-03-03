# Wallet Air-Gap Test Prompts

Test prompts for the wallet-airgap middleware. Run with:
```bash
node skills/wallet-airgap/wallet-airgap.js <command>
```

## Status Tests

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| ST01 | Check enabled status | node skills/wallet-airgap/wallet-airgap.js status | Protection enabled |
| ST02 | Check config | cat ~/.openclaw/airgap/config.json | Config file exists |

## Enable/Disable Tests

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| EN01 | Enable protection | node skills/wallet-airgap/wallet-airgap.js enable | Protection enabled message |
| EN02 | Disable protection | node skills/wallet-airgap/wallet-airgap.js disable | Protection disabled message |
| EN03 | Re-enable protection | node skills/wallet-airgap/wallet-airgap.js enable | Re-enabled message |

## Command Check Tests

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| CK01 | Check Sui transfer | node skills/wallet-airgap/wallet-airgap.js check "sui client transfer --to 0x123 --amount 100" | HIGH risk detected |
| CK02 | Check Sui stake | node skills/wallet-airgap/wallet-airgap.js check "sui client stake --validator 0xabc" | HIGH risk detected |
| CK03 | Check Sui publish | node skills/wallet-airgap/wallet-airgap.js check "sui client publish" | HIGH risk detected |
| CK04 | Check Sui key export | node skills/wallet-airgap/wallet-airgap.js check "sui key export" | CRITICAL risk detected |
| CK05 | Check Sui object query | node skills/wallet-airgap/wallet-airgap.js check "sui client objects" | LOW risk, allowed |

## Dangerous Operations Detection

| ID | Operation | Risk Level | Expected Action |
|----|-----------|------------|----------------|
| D01 | Key import/export | CRITICAL | Block immediately |
| D02 | Large transfer (>1000 SUI) | CRITICAL | Block immediately |
| D03 | Contract publish | HIGH | Require confirmation |
| D04 | Stake/unstake | HIGH | Require confirmation |
| D05 | Regular transfer | MEDIUM | Log and warn |
| D06 | Governance vote | MEDIUM | Log and warn |
| D07 | Object query | LOW | Allow |
| D08 | Balance check | LOW | Allow |

## Transaction Queue Tests

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| Q01 | View pending | node skills/wallet-airgap/wallet-airgap.js pending | List of pending transactions |
| Q02 | Approve transaction | node skills/wallet-airgap/wallet-airgap.js approve <tx-id> | Transaction approved |
| Q03 | Reject transaction | node skills/wallet-airgap/wallet-airgap.js reject <tx-id> | Transaction rejected |

## Configuration Tests

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| CFG01 | Default config | cat ~/.openclaw/airgap/config.json | Default settings shown |
| CFG02 | Set max transfer | node skills/wallet-airgap/wallet-airgap.js config maxTransfer 100 | Config updated |
| CFG03 | Add whitelist | node skills/wallet-airgap/wallet-airgap.js whitelist add 0x123 | Address added |
| CFG04 | Remove whitelist | node skills/wallet-airgap/wallet-airgap.js whitelist remove 0x123 | Address removed |

---

## Run All Tests

```bash
# Check status
node skills/wallet-airgap/wallet-airgap.js status

# Enable protection
node skills/wallet-airgap/wallet-airgap.js enable

# Test dangerous command
node skills/wallet-airgap/wallet-airgap.js check "sui client transfer --to 0x123 --amount 10000"

# View pending transactions
node skills/wallet-airgap/wallet-airgap.js pending

# Disable protection
node skills/wallet-airgap/wallet-airgap.js disable
```

---

## Expected Workflow

```
1. User initiates transfer
2. Wallet Air-Gap intercepts
3. Risk level assessed
4. If CRITICAL/HIGH -> Create pending transaction
5. User confirms via hardware wallet
6. Transaction approved or rejected
7. Result logged to audit
```

---

## Risk Level Actions

| Risk Level | Action | Color Code |
|------------|--------|------------|
| CRITICAL | Block immediately, require hardware wallet | Red |
| HIGH | Create pending, require confirmation | Orange |
| MEDIUM | Allow with warning, log transaction | Yellow |
| LOW | Allow, log only | Green |
