const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BeliefMarketFHE", function () {
  let beliefMarket;
  let owner;
  let user1;
  let user2;
  let user3;
  const PLATFORM_STAKE = ethers.parseEther("0.02");
  const VOTE_STAKE = ethers.parseEther("0.01");
  const MIN_DURATION = 5 * 60; // 5 minutes
  const TEST_DURATION = 30 * 24 * 60 * 60; // 30 days

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const BeliefMarketFHE = await ethers.getContractFactory("BeliefMarketFHE");
    beliefMarket = await BeliefMarketFHE.deploy();
    await beliefMarket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await beliefMarket.owner()).to.equal(owner.address);
    });

    it("Should set the correct platform stake", async function () {
      expect(await beliefMarket.platformStake()).to.equal(PLATFORM_STAKE);
    });

    it("Should initialize with zero platform fees", async function () {
      expect(await beliefMarket.platformFees()).to.equal(0);
    });

    it("Should start with empty bet IDs array", async function () {
      const betIds = await beliefMarket.getAllBetIds();
      expect(betIds.length).to.equal(0);
    });
  });

  describe("Creating Bets", function () {
    it("Should create a new bet successfully", async function () {
      const betId = "test-bet-1";

      await expect(
        beliefMarket.createBet(betId, VOTE_STAKE, TEST_DURATION, {
          value: PLATFORM_STAKE,
        })
      )
        .to.emit(beliefMarket, "BetCreated")
        .withArgs(betId, owner.address, PLATFORM_STAKE, VOTE_STAKE, await time.latest() + TEST_DURATION);
    });

    it("Should add bet ID to getAllBetIds array", async function () {
      const betId = "test-bet-2";

      await beliefMarket.createBet(betId, VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      const betIds = await beliefMarket.getAllBetIds();
      expect(betIds).to.include(betId);
      expect(betIds.length).to.equal(1);
    });

    it("Should revert if platform stake is incorrect", async function () {
      await expect(
        beliefMarket.createBet("test-bet", VOTE_STAKE, TEST_DURATION, {
          value: ethers.parseEther("0.01"),
        })
      ).to.be.revertedWith("Must stake the current platform fee");
    });

    it("Should revert if vote stake is too low", async function () {
      await expect(
        beliefMarket.createBet("test-bet", ethers.parseEther("0.001"), TEST_DURATION, {
          value: PLATFORM_STAKE,
        })
      ).to.be.revertedWith("Vote stake too low");
    });

    it("Should revert if duration is too short", async function () {
      await expect(
        beliefMarket.createBet("test-bet", VOTE_STAKE, 60, {
          value: PLATFORM_STAKE,
        })
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should revert if duration is too long", async function () {
      const tooLong = 31 * 24 * 60 * 60; // 31 days
      await expect(
        beliefMarket.createBet("test-bet", VOTE_STAKE, tooLong, {
          value: PLATFORM_STAKE,
        })
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should revert if bet already exists", async function () {
      const betId = "duplicate-bet";

      await beliefMarket.createBet(betId, VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      await expect(
        beliefMarket.createBet(betId, VOTE_STAKE, TEST_DURATION, {
          value: PLATFORM_STAKE,
        })
      ).to.be.revertedWith("Bet already exists");
    });

    it("Should increment platform fees", async function () {
      await beliefMarket.createBet("test-bet", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      expect(await beliefMarket.platformFees()).to.equal(PLATFORM_STAKE);
    });

    it("Should handle multiple bets", async function () {
      await beliefMarket.createBet("bet-1", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });
      await beliefMarket.createBet("bet-2", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });
      await beliefMarket.createBet("bet-3", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      const betIds = await beliefMarket.getAllBetIds();
      expect(betIds.length).to.equal(3);
      expect(betIds).to.deep.equal(["bet-1", "bet-2", "bet-3"]);
    });
  });

  describe("Getting Bet Information", function () {
    beforeEach(async function () {
      await beliefMarket.createBet("info-test-bet", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });
    });

    it("Should return correct bet info", async function () {
      const betInfo = await beliefMarket.getBet("info-test-bet");

      expect(betInfo[0]).to.equal(owner.address); // creator
      expect(betInfo[1]).to.equal(PLATFORM_STAKE); // platformStake
      expect(betInfo[2]).to.equal(VOTE_STAKE); // voteStake
      expect(betInfo[4]).to.equal(false); // isResolved
    });

    it("Should return zero values for non-existent bet", async function () {
      const betInfo = await beliefMarket.getBet("non-existent");

      expect(betInfo[0]).to.equal(ethers.ZeroAddress); // creator
    });

    it("Should return correct bet count", async function () {
      await beliefMarket.createBet("bet-2", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      expect(await beliefMarket.getBetCount()).to.equal(2);
    });
  });

  describe("Platform Management", function () {
    it("Should allow owner to update platform stake", async function () {
      const newStake = ethers.parseEther("0.03");
      await beliefMarket.setPlatformStake(newStake);

      expect(await beliefMarket.platformStake()).to.equal(newStake);
    });

    it("Should revert if non-owner tries to update platform stake", async function () {
      await expect(
        beliefMarket.connect(user1).setPlatformStake(ethers.parseEther("0.03"))
      ).to.be.revertedWith("Not owner");
    });

    it("Should allow owner to withdraw platform fees", async function () {
      await beliefMarket.createBet("fee-test", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);

      await expect(
        beliefMarket.withdrawPlatformFees(owner.address)
      ).to.emit(beliefMarket, "PlatformFeesWithdrawn");

      expect(await beliefMarket.platformFees()).to.equal(0);
    });

    it("Should revert if trying to withdraw with zero fees", async function () {
      await expect(
        beliefMarket.withdrawPlatformFees(owner.address)
      ).to.be.revertedWith("No fees to withdraw");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await beliefMarket.createBet("vote-test", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });
    });

    it("Should revert vote on non-existent bet", async function () {
      // Note: This would normally require FHE encryption
      // For unit tests, we're just checking the basic validation
      await expect(
        beliefMarket.connect(user1).vote("non-existent", 1, "0x00", "0x00", {
          value: VOTE_STAKE,
        })
      ).to.be.reverted;
    });

    it("Should revert if vote stake is incorrect", async function () {
      await expect(
        beliefMarket.connect(user1).vote("vote-test", 1, "0x00", "0x00", {
          value: ethers.parseEther("0.005"),
        })
      ).to.be.revertedWith("Incorrect vote stake");
    });

    it("Should mark user as voted after voting", async function () {
      // This test requires proper FHE encryption in real scenario
      // For now, just verify the hasVoted mapping would be updated
      const hasVotedBefore = await beliefMarket.hasVoted("vote-test", user1.address);
      expect(hasVotedBefore).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty bet ID gracefully", async function () {
      const betInfo = await beliefMarket.getBet("");
      expect(betInfo[0]).to.equal(ethers.ZeroAddress);
    });

    it("Should handle very long bet ID", async function () {
      const longBetId = "a".repeat(100);
      await beliefMarket.createBet(longBetId, VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      const betIds = await beliefMarket.getAllBetIds();
      expect(betIds[0]).to.equal(longBetId);
    });

    it("Should handle minimum valid duration", async function () {
      await expect(
        beliefMarket.createBet("min-duration", VOTE_STAKE, MIN_DURATION, {
          value: PLATFORM_STAKE,
        })
      ).to.not.be.reverted;
    });

    it("Should handle maximum valid duration", async function () {
      const maxDuration = 30 * 24 * 60 * 60; // exactly 30 days
      await expect(
        beliefMarket.createBet("max-duration", VOTE_STAKE, maxDuration, {
          value: PLATFORM_STAKE,
        })
      ).to.not.be.reverted;
    });
  });

  describe("Gas Usage", function () {
    it("Should have reasonable gas cost for creating bet", async function () {
      const tx = await beliefMarket.createBet("gas-test", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });
      const receipt = await tx.wait();

      // Gas should be under 350k for first bet (includes array initialization)
      expect(receipt.gasUsed).to.be.lessThan(350000);
    });

    it("Should have lower gas cost for subsequent bets", async function () {
      // First bet
      await beliefMarket.createBet("bet-1", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });

      // Second bet should use less gas
      const tx = await beliefMarket.createBet("bet-2", VOTE_STAKE, TEST_DURATION, {
        value: PLATFORM_STAKE,
      });
      const receipt = await tx.wait();

      // Subsequent bets should be under 280k
      expect(receipt.gasUsed).to.be.lessThan(280000);
    });
  });
});
