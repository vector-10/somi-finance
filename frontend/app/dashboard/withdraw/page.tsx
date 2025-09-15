'use client';

import React from 'react';
import { useAccount } from 'wagmi';

const TotalClaimableCard = () => {
  const totalClaimable = 156.75;
  const totalLocked = 2593.25;

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
        <button className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors">
          Claim All Available ({totalClaimable.toFixed(2)} STT)
        </button>
      )}
    </div>
  );
};

const SavingsPlanCard = ({ 
  planType, 
  depositAmount, 
  earnedRewards, 
  timeRemaining, 
  status, 
  progress, 
  claimableAmount 
}: {
  planType: string;
  depositAmount: number;
  earnedRewards: number;
  timeRemaining: string;
  status: 'claimable' | 'locked' | 'partial';
  progress: number;
  claimableAmount?: number;
}) => {
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
      buttonText: 'Claim Interest Only'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{planType} Savings Plan</h3>
          <p className="text-gray-400 text-sm">Deposited: {depositAmount.toFixed(2)} STT</p>
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

        {/* Progress Bar */}
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

        {/* Claimable Amount */}
        {(status === 'claimable' || status === 'partial') && claimableAmount && (
          <div className="bg-white/10 rounded-md p-3">
            <p className="text-sm text-gray-400">Available to Claim</p>
            <p className="text-2xl font-bold text-green-400">{claimableAmount.toFixed(4)} STT</p>
          </div>
        )}

        {/* Action Button */}
        <button 
          className={`w-full py-3 rounded-md text-white font-medium transition-colors ${config.buttonBg}`}
          disabled={status === 'locked'}
        >
          {config.buttonText}
          {(status === 'claimable' || status === 'partial') && claimableAmount && 
            ` (${claimableAmount.toFixed(4)} STT)`
          }
        </button>

        {/* Early Exit Option for Locked Plans */}
        {status === 'locked' && (
          <button className="w-full py-2 bg-red-600/20 border border-red-600 text-red-400 rounded-md text-sm font-medium hover:bg-red-600/30 transition-colors">
            Early Exit (10% Penalty)
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
    <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors">
      Start Saving Now
    </button>
  </div>
);

const Page = () => {
  const { isConnected } = useAccount();

  // Mock data - replace with real contract calls
  const mockSavingsPlans = [
    {
      planType: "6 Month",
      depositAmount: 500.00,
      earnedRewards: 45.2341,
      timeRemaining: "Completed",
      status: 'claimable' as const,
      progress: 100,
      claimableAmount: 545.2341
    },
    {
      planType: "12 Month", 
      depositAmount: 1000.00,
      earnedRewards: 98.7654,
      timeRemaining: "3 months left",
      status: 'partial' as const,
      progress: 75,
      claimableAmount: 98.7654
    },
    {
      planType: "24 Month",
      depositAmount: 1500.00,
      earnedRewards: 12.7500,
      timeRemaining: "18 months left",
      status: 'locked' as const,
      progress: 25,
      claimableAmount: 0
    }
  ];

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Withdraw & Claim</h1>
        <p className="text-gray-400">Manage your active savings plans and claim available rewards</p>
      </div>

      {mockSavingsPlans.length > 0 ? (
        <>
          {/* Summary Card */}
          <TotalClaimableCard />

          {/* Savings Plans Grid */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your Savings Plans</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockSavingsPlans.map((plan, index) => (
                <SavingsPlanCard key={index} {...plan} />
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white mb-3">Withdrawal Information</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Claimable:</strong> Full deposit + rewards available for immediate withdrawal</p>
              <p>• <strong>Partial:</strong> Earned interest can be claimed, principal remains locked</p>
              <p>• <strong>Locked:</strong> Funds locked until maturity, early exit incurs 10% penalty</p>
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