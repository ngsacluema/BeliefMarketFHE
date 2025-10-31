import { sepolia } from 'wagmi/chains';

// BeliefMarketFHE Contract Address on Sepolia
export const BELIEF_MARKET_ADDRESS = '0x35B1c3E1208Cf716d1d3558F30aE5de48f5fe3B4' as const;

export const BELIEF_MARKET_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'betId', type: 'string' },
      { internalType: 'uint256', name: 'voteStake', type: 'uint256' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
    ],
    name: 'createBet',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'betId', type: 'string' },
      { internalType: 'uint8', name: 'voteType', type: 'uint8' },
      { internalType: 'externalEuint64', name: 'encryptedWeight', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'betId', type: 'string' }],
    name: 'requestTallyReveal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'betId', type: 'string' }],
    name: 'claimPrize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'betId', type: 'string' }],
    name: 'claimRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'betId', type: 'string' }],
    name: 'getBet',
    outputs: [
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'uint256', name: 'platformStake', type: 'uint256' },
      { internalType: 'uint256', name: 'voteStake', type: 'uint256' },
      { internalType: 'uint256', name: 'expiryTime', type: 'uint256' },
      { internalType: 'bool', name: 'isResolved', type: 'bool' },
      { internalType: 'uint64', name: 'yesVotes', type: 'uint64' },
      { internalType: 'uint64', name: 'noVotes', type: 'uint64' },
      { internalType: 'uint256', name: 'prizePool', type: 'uint256' },
      { internalType: 'bool', name: 'yesWon', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'betId', type: 'string' }],
    name: 'getRevealStatus',
    outputs: [
      { internalType: 'bool', name: 'isResolved', type: 'bool' },
      { internalType: 'bool', name: 'pending', type: 'bool' },
      { internalType: 'uint64', name: 'revealedYes', type: 'uint64' },
      { internalType: 'uint64', name: 'revealedNo', type: 'uint64' },
      { internalType: 'uint256', name: 'decryptionRequestId', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'betId', type: 'string' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'hasVoted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'betId', type: 'string' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'hasUserClaimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'platformStake',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'betId', type: 'string' },
      { indexed: false, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'stakeAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'voteStake', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'expiryTime', type: 'uint256' },
    ],
    name: 'BetCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'string', name: 'betId', type: 'string' }],
    name: 'VoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'betId', type: 'string' },
      { indexed: false, internalType: 'bool', name: 'yesWon', type: 'bool' },
      { indexed: false, internalType: 'uint64', name: 'revealedYes', type: 'uint64' },
      { indexed: false, internalType: 'uint64', name: 'revealedNo', type: 'uint64' },
      { indexed: false, internalType: 'uint256', name: 'totalPrize', type: 'uint256' },
    ],
    name: 'BetResolved',
    type: 'event',
  },
] as const;

export const NETWORK_CONFIG = {
  chainId: sepolia.id,
  chainName: sepolia.name,
  contractAddress: BELIEF_MARKET_ADDRESS,
};
