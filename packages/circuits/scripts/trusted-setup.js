/**
 * Trusted Setup Script
 * 
 * Runs Powers of Tau ceremony and generates proving/verification keys for all circuits.
 * 
 * This script automates the trusted setup process for Groth16 proofs:
 * 1. Phase 1: Powers of Tau ceremony (universal setup)
 * 2. Phase 2: Circuit-specific setup for each circuit
 * 3. Export verification keys and verifier contracts
 * 
 * Requirements: 7.7, 17.2
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');
const KEYS_DIR = path.join(__dirname, '../keys');
const PTAU_FILE = path.join(KEYS_DIR, 'pot14_final.ptau');

// Circuit configurations
const circuits = [
  { name: 'balance_proof', description: 'Balance Proof Circuit' },
  { name: 'order_validity_proof', description: 'Order Validity Proof Circuit' },
  { name: 'trade_conservation_proof', description: 'Trade Conservation Proof Circuit' },
  { name: 'matching_correctness_proof', description: 'Matching Correctness Proof Circuit' }
];

// Create keys directory
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

console.log('🔐 Phantom Darkpool Trusted Setup\n');
console.log('This script will generate proving and verification keys for all circuits.');
console.log('The process may take several minutes.\n');

// Check if snarkjs is installed
try {
  execSync('snarkjs --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Error: SnarkJS not found!');
  console.error('Please install: npm install -g snarkjs');
  process.exit(1);
}

// Phase 1: Powers of Tau Ceremony
console.log('=' .repeat(60));
console.log('Phase 1: Powers of Tau Ceremony');
console.log('='.repeat(60) + '\n');

if (!fs.existsSync(PTAU_FILE)) {
  console.log('📝 Starting new Powers of Tau ceremony...\n');
  
  try {
    // Initialize ceremony (2^14 = 16,384 constraints)
    console.log('Step 1/3: Initializing ceremony...');
    execSync(`snarkjs powersoftau new bn128 14 ${path.join(KEYS_DIR, 'pot14_0000.ptau')} -v`, {
      stdio: 'inherit'
    });
    
    // Contribute randomness
    console.log('\nStep 2/3: Contributing randomness...');
    execSync(`snarkjs powersoftau contribute ${path.join(KEYS_DIR, 'pot14_0000.ptau')} ${path.join(KEYS_DIR, 'pot14_0001.ptau')} --name="First contribution" -e="$(date +%s)" -v`, {
      stdio: 'inherit'
    });
    
    // Prepare for phase 2
    console.log('\nStep 3/3: Preparing for phase 2...');
    execSync(`snarkjs powersoftau prepare phase2 ${path.join(KEYS_DIR, 'pot14_0001.ptau')} ${PTAU_FILE} -v`, {
      stdio: 'inherit'
    });
    
    // Cleanup intermediate files
    fs.unlinkSync(path.join(KEYS_DIR, 'pot14_0000.ptau'));
    fs.unlinkSync(path.join(KEYS_DIR, 'pot14_0001.ptau'));
    
    console.log('\n✅ Powers of Tau ceremony completed!\n');
  } catch (error) {
    console.error('\n❌ Powers of Tau ceremony failed!');
    console.error(error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Powers of Tau file already exists, skipping phase 1.\n');
}

// Phase 2: Circuit-Specific Setup
console.log('=' .repeat(60));
console.log('Phase 2: Circuit-Specific Setup');
console.log('='.repeat(60) + '\n');

let successCount = 0;
let failCount = 0;

for (const circuit of circuits) {
  console.log(`\n🔧 Setting up ${circuit.description}...`);
  console.log('-'.repeat(60));
  
  const r1csFile = path.join(BUILD_DIR, `${circuit.name}.r1cs`);
  const zkeyFile0 = path.join(KEYS_DIR, `${circuit.name}_0000.zkey`);
  const zkeyFileFinal = path.join(KEYS_DIR, `${circuit.name}_final.zkey`);
  const vkeyFile = path.join(KEYS_DIR, `${circuit.name}_verification_key.json`);
  const verifierFile = path.join(KEYS_DIR, `${circuit.name}_verifier.sol`);
  
  // Check if R1CS file exists
  if (!fs.existsSync(r1csFile)) {
    console.log(`⚠️  Skipping ${circuit.name}: R1CS file not found`);
    console.log(`   Run 'npm run compile' first`);
    failCount++;
    continue;
  }
  
  try {
    // Step 1: Groth16 setup
    console.log('Step 1/4: Running Groth16 setup...');
    execSync(`snarkjs groth16 setup ${r1csFile} ${PTAU_FILE} ${zkeyFile0}`, {
      stdio: 'inherit'
    });
    
    // Step 2: Contribute to circuit-specific setup
    console.log('\nStep 2/4: Contributing to circuit setup...');
    execSync(`snarkjs zkey contribute ${zkeyFile0} ${zkeyFileFinal} --name="Circuit contribution" -e="$(date +%s)" -v`, {
      stdio: 'inherit'
    });
    
    // Step 3: Export verification key
    console.log('\nStep 3/4: Exporting verification key...');
    execSync(`snarkjs zkey export verificationkey ${zkeyFileFinal} ${vkeyFile}`, {
      stdio: 'inherit'
    });
    
    // Step 4: Export Solidity verifier (can be adapted for Cairo)
    console.log('\nStep 4/4: Exporting verifier contract...');
    execSync(`snarkjs zkey export solidityverifier ${zkeyFileFinal} ${verifierFile}`, {
      stdio: 'inherit'
    });
    
    // Cleanup intermediate file
    fs.unlinkSync(zkeyFile0);
    
    console.log(`\n✅ ${circuit.description} setup completed!`);
    successCount++;
    
  } catch (error) {
    console.error(`\n❌ Failed to setup ${circuit.name}`);
    console.error(error.message);
    failCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Trusted Setup Summary');
console.log('='.repeat(60));
console.log(`✅ Successful: ${successCount}/${circuits.length}`);
console.log(`❌ Failed: ${failCount}/${circuits.length}`);
console.log(`📁 Keys directory: ${KEYS_DIR}`);

if (successCount > 0) {
  console.log('\n📝 Generated files:');
  console.log('  - *_final.zkey: Proving keys');
  console.log('  - *_verification_key.json: Verification keys');
  console.log('  - *_verifier.sol: Solidity verifier contracts');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Deploy verifier contracts to Starknet (adapt from Solidity)');
  console.log('2. Integrate proving keys with SDK');
  console.log('3. Test proof generation and verification');
}

process.exit(failCount > 0 ? 1 : 0);
