#!/usr/bin/env node
/**
 * Walrus Storage Module - 将检测结果存储到 Walrus 去中心化存储
 * 用于 injection-hunter 的区块链存证
 */

const crypto = require('crypto');

// Walrus aggregator endpoints (testnet)
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

/**
 * 存储 JSON 数据到 Walrus
 * @param {Object} data - 要存储的数据
 * @returns {Promise<{blobId: string, txHash: string}>}
 */
async function storeToWalrus(data) {
  const jsonStr = JSON.stringify(data);
  const encoder = new TextEncoder();
  const blob = encoder.encode(jsonStr);

  console.log(`📤 Storing ${blob.length} bytes to Walrus...`);

  try {
    // 使用 Walrus HTTP API 存储
    const response = await fetch(`${WALRUS_PUBLISHER}/v1/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: blob,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Walrus store failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Stored to Walrus!`);
    console.log(`   Blob ID: ${result.blobId}`);
    if (result.newlyCreated) {
      console.log(`   Newly created: yes`);
    }
    
    return {
      blobId: result.blobId,
      txHash: result.txHash || 'N/A',
      newlyCreated: result.newlyCreated || false
    };
  } catch (error) {
    console.error(`❌ Walrus storage failed: ${error.message}`);
    throw error;
  }
}

/**
 * 从 Walrus 读取数据
 * @param {string} blobId - Blob ID
 * @returns {Promise<Object>}
 */
async function readFromWalrus(blobId) {
  console.log(`📥 Reading from Walrus: ${blobId}...`);

  try {
    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Walrus read failed (${response.status})`);
    }

    const blob = await response.blob();
    const text = await blob.text();
    const data = JSON.parse(text);
    
    console.log(`✅ Read ${blob.size} bytes from Walrus`);
    return data;
  } catch (error) {
    console.error(`❌ Walrus read failed: ${error.message}`);
    throw error;
  }
}

/**
 * 生成检测报告的哈希
 * @param {Object} detectionResult - 检测结果
 * @returns {string}
 */
function generateReportHash(detectionResult) {
  const hashInput = JSON.stringify({
    verdict: detectionResult.verdict,
    riskScore: detectionResult.riskScore,
    timestamp: detectionResult.timestamp,
    findings: detectionResult.findings
  });
  return crypto.createHash('sha256').hash(hashInput);
}

/**
 * 存储检测报告到本地并准备 Walrus 格式
 * @param {Object} detectionResult - 检测结果
 * @param {string} outputPath - 输出文件路径
 */
function prepareWalrusReport(detectionResult, outputPath = '/tmp/injection-report.json') {
  const report = {
    // 基本信息
    version: detectionResult.version || '2.0',
    timestamp: detectionResult.timestamp,
    
    // 检测结果
    verdict: detectionResult.verdict,
    riskScore: detectionResult.riskScore,
    recommendation: detectionResult.recommendation,
    
    // 发现的问题
    findings: detectionResult.findings,
    
    // 输入信息
    inputLength: detectionResult.inputLength,
    
    // 哈希信息 (可用于验证)
    hash: detectionResult.hash,
    
    // Walrus 元数据
    walrus: {
      storedAt: new Date().toISOString(),
      type: 'injection-hunter-report-v2'
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📝 Report saved to: ${outputPath}`);
  
  return report;
}

// CLI 接口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node walrus-store.js <command> [options]

Commands:
  store <file>     Store a JSON file to Walrus
  read <blobId>   Read data from Walrus by blob ID
  prepare <json>  Prepare a detection result for Walrus storage

Examples:
  node walrus-store.js store /tmp/report.json
  node walrus-store.js read 0x1234567890abcdef...
  node walrus-store.js prepare '{"verdict":"DANGEROUS",...}'
`);
    process.exit(1);
  }

  const command = args[0];
  
  if (command === 'store') {
    if (!args[1]) {
      console.error('Error: Please provide a file path');
      process.exit(1);
    }
    const fs = require('fs');
    const filePath = args[1];
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    await storeToWalrus(data);
    
  } else if (command === 'read') {
    if (!args[1]) {
      console.error('Error: Please provide a blob ID');
      process.exit(1);
    }
    await readFromWalrus(args[1]);
    
  } else if (command === 'prepare') {
    if (!args[1]) {
      console.error('Error: Please provide JSON data');
      process.exit(1);
    }
    const detectionResult = JSON.parse(args[1]);
    prepareWalrusReport(detectionResult);
    
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

module.exports = {
  storeToWalrus,
  readFromWalrus,
  generateReportHash,
  prepareWalrusReport
};

if (require.main === module) {
  main();
}
