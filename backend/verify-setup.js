#!/usr/bin/env node

/**
 * Backend Setup Verification Script
 * Run: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Event Management Backend - Setup Verification\n');
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

// Check 1: Node.js
console.log('\n✓ Node.js Version: ' + process.version);
passed++;

// Check 2: npm
try {
  const version = require('child_process').execSync('npm -v').toString().trim();
  console.log('✓ npm Version: ' + version);
  passed++;
} catch (e) {
  console.log('✗ npm not found');
  failed++;
}

// Check 3: package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✓ package.json found');
  passed++;
} else {
  console.log('✗ package.json not found');
  failed++;
}

// Check 4: node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✓ node_modules directory found');
  passed++;
  
  // Check 5: Key dependencies
  const keyDeps = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken'];
  keyDeps.forEach(dep => {
    if (fs.existsSync(path.join(nodeModulesPath, dep))) {
      console.log(`  ✓ ${dep} installed`);
      passed++;
    } else {
      console.log(`  ✗ ${dep} NOT installed`);
      failed++;
    }
  });
} else {
  console.log('✗ node_modules not found - run: npm install');
  failed++;
}

// Check 6: .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file found');
  passed++;
  
  // Check .env content
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('MONGODB_URI')) {
    console.log('  ✓ MONGODB_URI configured');
    passed++;
  } else {
    console.log('  ⚠ MONGODB_URI not found in .env');
  }
  
  if (envContent.includes('JWT_SECRET')) {
    console.log('  ✓ JWT_SECRET configured');
    passed++;
  } else {
    console.log('  ⚠ JWT_SECRET not found in .env');
  }

  if (envContent.includes('SESSION_SECRET')) {
    console.log('  ✓ SESSION_SECRET configured');
    passed++;
  } else {
    console.log('  ⚠ SESSION_SECRET not found in .env - add a strong random value');
  }

  // Check .env secrets are not still the placeholder defaults
  const readEnvValue = (key) => {
    const match = envContent.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
  };

  const isPlaceholder = (value) =>
    !value ||
    value.toLowerCase().includes('change_this') ||
    value.toLowerCase().startsWith('your_');

  ['JWT_SECRET', 'SESSION_SECRET'].forEach(key => {
    const value = readEnvValue(key);
    if (isPlaceholder(value)) {
      console.log(
        `  ✗ ${key} is still a placeholder` +
        `${value ? ` ("${value}")` : ' (missing or empty)'}` +
        ' - replace it with a long random string'
      );
      failed++;
    } else {
      console.log(`  ✓ ${key} is a custom value`);
      passed++;
    }
  });
} else {
  console.log('✗ .env file not found - create from .env.example');
  failed++;
}

// Check 7: Required files
const files = [
  'server.js',
  'models/User.js',
  'routes/auth.js',
  'routes/users.js',
  'middleware/auth.js'
];

files.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✓ ${file} found`);
    passed++;
  } else {
    console.log(`✗ ${file} NOT found`);
    failed++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Verification Summary:');
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n✅ All checks passed! Ready to run:');
  console.log('   npm run dev     (development with auto-reload)');
  console.log('   npm start       (production mode)\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review and fix issues.\n');
  process.exit(1);
}
