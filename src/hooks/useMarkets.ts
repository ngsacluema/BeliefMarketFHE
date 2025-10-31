import { useReadContract } from 'wagmi';
import { BELIEF_MARKET_ADDRESS, BELIEF_MARKET_ABI } from '@/config/contracts';
import { formatEther } from 'viem';
import { useMarketEvents, getMarketMetadata } from './useMarketEvents';
import { useMemo } from 'react';

interface MarketData {
  betId: string;
  title: string;
  description: string;
  prizePool: string;
  participants: number;
  timeRemaining: string;
  status: 'active' | 'counting' | 'completed';
  expiryTime: number;
  isResolved: boolean;
  voteStake: string;
}

/**
 * Fetch a single market's data from the blockchain
 */
export function useMarket(betId: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: BELIEF_MARKET_ABI,
    functionName: 'getBet',
    args: [betId],
  });

  const market = useMemo(() => {
    if (!data || isLoading) return null;

    const [creator, platformStake, voteStake, expiryTime, isResolved, yesVotes, noVotes, prizePool, yesWon] = data;

    // Skip if market doesn't exist (creator is zero address)
    if (creator === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(expiryTime) - now;

    let status: 'active' | 'counting' | 'completed' = 'active';
    let timeRemaining = '';

    if (isResolved) {
      status = 'completed';
      timeRemaining = 'Resolved';
    } else if (timeLeft <= 0) {
      status = 'counting';
      timeRemaining = 'Counting Votes';
    } else {
      const days = Math.floor(timeLeft / 86400);
      const hours = Math.floor((timeLeft % 86400) / 3600);
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h remaining`;
      } else {
        const minutes = Math.floor((timeLeft % 3600) / 60);
        timeRemaining = `${hours}h ${minutes}m remaining`;
      }
    }

    // Calculate participants from votes (this is approximate since votes are encrypted)
    const participants = Number(yesVotes) + Number(noVotes);

    // Get metadata (title + description) from JSON or fallback to betId
    const metadata = getMarketMetadata(betId);

    return {
      betId,
      title: metadata.title,
      description: metadata.description,
      prizePool: `${formatEther(prizePool)} ETH`,
      participants,
      timeRemaining,
      status,
      expiryTime: Number(expiryTime),
      isResolved,
      voteStake: formatEther(voteStake),
    } as MarketData;
  }, [data, isLoading, betId]);

  return { market, isLoading, refetch };
}

/**
 * Fetch all markets data using multiple parallel contract calls
 */
export function useMarkets() {
  const { markets: marketIds, isLoading: isLoadingEvents } = useMarketEvents();

  // Create individual hooks for each market (hooks must be called unconditionally)
  const market1 = useMarket(marketIds[0] || '');
  const market2 = useMarket(marketIds[1] || '');
  const market3 = useMarket(marketIds[2] || '');
  const market4 = useMarket(marketIds[3] || '');
  const market5 = useMarket(marketIds[4] || '');
  const market6 = useMarket(marketIds[5] || '');
  const market7 = useMarket(marketIds[6] || '');
  const market8 = useMarket(marketIds[7] || '');
  const market9 = useMarket(marketIds[8] || '');
  const market10 = useMarket(marketIds[9] || '');

  const allMarkets = useMemo(() => {
    const markets = [
      market1.market,
      market2.market,
      market3.market,
      market4.market,
      market5.market,
      market6.market,
      market7.market,
      market8.market,
      market9.market,
      market10.market,
    ].filter((m): m is MarketData => m !== null);

    return markets;
  }, [
    market1.market,
    market2.market,
    market3.market,
    market4.market,
    market5.market,
    market6.market,
    market7.market,
    market8.market,
    market9.market,
    market10.market,
  ]);

  const isLoadingAny =
    isLoadingEvents ||
    market1.isLoading ||
    market2.isLoading ||
    market3.isLoading ||
    market4.isLoading ||
    market5.isLoading ||
    market6.isLoading ||
    market7.isLoading ||
    market8.isLoading ||
    market9.isLoading ||
    market10.isLoading;

  return {
    markets: allMarkets,
    activeMarkets: allMarkets.filter((m) => m.status === 'active'),
    countingMarkets: allMarkets.filter((m) => m.status === 'counting'),
    completedMarkets: allMarkets.filter((m) => m.status === 'completed'),
    isLoading: isLoadingAny,
  };
}
