import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  DollarSign,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import {
  useBetInfo,
  useRevealStatus,
  useHasVoted,
  useHasClaimed,
  useRequestTallyReveal,
  useClaimPrize,
  useClaimRefund,
} from '@/hooks/useBeliefMarket';
import { VoteModal } from './VoteModal';
import { formatEther } from 'viem';
import {
  showTxSubmitted,
  showTxSuccess,
  showTxError,
  showInfo,
} from '@/lib/toast-utils';

interface MarketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betId: string;
  title: string;
}

export const MarketDetailModal = ({ open, onOpenChange, betId, title }: MarketDetailModalProps) => {
  const { address } = useAccount();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteType, setVoteType] = useState<0 | 1>(1);

  const { betInfo, isLoading: loadingBet, refetch: refetchBet } = useBetInfo(betId);
  const { revealStatus, isLoading: loadingReveal, refetch: refetchReveal } = useRevealStatus(betId);
  const { hasVoted, refetch: refetchHasVoted } = useHasVoted(betId, address);
  const { hasClaimed, refetch: refetchHasClaimed } = useHasClaimed(betId, address);

  const {
    requestReveal,
    hash: revealHash,
    isPending: requestingReveal,
    isConfirming: confirmingReveal,
    isSuccess: revealRequested,
    error: revealError,
  } = useRequestTallyReveal();

  const {
    claimPrize,
    hash: claimHash,
    isPending: claiming,
    isConfirming: confirmingClaim,
    isSuccess: claimed,
    error: claimError,
  } = useClaimPrize();

  const {
    claimRefund,
    hash: refundHash,
    isPending: refunding,
    isConfirming: confirmingRefund,
    isSuccess: refunded,
    error: refundError,
  } = useClaimRefund();

  // Toast refs for each action
  const revealToastRef = useRef<string | number | null>(null);
  const claimToastRef = useRef<string | number | null>(null);
  const refundToastRef = useRef<string | number | null>(null);

  // Previous hash refs
  const prevRevealHashRef = useRef<string | undefined>();
  const prevClaimHashRef = useRef<string | undefined>();
  const prevRefundHashRef = useRef<string | undefined>();

  // Refresh data when modal opens
  useEffect(() => {
    if (open) {
      refetchBet();
      refetchReveal();
      refetchHasVoted();
      refetchHasClaimed();
    }
  }, [open, refetchBet, refetchReveal, refetchHasVoted, refetchHasClaimed]);

  // Handle reveal transaction
  useEffect(() => {
    if (revealHash && revealHash !== prevRevealHashRef.current) {
      prevRevealHashRef.current = revealHash;
      revealToastRef.current = showTxSubmitted(revealHash);
    }
  }, [revealHash]);

  useEffect(() => {
    if (revealRequested && revealHash) {
      showTxSuccess(
        'Decryption Requested!',
        'The encrypted votes will be revealed soon.',
        revealHash,
        revealToastRef.current ?? undefined
      );
      revealToastRef.current = null;
      refetchReveal();
    }
  }, [revealRequested, revealHash, refetchReveal]);

  useEffect(() => {
    if (revealError) {
      showTxError(
        'Decryption Request Failed',
        revealError,
        revealHash,
        revealToastRef.current ?? undefined
      );
      revealToastRef.current = null;
    }
  }, [revealError, revealHash]);

  // Handle claim prize transaction
  useEffect(() => {
    if (claimHash && claimHash !== prevClaimHashRef.current) {
      prevClaimHashRef.current = claimHash;
      claimToastRef.current = showTxSubmitted(claimHash);
    }
  }, [claimHash]);

  useEffect(() => {
    if (claimed && claimHash) {
      showTxSuccess(
        'Prize Claimed!',
        'Your winnings have been sent to your wallet.',
        claimHash,
        claimToastRef.current ?? undefined
      );
      claimToastRef.current = null;
      refetchHasClaimed();
    }
  }, [claimed, claimHash, refetchHasClaimed]);

  useEffect(() => {
    if (claimError) {
      showTxError(
        'Failed to Claim Prize',
        claimError,
        claimHash,
        claimToastRef.current ?? undefined
      );
      claimToastRef.current = null;
    }
  }, [claimError, claimHash]);

  // Handle refund transaction
  useEffect(() => {
    if (refundHash && refundHash !== prevRefundHashRef.current) {
      prevRefundHashRef.current = refundHash;
      refundToastRef.current = showTxSubmitted(refundHash);
    }
  }, [refundHash]);

  useEffect(() => {
    if (refunded && refundHash) {
      showTxSuccess(
        'Refund Claimed!',
        'Your stake has been returned to your wallet.',
        refundHash,
        refundToastRef.current ?? undefined
      );
      refundToastRef.current = null;
      refetchHasClaimed();
    }
  }, [refunded, refundHash, refetchHasClaimed]);

  useEffect(() => {
    if (refundError) {
      showTxError(
        'Failed to Claim Refund',
        refundError,
        refundHash,
        refundToastRef.current ?? undefined
      );
      refundToastRef.current = null;
    }
  }, [refundError, refundHash]);

  if (loadingBet || loadingReveal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!betInfo || !revealStatus) {
    return null;
  }

  const isExpired = Number(betInfo.expiryTime) * 1000 < Date.now();
  const isResolved = betInfo.isResolved;
  const canVote = !isExpired && !isResolved && !hasVoted;
  const isDecryptionRequested = revealStatus.pending;
  const canRequestReveal = isExpired && !isResolved && !isDecryptionRequested && address === betInfo.creator;
  const canClaim = isResolved && hasVoted && !hasClaimed;
  const isTie = isResolved && revealStatus.revealedYes === revealStatus.revealedNo;

  const timeRemaining = isExpired
    ? 'Expired'
    : new Date(Number(betInfo.expiryTime) * 1000).toLocaleString();

  const handleVote = (type: 0 | 1) => {
    setVoteType(type);
    setShowVoteModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>Market Details and Voting</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Badge */}
            <div>
              {isResolved && (
                <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                  <Unlock className="mr-1 h-3 w-3" />
                  Resolved - {betInfo.yesWon ? 'YES Won' : 'NO Won'}
                </Badge>
              )}
              {!isResolved && isExpired && (
                <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                  <Clock className="mr-1 h-3 w-3" />
                  Expired - Awaiting Reveal
                </Badge>
              )}
              {!isResolved && !isExpired && (
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                  <Lock className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              )}
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Prize Pool
                </div>
                <div className="text-2xl font-bold text-primary">{formatEther(betInfo.prizePool)} ETH</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Vote Stake
                </div>
                <div className="text-2xl font-bold">{formatEther(betInfo.voteStake)} ETH</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Deadline
                </div>
                <div className="text-sm font-semibold">{timeRemaining}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Creator</div>
                <div className="text-xs font-mono">{betInfo.creator.slice(0, 6)}...{betInfo.creator.slice(-4)}</div>
              </div>
            </div>

            <Separator />

            {/* Voting Results (if resolved) */}
            {isResolved && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Decrypted Results
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-lg border-2 ${betInfo.yesWon ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="text-sm text-muted-foreground mb-1">YES Votes</div>
                    <div className="text-xl font-bold text-green-700">
                      {Number(revealStatus.revealedYes)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border-2 ${!betInfo.yesWon && !isTie ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="text-sm text-muted-foreground mb-1">NO Votes</div>
                    <div className="text-xl font-bold text-red-700">
                      {Number(revealStatus.revealedNo)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Status */}
            {hasVoted && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>You have voted in this market</AlertDescription>
              </Alert>
            )}

            {hasClaimed && (
              <Alert className="bg-green-50 border-green-200">
                <Trophy className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">You have claimed your rewards</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {canVote && (
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleVote(1)} className="w-full" variant="default">
                    Vote YES
                  </Button>
                  <Button onClick={() => handleVote(0)} className="w-full" variant="secondary">
                    Vote NO
                  </Button>
                </div>
              )}

              {canRequestReveal && (
                <Button
                  onClick={() => requestReveal(betId)}
                  className="w-full"
                  disabled={requestingReveal || confirmingReveal}
                >
                  {(requestingReveal || confirmingReveal) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Unlock className="mr-2 h-4 w-4" />
                  Request Decryption
                </Button>
              )}

              {canClaim && !isTie && (
                <Button
                  onClick={() => claimPrize(betId)}
                  className="w-full"
                  disabled={claiming || confirmingClaim}
                  variant="default"
                >
                  {(claiming || confirmingClaim) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trophy className="mr-2 h-4 w-4" />
                  Claim Prize
                </Button>
              )}

              {canClaim && isTie && (
                <Button
                  onClick={() => claimRefund(betId)}
                  className="w-full"
                  disabled={refunding || confirmingRefund}
                  variant="outline"
                >
                  {(refunding || confirmingRefund) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Claim Refund
                </Button>
              )}
            </div>

            {isDecryptionRequested && !isResolved && (
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Decryption in progress... This may take a few minutes.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <VoteModal
        open={showVoteModal}
        onOpenChange={setShowVoteModal}
        betId={betId}
        voteStake={betInfo.voteStake}
        marketTitle={title}
      />
    </>
  );
};
