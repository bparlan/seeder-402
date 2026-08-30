"use strict";

const http = require('http');
const assert = require('assert');

async function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          assert.strictEqual(res.statusCode, 200);
          assert.strictEqual(result.ok, true);
          console.log('✓ /health endpoint works');
          resolve();
        } catch (e) {
          reject(new Error(`Failed to parse /health response: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function testWellKnownEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/.well-known/x402', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          assert.strictEqual(res.statusCode, 200);
          assert.strictEqual(result.version, '1.0');
          assert(Array.isArray(result.endpoints));
          console.log('✓ /.well-known/x402 endpoint works');
          resolve();
        } catch (e) {
          reject(new Error(`Failed to parse /.well-known/x402 response: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function testPaymentRequiredEndpoints() {
  const testCases = [
    { method: 'POST', path: '/v1/seed', body: { key: 'test_key_123', kind: 'hyperdrive' } },
    { method: 'POST', path: '/v1/pin', body: { key: 'test_key_123', until: Math.floor(Date.now() / 1000) + 86400 } },
    { method: 'POST', path: '/v1/house', body: { key: 'test_key_123' } },
    { method: 'GET', path: '/v1/status?key=test_key_123' }
  ];

  for (const testCase of testCases) {
    const postData = JSON.stringify(testCase.body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: testCase.path,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            assert.strictEqual(res.statusCode, 402);
            assert(result.sentence);
            assert(result.priceUsd);
            console.log(`✓ ${testCase.method} ${testCase.path} returns 402 with payment info`);
            resolve();
          } catch (e) {
            reject(new Error(`Failed to parse ${testCase.method} ${testCase.path} response: ${e.message}`));
          }
        });
      });
      req.on('error', reject);
      if (testCase.body) req.write(postData);
      req.end();
    });
  }
}

async function runTests() {
  console.log('Running M0 endpoint tests...');
  
  try {
    await testHealthEndpoint();
    await testWellKnownEndpoint();
    await testPaymentRequiredEndpoints();
    
    console.log('\n✅ All M0 tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();