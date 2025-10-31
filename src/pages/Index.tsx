import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Markets } from '@/components/Markets';
import { CreateMarket } from '@/components/CreateMarket';
import { Footer } from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    // Handle hash navigation on mount and hash change
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1); // Remove the '#'
        const element = document.getElementById(elementId);
        if (element) {
          // Wait for DOM to fully render
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    // Scroll on initial load
    scrollToHash();

    // Listen for hash changes
    window.addEventListener('hashchange', scrollToHash);

    return () => {
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Markets />
        <CreateMarket />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
