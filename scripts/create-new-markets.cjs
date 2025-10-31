const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🎯 Creating new prediction markets for BeliefMarketFHE...\n');

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

  // Define new test markets - all 30 days duration
  const testMarkets = [
    {
      betId: 'btc-100k-2025',
      voteStake: hre.ethers.parseEther('0.01'),
      duration: 30 * 24 * 60 * 60, // 30 days
      title: 'Will Bitcoin reach $100,000 by end of 2025?',
    },
    {
      betId: 'eth-staking-20m-2025',
      voteStake: hre.ethers.parseEther('0.008'),
      duration: 30 * 24 * 60 * 60, // 30 days
      title: 'Will Ethereum staked ETH exceed 20M by Q4 2025?',
    },
    {
      betId: 'arbitrum-txs-1b-2025',
      voteStake: hre.ethers.parseEther('0.006'),
      duration: 30 * 24 * 60 * 60, // 30 days
      title: 'Will Arbitrum process 1B+ transactions in 2025?',
    },
    {
      betId: 'base-mau-10m-2025',
      voteStake: hre.ethers.parseEther('0.007'),
      duration: 30 * 24 * 60 * 60, // 30 days
      title: 'Will Base reach 10M monthly active users by end of 2025?',
    },
    {
      betId: 'uniswap-v4-launch-q2-2025',
      voteStake: hre.ethers.parseEther('0.005'),
      duration: 30 * 24 * 60 * 60, // 30 days
      title: 'Will Uniswap V4 launch before Q2 2025?',
    },
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 CREATING NEW TEST MARKETS');
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
    const marketsFile = path.join(marketsPath, `${hre.network.name}-new-markets.json`);

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
    console.log('🎉 New prediction markets are ready!\n');
    console.log('📍 Contract:', contractAddress);
    console.log('🌐 Network: Sepolia Testnet');
    console.log('⏱️  Duration: 30 days for all markets\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
