const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("BeliefMarketFHE - Comprehensive FHE Operations", function () {
  let contract;
  let owner, creator, voter1, voter2, voter3, voter4;
  const PLATFORM_STAKE = ethers.parseEther("0.02");
  const VOTE_STAKE = ethers.parseEther("0.005");
  const BET_DURATION = 300; // 5 minutes

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, creator, voter1, voter2, voter3, voter4] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`✅ BeliefMarketFHE deployed at: ${await contract.getAddress()}`);
  });

  describe("Bet Creation", function () {
    it("should create a bet with correct parameters", async function () {
      const betId = "test-bet-1";

      const tx = await contract.connect(creator).createBet(
        betId,
        VOTE_STAKE,
        BET_DURATION,
        { value: PLATFORM_STAKE }
      );
      await tx.wait();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.creator).to.equal(creator.address);
      expect(betInfo.voteStake).to.equal(VOTE_STAKE);
      expect(betInfo.isResolved).to.equal(false);
      expect(betInfo.prizePool).to.equal(0);

      console.log("✅ Bet created successfully");
    });

    it("should emit BetCreated event", async function () {
      const betId = "test-bet-2";

      await expect(
        contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE })
      ).to.emit(contract, "BetCreated");

      console.log("✅ BetCreated event emitted");
    });

    it("should reject bet creation with insufficient stake", async function () {
      const betId = "test-bet-3";

      await expect(
        contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Must stake the current platform fee");

      console.log("✅ Insufficient stake correctly rejected");
    });

    it("should reject duplicate bet IDs", async function () {
      const betId = "test-bet-4";

      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

      await expect(
        contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE })
      ).to.be.revertedWith("Bet already exists");

      console.log("✅ Duplicate bet ID correctly rejected");
    });
  });

  describe("FHE Voting Operations", function () {
    let betId;

    beforeEach(async function () {
      betId = `bet-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });
    });

    it("should cast encrypted YES vote using FHE.fromExternal", async function () {
      console.log("Testing encrypted YES vote...");

      // Create encrypted input for vote weight (1)
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n) // Vote weight
        .encrypt();

      // Cast YES vote (voteType = 1)
      const tx = await contract.connect(voter1).vote(
        betId,
        1, // YES
        encrypted.handles[0],
        encrypted.inputProof,
        { value: VOTE_STAKE }
      );
      await tx.wait();

      const hasVoted = await contract.hasVoted(betId, voter1.address);
      expect(hasVoted).to.equal(true);

      console.log("✅ FHE.fromExternal() - Encrypted vote accepted");
    });

    it("should cast encrypted NO vote using FHE.fromExternal", async function () {
      console.log("Testing encrypted NO vote...");

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      // Cast NO vote (voteType = 0)
      await contract.connect(voter1).vote(
        betId,
        0, // NO
        encrypted.handles[0],
        encrypted.inputProof,
        { value: VOTE_STAKE }
      );

      const hasVoted = await contract.hasVoted(betId, voter1.address);
      expect(hasVoted).to.equal(true);

      console.log("✅ Encrypted NO vote cast successfully");
    });

    it("should reject double voting", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      await contract.connect(voter1).vote(
        betId,
        1,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: VOTE_STAKE }
      );

      // Try to vote again
      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      await expect(
        contract.connect(voter1).vote(
          betId,
          0,
          encrypted2.handles[0],
          encrypted2.inputProof,
          { value: VOTE_STAKE }
        )
      ).to.be.revertedWith("Already voted");

      console.log("✅ Double voting correctly prevented");
    });

    it("should reject voting with incorrect stake", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      await expect(
        contract.connect(voter1).vote(
          betId,
          1,
          encrypted.handles[0],
          encrypted.inputProof,
          { value: ethers.parseEther("0.001") } // Wrong stake
        )
      ).to.be.revertedWith("Incorrect vote stake");

      console.log("✅ Incorrect stake correctly rejected");
    });

    it("should reject invalid vote type", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      await expect(
        contract.connect(voter1).vote(
          betId,
          2, // Invalid vote type
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        )
      ).to.be.reverted;

      console.log("✅ Invalid vote type correctly rejected");
    });

    it("should accumulate prize pool from votes", async function () {
      const voters = [voter1, voter2, voter3];

      for (const voter of voters) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add64(1n)
          .encrypt();

        await contract.connect(voter).vote(
          betId,
          1,
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        );
      }

      const betInfo = await contract.getBet(betId);
      expect(betInfo.prizePool).to.equal(VOTE_STAKE * 3n);

      console.log("✅ Prize pool accumulated correctly");
    });
  });

  describe("FHE Tally and Decryption", function () {
    let betId;

    beforeEach(async function () {
      betId = `bet-tally-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

      // Cast votes: 2 YES, 1 NO
      const votePatterns = [
        { voter: voter1, type: 1 }, // YES
        { voter: voter2, type: 1 }, // YES
        { voter: voter3, type: 0 }, // NO
      ];

      for (const { voter, type } of votePatterns) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add64(1n)
          .encrypt();

        await contract.connect(voter).vote(
          betId,
          type,
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        );
      }
    });

    it("should request tally reveal using FHE.makePubliclyDecryptable", async function () {
      // Advance time past expiry
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      const tx = await contract.connect(creator).requestTallyReveal(betId);
      await tx.wait();

      const isRequested = await contract.isDecryptionRequested(betId);
      expect(isRequested).to.equal(true);

      console.log("✅ FHE.makePubliclyDecryptable() - Decryption requested");
    });

    it("should emit DecryptionRequested event", async function () {
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        contract.connect(creator).requestTallyReveal(betId)
      ).to.emit(contract, "DecryptionRequested");

      console.log("✅ DecryptionRequested event emitted");
    });

    it("should reject reveal request before expiry", async function () {
      await expect(
        contract.connect(creator).requestTallyReveal(betId)
      ).to.be.revertedWith("Bet not expired");

      console.log("✅ Early reveal request correctly rejected");
    });

    it("should only allow creator to request reveal", async function () {
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        contract.connect(voter1).requestTallyReveal(betId)
      ).to.be.revertedWith("Only creator can request reveal");

      console.log("✅ Non-creator reveal request correctly rejected");
    });

    it("should resolve bet with FHE.checkSignatures verification", async function () {
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      // Request reveal
      await contract.connect(creator).requestTallyReveal(betId);

      // Wait for decryption oracle
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.isResolved).to.equal(true);
      expect(betInfo.yesVotes).to.equal(2); // 2 YES votes
      expect(betInfo.noVotes).to.equal(1);  // 1 NO vote
      expect(betInfo.yesWon).to.equal(true);

      console.log("✅ FHE.checkSignatures() - Decryption verified");
      console.log("✅ Bet resolved with correct tallies");
    });
  });

  describe("Prize Distribution", function () {
    let betId;

    beforeEach(async function () {
      betId = `bet-prize-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

      // Cast votes: 2 YES (winners), 1 NO
      const votePatterns = [
        { voter: voter1, type: 1 }, // YES - winner
        { voter: voter2, type: 1 }, // YES - winner
        { voter: voter3, type: 0 }, // NO - loser
      ];

      for (const { voter, type } of votePatterns) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add64(1n)
          .encrypt();

        await contract.connect(voter).vote(
          betId,
          type,
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        );
      }

      // Resolve bet
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();
    });

    it("should allow winners to claim prize", async function () {
      const balanceBefore = await ethers.provider.getBalance(voter1.address);

      const tx = await contract.connect(voter1).claimPrize(betId);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(voter1.address);

      // Winner should receive prize (total pool / num winners)
      expect(balanceAfter).to.be.gt(balanceBefore - gasCost);

      console.log("✅ Winner claimed prize successfully");
    });

    it("should emit PrizeDistributed event", async function () {
      await expect(
        contract.connect(voter1).claimPrize(betId)
      ).to.emit(contract, "PrizeDistributed");

      console.log("✅ PrizeDistributed event emitted");
    });

    it("should reject loser claiming prize", async function () {
      await expect(
        contract.connect(voter3).claimPrize(betId)
      ).to.be.revertedWith("Not a winner");

      console.log("✅ Loser prize claim correctly rejected");
    });

    it("should reject double claim", async function () {
      await contract.connect(voter1).claimPrize(betId);

      await expect(
        contract.connect(voter1).claimPrize(betId)
      ).to.be.revertedWith("Already claimed");

      console.log("✅ Double claim correctly rejected");
    });

    it("should reject claim by non-voter", async function () {
      await expect(
        contract.connect(voter4).claimPrize(betId)
      ).to.be.revertedWith("Did not vote");

      console.log("✅ Non-voter claim correctly rejected");
    });
  });

  describe("Tie Scenario and Refunds", function () {
    let betId;

    beforeEach(async function () {
      betId = `bet-tie-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

      // Cast tie votes: 1 YES, 1 NO
      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();
      await contract.connect(voter1).vote(betId, 1, encrypted1.handles[0], encrypted1.inputProof, { value: VOTE_STAKE });

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter2.address)
        .add64(1n)
        .encrypt();
      await contract.connect(voter2).vote(betId, 0, encrypted2.handles[0], encrypted2.inputProof, { value: VOTE_STAKE });

      // Resolve
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();
    });

    it("should allow refund claim in tie scenario", async function () {
      const balanceBefore = await ethers.provider.getBalance(voter1.address);

      const tx = await contract.connect(voter1).claimRefund(betId);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(voter1.address);

      // Should receive refund (vote stake)
      expect(balanceAfter + gasCost - balanceBefore).to.be.closeTo(VOTE_STAKE, ethers.parseEther("0.0001"));

      console.log("✅ Refund claimed successfully in tie scenario");
    });

    it("should reject prize claim in tie scenario", async function () {
      await expect(
        contract.connect(voter1).claimPrize(betId)
      ).to.be.revertedWith("Tie, use claimRefund");

      console.log("✅ Prize claim correctly rejected in tie scenario");
    });
  });

  describe("View Functions", function () {
    let betId;

    beforeEach(async function () {
      betId = `bet-view-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });
    });

    it("should return correct reveal status", async function () {
      const statusBefore = await contract.getRevealStatus(betId);
      expect(statusBefore.isResolved).to.equal(false);
      expect(statusBefore.decryptionRequested).to.equal(false);

      console.log("✅ getRevealStatus() returns correct values");
    });

    it("should track bet count correctly", async function () {
      const count = await contract.getBetCount();
      expect(count).to.be.gte(1);

      console.log("✅ getBetCount() returns correct value");
    });

    it("should return all bet IDs", async function () {
      const betIds = await contract.getAllBetIds();
      expect(betIds).to.include(betId);

      console.log("✅ getAllBetIds() returns correct values");
    });

    it("should check hasUserClaimed correctly", async function () {
      const hasClaimed = await contract.hasUserClaimed(betId, voter1.address);
      expect(hasClaimed).to.equal(false);

      console.log("✅ hasUserClaimed() returns correct value");
    });
  });

  describe("Owner Functions", function () {
    it("should allow owner to set platform stake", async function () {
      const newStake = ethers.parseEther("0.05");
      await contract.connect(owner).setPlatformStake(newStake);

      const stake = await contract.platformStake();
      expect(stake).to.equal(newStake);

      console.log("✅ Owner can set platform stake");
    });

    it("should allow owner to enable testing mode", async function () {
      await contract.connect(owner).setTesting(true);

      // Testing functions should work now
      const betId = "test-mode-bet";
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

      await contract.connect(owner).testingMarkVoted(betId, voter1.address, 1);
      const hasVoted = await contract.hasVoted(betId, voter1.address);
      expect(hasVoted).to.equal(true);

      console.log("✅ Owner can enable testing mode");
    });

    it("should allow owner to withdraw platform fees", async function () {
      // Create a bet to generate fees
      await contract.connect(creator).createBet("fee-bet", VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await contract.connect(owner).withdrawPlatformFees(owner.address);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter + gasCost).to.be.gt(balanceBefore);

      console.log("✅ Owner can withdraw platform fees");
    });
  });
});
