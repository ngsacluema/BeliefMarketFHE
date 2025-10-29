import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, TrendingUp } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 sm:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-foreground/80">Powered by Fully Homomorphic Encryption</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Predict the Future,{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Privately
            </span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            The first binary prediction market built on FHE technology. Vote with encrypted weights,
            maintain privacy until expiry, and win from the prize pool based on decrypted results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group">
              Explore Markets
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Create Market
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Encrypted Votes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">$2.5M+</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">1,247</div>
              <div className="text-sm text-muted-foreground">Active Markets</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
