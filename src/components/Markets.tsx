import { MarketCard } from './MarketCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarkets } from '@/hooks/useMarkets';
import { Loader2 } from 'lucide-react';

export const Markets = () => {
  const { markets, activeMarkets, countingMarkets, completedMarkets } = useMarkets();

  if (markets.length === 0) {
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
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading markets from blockchain...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
            {activeMarkets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMarkets.map((market) => (
                  <MarketCard key={market.betId} {...market} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active markets at the moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="counting">
            {countingMarkets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {countingMarkets.map((market) => (
                  <MarketCard key={market.betId} {...market} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No markets in counting phase</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedMarkets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedMarkets.map((market) => (
                  <MarketCard key={market.betId} {...market} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No completed markets yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
