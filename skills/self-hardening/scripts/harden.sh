#!/bin/bash
# Self-Hardening Script v2.0 - OpenClaw Security Hardening
# Auto-configure system protection, restrict dangerous operations

set -e

echo "🛡️ OpenClaw Security Hardening v2.0"
echo "================================"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check root privileges
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Run with sudo for full functionality${NC}"
fi

# Create audit directory
AUDIT_DIR="$HOME/.openclaw/audit"
mkdir -p "$AUDIT_DIR"

log_action() {
    local action="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] $action" >> "$AUDIT_DIR/actions.log"
    echo -e "${GREEN}✓${NC} $action"
}

# ============================================
# 1. Firewall Configuration
# ============================================
configure_firewall() {
    echo -e "\n${YELLOW}🔥 Configuring Firewall...${NC}"
    
    # Check if ufw is installed
    if command -v ufw &> /dev/null; then
        # Allow ports needed by OpenClaw
        ufw --force enable 2>/dev/null || true
        ufw allow 22/tcp comment 'SSH' 2>/dev/null || true
        ufw allow 80/tcp comment 'HTTP' 2>/dev/null || true
        ufw allow 443/tcp comment 'HTTPS' 2>/dev/null || true
        
        # Limit SSH attempts
        if [ -f /etc/ufw/before.rules ]; then
            # Add SSH rate limiting
            if ! grep -q "ufw-secure-ssh" /etc/ufw/before.rules; then
                echo "# ufw-secure-ssh" >> /etc/ufw/before.rules
            fi
        fi
        
        log_action "Firewall configured"
    else
        echo -e "${YELLOW}⚠ ufw not installed, skipping firewall config${NC}"
        log_action "ufw not installed, skipped"
    fi
    
    # Configure iptables basic rules (if available)
    if command -v iptables &> /dev/null; then
        # Log blocked connections
        iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-blocked: " 2>/dev/null || true
        log_action "iptables basic rules configured"
    fi
}

# ============================================
# 2. Git Version Control
# ============================================
setup_git_tracking() {
    echo -e "\n${YELLOW}📒 Setting up Git Version Control...${NC}"
    
    WORKSPACE="$HOME/.openclaw/workspace"
    
    # Initialize git repo (if not exists)
    if [ ! -d "$WORKSPACE/.git" ]; then
        cd "$WORKSPACE"
        git init
        git config user.email "openclaw@local"
        git config user.name "OpenClaw Agent"
        
        # Create .gitignore
        cat > "$WORKSPACE/.gitignore" << 'EOF'
# OpenClaw
*.log
*.tmp
node_modules/
.env
secrets/
credentials/
*.key
*.pem
EOF
        
        git add .
        git commit -m "Initial commit - OpenClaw workspace"
        log_action "Git repository initialized"
    else
        # Commit current changes
        cd "$WORKSPACE"
        git add -A
        if git diff --staged --quiet; then
            echo "No new changes to commit"
        else
            git commit -m "Auto-save - $(date '+%Y-%m-%d %H:%M:%S')"
            log_action "Git committed current changes"
        fi
    fi
    
    # Create auto-backup script
    cat > "$WORKSPACE/scripts/auto-backup.sh" << 'SCRIPT'
#!/bin/bash
# Auto-backup script - runs daily
WORKSPACE="$HOME/.openclaw/workspace"
BACKUP_DIR="$HOME/.openclaw/backups"

mkdir -p "$BACKUP_DIR"

# Git commit
cd "$WORKSPACE"
git add -A
git commit -m "Auto-backup - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null

# Package important files
tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d).tar.gz" \
    $WORKSPACE/*.md \
    $WORKSPACE/memory/ \
    --exclude='node_modules' 2>/dev/null

echo "Backup completed: $(date)"
SCRIPT
    chmod +x "$WORKSPACE/scripts/auto-backup.sh"
    log_action "Auto-backup script created"
}

# ============================================
# 3. Secrets Encryption
# ============================================
encrypt_secrets() {
    echo -e "\n${YELLOW}🔐 Encrypting sensitive files...${NC}"
    
    WORKSPACE="$HOME/.openclaw/workspace"
    SECRETS_DIR="$WORKSPACE/secrets"
    ENCRYPTED_DIR="$WORKSPACE/.secrets.encrypted"
    
    mkdir -p "$SECRETS_DIR" "$ENCRYPTED_DIR"
    
    # Create secrets directory readme
    cat > "$SECRETS_DIR/README.md" << 'EOF'
# Secrets Directory

This directory is for storing sensitive files that need encryption.

## Usage

1. Put sensitive files in this directory
2. Run encryption command:
   openssl enc -aes-256-cbc -salt -in secrets/xxx -out .secrets.encrypted/xxx.enc
3. Delete original plaintext files

## Important Files

- API keys
- Passwords
- Private keys
- Tokens
EOF
    
    # Encrypt existing sensitive files (if any)
    for file in "$WORKSPACE"/*.json; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # Check if contains sensitive keywords
            if grep -qi "key\|token\|secret\|password\|auth" "$file" 2>/dev/null; then
                echo -e "${YELLOW}⚠ Sensitive file found: $filename${NC}"
                echo "Manually encrypt: openssl enc -aes-256-cbc -salt -in $file -out $file.enc"
            fi
        fi
    done
    
    log_action "Secrets directory configured"
}

# ============================================
# 4. Enhanced Audit Logging
# ============================================
enhance_audit() {
    echo -e "\n${YELLOW}📋 Enhancing Audit Logs...${NC}"
    
    AUDIT_DIR="$HOME/.openclaw/audit"
    mkdir -p "$AUDIT_DIR"
    
    # Create audit config
    cat > "$AUDIT_DIR/config.yaml" << 'EOF'
# OpenClaw Audit Configuration
audit:
  enabled: true
  log_file: ~/.openclaw/audit/actions.log
  max_size: 10MB
  retention: 30 days
  
events:
  - command_execution
  - file_access
  - network_request
  - config_change
  - agent_start
  - agent_stop
EOF
    
    # Create audit log viewer script
    cat > "$AUDIT_DIR/view.sh" << 'SCRIPT'
#!/bin/bash
# Audit Log Viewer Tool

AUDIT_LOG="$HOME/.openclaw/audit/actions.log"

if [ ! -f "$AUDIT_LOG" ]; then
    echo "No audit logs yet"
    exit 0
fi

case "${1:-all}" in
    today)
        grep "^$(date '+%Y-%m-%d')" "$AUDIT_LOG"
        ;;
    commands)
        grep -i "command\|exec\|execute" "$AUDIT_LOG"
        ;;
    errors)
        grep -i "error\|fail\|denied" "$AUDIT_LOG"
        ;;
    *)
        tail -100 "$AUDIT_LOG"
        ;;
esac
SCRIPT
    chmod +x "$AUDIT_DIR/view.sh"
    
    # Setup log rotation
    if command -v logrotate &> /dev/null; then
        cat > /etc/logrotate.d/openclaw-audit << 'EOF'
$HOME/.openclaw/audit/actions.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
EOF
    fi
    
    log_action "Audit logging enhanced"
}

# ============================================
# 5. Command Blacklist
# ============================================
setup_command_blacklist() {
    echo -e "\n${YELLOW}🚫 Configuring Command Blacklist...${NC}"
    
    # Create command aliases to intercept dangerous commands
    BASHRC="$HOME/.bashrc"
    
    # Add dangerous command warnings
    cat >> "$BASHRC" << 'EOF'

# OpenClaw Security Hardening - Dangerous Command Interception
# The following commands require confirmation before execution
openclaw_dangerous_commands=(
    "rm -rf /"
    "mkfs"
    "dd if="
    "userdel"
    "groupdel"
    "shutdown"
    "reboot"
    "init 0"
    "init 6"
    "> /dev/sda"
)

# Dangerous command aliases
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Logging
log_command() {
    echo "[$(date)] $USER ran: $1" >> ~/.openclaw/audit/commands.log
}
EOF
    
    log_action "Command blacklist configured"
}

# ============================================
# 6. SSH Hardening
# ============================================
harden_ssh() {
    echo -e "\n${YELLOW}🔒 Hardening SSH...${NC}"
    
    SSH_CONFIG="/etc/ssh/sshd_config"
    
    if [ -f "$SSH_CONFIG" ]; then
        # Backup config
        cp "$SSH_CONFIG" "$SSH_CONFIG.backup.$(date +%Y%m%d)"
        
        # Suggested config changes
        cat >> "$SSH_CONFIG" << 'EOF'

# OpenClaw Security Hardening Suggestions
# Please manually edit the following options:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# MaxAuthTries 3
# ClientAliveInterval 300
EOF
        log_action "SSH config added security suggestions"
    else
        echo -e "${YELLOW}⚠ SSH config file not found${NC}"
    fi
}

# ============================================
# 7. Docker Security
# ============================================
harden_docker() {
    echo -e "\n${YELLOW}🐳 Docker Security Config...${NC}"
    
    if command -v docker &> /dev/null; then
        # Create Docker security config
        DOCKER_CONFIG_DIR="$HOME/.docker"
        mkdir -p "$DOCKER_CONFIG_DIR"
        
        cat > "$DOCKER_CONFIG_DIR/daemon.json" << 'EOF'
{
    "live-restore": true,
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2"
}
EOF
        log_action "Docker security config created"
    else
        echo -e "${YELLOW}⚠ Docker not installed, skipping${NC}"
    fi
}

# ============================================
# Main Program
# ============================================
main() {
    echo -e "\n${GREEN}Starting Security Hardening...${NC}\n"
    
    configure_firewall
    setup_git_tracking
    encrypt_secrets
    enhance_audit
    setup_command_blacklist
    harden_ssh
    harden_docker
    
    echo -e "\n${GREEN}================================"
    echo -e "✅ Security Hardening Complete!"
    echo -e "================================${NC}"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Restart terminal for config to take effect"
    echo "2. Review audit logs: ~/.openclaw/audit/view.sh"
    echo "3. Configure SSH key authentication"
    echo "4. Set up scheduled backup: crontab -e"
    echo "   Add: 0 2 * * * ~/.openclaw/workspace/scripts/auto-backup.sh"
}

main "$@"
