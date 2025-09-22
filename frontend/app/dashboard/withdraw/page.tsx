'use client';

import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useUserPositions, usePreviewInterest, usePool } from '@/hooks/usePool';
import { toast } from 'sonner';

interface UserPosition {
  id: bigint;
  planType: number;
  principal: bigint;
  start: number;
  term: number;
  aprBps: number;
  closed: boolean;
  receiptId: bigint;
}

interface UserPositionsResult {
  0: UserPosition[];
  1: bigint; 
}

const TotalClaimableCard = () => {
  const { address } = useAccount();
  const { data: rawPositions } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;
  const userPositions = positions?.[0] || [];
  const { isPending, isConfirming, isSuccess, error, hash } = usePool();

  useEffect(() => {
    if (isPending) {
      toast.loading('Initiating claim all positions...', { id: 'claim-all' });
    } else if (isConfirming) {
      toast.loading('Confirming batch claim...', { id: 'claim-all' });
    } else if (isSuccess) {
      toast.success('All available positions claimed successfully!', { 
        id: 'claim-all',
        action: hash ? {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.somnia.network/tx/${hash}`, '_blank')
        } : undefined
      });
    } else if (error) {
      toast.error(`Claim all failed: ${error.message}`, { id: 'claim-all' });
    }
  }, [isPending, isConfirming, isSuccess, error, hash]);
  
  const totalClaimable = userPositions.reduce((sum, pos) => {
    if (pos.closed) return sum;
    const now = Date.now() / 1000;
    const isMatured = pos.term > 0 && now >= pos.start + pos.term;
    const isFlexOrCustom = pos.planType === 0 || pos.planType === 1;
    
    if (isMatured || isFlexOrCustom) {
      const principal = parseFloat(formatEther(pos.principal));
      const apy = pos.aprBps / 10000;
      const elapsed = Math.min(now - pos.start, pos.term || (now - pos.start));
      const interest = principal * apy * (elapsed / (365 * 24 * 60 * 60));
      return sum + principal + interest;
    }
    return sum;
  }, 0);

  const totalLocked = userPositions.reduce((sum, pos) => {
    if (pos.closed) return sum;
    const now = Date.now() / 1000;
    const isMatured = pos.term > 0 && now >= pos.start + pos.term;
    const isFlexOrCustom = pos.planType === 0 || pos.planType === 1;
    
    if (!isMatured && !isFlexOrCustom) {
      return sum + parseFloat(formatEther(pos.principal));
    }
    return sum;
  }, 0);

  const handleClaimAll = async () => {
    console.log('=== CLAIM ALL POSITIONS ===');
    console.log('Total positions:', userPositions.length);
    console.log('Total claimable amount:', totalClaimable.toFixed(4), 'STT');
    
    const claimablePositions = userPositions.filter(pos => {
      if (pos.closed) return false;
      const now = Date.now() / 1000;
      const isMatured = pos.term > 0 && now >= pos.start + pos.term;
      const isFlexOrCustom = pos.planType === 0 || pos.planType === 1;
      return isMatured || isFlexOrCustom;
    });

    console.log('Claimable positions:', claimablePositions.length);
    claimablePositions.forEach((pos, index) => {
      console.log(`Position ${index + 1}:`, {
        id: pos.id.toString(),
        planType: pos.planType,
        principal: formatEther(pos.principal),
        aprBps: pos.aprBps
      });
    });

    if (claimablePositions.length === 0) {
      toast.error('No positions available to claim');
      return;
    }

    if (totalClaimable === 0) {
      toast.error('No claimable amount available');
      return;
    }

    toast.info(`Starting batch claim for ${claimablePositions.length} positions worth ${totalClaimable.toFixed(4)} STT`);
    
    // TODO: Implement actual batch claiming logic
    console.log('Would claim positions:', claimablePositions.map(p => p.id.toString()));
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <h2 className="text-2xl font-bold text-white mb-4">Withdrawal Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-400">{totalClaimable.toFixed(2)} STT</p>
          <p className="text-gray-400 text-sm">Available to Claim</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-400">{totalLocked.toFixed(2)} STT</p>
          <p className="text-gray-400 text-sm">Still Locked</p>
        </div>
      </div>
      
      {totalClaimable > 0 && (
        <button 
          onClick={handleClaimAll}
          disabled={isPending || isConfirming}
          className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors disabled:opacity-50"
        >
          {isPending || isConfirming ? 'Processing...' : `Claim All Available (${totalClaimable.toFixed(2)} STT)`}
        </button>
      )}
    </div>
  );
};

const SavingsPlanCard = ({ position }: { position: UserPosition }) => {
  const { closePosition, isPending, isConfirming, isSuccess, error, hash } = usePool();
  const { data: interest } = usePreviewInterest(position.id);
  

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    const positionId = position.id.toString();
    const planName = getPlanName(position.planType);
    
    if (isPending) {
      toast.loading(`Processing ${planName} position withdrawal...`, { id: `position-${positionId}` });
    } else if (isConfirming) {
      toast.loading('Confirming transaction on blockchain...', { id: `position-${positionId}` });
    } else if (isSuccess) {
      const amount = getClaimableAmount().toFixed(4);
      toast.success(`${planName} position claimed successfully! ${amount} STT withdrawn`, { 
        id: `position-${positionId}`,
        action: hash ? {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.somnia.network/tx/${hash}`, '_blank')
        } : undefined
      });
    } else if (error) {
      toast.error(`Failed to claim ${planName} position: ${error.message}`, { id: `position-${positionId}` });
    }
  }, [isPending, isConfirming, isSuccess, error, hash, position.id, position.planType]);
  
  const getPlanName = (planType: number) => {
    const types = ['Flex Save', 'Custom Duration', '6 Month', '1 Year', '2 Year'];
    return types[planType] || 'Unknown';
  };

  const getStatus = (position: UserPosition) => {
    if (position.closed) return 'claimed';
    
    const now = Date.now() / 1000;
    const isMatured = position.term > 0 && now >= position.start + position.term;
    const isFlexOrCustom = position.planType === 0 || position.planType === 1;
    
    if (isMatured || isFlexOrCustom) return 'claimable';
    if (isFlexOrCustom) return 'partial'; 
    return 'locked';
  };

  const getTimeRemaining = (position: UserPosition) => {
    if (position.closed) return 'Claimed';
    if (position.planType === 0) return 'Flexible'; 
    
    const now = Date.now() / 1000;
    const maturity = position.start + position.term;
    
    if (now >= maturity) return 'Matured';
    
    const remaining = maturity - now;
    const days = Math.floor(remaining / 86400);
    if (days > 365) return `${Math.floor(days / 365)} years left`;
    if (days > 30) return `${Math.floor(days / 30)} months left`;
    return `${days} days left`;
  };

  const getProgress = (position: UserPosition) => {
    if (position.closed) return 100;
    if (position.planType === 0) return 50; 
    
    const now = Date.now() / 1000;
    const elapsed = now - position.start;
    const progress = Math.min((elapsed / position.term) * 100, 100);
    return Math.floor(progress);
  };

  const getClaimableAmount = () => {
    const status = getStatus(position);
    const depositAmount = parseFloat(formatEther(position.principal));
    const earnedRewards = interest && typeof interest === 'bigint' ? parseFloat(formatEther(interest)) : 0;
    return status === 'claimable' ? depositAmount + earnedRewards : earnedRewards;
  };

  const status = getStatus(position);
  const timeRemaining = getTimeRemaining(position);
  const progress = getProgress(position);
  const depositAmount = parseFloat(formatEther(position.principal));
  const earnedRewards = interest && typeof interest === 'bigint' ? parseFloat(formatEther(interest)) : 0;
  const claimableAmount = getClaimableAmount();

  const statusConfig = {
    claimable: {
      bgColor: 'bg-green-900/50',
      textColor: 'text-green-300',
      borderColor: 'border-green-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
      buttonText: 'Claim Full Amount'
    },
    locked: {
      bgColor: 'bg-gray-900/50',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-600',
      buttonBg: 'bg-gray-600 cursor-not-allowed',
      buttonText: 'Locked'
    },
    partial: {
      bgColor: 'bg-yellow-900/50',
      textColor: 'text-yellow-300',
      borderColor: 'border-yellow-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
      buttonText: 'Claim Interest'
    },
    claimed: {
      bgColor: 'bg-blue-900/50',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-600',
      buttonBg: 'bg-gray-600 cursor-not-allowed',
      buttonText: 'Already Claimed'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  const handleClaim = async () => {
    if (status === 'locked' || status === 'claimed') {
      toast.error('This position cannot be claimed at this time');
      return;
    }
    
    console.log('=== INDIVIDUAL POSITION CLAIM ===');
    console.log('Position ID:', position.id.toString());
    console.log('Plan Type:', getPlanName(position.planType));
    console.log('Status:', status);
    console.log('Deposit Amount:', depositAmount.toFixed(4), 'STT');
    console.log('Earned Rewards:', earnedRewards.toFixed(4), 'STT');
    console.log('Claimable Amount:', claimableAmount.toFixed(4), 'STT');
    console.log('Position Details:', {
      principal: formatEther(position.principal),
      start: new Date(position.start * 1000).toISOString(),
      term: position.term,
      aprBps: position.aprBps,
      closed: position.closed
    });

    if (claimableAmount <= 0) {
      toast.error('No amount available to claim from this position');
      return;
    }

    toast.info(`Claiming ${claimableAmount.toFixed(4)} STT from ${getPlanName(position.planType)} position`);
    
    try {
      await closePosition(position.id);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  const handleEarlyExit = async () => {
    console.log('=== EARLY EXIT ATTEMPT ===');
    console.log('Position ID:', position.id.toString());
    console.log('Plan Type:', getPlanName(position.planType));
    console.log('Principal to recover:', depositAmount.toFixed(4), 'STT');
    console.log('Interest to forfeit:', earnedRewards.toFixed(4), 'STT');
    
    const confirmed = window.confirm(
      `Early exit will forfeit all interest (${earnedRewards.toFixed(4)} STT). You'll only receive your principal (${depositAmount.toFixed(4)} STT). Continue?`
    );
    
    if (!confirmed) {
      toast.info('Early exit cancelled');
      return;
    }

    toast.warning(`Processing early exit - forfeiting ${earnedRewards.toFixed(4)} STT interest`);
    
    try {
      await closePosition(position.id);
    } catch (err) {
      console.error('Early exit failed:', err);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{getPlanName(position.planType)} Plan</h3>
          <p className="text-gray-400 text-sm">Deposited: {depositAmount.toFixed(4)} STT</p>
        </div>
        <span className={`px-3 py-1 text-xs rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Earned Rewards</p>
            <p className="text-xl font-bold text-green-400">{earnedRewards.toFixed(4)} STT</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Time Remaining</p>
            <p className="text-white font-medium">{timeRemaining}</p>
          </div>
        </div>

        {position.planType !== 0 && (
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
                style={{width: `${progress}%`}}
              ></div>
            </div>
          </div>
        )}

        {(status === 'claimable' || status === 'partial') && claimableAmount > 0 && (
          <div className="bg-white/10 rounded-md p-3">
            <p className="text-sm text-gray-400">Available to Claim</p>
            <p className="text-2xl font-bold text-green-400">{claimableAmount.toFixed(4)} STT</p>
          </div>
        )}

        <button 
          onClick={handleClaim}
          disabled={status === 'locked' || status === 'claimed' || isPending || isConfirming}
          className={`w-full py-3 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonBg}`}
        >
          {isPending || isConfirming ? 'Processing...' : config.buttonText}
          {(status === 'claimable' || status === 'partial') && claimableAmount > 0 && 
            ` (${claimableAmount.toFixed(4)} STT)`
          }
        </button>

        {status === 'locked' && (
          <button 
            onClick={handleEarlyExit}
            disabled={isPending || isConfirming}
            className="w-full py-2 bg-red-600/20 border border-red-600 text-red-400 rounded-md text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
          >
            {isPending || isConfirming ? 'Processing...' : 'Early Exit (Forfeit Interest)'}
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-xl font-bold text-gray-300 mb-2">No Active Savings Plans</h3>
    <p className="text-gray-500 mb-6">You don't have any active savings plans to withdraw from.</p>
    <a 
      href="/dashboard/deposit"
      className="inline-flex px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors"
    >
      Start Saving Now
    </a>
  </div>
);

const Page = () => {
  const { isConnected, address } = useAccount();
  const { data: rawPositions, isLoading } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;

  const userPositions = positions?.[0] || [];

  useEffect(() => {
    if (isConnected && address) {
      console.log('=== WITHDRAW PAGE LOADED ===');
      console.log('Connected Address:', address);
      console.log('Total Positions:', userPositions.length);
      console.log('Loading State:', isLoading);
      
      if (userPositions.length > 0) {
        console.log('User Positions Summary:');
        userPositions.forEach((pos, index) => {
          console.log(`Position ${index + 1}:`, {
            id: pos.id.toString(),
            planType: pos.planType,
            principal: formatEther(pos.principal),
            closed: pos.closed,
            start: new Date(pos.start * 1000).toISOString(),
            term: pos.term
          });
        });
      }
    }
  }, [isConnected, address, userPositions, isLoading]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Connect your wallet to view and claim your savings</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your savings plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Withdraw & Claim</h1>
        <p className="text-gray-400">Manage your active savings plans and claim available rewards</p>
      </div>

      {userPositions.length > 0 ? (
        <>
          <TotalClaimableCard />

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your Savings Plans</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userPositions.map((position, index) => (
                <SavingsPlanCard key={index} position={position} />
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white mb-3">Withdrawal Information</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Claimable:</strong> Full deposit + rewards available for immediate withdrawal</p>
              <p>• <strong>Partial:</strong> Earned interest can be claimed for Flex/Custom plans, principal remains</p>
              <p>• <strong>Locked:</strong> Fixed plans locked until maturity, early exit forfeits all interest</p>
            </div>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default Page;