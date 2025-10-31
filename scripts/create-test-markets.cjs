const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🎯 Creating test markets for BeliefMarketFHE...\n');

  // Load latest deployment
  const deploymentPath = path.join(__dirname, `../deployments/${hre.network.name}-latest.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ No deployment found for', hre.network.name);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contractAddress;

  console.log('📍 Contract Address:', contractAddress);
  console.log('🌐 Network:', hre.network.name);
  console.log('');

  // Get contract instance
  const [signer] = await hre.ethers.getSigners();
  const BeliefMarket = await hre.ethers.getContractFactory('BeliefMarketFHE');
  const contract = BeliefMarket.attach(contractAddress);

  // Get platform stake
  const platformStake = await contract.platformStake();
  console.log('💎 Platform Stake Required:', hre.ethers.formatEther(platformStake), 'ETH\n');

  // Define test markets
  const testMarkets = [
    {
      betId: 'eth-5000-2025',
      voteStake: hre.ethers.parseEther('0.01'),
      duration: 30 * 24 * 60 * 60, // 30 days
      title: 'Will ETH reach $5,000 by end of 2025?',
    },
    {
      betId: 'btc-halving-2028',
      voteStake: hre.ethers.parseEther('0.005'),
      duration: 60 * 24 * 60 * 60, // 60 days
      title: 'Will Bitcoin halving occur before May 2028?',
    },
    {
      betId: 'solana-tvl-q2-2025',
      voteStake: hre.ethers.parseEther('0.008'),
      duration: 45 * 24 * 60 * 60, // 45 days
      title: 'Will Solana TVL exceed $10B in Q2 2025?',
    },
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 CREATING TEST MARKETS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const createdMarkets = [];

  for (let i = 0; i < testMarkets.length; i++) {
    const market = testMarkets[i];
    console.log(`${i + 1}. Creating: ${market.title}`);
    console.log(`   betId: ${market.betId}`);
    console.log(`   voteStake: ${hre.ethers.formatEther(market.voteStake)} ETH`);
    console.log(`   duration: ${market.duration / 86400} days`);

    try {
      const tx = await contract.createBet(market.betId, market.voteStake, market.duration, {
        value: platformStake,
      });

      console.log(`   📤 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Market created! Gas used: ${receipt.gasUsed.toString()}\n`);

      // Get market info
      const betInfo = await contract.getBet(market.betId);
      createdMarkets.push({
        betId: market.betId,
        title: market.title,
        creator: betInfo[0],
        voteStake: hre.ethers.formatEther(betInfo[2]),
        expiryTime: new Date(Number(betInfo[3]) * 1000).toISOString(),
        transactionHash: tx.hash,
      });
    } catch (error) {
      console.log(`   ❌ Failed to create market: ${error.message}\n`);
    }
  }

  // Save created markets info
  if (createdMarkets.length > 0) {
    const marketsPath = path.join(__dirname, '../deployments');
    const marketsFile = path.join(marketsPath, `${hre.network.name}-markets.json`);

    fs.writeFileSync(marketsFile, JSON.stringify(createdMarkets, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 Markets info saved to:', marketsFile);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ Created ${createdMarkets.length} out of ${testMarkets.length} markets`);
  console.log(`💰 Total platform stake spent: ${hre.ethers.formatEther(platformStake * BigInt(createdMarkets.length))} ETH\n`);

  if (createdMarkets.length > 0) {
    console.log('🎉 Test markets are ready for testing!\n');
    console.log('Next steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Connect your wallet');
    console.log('3. Navigate to the Markets section');
    console.log('4. Test voting with FHE encryption!\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
