import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, DollarSign } from 'lucide-react';
import { MarketDetailModal } from './MarketDetailModal';

interface MarketCardProps {
  betId: string;
  title: string;
  description: string;
  prizePool: string;
  participants?: number;
  timeRemaining: string;
  status: 'active' | 'counting' | 'completed';
}

export const MarketCard = ({
  betId,
  title,
  description,
  prizePool,
  participants = 0,
  timeRemaining,
  status,
}: MarketCardProps) => {
  const [showDetail, setShowDetail] = useState(false);

  const statusColors = {
    active: 'bg-green-500/10 text-green-700 border-green-500/20',
    counting: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    completed: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <>
      <Card className="group hover:shadow-lg hover:border-primary/50 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Badge className={statusColors[status]} variant="outline">
              {status === 'active' && '🔓 Active'}
              {status === 'counting' && '🔒 Counting'}
              {status === 'completed' && '✓ Completed'}
            </Badge>
          </div>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Prize Pool
              </span>
              <span className="font-semibold text-primary">{prizePool}</span>
            </div>

            {participants > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Participants
                </span>
                <span className="font-semibold">{participants}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Time Left
              </span>
              <span className="font-semibold">{timeRemaining}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button className="w-full" onClick={() => setShowDetail(true)}>
            View Market
          </Button>
        </CardFooter>
      </Card>

      <MarketDetailModal open={showDetail} onOpenChange={setShowDetail} betId={betId} title={title} />
    </>
  );
};
