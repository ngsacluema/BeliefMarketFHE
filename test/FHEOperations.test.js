const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("BeliefMarketFHE - FHE-Specific Operations", function () {
  let contract;
  let owner, creator, voter1, voter2, voter3, voter4, voter5;
  const PLATFORM_STAKE = ethers.parseEther("0.02");
  const VOTE_STAKE = ethers.parseEther("0.005");
  const BET_DURATION = 300;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, creator, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`✅ BeliefMarketFHE deployed at: ${await contract.getAddress()}`);
  });

  describe("FHE.fromExternal() - Input Decryption", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-input-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });
    });

    it("should accept valid encrypted input with proof", async function () {
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
          { value: VOTE_STAKE }
        )
      ).to.not.be.reverted;

      console.log("✅ FHE.fromExternal() accepts valid encrypted input");
    });

    it("should reject invalid input proof", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      const invalidProof = "0x" + "00".repeat(64);

      await expect(
        contract.connect(voter1).vote(
          betId,
          1,
          encrypted.handles[0],
          invalidProof,
          { value: VOTE_STAKE }
        )
      ).to.be.reverted;

      console.log("✅ FHE.fromExternal() rejects invalid proof");
    });

    it("should reject proof from different address", async function () {
      // Create encrypted input for voter1
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      // Try to use it from voter2
      await expect(
        contract.connect(voter2).vote(
          betId,
          1,
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        )
      ).to.be.reverted;

      console.log("✅ FHE.fromExternal() rejects mismatched sender proof");
    });
  });

  describe("FHE.add() - Encrypted Accumulation", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-add-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });
    });

    it("should accumulate YES votes correctly", async function () {
      const voters = [voter1, voter2, voter3];

      for (const voter of voters) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add64(1n)
          .encrypt();

        await contract.connect(voter).vote(
          betId,
          1, // YES
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        );
      }

      // Resolve to verify accumulation
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.yesVotes).to.equal(3);

      console.log("✅ FHE.add() accumulates YES votes correctly");
    });

    it("should accumulate NO votes correctly", async function () {
      const voters = [voter1, voter2];

      for (const voter of voters) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add64(1n)
          .encrypt();

        await contract.connect(voter).vote(
          betId,
          0, // NO
          encrypted.handles[0],
          encrypted.inputProof,
          { value: VOTE_STAKE }
        );
      }

      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.noVotes).to.equal(2);

      console.log("✅ FHE.add() accumulates NO votes correctly");
    });

    it("should handle mixed votes with correct accumulation", async function () {
      const votePatterns = [
        { voter: voter1, type: 1 }, // YES
        { voter: voter2, type: 0 }, // NO
        { voter: voter3, type: 1 }, // YES
        { voter: voter4, type: 0 }, // NO
        { voter: voter5, type: 1 }, // YES
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

      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.yesVotes).to.equal(3);
      expect(betInfo.noVotes).to.equal(2);
      expect(betInfo.yesWon).to.equal(true);

      console.log("✅ FHE.add() handles mixed votes correctly");
    });
  });

  describe("FHE.makePubliclyDecryptable() - Decryption Preparation", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-decrypt-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

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
    });

    it("should mark ciphertexts as publicly decryptable", async function () {
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(creator).requestTallyReveal(betId);

      const isRequested = await contract.isDecryptionRequested(betId);
      expect(isRequested).to.equal(true);

      console.log("✅ FHE.makePubliclyDecryptable() marks ciphertexts correctly");
    });

    it("should return correct ciphertext handles", async function () {
      const handles = await contract.getCiphertextHandles(betId);

      // Handles should be non-zero
      expect(handles.yesHandle).to.not.equal(ethers.ZeroHash);
      expect(handles.noHandle).to.not.equal(ethers.ZeroHash);

      console.log("✅ getCiphertextHandles() returns valid handles");
    });

    it("should track isReadyForDecryption status", async function () {
      let isReady = await contract.isReadyForDecryption(betId);
      expect(isReady).to.equal(false);

      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(creator).requestTallyReveal(betId);

      isReady = await contract.isReadyForDecryption(betId);
      expect(isReady).to.equal(true);

      console.log("✅ isReadyForDecryption() tracks status correctly");
    });
  });

  describe("FHE.checkSignatures() - Decryption Verification", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-verify-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

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

      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
    });

    it("should verify decryption with valid signatures", async function () {
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.isResolved).to.equal(true);

      console.log("✅ FHE.checkSignatures() verifies valid decryption");
    });

    it("should reject double decryption request", async function () {
      await contract.connect(creator).requestTallyReveal(betId);

      await expect(
        contract.connect(creator).requestTallyReveal(betId)
      ).to.be.reverted;

      console.log("✅ Double decryption request correctly rejected");
    });
  });

  describe("FHE.allowThis() - Permission Management", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-allow-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });
    });

    it("should allow contract to operate on tally ciphertexts", async function () {
      // Multiple votes should work (requires FHE.allowThis on tallies)
      const voters = [voter1, voter2, voter3];

      for (const voter of voters) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add64(1n)
          .encrypt();

        await expect(
          contract.connect(voter).vote(
            betId,
            1,
            encrypted.handles[0],
            encrypted.inputProof,
            { value: VOTE_STAKE }
          )
        ).to.not.be.reverted;
      }

      console.log("✅ FHE.allowThis() enables contract operations on tallies");
    });
  });

  describe("FHE.toBytes32() - Handle Conversion", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-bytes32-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });

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
    });

    it("should convert euint64 to bytes32 for decryption", async function () {
      const handles = await contract.getCiphertextHandles(betId);

      // Both handles should be valid bytes32
      expect(handles.yesHandle.length).to.equal(66); // 0x + 64 hex chars
      expect(handles.noHandle.length).to.equal(66);

      console.log("✅ FHE.toBytes32() converts handles correctly");
    });
  });

  describe("Edge Cases - Zero Votes and Large Numbers", function () {
    let betId;

    beforeEach(async function () {
      betId = `fhe-edge-${Date.now()}`;
      await contract.connect(creator).createBet(betId, VOTE_STAKE, BET_DURATION, { value: PLATFORM_STAKE });
    });

    it("should handle bet with no votes", async function () {
      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.isResolved).to.equal(true);
      expect(betInfo.yesVotes).to.equal(0);
      expect(betInfo.noVotes).to.equal(0);

      console.log("✅ Handles bet with no votes correctly");
    });

    it("should handle only YES votes", async function () {
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

      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.yesVotes).to.equal(1);
      expect(betInfo.noVotes).to.equal(0);
      expect(betInfo.yesWon).to.equal(true);

      console.log("✅ Handles only YES votes correctly");
    });

    it("should handle only NO votes", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add64(1n)
        .encrypt();

      await contract.connect(voter1).vote(
        betId,
        0,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: VOTE_STAKE }
      );

      await ethers.provider.send("evm_increaseTime", [BET_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await contract.connect(creator).requestTallyReveal(betId);
      await fhevm.awaitDecryptionOracle();

      const betInfo = await contract.getBet(betId);
      expect(betInfo.yesVotes).to.equal(0);
      expect(betInfo.noVotes).to.equal(1);
      expect(betInfo.yesWon).to.equal(false);

      console.log("✅ Handles only NO votes correctly");
    });
  });
});
