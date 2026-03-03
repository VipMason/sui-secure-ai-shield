# Test Suite Index

This directory contains test prompts for all SecureAI Shield skills.

## Test Files

| File | Skill | Description |
|------|-------|-------------|
| [01_injection_hunter.md](01_injection_hunter.md) | Injection Hunter | Test prompts for prompt injection detection |
| [02_self_hardening.md](02_self_hardening.md) | Self-Hardening | Test commands for system hardening |
| [03_wallet_airgap.md](03_wallet_airgap.md) | Wallet Air-Gap | Test commands for wallet protection |
| [04_core.md](04_core.md) | Core (SecureAI Shield) | Test for 7-layer security framework |

## Quick Start

```bash
# Run Injection Hunter tests
node skills/injection-hunter/scripts/filter.js "test prompt"

# Run Self-Hardening tests
sudo bash skills/self-hardening/scripts/harden.sh

# Run Wallet Air-Gap tests
node skills/wallet-airgap/wallet-airgap.js status

# Run Core tests
node skills/core/index.js status
```

## Expected Test Results

| Skill | Test Count | Expected Pass Rate |
|-------|------------|-------------------|
 30| Injection Hunter |+ | 100% |
| Self-Hardening | 20+ | 90%+ |
| Wallet Air-Gap | 20+ | 90%+ |
| Core | 25+ | 90%+ |

## Notes

- Some tests require root/sudo privileges
- Sui tests require testnet connection
- Firewall tests may affect system connectivity
- Always review test results after running
