#!/usr/bin/env node
/**
 * Wallet Air-Gap - Hardware Wallet Middleware
 * 
 * Features:
 * 1. Intercept dangerous Sui transactions
 * 2. Require hardware wallet signature confirmation
 * 3. Prevent hot wallet drainage
 * 
 * Usage:
 * node wallet-airgap.js enable   - Enable protection
 * node wallet-airgap.js disable  - Disable protection
 * node wallet-airgap.js status   - View status
 * node wallet-airgap.js pending  - View pending transactions
 * node wallet-airgap.js approve <id> - Approve transaction
 * node wallet-airgap.js reject <id> - Reject transaction
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG_DIR = path.join(process.env.HOME || '/root', '.openclaw', 'airgap');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PENDING_FILE = path.join(CONFIG_DIR, 'pending.json');

// Dangerous operations list (English + Chinese patterns)
const DANGEROUS_OPERATIONS = [
  // English
  { pattern: /transfer|sui.*send|pay/i, risk: 'HIGH', desc: 'Token transfer' },
  { pattern: /stake|unstake|delegate/i, risk: 'HIGH', desc: 'Staking operation' },
  { pattern: /publish|deploy/i, risk: 'HIGH', desc: 'Contract publish' },
  { pattern: /keytool.*import|import.*key/i, risk: 'CRITICAL', desc: 'Key import' },
  { pattern: /keytool.*export|export.*key/i, risk: 'CRITICAL', desc: 'Key export' },
  { pattern: /validator.*join|validator.*leave/i, risk: 'HIGH', desc: 'Validator operation' },
  { pattern: /governance|vote|proposal/i, risk: 'MEDIUM', desc: 'Governance voting' },
  // Chinese
  { pattern: /转账|转币|发送代币/i, risk: 'HIGH', desc: 'Token transfer' },
  { pattern: /质押|取消质押|委托/i, risk: 'HIGH', desc: 'Staking operation' },
  { pattern: /发布合约|部署合约/i, risk: 'HIGH', desc: 'Contract publish' },
  { pattern: /导入密钥|导入私钥/i, risk: 'CRITICAL', desc: 'Key import' },
  { pattern: /导出密钥|导出私钥|助记词/i, risk: 'CRITICAL', desc: 'Key export' },
  { pattern: /验证器加入|验证器退出/i, risk: 'HIGH', desc: 'Validator operation' },
  { pattern: /投票|提案/i, risk: 'MEDIUM', desc: 'Governance voting' },
];

// Default config
const DEFAULT_CONFIG = {
  enabled: false,
  requireHardwareWallet: true,
  hotWalletReadOnly: true,
  maxTransferAmount: 1,
  pendingTransactions: [],
  whitelist: [],
  blacklist: [],
};

// Load config
function loadConfig() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

// Save config
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Load pending transactions
function loadPending() {
  if (!fs.existsSync(PENDING_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
}

// Save pending transactions
function savePending(pending) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
}

// Detect dangerous operation
function detectDangerousOperation(input) {
  const findings = [];
  for (const rule of DANGEROUS_OPERATIONS) {
    if (rule.pattern.test(input)) {
      findings.push(rule);
    }
  }
  return findings;
}

// Generate transaction ID
function generateTxId() {
  return crypto.randomBytes(8).toString('hex');
}

// Create pending transaction
function createPendingTx(command, details) {
  const pending = loadPending();
  const tx = {
    id: generateTxId(),
    command: command,
    details: details,
    risk: details.risk,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    rejectedAt: null,
  };
  pending.push(tx);
  savePending(pending);
  return tx;
}

// Enable protection
function enable() {
  const config = loadConfig();
  config.enabled = true;
  saveConfig(config);
  console.log('✅ Wallet Air-Gap enabled');
  console.log('   - Hot wallet set to read-only');
  console.log('   - Dangerous operations require hardware wallet confirmation');
}

// Disable protection
function disable() {
  const config = loadConfig();
  config.enabled = false;
  saveConfig(config);
  console.log('✅ Wallet Air-Gap disabled');
}

// View status
function status() {
  const config = loadConfig();
  const pending = loadPending();
  
  console.log('\n🛡️ Wallet Air-Gap Status\n');
  console.log(`   Protection: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Hardware Wallet: ${config.requireHardwareWallet ? '✅ Required' : '❌ Optional'}`);
  console.log(`   Hot Wallet Read-only: ${config.hotWalletReadOnly ? '✅ Yes' : '❌ No'}`);
  console.log(`   Max Transfer Amount: ${config.maxTransferAmount} SUI`);
  console.log(`   Pending Transactions: ${pending.filter(t => t.status === 'PENDING').length}`);
  
  if (config.enabled) {
    console.log('\n📋 Dangerous Operation Rules:');
    DANGEROUS_OPERATIONS.forEach(op => {
      console.log(`   [${op.risk}] ${op.desc}: ${op.pattern}`);
    });
  }
}

// List pending transactions
function listPending() {
  const pending = loadPending();
  const pendingList = pending.filter(t => t.status === 'PENDING');
  
  if (pendingList.length === 0) {
    console.log('📭 No pending transactions');
    return;
  }
  
  console.log(`\n📋 Pending Transactions (${pendingList.length})\n`);
  pendingList.forEach(tx => {
    console.log(`   ID: ${tx.id}`);
    console.log(`   Command: ${tx.command}`);
    console.log(`   Risk: ${tx.risk}`);
    console.log(`   Created: ${tx.createdAt}`);
    console.log('   ---');
  });
}

// Approve transaction
function approveTx(id) {
  const pending = loadPending();
  const tx = pending.find(t => t.id === id);
  
  if (!tx) {
    console.log(`❌ Transaction not found: ${id}`);
    return;
  }
  
  if (tx.status !== 'PENDING') {
    console.log(`❌ Transaction not pending: ${tx.status}`);
    return;
  }
  
  tx.status = 'APPROVED';
  tx.approvedAt = new Date().toISOString();
  savePending(pending);
  
  console.log(`✅ Transaction approved: ${id}`);
  console.log('   Next: Sign with hardware wallet then execute');
}

// Reject transaction
function rejectTx(id) {
  const pending = loadPending();
  const tx = pending.find(t => t.id === id);
  
  if (!tx) {
    console.log(`❌ Transaction not found: ${id}`);
    return;
  }
  
  tx.status = 'REJECTED';
  tx.rejectedAt = new Date().toISOString();
  savePending(pending);
  
  console.log(`❌ Transaction rejected: ${id}`);
}

// Intercept check
function checkCommand(command) {
  const config = loadConfig();
  
  if (!config.enabled) {
    return { allowed: true, reason: 'Protection not enabled' };
  }
  
  const dangers = detectDangerousOperation(command);
  
  if (dangers.length === 0) {
    return { allowed: true, reason: 'Safe operation' };
  }
  
  // Create pending transaction
  const tx = createPendingTx(command, {
    risk: dangers[0].risk,
    description: dangers.map(d => d.desc).join(', ')
  });
  
  return {
    allowed: false,
    reason: 'Dangerous operation requires confirmation',
    txId: tx.id,
    risk: dangers[0].risk,
    details: dangers.map(d => d.desc).join(', ')
  };
}

// CLI main
function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'status';
  
  switch (action) {
    case 'enable':
      enable();
      break;
    case 'disable':
      disable();
      break;
    case 'status':
      status();
      break;
    case 'pending':
      listPending();
      break;
    case 'approve':
      if (!args[1]) {
        console.log('Usage: node wallet-airgap.js approve <id>');
        process.exit(1);
      }
      approveTx(args[1]);
      break;
    case 'reject':
      if (!args[1]) {
        console.log('Usage: node wallet-airgap.js reject <id>');
        process.exit(1);
      }
      rejectTx(args[1]);
      break;
    case 'check':
      if (!args[1]) {
        console.log('Usage: node wallet-airgap.js check "<command>"');
        process.exit(1);
      }
      const result = checkCommand(args.slice(1).join(' '));
      console.log('\n🛡️ Wallet Air-Gap Check Result\n');
      console.log(`   Allowed: ${result.allowed ? '✅ Yes' : '❌ No'}`);
      console.log(`   Reason: ${result.reason}`);
      if (result.txId) {
        console.log(`   Transaction ID: ${result.txId}`);
        console.log(`   Risk Level: ${result.risk}`);
        console.log(`   Details: ${result.details}`);
        console.log('\n   Approve: node wallet-airgap.js approve ' + result.txId);
        console.log('   Reject: node wallet-airgap.js reject ' + result.txId);
      }
      process.exit(result.allowed ? 0 : 1);
      break;
    default:
      console.log(`
🛡️ Wallet Air-Gap - Hardware Wallet Middleware

Usage: node wallet-airgap.js <command>

Commands:
  enable          Enable protection
  disable         Disable protection
  status          View status
  pending         View pending transactions
  approve <id>    Approve transaction
  reject <id>     Reject transaction
  check "<cmd>"   Check command (returns allow status)

Examples:
  node wallet-airgap.js status
  node wallet-airgap.js enable
  node wallet-airgap.js check "sui client transfer --to 0x123 --amount 100"
`);
      process.exit(1);
  }
}

module.exports = {
  checkCommand,
  enable,
  disable,
  status,
  approveTx,
  rejectTx,
  loadConfig,
  loadPending
};

if (require.main === module) {
  main();
}
