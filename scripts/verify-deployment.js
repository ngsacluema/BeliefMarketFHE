const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 Verifying BeliefMarketFHE deployment...\n');

  // Load latest deployment
  const deploymentPath = path.join(__dirname, `../deployments/${hre.network.name}-latest.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ No deployment found for', hre.network.name);
    console.log('   Run deployment first: npx hardhat run scripts/deploy.js --network', hre.network.name);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contractAddress;

  console.log('📍 Contract Address:', contractAddress);
  console.log('🌐 Network:', hre.network.name);
  console.log('⛓️  Chain ID:', deployment.chainId);
  console.log('📅 Deployed:', deployment.timestamp);
  console.log('');

  // Get contract instance
  const BeliefMarket = await hre.ethers.getContractFactory('BeliefMarketFHE');
  const contract = BeliefMarket.attach(contractAddress);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CONTRACT VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Check basic contract info
    console.log('✓ Contract bytecode exists');
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('No bytecode at address');
    }

    // 2. Check owner
    const owner = await contract.owner();
    console.log('✓ Owner:', owner);

    // 3. Check platform stake
    const platformStake = await contract.platformStake();
    console.log('✓ Platform Stake:', hre.ethers.formatEther(platformStake), 'ETH');

    // 4. Test view functions
    const testBetId = 'test-bet-verification';
    const betInfo = await contract.getBet(testBetId);
    console.log('✓ getBet() function works');

    const revealStatus = await contract.getRevealStatus(testBetId);
    console.log('✓ getRevealStatus() function works');

    // 5. Check constants
    const MIN_VOTE_STAKE = await contract.MIN_VOTE_STAKE();
    const MIN_DURATION = await contract.MIN_DURATION();
    const MAX_DURATION = await contract.MAX_DURATION();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  CONTRACT CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Min Vote Stake:', hre.ethers.formatEther(MIN_VOTE_STAKE), 'ETH');
    console.log('Min Duration:', Number(MIN_DURATION), 'seconds (~', Number(MIN_DURATION) / 60, 'minutes)');
    console.log('Max Duration:', Number(MAX_DURATION), 'seconds (~', Number(MAX_DURATION) / 86400, 'days)');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 BLOCKCHAIN EXPLORER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (hre.network.name === 'sepolia') {
      console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    }

    console.log('\n✅ All verification checks passed!\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
