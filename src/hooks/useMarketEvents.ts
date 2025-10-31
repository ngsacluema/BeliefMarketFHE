import { useReadContract } from 'wagmi';
import { BELIEF_MARKET_ADDRESS, BELIEF_MARKET_ABI } from '@/config/contracts';
import marketsMetadata from '@/config/markets.json';

interface MarketMetadata {
  betId: string;
  title: string;
  description: string;
}

/**
 * Fetch all market IDs directly from the contract
 * Uses the getAllBetIds() function for instant discovery
 */
export function useMarketEvents() {
  const { data, isLoading, error } = useReadContract({
    address: BELIEF_MARKET_ADDRESS,
    abi: [
      ...BELIEF_MARKET_ABI,
      {
        inputs: [],
        name: 'getAllBetIds',
        outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'getAllBetIds',
    query: {
      staleTime: 60_000, // 1 minute - prevent hydration mismatch
      gcTime: 5 * 60_000, // 5 minutes
    },
  });

  // Always return an array to ensure consistent type
  const markets = Array.isArray(data) ? data : [];

  // Only log when data is actually loaded
  if (!isLoading && markets.length > 0) {
    console.log('📦 Loaded', markets.length, 'markets from contract:', markets);
  }

  return { markets, isLoading, error };
}

/**
 * Get metadata for a market (title + description)
 * Falls back to betId if metadata not found
 */
export function getMarketMetadata(betId: string): MarketMetadata {
  const metadata = (marketsMetadata as MarketMetadata[]).find((m) => m.betId === betId);

  if (metadata) {
    return metadata;
  }

  // Fallback: use betId as title, format it nicely
  const formattedTitle = betId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    betId,
    title: formattedTitle,
    description: `Prediction market: ${formattedTitle}`,
  };
}
