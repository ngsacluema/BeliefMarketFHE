import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Markets } from '@/components/Markets';
import { CreateMarket } from '@/components/CreateMarket';
import { Footer } from '@/components/Footer';

const Index = () => {
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
