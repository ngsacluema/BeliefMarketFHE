import { MarketCard } from './MarketCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockMarkets = [
  {
    betId: 'demo-eth-5000-2025',
    title: 'Will ETH reach $5,000 by end of 2025?',
    description: 'Predict whether Ethereum will reach or exceed $5,000 USD by December 31, 2025, based on major exchange prices.',
    prizePool: '0 ETH',
    participants: 0,
    timeRemaining: 'Demo Market',
    status: 'active' as const,
  },
  {
    betId: 'demo-btc-halving-2028',
    title: 'Will the next Bitcoin halving occur before May 2028?',
    description: 'Binary prediction on the timing of the next Bitcoin block reward halving event.',
    prizePool: '0 ETH',
    participants: 0,
    timeRemaining: 'Demo Market',
    status: 'active' as const,
  },
  {
    betId: 'demo-solana-tvl-q2',
    title: 'Will Solana TVL exceed $10B in Q2 2025?',
    description: 'Predict if Solana\'s Total Value Locked will surpass $10 billion during Q2 2025.',
    prizePool: '0 ETH',
    participants: 0,
    timeRemaining: 'Demo Market',
    status: 'counting' as const,
  },
];

export const Markets = () => {
  const activeMarkets = mockMarkets.filter((m) => m.status === 'active');
  const countingMarkets = mockMarkets.filter((m) => m.status === 'counting');
  const completedMarkets = mockMarkets.filter((m) => m.status === 'completed');

  return (
    <section id="markets" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Active Prediction Markets</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore ongoing encrypted prediction markets. All votes remain private using FHE
            until the official decryption callback.
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="active">Active ({activeMarkets.length})</TabsTrigger>
            <TabsTrigger value="counting">Counting ({countingMarkets.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedMarkets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeMarkets.map((market, index) => (
                <MarketCard key={index} {...market} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="counting">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {countingMarkets.map((market, index) => (
                <MarketCard key={index} {...market} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedMarkets.map((market, index) => (
                <MarketCard key={index} {...market} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
