import { Lock, Vote, Clock, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    icon: Lock,
    title: 'Creator Stakes & Opens',
    description: 'Market creators stake platform fees to launch a binary (Yes/No) prediction event with defined parameters.',
  },
  {
    icon: Vote,
    title: 'Encrypted Voting',
    description: 'Participants submit their predictions as encrypted weights before the deadline. All votes remain private using FHE.',
  },
  {
    icon: Clock,
    title: 'Secure Counting',
    description: 'During the counting phase, all vote weights stay encrypted. No one can see voting patterns or manipulate results.',
  },
  {
    icon: Trophy,
    title: 'Decryption & Rewards',
    description: 'After expiry, smart contracts trigger decryption callbacks. Winners share the prize pool based on verified results.',
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            BeliefMarketFHE uses Fully Homomorphic Encryption to ensure complete privacy
            throughout the prediction process, revealing results only at the designated time.
          </p>
        </div>

        {/* Demo Video */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 shadow-2xl bg-black">
            <video
              controls
              className="w-full aspect-video"
              poster="/favicon.svg"
            >
              <source src="/vedio.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>

                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
