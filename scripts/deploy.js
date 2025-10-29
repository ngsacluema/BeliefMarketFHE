const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting BeliefMarketFHE deployment...\n');

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log('📍 Deploying from account:', deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', hre.ethers.formatEther(balance), 'ETH\n');

  if (balance < hre.ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance! Need at least 0.01 ETH for deployment.');
    process.exit(1);
  }

  // Deploy BeliefMarketFHE contract
  console.log('📦 Deploying BeliefMarketFHE contract...');
  const BeliefMarket = await hre.ethers.getContractFactory('BeliefMarketFHE');
  const beliefMarket = await BeliefMarket.deploy();

  await beliefMarket.waitForDeployment();
  const contractAddress = await beliefMarket.getAddress();

  console.log('✅ BeliefMarketFHE deployed to:', contractAddress);

  // Get platform stake
  const platformStake = await beliefMarket.platformStake();
  console.log('💎 Platform Stake:', hre.ethers.formatEther(platformStake), 'ETH');

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    platformStake: hre.ethers.formatEther(platformStake),
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const fileName = `${hre.network.name}-${Date.now()}.json`;
  const filePath = path.join(deploymentPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

  // Also save as latest
  const latestPath = path.join(deploymentPath, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  console.log('\n📄 Deployment info saved to:', filePath);
  console.log('📄 Latest deployment saved to:', latestPath);

  console.log('\n🎉 Deployment complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 NEXT STEPS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`1. Update src/config/contracts.ts:`);
  console.log(`   BELIEF_MARKET_ADDRESS = '${contractAddress}'`);
  console.log(`\n2. Verify deployment:`);
  console.log(`   npx hardhat run scripts/verify-deployment.js --network ${hre.network.name}`);
  console.log(`\n3. Create test markets:`);
  console.log(`   npx hardhat run scripts/create-test-markets.js --network ${hre.network.name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
