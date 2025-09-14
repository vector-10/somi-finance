'use client';

import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

const WalletOverviewCard = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Wallet Balance</h3>
          <p className="text-3xl font-bold text-purple-300 mt-2">
            {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} STT
          </p>
          <p className="text-gray-400 text-sm mt-1">~$1,247.50 USD</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors">
            Deposit
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

const SavingsSummaryCard = () => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-md p-6">
    <h3 className="text-lg font-semibold text-white mb-4">Active Savings</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-2xl font-bold text-white">2,750.00</p>
        <p className="text-gray-400 text-sm">Total STT Locked</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-400">156.75</p>
        <p className="text-gray-400 text-sm">Projected Earnings</p>
      </div>
    </div>
    <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-md">
      <p className="text-green-300 text-sm font-medium">Next claim available in 8 days</p>
      <p className="text-green-400 font-semibold">12.45 STT ready to claim</p>
    </div>
  </div>
);

const SaverLevelCard = () => {
  const level = "Gold";
  const progress = 75;
  const totalSaved = 2750;
  const nextLevelRequirement = 5000;
  
  return (
    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600/50 rounded-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Saver Level</h3>
        <div className="px-3 py-1 bg-yellow-600 text-yellow-100 rounded-md text-sm font-bold">
          {level}
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{totalSaved} STT saved</span>
          <span>{nextLevelRequirement} STT for Diamond</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" 
            style={{width: `${progress}%`}}
          ></div>
        </div>
      </div>
      <p className="text-yellow-400 text-sm">Gold Tier: +0.5% APY bonus on all plans</p>
    </div>
  );
};

const StreakCard = () => (
  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-600/50 rounded-md p-6">
    <h3 className="text-lg font-semibold text-white mb-2">Savings Streak</h3>
    <div className="flex items-center space-x-4">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-400">127</p>
        <p className="text-gray-400 text-sm">Days Active</p>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-green-300">+2.5%</p>
        <p className="text-gray-400 text-sm">Streak Bonus</p>
      </div>
    </div>
  </div>
);

const SoloPlanCard = ({ planType, amount, timeLeft, apy, status, progress }: {
  planType: string;
  amount: string;
  timeLeft: string;
  apy: string;
  status: 'active' | 'pending' | 'claimable';
  progress: number;
}) => {
  const statusStyles = {
    active: 'bg-green-900/50 text-green-300 border-green-600',
    pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-600',
    claimable: 'bg-purple-900/50 text-purple-300 border-purple-600'
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-md p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-white">{planType} Plan</h4>
          <p className="text-gray-400 text-sm">{amount} STT</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-md border ${statusStyles[status]}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-400 mb-3">
        <span>APY: {apy}</span>
        <span>{timeLeft}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div 
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
          style={{width: `${progress}%`}}
        ></div>
      </div>
      {status === 'claimable' && (
        <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors">
          Claim Rewards
        </button>
      )}
    </div>
  );
};

const PodCard = ({ podName, members, target, yourContribution, podApy, status }: {
  podName: string;
  members: string;
  target: string;
  yourContribution: string;
  podApy: string;
  status: string;
}) => (
  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-600/50 rounded-md p-4">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-semibold text-white">{podName}</h4>
        <p className="text-gray-400 text-sm">{members} • Target: {target} STT</p>
      </div>
      <span className="px-2 py-1 bg-purple-900 text-purple-300 border border-purple-600 rounded-md text-xs">
        {status}
      </span>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">Your share:</span>
        <span className="text-white">{yourContribution} STT</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Pod APY:</span>
        <span className="text-purple-300">{podApy}</span>
      </div>
    </div>
  </div>
);

const AchievementBadge = ({ title, description, earned }: {
  title: string;
  description: string;
  earned: boolean;
}) => (
  <div className={`p-3 rounded-md border ${earned 
    ? 'bg-gradient-to-br from-gold-900/30 to-yellow-900/30 border-yellow-600/50' 
    : 'bg-gray-800 border-gray-700'
  }`}>
    <div className="flex items-center space-x-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${earned 
        ? 'bg-yellow-600' 
        : 'bg-gray-600'
      }`}>
        <span className="text-xs">🏆</span>
      </div>
      <div>
        <p className={`font-medium text-sm ${earned ? 'text-yellow-300' : 'text-gray-400'}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

const ProtocolStatsCard = () => (
  <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-600/50 rounded-md p-6">
    <h3 className="text-lg font-semibold text-white mb-4">Protocol Stats</h3>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-xl font-bold text-blue-300">847K</p>
        <p className="text-gray-400 text-xs">Total STT Locked</p>
      </div>
      <div>
        <p className="text-xl font-bold text-blue-300">2,341</p>
        <p className="text-gray-400 text-xs">Active Savers</p>
      </div>
      <div>
        <p className="text-xl font-bold text-blue-300">14.2%</p>
        <p className="text-gray-400 text-xs">Avg APY</p>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ action, amount, time, hash }: {
  action: string;
  amount: string;
  time: string;
  hash: string;
}) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-800 last:border-b-0">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold">
          {action.includes('Deposit') ? '↓' : action.includes('Claim') ? '↑' : '👥'}
        </span>
      </div>
      <div>
        <p className="text-white text-sm font-medium">{action}</p>
        <p className="text-gray-400 text-xs">{amount} STT</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-gray-400 text-xs">{time}</p>
      <a 
        href={`https://explorer.somnia.network/tx/${hash}`}
        className="text-purple-400 hover:text-purple-300 text-xs"
        target="_blank"
        rel="noopener noreferrer"
      >
        View ↗
      </a>
    </div>
  </div>
);

const Page = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Access your Somi Finance portfolio and start earning</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* STT Price Ticker */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-md p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-gray-400 text-sm">STT Price</span>
              <p className="text-xl font-bold text-white">$0.4521</p>
            </div>
            <div>
              <span className="text-green-400 text-sm">+2.34%</span>
              <p className="text-gray-400 text-xs">24h change</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Your Portfolio Value</p>
            <p className="text-xl font-bold text-purple-300">$1,243.75</p>
          </div>
        </div>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WalletOverviewCard />
        <SavingsSummaryCard />
        <ProtocolStatsCard />
      </div>

      {/* Gamification Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SaverLevelCard />
        <StreakCard />
      </div>

      {/* Solo Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Solo Savings Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SoloPlanCard
            planType="6 Month"
            amount="500.00"
            timeLeft="2 months left"
            apy="8.5%"
            status="active"
            progress={67}
          />
          <SoloPlanCard
            planType="12 Month"
            amount="750.00"
            timeLeft="8 months left"
            apy="12.0%"
            status="active"
            progress={33}
          />
          <SoloPlanCard
            planType="24 Month"
            amount="1,500.00"
            timeLeft="Ready to claim!"
            apy="18.0%"
            status="claimable"
            progress={100}
          />
        </div>
      </div>

      {/* Savings Pods */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Savings Pods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PodCard
            podName="DeFi Builders Pod"
            members="9/10 members"
            target="10,000"
            yourContribution="500"
            podApy="15.0%"
            status="ACTIVE"
          />
          <PodCard
            podName="Diamond Hands Pod"
            members="5/8 members"
            target="5,000"
            yourContribution="250"
            podApy="20.0%"
            status="FILLING"
          />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <AchievementBadge
            title="First Depositor"
            description="Made your first deposit"
            earned={true}
          />
          <AchievementBadge
            title="Pod Master"
            description="Joined 3+ savings pods"
            earned={true}
          />
          <AchievementBadge
            title="Diamond Hands"
            description="Complete 24-month plan"
            earned={false}
          />
          <AchievementBadge
            title="Community Builder"
            description="Create successful pod"
            earned={false}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-md p-6">
          <ActivityItem
            action="Deposit to 6M Plan"
            amount="500.00"
            time="2 hours ago"
            hash="0x1234...5678"
          />
          <ActivityItem
            action="Joined Pod"
            amount="250.00"
            time="1 day ago"
            hash="0xabcd...efgh"
          />
          <ActivityItem
            action="Claim Rewards"
            amount="12.45"
            time="3 days ago"
            hash="0x9876...5432"
          />
          <ActivityItem
            action="Deposit to 12M Plan"
            amount="750.00"
            time="1 week ago"
            hash="0xdef0...1234"
          />
        </div>
      </div>
    </div>
  );
};

export default Page;