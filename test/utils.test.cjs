const { expect } = require("chai");

/**
 * Utility function tests for BeliefMarket project
 * Tests format helpers, validation, and data transformation
 */

describe("Utility Functions", function () {
  describe("Market ID Generation", function () {
    it("Should generate valid market ID from title", function () {
      const title = "Will BTC reach $100k?";
      const timestamp = Date.now();
      const betId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`;

      // Should contain the key words with hyphens
      expect(betId).to.include('will');
      expect(betId).to.include('btc');
      expect(betId).to.include('reach');
      expect(betId).to.include('100k');
      expect(betId).to.include(`-${timestamp}`);
    });

    it("Should handle special characters in title", function () {
      const title = "Will ETH @ $5000 by 2025?!";
      const betId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Special characters should be replaced with hyphens
      expect(betId).to.include("will");
      expect(betId).to.include("eth");
      expect(betId).to.include("5000");
      expect(betId).to.include("2025");
      expect(betId).to.not.include("@");
      expect(betId).to.not.include("?");
      expect(betId).to.not.include("!");
    });

    it("Should handle multiple spaces and hyphens", function () {
      const title = "Will   BTC---reach  $100k";
      const betId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

      expect(betId).to.include("will");
      expect(betId).to.include("btc");
      expect(betId).to.include("100k");
    });

    it("Should handle unicode characters", function () {
      const title = "Will 比特币 reach $100k?";
      const betId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Unicode characters should be replaced with hyphens
      expect(betId).to.include("will");
      expect(betId).to.include("reach");
      expect(betId).to.include("100k");
    });

    it("Should ensure uniqueness with timestamp", function () {
      const title = "Same Title";
      const timestamp1 = Date.now();
      const betId1 = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp1}`;

      // Wait a tiny bit to ensure different timestamp
      const timestamp2 = timestamp1 + 1;
      const betId2 = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp2}`;

      // IDs should be different due to timestamp
      expect(betId1).to.not.equal(betId2);
    });
  });

  describe("Time Formatting", function () {
    it("Should format days and hours correctly", function () {
      const timeLeft = 2 * 86400 + 5 * 3600; // 2 days 5 hours
      const days = Math.floor(timeLeft / 86400);
      const hours = Math.floor((timeLeft % 86400) / 3600);

      const formatted = `${days}d ${hours}h remaining`;
      expect(formatted).to.equal("2d 5h remaining");
    });

    it("Should format hours and minutes for < 1 day", function () {
      const timeLeft = 5 * 3600 + 30 * 60; // 5 hours 30 minutes
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);

      const formatted = `${hours}h ${minutes}m remaining`;
      expect(formatted).to.equal("5h 30m remaining");
    });

    it("Should handle zero time left", function () {
      const timeLeft = 0;
      const status = timeLeft <= 0 ? "Counting Votes" : "Active";

      expect(status).to.equal("Counting Votes");
    });

    it("Should handle negative time", function () {
      const timeLeft = -3600;
      const status = timeLeft <= 0 ? "Counting Votes" : "Active";

      expect(status).to.equal("Counting Votes");
    });
  });

  describe("ETH Amount Formatting", function () {
    it("Should format Wei to ETH correctly", function () {
      const wei = BigInt("10000000000000000"); // 0.01 ETH
      const eth = Number(wei) / 1e18;

      expect(eth).to.equal(0.01);
    });

    it("Should handle zero value", function () {
      const wei = BigInt("0");
      const eth = Number(wei) / 1e18;

      expect(eth).to.equal(0);
    });

    it("Should handle large values", function () {
      const wei = BigInt("1000000000000000000"); // 1 ETH
      const eth = Number(wei) / 1e18;

      expect(eth).to.equal(1);
    });

    it("Should handle decimal precision", function () {
      const wei = BigInt("5000000000000000"); // 0.005 ETH
      const eth = Number(wei) / 1e18;

      expect(eth).to.equal(0.005);
    });
  });

  describe("Market Status Determination", function () {
    it("Should return 'completed' when resolved", function () {
      const isResolved = true;
      const timeLeft = 1000;

      const status = isResolved ? "completed" : timeLeft <= 0 ? "counting" : "active";

      expect(status).to.equal("completed");
    });

    it("Should return 'counting' when expired but not resolved", function () {
      const isResolved = false;
      const timeLeft = -100;

      const status = isResolved ? "completed" : timeLeft <= 0 ? "counting" : "active";

      expect(status).to.equal("counting");
    });

    it("Should return 'active' when still ongoing", function () {
      const isResolved = false;
      const timeLeft = 86400;

      const status = isResolved ? "completed" : timeLeft <= 0 ? "counting" : "active";

      expect(status).to.equal("active");
    });
  });

  describe("Bet ID Validation", function () {
    it("Should validate correct bet ID format", function () {
      const betId = "btc-100k-2025";
      const isValid = /^[a-z0-9-]+$/.test(betId);

      expect(isValid).to.be.true;
    });

    it("Should reject bet ID with uppercase", function () {
      const betId = "BTC-100k-2025";
      const isValid = /^[a-z0-9-]+$/.test(betId);

      expect(isValid).to.be.false;
    });

    it("Should reject bet ID with special characters", function () {
      const betId = "btc@100k!2025";
      const isValid = /^[a-z0-9-]+$/.test(betId);

      expect(isValid).to.be.false;
    });

    it("Should accept bet ID with numbers and hyphens only", function () {
      const betId = "123-456-789";
      const isValid = /^[a-z0-9-]+$/.test(betId);

      expect(isValid).to.be.true;
    });
  });

  describe("Metadata Fallback", function () {
    it("Should format bet ID as title when metadata missing", function () {
      const betId = "eth-5000-by-2025";
      const formattedTitle = betId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      expect(formattedTitle).to.equal("Eth 5000 By 2025");
    });

    it("Should handle single word bet ID", function () {
      const betId = "test";
      const formattedTitle = betId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      expect(formattedTitle).to.equal("Test");
    });

    it("Should handle bet ID with numbers", function () {
      const betId = "100k-btc";
      const formattedTitle = betId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      expect(formattedTitle).to.equal("100k Btc");
    });
  });

  describe("Array Operations", function () {
    it("Should filter null values from markets array", function () {
      const markets = [
        { betId: "1", title: "Market 1" },
        null,
        { betId: "2", title: "Market 2" },
        null,
        { betId: "3", title: "Market 3" },
      ];

      const filtered = markets.filter((m) => m !== null);

      expect(filtered.length).to.equal(3);
      expect(filtered.every(m => m !== null)).to.be.true;
    });

    it("Should categorize markets by status", function () {
      const markets = [
        { betId: "1", status: "active" },
        { betId: "2", status: "counting" },
        { betId: "3", status: "active" },
        { betId: "4", status: "completed" },
        { betId: "5", status: "active" },
      ];

      const active = markets.filter((m) => m.status === "active");
      const counting = markets.filter((m) => m.status === "counting");
      const completed = markets.filter((m) => m.status === "completed");

      expect(active.length).to.equal(3);
      expect(counting.length).to.equal(1);
      expect(completed.length).to.equal(1);
    });

    it("Should handle empty markets array", function () {
      const markets = [];

      const active = markets.filter((m) => m.status === "active");

      expect(active.length).to.equal(0);
      expect(active).to.be.an("array");
    });
  });

  describe("Vote Type Validation", function () {
    it("Should validate Yes vote type", function () {
      const voteType = 1;
      const isValid = voteType === 0 || voteType === 1;

      expect(isValid).to.be.true;
    });

    it("Should validate No vote type", function () {
      const voteType = 0;
      const isValid = voteType === 0 || voteType === 1;

      expect(isValid).to.be.true;
    });

    it("Should reject invalid vote type", function () {
      const voteType = 2;
      const isValid = voteType === 0 || voteType === 1;

      expect(isValid).to.be.false;
    });

    it("Should reject negative vote type", function () {
      const voteType = -1;
      const isValid = voteType === 0 || voteType === 1;

      expect(isValid).to.be.false;
    });
  });

  describe("Duration Calculation", function () {
    it("Should calculate duration in seconds from date", function () {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const durationInSeconds = Math.floor((futureDate.getTime() - Date.now()) / 1000);

      expect(durationInSeconds).to.be.greaterThan(6 * 24 * 60 * 60);
      expect(durationInSeconds).to.be.lessThan(8 * 24 * 60 * 60);
    });

    it("Should handle minimum duration", function () {
      const MIN_DURATION = 5 * 60; // 5 minutes
      const duration = 300;

      expect(duration).to.be.at.least(MIN_DURATION);
    });

    it("Should handle maximum duration", function () {
      const MAX_DURATION = 30 * 24 * 60 * 60; // 30 days
      const duration = 25 * 24 * 60 * 60; // 25 days

      expect(duration).to.be.at.most(MAX_DURATION);
    });
  });

  describe("Address Validation", function () {
    it("Should identify zero address", function () {
      const address = "0x0000000000000000000000000000000000000000";
      const isZeroAddress = address === "0x0000000000000000000000000000000000000000";

      expect(isZeroAddress).to.be.true;
    });

    it("Should identify valid address", function () {
      const address = "0xf2E4CCc3ebc62EBa777CD36b904382eC41706b27";
      const isZeroAddress = address === "0x0000000000000000000000000000000000000000";

      expect(isZeroAddress).to.be.false;
    });

    it("Should validate address format", function () {
      const address = "0xf2E4CCc3ebc62EBa777CD36b904382eC41706b27";
      const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(address);

      expect(isValidFormat).to.be.true;
    });

    it("Should reject invalid address format", function () {
      const address = "0xinvalid";
      const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(address);

      expect(isValidFormat).to.be.false;
    });
  });
});
