import { useState, useEffect } from 'react';
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
import { Loader2, Lock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useVote } from '@/hooks/useBeliefMarket';
import { encryptUint64 } from '@/lib/fhe';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { BELIEF_MARKET_ADDRESS } from '@/config/contracts';

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
  const { vote, hash, isPending, isConfirming, isSuccess, error } = useVote();

  // Watch for transaction confirmation
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">✅ Vote Confirmed!</p>
          <p className="text-sm">Your encrypted vote has been recorded on-chain.</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        {
          duration: 8000,
        }
      );
      // Close modal after success
      setTimeout(() => onOpenChange(false), 2000);
    }
  }, [isSuccess, hash, onOpenChange]);

  // Watch for transaction error
  useEffect(() => {
    if (error && !isEncrypting) {
      const errorMessage = error.message || 'Transaction failed';
      toast.error(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">❌ Vote Failed</p>
          <p className="text-sm">{errorMessage}</p>
          {hash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              View on Etherscan <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>,
        {
          duration: 10000,
        }
      );
    }
  }, [error, hash, isEncrypting]);

  const handleVote = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsEncrypting(true);
      toast.info('🔐 Encrypting your vote with FHE...');

      // Encrypt the vote weight (each vote counts as 1)
      // The contract uses this for counting votes, not for stake amounts
      // Prize distribution uses bet.voteStake (same for all users) divided by total vote count
      const voteWeight = BigInt(1);

      console.log('Encrypting vote:', {
        betId,
        voteType,
        voteWeight: voteWeight.toString(),
        voteStake: formatEther(voteStake),
        address,
        contractAddress: BELIEF_MARKET_ADDRESS,
      });

      const { handle, proof } = await encryptUint64(
        voteWeight,
        BELIEF_MARKET_ADDRESS,
        address
      );

      setIsEncrypting(false);
      console.log('Encrypted data:', { handle, proof });

      toast.info('📤 Submitting encrypted vote to blockchain...');

      // Submit vote to contract with plaintext voteType and encrypted weight
      await vote(betId, Number(voteType) as 0 | 1, handle, proof, voteStake);
    } catch (err: any) {
      setIsEncrypting(false);
      console.error('Vote error:', err);
      toast.error(err.message || 'Failed to encrypt vote');
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

          {isConfirming && (
            <Alert className="bg-blue-50 border-blue-200">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-700">
                Waiting for blockchain confirmation...
              </AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Vote confirmed! Transaction: {hash?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEncrypting || isPending || isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVote}
            disabled={isEncrypting || isPending || isConfirming || isSuccess}
          >
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
