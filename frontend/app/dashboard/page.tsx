'use client';

import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { CiBadgeDollar } from "react-icons/ci";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { formatEther } from 'viem';

const WalletOverviewCard = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="bg-[#1A2333] border border-gray-700 rounded-md p-6">
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
  <div className="bg-[#1A2333] border border-gray-700 rounded-md p-6">
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
    const totalSaved = 2750;
    const nextLevelRequirement = 5000;
    
    // Tier icons with golden colors
    const tierIcons = {
      Bronze: <CiBadgeDollar className="w-12 h-12 text-orange-600" />,
      Silver: <CiBadgeDollar className="w-12 h-12 text-gray-400" />,
      Gold: <BiSolidBadgeDollar className="w-20 h-20 text-yellow-500" />,
      Diamond: <CiBadgeDollar className="w-12 h-12 text-blue-400" />
    };
    
    return (
      <div className="bg-[#1A2333] border border-gray-700 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Saver Level</h3>
          <div className="px-3 py-1 bg-yellow-600 text-yellow-100 rounded-md text-sm font-bold">
            {level}
          </div>
        </div>
        
        {/* Icon Display Section */}
        <div className="flex flex-col items-center mb-4">
          {tierIcons[level as keyof typeof tierIcons]}
          <p className="text-xl font-bold text-yellow-400 mt-2">{totalSaved} STT</p>
          <p className="text-gray-400 text-sm">Total Saved</p>
        </div>
        
        {/* Tier Benefits */}
        <div className="text-center">
          <p className="text-yellow-400 text-sm font-medium">Gold Tier Benefits:</p>
          <p className="text-yellow-300 text-sm">+0.5% APY bonus on all plans</p>
          <p className="text-gray-400 text-xs mt-1">
            {nextLevelRequirement - totalSaved} STT until Diamond tier
          </p>
        </div>
      </div>
    );
  };




const StreakCard = () => (
  <div className="bg-[#1A2333] border border-gray-700 rounded-md p-6">
    <h3 className="text-lg font-semibold text-white mb-2">Savings Streak</h3>
    <div className="flex items-center justify-center space-x-4 min-h-[12rem]">
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
    <div className="bg-[#1A2333] border border-gray-700 rounded-md p-4">
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
  <div className="bg-[#1A2333] border border-gray-700 rounded-md p-4">
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



const SoloPlansSection = () => {
    const plans = [
      { planType: "6 Month", amount: "500.00", timeLeft: "2 months left", apy: "8.5%", status: "active" as const, progress: 67 },
      { planType: "12 Month", amount: "750.00", timeLeft: "8 months left", apy: "12.0%", status: "active" as const, progress: 33 },
      { planType: "24 Month", amount: "1,500.00", timeLeft: "Ready to claim!", apy: "18.0%", status: "claimable" as const, progress: 100 },
      { planType: "6 Month", amount: "300.00", timeLeft: "4 months left", apy: "8.5%", status: "active" as const, progress: 45 },
    ];
  
    return (
      <div className="bg-[#1A2333] border border-gray-700 rounded-md p-6 min-h-[280px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Solo Savings Plans</h2>
        </div>
        <div className="max-h-[200px] overflow-y-auto space-y-4 pr-2">
          {plans.map((plan, index) => (
            <SoloPlanCard key={index} {...plan} />
          ))}
        </div>
      </div>
    );
  };


const SavingsPodsSection = () => {
  const pods = [
    { podName: "DeFi Builders Pod", members: "9/10 members", target: "10,000", yourContribution: "500", podApy: "15.0%", status: "ACTIVE" },
    { podName: "Diamond Hands Pod", members: "5/8 members", target: "5,000", yourContribution: "250", podApy: "20.0%", status: "FILLING" },
    { podName: "Whale Savers Pod", members: "12/15 members", target: "50,000", yourContribution: "1,000", podApy: "25.0%", status: "ACTIVE" },
  ];

  return (
    <div className="bg-[#1A2333] border border-gray-700 rounded-md p-6 min-h-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Savings Pods</h2>
      </div>
      <div className="max-h-[200px] overflow-y-auto space-y-4 pr-2">
        {pods.map((pod, index) => (
          <PodCard key={index} {...pod} />
        ))}
      </div>
    </div>
  );
};

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
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletOverviewCard />
        <SavingsSummaryCard />
      </div>

      {/* Gamification Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SaverLevelCard />
        <StreakCard />
      </div>

      {/* Plans and Pods Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SoloPlansSection />
        <SavingsPodsSection />
      </div>
    </div>
  );
};

export default Page;