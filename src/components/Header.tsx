import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="BeliefMarket" className="h-8 w-8" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            BeliefMarketFHE
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#markets" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Markets
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#create" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Create Market
          </a>
        </nav>

        <ConnectButton />
      </div>
    </header>
  );
};
