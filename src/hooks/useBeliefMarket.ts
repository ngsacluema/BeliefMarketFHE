import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BELIEF_MARKET_ADDRESS, BELIEF_MARKET_ABI } from '@/config/contracts';
import { useEffect, useState } from 'react';
import { parseEther, formatEther } from 'viem';

export interface BetInfo {
  betId: string;
  creator: string;
  platformStake: bigint;
  voteStake: bigint;
  expiryTime: bigint;
  isResolved: boolean;
  yesVotes: bigint;
  noVotes: bigint;
  prizePool: bigint;
  yesWon: boolean;
}

export interface RevealStatus {
  isResolved: boolean;
  pending: boolean;
  revealedYes: bigint;
  revealedNo: bigint;
  decryptionRequestId: bigint;
}

// Hook to get platform stake
export function usePlatformStake() {
  const { data, isLoading, error } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: BELIEF_MARKET_ABI,
    functionName: 'platformStake',
  });

  return {
    platformStake: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Hook to get bet info
export function useBetInfo(betId: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: BELIEF_MARKET_ABI,
    functionName: 'getBet',
    args: [betId],
  });

  const betInfo = data as [string, bigint, bigint, bigint, boolean, bigint, bigint, bigint, boolean] | undefined;

  return {
    betInfo: betInfo
      ? {
          betId,
          creator: betInfo[0],
          platformStake: betInfo[1],
          voteStake: betInfo[2],
          expiryTime: betInfo[3],
          isResolved: betInfo[4],
          yesVotes: betInfo[5],
          noVotes: betInfo[6],
          prizePool: betInfo[7],
          yesWon: betInfo[8],
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get reveal status
export function useRevealStatus(betId: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: BELIEF_MARKET_ABI,
    functionName: 'getRevealStatus',
    args: [betId],
  });

  const revealStatus = data as [boolean, boolean, bigint, bigint, bigint] | undefined;

  return {
    revealStatus: revealStatus
      ? {
          isResolved: revealStatus[0],
          pending: revealStatus[1],
          revealedYes: revealStatus[2],
          revealedNo: revealStatus[3],
          decryptionRequestId: revealStatus[4],
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

// Hook to check if user has voted
export function useHasVoted(betId: string, userAddress?: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: BELIEF_MARKET_ABI,
    functionName: 'hasVoted',
    args: betId && userAddress ? [betId, userAddress as `0x${string}`] : undefined,
  });

  return {
    hasVoted: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

// Hook to check if user has claimed
export function useHasClaimed(betId: string, userAddress?: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: BELIEF_MARKET_ABI,
    functionName: 'hasUserClaimed',
    args: betId && userAddress ? [betId, userAddress as `0x${string}`] : undefined,
  });

  return {
    hasClaimed: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

// Hook to create bet
export function useCreateBet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createBet = async (betId: string, voteStake: string, durationInSeconds: number, platformStakeValue: bigint) => {
    writeContract({
      address: BELIEF_MARKET_ADDRESS,
      abi: BELIEF_MARKET_ABI,
      functionName: 'createBet',
      args: [betId, parseEther(voteStake), BigInt(durationInSeconds)],
      value: platformStakeValue,
    });
  };

  return {
    createBet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to vote
export function useVote() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const vote = async (
    betId: string,
    encryptedWeight: `0x${string}`,
    voteType: 0 | 1,
    inputProof: `0x${string}`,
    voteStakeValue: bigint
  ) => {
    writeContract({
      address: BELIEF_MARKET_ADDRESS,
      abi: BELIEF_MARKET_ABI,
      functionName: 'vote',
      args: [betId, encryptedWeight, voteType, inputProof],
      value: voteStakeValue,
    });
  };

  return {
    vote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to request tally reveal
export function useRequestTallyReveal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const requestReveal = async (betId: string) => {
    writeContract({
      address: BELIEF_MARKET_ADDRESS,
      abi: BELIEF_MARKET_ABI,
      functionName: 'requestTallyReveal',
      args: [betId],
    });
  };

  return {
    requestReveal,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to claim prize
export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimPrize = async (betId: string) => {
    writeContract({
      address: BELIEF_MARKET_ADDRESS,
      abi: BELIEF_MARKET_ABI,
      functionName: 'claimPrize',
      args: [betId],
    });
  };

  return {
    claimPrize,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to claim refund
export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRefund = async (betId: string) => {
    writeContract({
      address: BELIEF_MARKET_ADDRESS,
      abi: BELIEF_MARKET_ABI,
      functionName: 'claimRefund',
      args: [betId],
    });
  };

  return {
    claimRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
