# Secure Audit - On-Chain Security Logging

A Sui smart contract for storing security events and audit logs on-chain. Part of SecureAI Shield.

## Overview

Secure Audit provides on-chain storage for security events from the SecureAI Shield system. It allows tracking of:

- Injection attack attempts
- Unauthorized access attempts
- Wallet transfer approvals/rejections
- Risk scoring events

## Features

- **Security Event Logging** - Store security events on Sui blockchain
- **Risk Scoring** - 0-100 risk score per event
- **Audit Trail** - Immutable record of all security events
- **Multi-event Types** - Supports injection, unauthorized access, wallet transfers

## Build

```bash
sui move build
```

## Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

## Contract Functions

- `create_audit_store` - Create an audit store for an address
- `log_event` - Log a generic security event
- `log_injection` - Log an injection detection event
- `log_unauthorized` - Log unauthorized access attempt
- `log_wallet_transfer` - Log wallet transfer for Wallet Air-Gap
- `get_event_count` - Get total events logged

## Package ID

**Testnet:** `0x3a22bb587ac926723a67cf6d134ab4795887639c49a61cf1aafae1a388d1a197`

## Integration

This contract is used by SecureAI Shield for blockchain-backed audit logging:

```
SecureAI Shield → Security Events → secure_audit Contract → Sui Testnet
```

## License

MIT
