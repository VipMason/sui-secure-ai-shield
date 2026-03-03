---
name: self-hardening
description: OpenClaw security hardening script - auto-configure system protection, restrict dangerous operations
emoji: 🛡️
metadata:
  version: 2.0.0
  author: OpenClaw Agent (gugu)
  category: security
---

# Self-Hardening Script v2.0 - Security Hardening Script

Automatically configures complete security protection for OpenClaw, acting as the Agent's "bulletproof vest".

## Features v2.0

- **Firewall Configuration** - Auto-configure UFW/iptables, restrict port access
- **Git Version Control** - Auto-commit workspace changes, support auto-backup
- **Secrets Encryption** - Encrypted storage for sensitive files
- **Enhanced Audit Logging** - Complete operation logging, view/rotate logs
- **Command Blacklist** - Intercept dangerous system commands
- **SSH Hardening** - Secure configuration suggestions
- **Docker Security** - Container runtime security configuration

## Usage

### Run Full Hardening

```bash
sudo bash ~/.openclaw/workspace/skills/self-hardening/scripts/harden.sh
```

### View Audit Logs

```bash
# View all logs
~/.openclaw/audit/view.sh

# View today's logs
~/.openclaw/audit/view.sh today

# View command executions
~/.openclaw/audit/view.sh commands

# View errors
~/.openclaw/audit/view.sh errors
```

### Test Command Restrictions

```bash
# Test if dangerous commands are blocked
node ~/.openclaw/workspace/skills/injection-hunter/scripts/filter.js "userdel root"
```

## Hardening Modules

### 1. Firewall Configuration
- Open necessary ports (22, 80, 443)
- SSH rate limiting
- Connection logging

### 2. Git Version Control
- Auto-initialize Git repository
- Auto-commit changes
- Auto-backup scripts (`scripts/auto-backup.sh`)

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
2. **Set auto-backup**: `crontab -e` add `0 2 * * * ~/.openclaw/workspace/scripts/auto-backup.sh`
3. **Manual SSH config**: Edit `/etc/ssh/sshd_config`
4. **Regular log check**: `~/.openclaw/audit/view.sh`

## Version History

- v2.0.0 (2026-03-02): Enhanced version, added firewall, git, encryption, audit
- v1.0.0 (2026-02-26): Basic version
