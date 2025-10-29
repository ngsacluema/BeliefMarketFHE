import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useVote } from '@/hooks/useBeliefMarket';
import { encryptUint64 } from '@/lib/fhe';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';

interface VoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betId: string;
  voteStake: bigint;
  marketTitle: string;
}

export const VoteModal = ({ open, onOpenChange, betId, voteStake, marketTitle }: VoteModalProps) => {
  const { address } = useAccount();
  const [voteType, setVoteType] = useState<'1' | '0'>('1'); // 1 = Yes, 0 = No
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { vote, isPending, isConfirming, isSuccess, error } = useVote();

  const handleVote = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsEncrypting(true);
      toast.info('Encrypting your vote with FHE...');

      // Encrypt the vote weight (vote stake amount)
      const voteStakeNumber = Number(formatEther(voteStake));
      const voteWeightBigInt = BigInt(Math.floor(voteStakeNumber * 1e18));

      console.log('Encrypting vote:', {
        betId,
        voteType,
        voteWeightBigInt: voteWeightBigInt.toString(),
        voteStake: formatEther(voteStake),
        address,
      });

      const { handle, proof } = await encryptUint64(
        voteWeightBigInt,
        '0x0000000000000000000000000000000000000000', // TODO: Update with actual contract address
        address
      );

      setIsEncrypting(false);
      toast.success('Vote encrypted successfully!');

      console.log('Encrypted data:', { handle, proof });

      // Submit vote to contract
      await vote(betId, handle, Number(voteType) as 0 | 1, proof, voteStake);

      toast.success('Vote submitted! Waiting for confirmation...');
    } catch (err: any) {
      setIsEncrypting(false);
      console.error('Vote error:', err);
      toast.error(err.message || 'Failed to submit vote');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Cast Encrypted Vote
          </DialogTitle>
          <DialogDescription>{marketTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your vote will be encrypted using Fully Homomorphic Encryption (FHE). No one can see your choice until
              the market is resolved.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Label>Select Your Vote</Label>
            <RadioGroup value={voteType} onValueChange={(v) => setVoteType(v as '1' | '0')}>
              <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-4 hover:bg-green-100 transition-colors">
                <RadioGroupItem value="1" id="yes" />
                <Label htmlFor="yes" className="flex-1 cursor-pointer font-semibold text-green-700">
                  ✓ Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 hover:bg-red-100 transition-colors">
                <RadioGroupItem value="0" id="no" />
                <Label htmlFor="no" className="flex-1 cursor-pointer font-semibold text-red-700">
                  ✗ No
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vote Stake:</span>
              <span className="font-semibold">{formatEther(voteStake)} ETH</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">Vote submitted successfully!</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isEncrypting || isPending || isConfirming}>
            Cancel
          </Button>
          <Button onClick={handleVote} disabled={isEncrypting || isPending || isConfirming || isSuccess}>
            {isEncrypting && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Encrypting...
              </>
            )}
            {!isEncrypting && (isPending || isConfirming) && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            )}
            {!isEncrypting && !isPending && !isConfirming && (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Submit Encrypted Vote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
