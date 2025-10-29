import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateBet, usePlatformStake } from '@/hooks/useBeliefMarket';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';

export const CreateMarket = () => {
  const { address } = useAccount();
  const { platformStake } = usePlatformStake();
  const { createBet, isPending, isConfirming, isSuccess, error } = useCreateBet();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [voteStake, setVoteStake] = useState('0.005');
  const [date, setDate] = useState<Date>();
  const [resolution, setResolution] = useState('');

  const handleCreate = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!title || !description || !date || !voteStake) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!platformStake) {
      toast.error('Unable to fetch platform stake');
      return;
    }

    try {
      const betId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      const durationInSeconds = Math.floor((date.getTime() - Date.now()) / 1000);

      if (durationInSeconds < 300) {
        toast.error('Market duration must be at least 5 minutes');
        return;
      }

      await createBet(betId, voteStake, durationInSeconds, platformStake);
      toast.success('Market created successfully!');

      // Reset form
      setTitle('');
      setDescription('');
      setVoteStake('0.005');
      setDate(undefined);
      setResolution('');
    } catch (err: any) {
      console.error('Create market error:', err);
      toast.error(err.message || 'Failed to create market');
    }
  };

  return (
    <section id="create" className="py-20 bg-muted/30">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Create a Prediction Market</h2>
          <p className="text-muted-foreground">
            Stake platform fees to launch your own binary prediction event with FHE-powered privacy.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Market Details</CardTitle>
            <CardDescription>
              Define your binary (Yes/No) prediction event. All participant votes will be encrypted.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Market Question</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Will ETH reach $5,000 by end of 2025?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide clear criteria for how this prediction will be resolved..."
                rows={4}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voteStake">Vote Stake (ETH)</Label>
                <Input
                  id="voteStake"
                  type="number"
                  value={voteStake}
                  onChange={(e) => setVoteStake(e.target.value)}
                  placeholder="0.005"
                  step="0.001"
                  min="0.005"
                />
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Source</Label>
              <Input
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="e.g., CoinGecko API, Official announcement, etc."
              />
            </div>

            {platformStake && (
              <Alert>
                <AlertDescription>
                  Platform Stake Required: {(Number(platformStake) / 1e18).toFixed(4)} ETH
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {isSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">Market created successfully!</AlertDescription>
              </Alert>
            )}

            <div className="pt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCreate}
                disabled={isPending || isConfirming || isSuccess}
              >
                {(isPending || isConfirming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isPending && !isConfirming && <Plus className="mr-2 h-4 w-4" />}
                {isPending || isConfirming ? 'Creating...' : 'Create Encrypted Market'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By creating a market, you agree to stake the platform fee. Markets use FHE to keep all
              votes encrypted until the official decryption callback.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
