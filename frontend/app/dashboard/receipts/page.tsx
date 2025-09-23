'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useUserPositions } from '@/hooks/usePool';

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

const NFTReceiptCard = ({ position }: { position: UserPosition }) => {
  const getTierInfo = (position: UserPosition) => {
    const now = Date.now() / 1000;
    const elapsed = now - position.start;
    

    let tier: 0 | 1 | 2 = 0; 
    if (position.closed) tier = 2; 
    else if (position.term > 0 && elapsed >= position.term / 2) tier = 1;

    const tiers: Record<0 | 1 | 2, { name: string; color: string; bgPattern: string; icon: string; description: string }> = {
    0: { 
      name: 'Bronze Saver', 
      color: 'from-orange-600 to-orange-400', 
      bgPattern: 'bg-gradient-to-br',
      icon: '🥉',
      description: 'Active Savings Position'
    },
    1: { 
      name: 'Silver Saver', 
      color: 'from-gray-400 to-gray-200', 
      bgPattern: 'bg-gradient-to-br',
      icon: '🥈',
      description: 'Halfway Milestone Reached'
    },
    2: { 
      name: 'Gold Saver', 
      color: 'from-yellow-500 to-yellow-300', 
      bgPattern: 'bg-gradient-to-br',
      icon: '🥇',
      description: 'Position Completed'
    }
  };
  return tiers[tier];
};


  const getPlanName = (planType: number) => {
    const types = ['Flex Save', 'Custom Duration', '6 Month', '1 Year', '2 Year'];
    return types[planType] || 'Unknown';
  };

  const tierInfo = getTierInfo(position);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
      {/* NFT Visual */}
      <div className={`w-full h-48 rounded-lg ${tierInfo.bgPattern} ${tierInfo.color} p-4 flex flex-col items-center justify-center text-white shadow-lg mb-4`}>
        <div className="text-6xl mb-2">{tierInfo.icon}</div>
        <h3 className="font-bold text-lg text-center">{tierInfo.name}</h3>
        <p className="text-sm opacity-90 text-center">Receipt #{position.receiptId.toString()}</p>
        <p className="text-xs opacity-75 mt-1 text-center">{tierInfo.description}</p>
      </div>

      {/* Position Details */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Plan Type:</span>
          <span className="text-white text-sm">{getPlanName(position.planType)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Amount:</span>
          <span className="text-white text-sm">{parseFloat(formatEther(position.principal)).toFixed(4)} STT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Status:</span>
          <span className={`text-sm ${position.closed ? 'text-green-400' : 'text-blue-400'}`}>
            {position.closed ? 'Completed' : 'Active'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Started:</span>
          <span className="text-white text-sm">
            {new Date(position.start * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Somi Finance Branding */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">Somi Finance Savings Receipt</p>
      </div>
    </div>
  );
};

const Page = () => {
  const { isConnected, address } = useAccount();
  const { data: rawPositions, isLoading } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;
  const userPositions = positions?.[0] || [];

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Connect your wallet to view your savings receipts</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Savings Receipts</h1>
        <p className="text-gray-400">Your NFT collection representing savings milestones and achievements</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-md p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{userPositions.length}</p>
          <p className="text-gray-400 text-sm">Total Receipts</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-md p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {userPositions.filter(p => !p.closed).length}
          </p>
          <p className="text-gray-400 text-sm">Active Positions</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-md p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {userPositions.filter(p => p.closed).length}
          </p>
          <p className="text-gray-400 text-sm">Completed</p>
        </div>
      </div>

      {/* Receipt Collection */}
      {userPositions.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Receipt Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPositions.map((position) => (
              <NFTReceiptCard key={position.receiptId.toString()} position={position} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">No Receipts Yet</h3>
          <p className="text-gray-500 mb-6">Start saving to earn your first NFT receipt!</p>
          <a 
            href="/dashboard/deposit"
            className="inline-flex px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors"
          >
            Start Saving
          </a>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-white/5 border border-white/10 rounded-md p-6">
        <h3 className="text-lg font-semibold text-white mb-3">About Savings Receipts</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong className="text-yellow-400">Bronze:</strong> Awarded when you start a savings position</p>
          <p>• <strong className="text-gray-300">Silver:</strong> Earned at halfway milestones for fixed-term plans</p>
          <p>• <strong className="text-yellow-500">Gold:</strong> Awarded when you complete a savings position</p>
          <p>• These NFT receipts are non-transferable proof of your savings journey</p>
        </div>
      </div>
    </div>
  );
};

export default Page;