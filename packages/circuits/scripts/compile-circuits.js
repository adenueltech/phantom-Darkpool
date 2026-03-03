/**
 * Circuit Compilation Script
 * 
 * Compiles all Circom circuits to R1CS, WASM, and symbol files.
 * Requires Circom compiler to be installed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CIRCUITS_DIR = path.join(__dirname, '../circuits');
const BUILD_DIR = path.join(__dirname, '../build');

// List of circuits to compile
const circuits = [
  'balance_proof',
  'order_validity_proof',
  'trade_conservation_proof',
  'matching_correctness_proof'
];

// Create build directory if it doesn't exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

console.log('🔧 Compiling Phantom Darkpool Circuits\n');

// Check if circom is installed
try {
  execSync('circom --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Error: Circom compiler not found!');
  console.error('Please install Circom from: https://docs.circom.io/getting-started/installation/');
  process.exit(1);
}

// Compile each circuit
let successCount = 0;
let failCount = 0;

for (const circuit of circuits) {
  const circuitPath = path.join(CIRCUITS_DIR, `${circuit}.circom`);
  
  if (!fs.existsSync(circuitPath)) {
    console.log(`⚠️  Skipping ${circuit}: file not found`);
    continue;
  }
  
  console.log(`📦 Compiling ${circuit}...`);
  
  try {
    const command = `circom ${circuitPath} --r1cs --wasm --sym -o ${BUILD_DIR}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${circuit} compiled successfully\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to compile ${circuit}\n`);
    failCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Compilation Summary');
console.log('='.repeat(50));
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📁 Output directory: ${BUILD_DIR}`);

if (successCount > 0) {
  console.log('\n📝 Next steps:');
  console.log('1. Run trusted setup: npm run setup');
  console.log('2. Generate proofs: npm run prove');
  console.log('3. Run tests: npm test');
}

process.exit(failCount > 0 ? 1 : 0);

