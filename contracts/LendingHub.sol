// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint64, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title BeliefMarketFHE
 * @notice Privacy-preserving prediction market using Zama's FHE (fhEVM 0.9.1)
 * @dev Uses self-relaying decryption pattern instead of Oracle-based decryption
 */
contract BeliefMarketFHE is ZamaEthereumConfig {
    struct BetInfo {
        address creator;
        uint256 platformStake;
        uint256 voteStake;
        uint256 expiryTime;
        bool isResolved;
        euint64 yesVotes;
        euint64 noVotes;
        uint64 revealedYes;
        uint64 revealedNo;
        uint256 prizePool;
        bool yesWon;
        bool decryptionRequested;  // Changed from requestId to boolean flag
    }

    uint256 public platformStake = 0.02 ether;
    uint256 public constant MIN_VOTE_STAKE = 0.005 ether;
    uint256 public constant MIN_DURATION = 5 minutes;
    uint256 public constant MAX_DURATION = 30 days;

    mapping(string => BetInfo) private bets;
    mapping(string => mapping(address => bool)) public hasVoted;
    uint256 public platformFees;
    address public owner;
    bool public isTesting;
    mapping(string => mapping(address => uint8)) internal userVoteType; // 0 = No, 1 = Yes
    mapping(string => mapping(address => bool)) internal hasClaimed;

    // Array to store all bet IDs for enumeration
    string[] private allBetIds;

    event BetCreated(string betId, address creator, uint256 stakeAmount, uint256 voteStake, uint256 expiryTime);
    event VoteCast(string betId);
    event BetResolved(string betId, bool yesWon, uint64 revealedYes, uint64 revealedNo, uint256 totalPrize);
    event PrizeDistributed(string betId, address winner, uint256 amount);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);
    event DecryptionRequested(string betId);

    error DecryptionAlreadyRequested();
    error DecryptionNotRequested();
    error DecryptionNotReady();
    error InvalidVoteStake();
    error InvalidVoteType();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Test-only controls (no effect in production unless explicitly enabled)
    function setTesting(bool enabled) external onlyOwner {
        isTesting = enabled;
    }

    function setPlatformStake(uint256 newStake) external onlyOwner {
        require(newStake > 0, "Platform stake must be positive");
        platformStake = newStake;
    }

    function withdrawPlatformFees(address to) external onlyOwner {
        require(platformFees > 0, "No fees to withdraw");
        uint256 amount = platformFees;
        platformFees = 0;
        (bool sent, ) = payable(to).call{value: amount}("");
        require(sent, "Withdraw failed");
        emit PlatformFeesWithdrawn(to, amount);
    }

    function createBet(
        string memory betId,
        uint256 voteStake,
        uint256 duration
    ) external payable {
        require(msg.value == platformStake, "Must stake the current platform fee");
        platformFees += msg.value;
        require(voteStake >= MIN_VOTE_STAKE, "Vote stake too low");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        if (voteStake > type(uint64).max) revert InvalidVoteStake();
        require(bets[betId].creator == address(0), "Bet already exists");
        bets[betId] = BetInfo({
            creator: msg.sender,
            platformStake: msg.value,
            voteStake: voteStake,
            expiryTime: block.timestamp + duration,
            isResolved: false,
            yesVotes: FHE.asEuint64(0),
            noVotes: FHE.asEuint64(0),
            revealedYes: 0,
            revealedNo: 0,
            prizePool: 0,
            yesWon: false,
            decryptionRequested: false
        });

        // Grant the contract permission to operate on the tally ciphertexts
        FHE.allowThis(bets[betId].yesVotes);
        FHE.allowThis(bets[betId].noVotes);

        // Add betId to the array for enumeration
        allBetIds.push(betId);

        emit BetCreated(betId, msg.sender, msg.value, voteStake, block.timestamp + duration);
    }

    // VoteType: 0 = No, 1 = Yes (plaintext for prize distribution)
    // Weight is encrypted to hide vote strength
    function vote(
        string memory betId,
        uint8 voteType,
        externalEuint64 encryptedWeight,
        bytes calldata inputProof
    ) external payable {
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        require(!bet.isResolved, "Bet already resolved");
        require(block.timestamp < bet.expiryTime, "Bet expired");
        require(msg.value == bet.voteStake, "Incorrect vote stake");
        require(!hasVoted[betId][msg.sender], "Already voted");
        if (voteType > 1) revert InvalidVoteType();

        // Decrypt encrypted weight using proof
        euint64 weight = FHE.fromExternal(encryptedWeight, inputProof);

        // Add weight to the appropriate vote pool based on plaintext voteType
        if (voteType == 1) {
            // Yes vote
            bet.yesVotes = FHE.add(bet.yesVotes, weight);
        } else {
            // No vote
            bet.noVotes = FHE.add(bet.noVotes, weight);
        }

        FHE.allowThis(bet.yesVotes);
        FHE.allowThis(bet.noVotes);

        hasVoted[betId][msg.sender] = true;
        userVoteType[betId][msg.sender] = voteType;
        bet.prizePool += msg.value;
        emit VoteCast(betId);
    }

    /**
     * @notice Request decryption of tallies after bet expiry (Step 1 of 0.9.1 flow)
     * @dev Marks ciphertexts as publicly decryptable for off-chain relayer
     */
    function requestTallyReveal(string memory betId) external {
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        require(block.timestamp >= bet.expiryTime, "Bet not expired");
        require(!bet.isResolved, "Already resolved");
        require(msg.sender == bet.creator, "Only creator can request reveal");
        if (bet.decryptionRequested) revert DecryptionAlreadyRequested();

        // Mark ciphertexts as publicly decryptable (0.9.1 self-relaying pattern)
        bet.yesVotes = FHE.makePubliclyDecryptable(bet.yesVotes);
        bet.noVotes = FHE.makePubliclyDecryptable(bet.noVotes);
        bet.decryptionRequested = true;

        emit DecryptionRequested(betId);
    }

    /**
     * @notice Resolve the bet with decrypted values and proof (Step 2 of 0.9.1 flow)
     * @dev Called by relayer/user with decrypted values and cryptographic proof
     * @param betId The bet identifier
     * @param revealedYes Decrypted yes vote count
     * @param revealedNo Decrypted no vote count
     * @param decryptionProof Cryptographic proof from relayer SDK
     */
    function resolveTally(
        string memory betId,
        uint64 revealedYes,
        uint64 revealedNo,
        bytes calldata decryptionProof
    ) external {
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        require(!bet.isResolved, "Already resolved");
        if (!bet.decryptionRequested) revert DecryptionNotRequested();

        // Verify the decryption is ready (ciphertexts are publicly decryptable)
        if (!FHE.isPubliclyDecryptable(bet.yesVotes) || !FHE.isPubliclyDecryptable(bet.noVotes)) {
            revert DecryptionNotReady();
        }

        // Prepare ciphertext handles for signature verification
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(bet.yesVotes);
        cts[1] = FHE.toBytes32(bet.noVotes);

        // Encode the claimed decrypted values
        bytes memory cleartexts = abi.encode(revealedYes, revealedNo);

        // Verify the decryption proof using FHE.checkSignatures (0.9.1 API)
        FHE.checkSignatures(cts, cleartexts, decryptionProof);

        // Update bet state with verified decrypted values
        bet.revealedYes = revealedYes;
        bet.revealedNo = revealedNo;
        bet.isResolved = true;
        bet.yesWon = revealedYes > revealedNo;

        emit BetResolved(betId, bet.yesWon, revealedYes, revealedNo, bet.prizePool);
    }

    function claimPrize(string memory betId) external {
        BetInfo storage bet = bets[betId];
        require(bet.isResolved, "Bet not resolved");
        require(!hasClaimed[betId][msg.sender], "Already claimed");
        require(hasVoted[betId][msg.sender], "Did not vote");
        require(bet.revealedYes != bet.revealedNo, "Tie, use claimRefund");

        bool isWinner = (bet.yesWon && userVoteType[betId][msg.sender] == 1) ||
                        (!bet.yesWon && userVoteType[betId][msg.sender] == 0);
        require(isWinner, "Not a winner");

        hasClaimed[betId][msg.sender] = true;
        uint256 userWeight = bet.voteStake; // all users vote with the same stake
        uint256 totalWinningWeight = bet.yesWon ? bet.revealedYes : bet.revealedNo;
        require(totalWinningWeight > 0, "No winners");
        uint256 prize = (bet.prizePool * userWeight) / totalWinningWeight;
        (bool sent, ) = payable(msg.sender).call{value: prize}("");
        require(sent, "Failed to send Ether");
        emit PrizeDistributed(betId, msg.sender, prize);
    }

    function claimRefund(string memory betId) external {
        BetInfo storage bet = bets[betId];
        require(bet.isResolved, "Bet not resolved");
        require(bet.revealedYes == bet.revealedNo, "Not a tie");
        require(hasVoted[betId][msg.sender], "Did not vote");
        require(!hasClaimed[betId][msg.sender], "Already claimed");

        hasClaimed[betId][msg.sender] = true;
        uint256 refund = bet.voteStake;
        (bool sent, ) = payable(msg.sender).call{value: refund}("");
        require(sent, "Failed to send Ether");
    }

    // ===== Test-only helpers to simulate votes, funding and resolution locally =====
    function testingMarkVoted(string memory betId, address voter, uint8 voteType) external onlyOwner {
        require(isTesting, "Testing disabled");
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        hasVoted[betId][voter] = true;
        userVoteType[betId][voter] = voteType; // 0 = No, 1 = Yes
    }

    function testingFundPrizePool(string memory betId) external payable onlyOwner {
        require(isTesting, "Testing disabled");
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        bet.prizePool += msg.value;
    }

    function testingResolve(
        string memory betId,
        uint64 revealedYes,
        uint64 revealedNo
    ) external onlyOwner {
        require(isTesting, "Testing disabled");
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        bet.revealedYes = revealedYes;
        bet.revealedNo = revealedNo;
        bet.isResolved = true;
        bet.yesWon = revealedYes > revealedNo;
    }

    // Get bet info (returns revealed tallies if resolved, otherwise 0)
    function getBet(string memory betId) external view returns (
        address creator,
        uint256 creatorStake,
        uint256 voteStake,
        uint256 expiryTime,
        bool isResolved,
        uint64 yesVotes,
        uint64 noVotes,
        uint256 prizePool,
        bool yesWon
    ) {
        BetInfo storage bet = bets[betId];
        return (
            bet.creator,
            bet.platformStake,
            bet.voteStake,
            bet.expiryTime,
            bet.isResolved,
            bet.isResolved ? bet.revealedYes : 0,
            bet.isResolved ? bet.revealedNo : 0,
            bet.prizePool,
            bet.yesWon
        );
    }

    // Get reveal status for a bet (updated for 0.9.1)
    function getRevealStatus(string memory betId)
        external
        view
        returns (
            bool isResolved,
            bool decryptionRequested,
            uint64 revealedYes,
            uint64 revealedNo,
            bool isDecryptable
        )
    {
        BetInfo storage bet = bets[betId];
        bool decryptable = bet.decryptionRequested &&
            FHE.isPubliclyDecryptable(bet.yesVotes) &&
            FHE.isPubliclyDecryptable(bet.noVotes);
        return (
            bet.isResolved,
            bet.decryptionRequested,
            bet.revealedYes,
            bet.revealedNo,
            decryptable
        );
    }

    // Check if decryption has been requested for a bet
    function isDecryptionRequested(string memory betId) external view returns (bool) {
        return bets[betId].decryptionRequested;
    }

    // Check if ciphertexts are ready for decryption
    function isReadyForDecryption(string memory betId) external view returns (bool) {
        BetInfo storage bet = bets[betId];
        if (!bet.decryptionRequested) return false;
        return FHE.isPubliclyDecryptable(bet.yesVotes) && FHE.isPubliclyDecryptable(bet.noVotes);
    }

    // Get ciphertext handles for off-chain decryption (needed by relayer SDK)
    function getCiphertextHandles(string memory betId) external view returns (bytes32 yesHandle, bytes32 noHandle) {
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        return (FHE.toBytes32(bet.yesVotes), FHE.toBytes32(bet.noVotes));
    }

    // Public getter for hasClaimed for frontend usage
    function hasUserClaimed(string memory betId, address user) public view returns (bool) {
        return hasClaimed[betId][user];
    }

    // Get all bet IDs
    function getAllBetIds() external view returns (string[] memory) {
        return allBetIds;
    }

    // Get total number of bets
    function getBetCount() external view returns (uint256) {
        return allBetIds.length;
    }

    receive() external payable {}
} 

// Compatibility wrapper expected by some tooling: provide BeliefMarket in this file
contract BeliefMarket is BeliefMarketFHE {
    constructor() BeliefMarketFHE() {}
}
