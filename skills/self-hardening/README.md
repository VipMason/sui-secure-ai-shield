# Self-Hardening Script

OpenClaw security hardening script - automatically configures system protection and restricts dangerous operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/VipMason/sui-secure-ai-shield)

## Overview

Self-Hardening is an automated security hardening script for OpenClaw Agent. It acts as the Agent's "bulletproof vest" by configuring comprehensive security protections.

## Features

- **Firewall Configuration** - Auto-configure UFW/iptables, restrict port access
- **Git Version Control** - Auto-commit workspace changes, support auto-backup
- **Secrets Encryption** - Encrypted storage for sensitive files
- **Enhanced Audit Logging** - Complete operation logging with log rotation
- **Command Blacklist** - Intercept dangerous system commands
- **SSH Hardening** - Secure configuration suggestions
- **Docker Security** - Container runtime security configuration

## Installation

```bash
# Clone the SecureAI Shield repository
git clone https://github.com/VipMason/sui-secure-ai-shield.git
cd sui-secure-ai-shield/skills/self-hardening
```

## Usage

### Run Full Hardening

```bash
sudo bash scripts/harden.sh
```

### View Audit Logs

```bash
# View all logs
./scripts/view.sh

# View today's logs
./scripts/view.sh today

# View command executions
./scripts/view.sh commands

# View errors
./scripts/view.sh errors
```

## Hardening Modules

### 1. Firewall Configuration
- Open necessary ports (22, 80, 443)
- SSH rate limiting
- Connection logging

### 2. Git Version Control
- Auto-initialize Git repository
- Auto-commit changes
- Auto-backup scripts

### 3. Secrets Encryption
- Create encrypted directory structure
- Provide encryption guide
- Sensitive file detection alerts

### 4. Audit Logging
- Log all operations
- Log rotation (logrotate)
- Multiple view modes

### 5. Command Blacklist
- Dangerous command interception
- rm/cp/mv alias protection
- Operation logging

### 6. SSH Hardening
- Configuration backup
- Add security suggestions

### 7. Docker Security
- Container logging configuration
- Storage driver optimization

## Blocked Dangerous Operations

| Command | Risk |
|---------|------|
| userdel/usermod/useradd | Delete/modify user |
| groupdel/groupmod/groupadd | Delete/modify group |
| reboot/shutdown/halt | System shutdown |
| crontab -r | Delete cron job |
| rm -rf / | Recursive delete root |
| mkfs | Format disk |
| dd | Disk write |

## Audit Log Locations

- Main log: `~/.openclaw/audit/actions.log`
- Command log: `~/.openclaw/audit/commands.log`
- Config: `~/.openclaw/audit/config.yaml`

## Next Steps

1. **Run hardening script**: `sudo bash harden.sh`
2. **Set auto-backup**: `crontab -e` add backup job
3. **Manual SSH config**: Edit `/etc/ssh/sshd_config`
4. **Regular log check**: `./scripts/view.sh`

## Related Projects

| Project | Description |
|---------|-------------|
| [injection-hunter](https://github.com/VipMason/sui-secure-ai-shield/injection-hunter) | Detect and filter malicious prompt injection |
| [secure-ai-shield](https://github.com/VipMason/sui-secure-ai-shield) | Multi-layer security protection for AI Agents |
| [wallet-airgap](https://github.com/VipMason/sui-secure-ai-shield) | Hardware wallet middleware |

## License

MIT License - see [LICENSE](LICENSE) for details.
