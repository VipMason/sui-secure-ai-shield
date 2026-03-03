# SecureAI Shield

Comprehensive security suite for AI Agents with Sui blockchain integration. Developed for DeepSurge Hackathon.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/openclaw/secure-ai-shield)

## Overview

SecureAI Shield is a complete security protection system for AI Agents. It provides multi-layer defense from input detection to execution monitoring, with blockchain-backed audit logging on Sui.

## Project Structure

```
secure-ai-shield/
├── skills/                    # Security Skills for OpenClaw
│   ├── core/                # Multi-layer security framework
│   ├── injection-hunter/   # Malicious prompt injection detection
│   ├── self-hardening/     # System security hardening
│   └── wallet-airgap/      # Hardware wallet middleware
├── sui-projects/            # Sui Move Smart Contract
│   └── secure_audit/       # On-chain security audit logging
├── index.js                  # Main entry
├── SKILL.md                  # OpenClaw skill definition
├── README.md                 # This file
├── package.json              # NPM package
└── LICENSE                   # MIT License
```

## Security Skills

### 1. Injection Hunter

Detect and filter malicious prompt injection attacks.

```bash
node skills/injection-hunter/scripts/filter.js "your prompt"
```

**Features:**
- Real-time detection
- Risk scoring (0-100)
- 120+ detection rules
- Sui CLI command security detection

### 2. Self-Hardening

Automated security hardening for host systems.

```bash
sudo bash skills/self-hardening/scripts/harden.sh
```

**Features:**
- Firewall configuration
- Git version control
- Secrets encryption
- Enhanced audit logging
- Command blacklist

### 3. Wallet Air-Gap

Hardware wallet middleware preventing hot wallet drains.

```bash
node skills/wallet-airgap/wallet-airgap.js enable
```

**Features:**
- Transaction interception
- Hardware wallet verification
- Hot wallet read-only
- Transaction queue

## Sui Smart Contract

### secure_audit

On-chain security audit logging for SecureAI Shield. Records all security events on Sui blockchain.

**Package ID (Testnet):** 
```
0x3a22bb587ac926723a67cf6d134ab4795887639c49a61cf1aafae1a388d1a197
```

**Functions:**
- `create_audit_store` - Create an audit store
- `log_event` - Log a generic security event
- `log_injection` - Log injection attack
- `log_unauthorized` - Log unauthorized access
- `log_wallet_transfer` - Log wallet transfer attempt
- `get_event_count` - Get total events logged
- `get_owner` - Get store owner

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SecureAI Shield                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────┐           │
│  │  Input (Prompt) │───▶│ Injection Hunter │           │
│  └─────────────────┘    └────────┬─────────┘           │
│                                  │                      │
│                                  ▼                      │
│                         ┌──────────────────┐           │
│                         │  Risk Assessment │           │
│                         └────────┬─────────┘           │
│                                  │                      │
│         ┌───────────────────────┼───────────────────┐    │
│         ▼                       ▼                    ▼  │
│  ┌─────────────┐       ┌──────────────┐      ┌───────────┐│
│  │    Pass     │       │    Warn      │      │   Block   ││
│  └─────────────┘       └──────────────┘      └───────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Self-Hardening v2.0                        │   │
│  │  🔥 Firewall │ 📒 Git │ 🔐 Encrypt │ 📋 Audit │ 🚫 Blacklist │ │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │  Sui Contract  │◀───│   Audit Logs    │              │
│  │ secure_audit   │    │   (On-Chain)     │              │
│  └─────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Security Skills

```bash
# Install dependencies
cd skills/injection-hunter
npm install

# Run injection detection
node scripts/filter.js "test prompt"

# Run hardening
sudo bash skills/self-hardening/scripts/harden.sh

# Enable wallet air-gap
node skills/wallet-airgap/wallet-airgap.js enable
```

### Sui Contract

```bash
# Build
cd sui-projects/secure_audit
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000
```

## Gas Calculation

For Sui blockchain operations:

```
1 SUI = 1,000,000,000 MIST (10^9)

Typical operations:
- Simple transfer: ~5000 MIST
- Contract call: ~10000-50000 MIST
- Contract publish: ~100000+ MIST
```

## DeepSurge Hackathon

**Track:** Safety & Security  
**Sui Wallet:** 0xe4f90573ff2ee4b98a37fe3b95db41b125b77e08a0d4754640a7e16a69d4a943

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Created:** 2026-03-02  
**For:** DeepSurge Hackathon
