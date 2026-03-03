# Self-Hardening Test Prompts

Test prompts for the self-hardening security script. Run with:
```bash
sudo bash skills/self-hardening/scripts/harden.sh
```

## Hardening Module Tests

### 1. Firewall Configuration

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| FW01 | Check UFW status | sudo ufw status | Active |
| FW02 | Check SSH port | sudo ufw status | Port 22 listed |
| FW03 | Check default deny | sudo ufw default deny incoming | Default incoming policy is deny |
| FW04 | List firewall rules | sudo ufw status numbered | Rules exist |

### 2. Git Version Control

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| GIT01 | Check git initialized | git status | Working directory is a git repository |
| GIT02 | Check auto-commit script | ls -la scripts/autocommit.sh | File exists |
| GIT03 | Check backup script | ls -la scripts/backup.sh | File exists |
| GIT04 | Check git log | git log --oneline -5 | Recent commits visible |

### 3. Secrets Encryption

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| SEC01 | Check secrets directory | ls -la ~/.openclaw/secrets/ | Directory exists |
| SEC02 | Check encryption script | ls -la scripts/encrypt.sh | File exists |
| SEC03 | Test encryption | bash scripts/encrypt.sh test.txt | Encrypted file created |
| SEC04 | Test decryption | bash scripts/decrypt.sh test.txt.enc | Original content restored |

### 4. Audit Logging

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| AUD01 | Check audit directory | ls -la ~/.openclaw/audit/ | Directory exists |
| AUD02 | Check action log | tail -10 ~/.openclaw/audit/actions.log | Recent actions logged |
| AUD03 | Check command log | tail -10 ~/.openclaw/audit/commands.log | Commands logged |
| AUD04 | View today's logs | bash scripts/view.sh today | Today's logs displayed |

### 5. Command Blacklist

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| BL01 | Test userdel blocked | userdel testuser 2>&1 | Command blocked message |
| BL02 | Test reboot blocked | reboot 2>&1 | Command blocked message |
| BL03 | Test rm rf blocked | rm -rf / 2>&1 | Warning message |
| BL04 | Test crontab -r blocked | crontab -r 2>&1 | Warning message |

### 6. SSH Hardening

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| SSH01 | Check SSH config backup | ls -la /etc/ssh/sshd_config.backup | Backup exists |
| SSH02 | Check SSH config suggestions | cat ~/.openclaw/audit/ssh_hardening.txt | Suggestions file exists |

### 7. Docker Security

| ID | Test | Command | Expected Result |
|----|------|---------|----------------|
| DOCK01 | Check Docker config | cat /etc/docker/daemon.json | Config file exists |
| DOCK02 | Check Docker logging | docker info --format '{{.LogDriver}}' | Logging configured |

---

## Run All Tests

```bash
# Run full hardening
sudo bash skills/self-hardening/scripts/harden.sh

# View all logs
bash skills/self-hardening/scripts/view.sh

# View today's logs
bash skills/self-hardening/scripts/view.sh today

# View errors only
bash skills/self-hardening/scripts/view.sh errors

# Test command blocking
skills/injection-hunter/scripts/filter.js "userdel root"
```

---

## Expected Outcomes

| Module | Pass Criteria |
|--------|---------------|
| Firewall | UFW active, port 22 limited |
| Git | Repository initialized, autocommit configured |
| Secrets | Encryption script functional |
| Audit | Logs created and rotating |
| Blacklist | Dangerous commands intercepted |
| SSH | Hardening suggestions available |
| Docker | Security configurations applied |
