'use client';

import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { CiBadgeDollar } from "react-icons/ci";
import Link from "next/link";
import { BiSolidBadgeDollar } from "react-icons/bi";
import { formatEther } from 'viem';
import { useUserPositions, usePreviewInterest } from '../../hooks/usePool';
import { usePublicPods } from '../../hooks/useVault';

interface Position {
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
  0: Position[];
  1: bigint;    
}

interface PublicPodsResult {
  0: bigint[];
  1: string[];
  2: number[];
  3: number[];
  4: bigint[];
  5: number[];
}

const WalletOverviewCard = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Wallet Balance</h3>
          <p className="text-3xl font-bold text-purple-300 mt-2">
            {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} STT
          </p>
          <p className="text-gray-400 text-sm mt-1">~$1,247.50 USD</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/deposit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors">
            Deposit
          </Link>
          <Link href="/dashboard/withdraw" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition-colors">
            Withdraw
          </Link>
        </div>
      </div>
    </div>
  );
};

const SavingsSummaryCard = () => {
  const { address } = useAccount();
  const { data: rawPositions } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;
  
  const userPositions = positions?.[0] || [];
  
  const totalLocked = userPositions.reduce((sum: number, pos: Position) => 
    pos.closed ? sum : sum + parseFloat(formatEther(pos.principal)), 0
  );

  const [totalEarnings, setTotalEarnings] = React.useState(0);

  React.useEffect(() => {
    const calculateEarnings = async () => {
      if (!userPositions.length) {
        setTotalEarnings(0);
        return;
      }

      let earnings = 0;
      for (const pos of userPositions) {
        if (!pos.closed) {
          const interest = await fetch(`/api/preview-interest?positionId=${pos.id}`).catch(() => null);
          if (interest) {
            const data = await interest.json();
            earnings += parseFloat(formatEther(data.interest || BigInt(0)));
          }
        }
      }
      setTotalEarnings(earnings);
    };

    calculateEarnings();
  }, [userPositions]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <h3 className="text-lg font-semibold text-white mb-4">Active Solo Savings</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold text-white">{totalLocked.toFixed(2)}</p>
          <p className="text-gray-400 text-sm">Total STT Locked</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-400">{totalEarnings.toFixed(4)}</p>
          <p className="text-gray-400 text-sm">Current Earnings</p>
        </div>
      </div>
      {totalLocked > 0 && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-md">
          <p className="text-green-300 text-sm font-medium">Active positions found</p>
          <p className="text-green-400 font-semibold">Check withdraw page to claim</p>
        </div>
      )}
    </div>
  );
};

const SaverLevelCard = () => {
  const { address } = useAccount();
  const { data: rawPositions } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;

  const totalSaved = positions?.[0]?.reduce((sum: number, pos) => 
    sum + parseFloat(formatEther(pos.principal)), 0
  ) || 0;
    
  const getLevel = (amount: number) => {
    if (amount >= 5000) return "Diamond";
    if (amount >= 2500) return "Gold"; 
    if (amount >= 1000) return "Silver";
    return "Bronze";
  };
  
  const level = getLevel(totalSaved);
  const nextTier = level === "Diamond" ? 5000 : 
                   level === "Gold" ? 5000 : 
                   level === "Silver" ? 2500 : 1000;
  
  const tierIcons = {
    Bronze: <CiBadgeDollar className="w-12 h-12 text-orange-600" />,
    Silver: <CiBadgeDollar className="w-12 h-12 text-gray-400" />,
    Gold: <BiSolidBadgeDollar className="w-20 h-20 text-yellow-500" />,
    Diamond: <CiBadgeDollar className="w-12 h-12 text-blue-400" />
  };
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Saver Level</h3>
        <div className="px-3 py-1 bg-yellow-600 text-yellow-100 rounded-md text-sm font-bold">
          {level}
        </div>
      </div>
      
      <div className="flex flex-col items-center mb-4">
        {tierIcons[level as keyof typeof tierIcons]}
        <p className="text-xl font-bold text-yellow-400 mt-2">{totalSaved.toFixed(0)} STT</p>
        <p className="text-gray-400 text-sm">Total Saved</p>
      </div>
      
      <div className="text-center">
        <p className="text-yellow-400 text-sm font-medium">{level} Tier Benefits:</p>
        <p className="text-yellow-300 text-sm">+{level === "Diamond" ? "2" : level === "Gold" ? "0.5" : "0"}% APY bonus</p>
        {level !== "Diamond" && (
          <p className="text-gray-400 text-xs mt-1">
            {nextTier - totalSaved} STT until next tier
          </p>
        )}
      </div>
    </div>
  );
};

const StreakCard = () => {
  const { address } = useAccount();
  const { data: rawPositions } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;
  
  const userPositions = positions?.[0] || [];
  
  const oldestPosition = userPositions.length > 0 ? 
    userPositions.reduce((oldest, pos) => 
      !pos.closed && pos.start < oldest.start ? pos : oldest, 
      userPositions[0]
    ) : null;
    
  const streakDays = oldestPosition && !oldestPosition.closed ? 
    Math.floor((Date.now() / 1000 - Number(oldestPosition.start)) / 86400) : 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <h3 className="text-lg font-semibold text-white mb-2">Savings Streak</h3>
      <div className="flex items-center justify-center space-x-4 min-h-[12rem]">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-400">{streakDays}</p>
          <p className="text-gray-400 text-sm">Days Active</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-300">+{Math.min(streakDays * 0.01, 5).toFixed(1)}%</p>
          <p className="text-gray-400 text-sm">Streak Bonus</p>
        </div>
      </div>
    </div>
  );
};

const SoloPlanCard = ({ position }: { position: Position }) => {
  const { data: interest } = usePreviewInterest(position.id);
  const interestAmount = interest && typeof interest === 'bigint' ? formatEther(interest) : '0';
  
  const getPlanName = (planType: number) => {
    const types = ['Flex', 'Custom', '6 Month', '1 Year', '2 Year'];
    return types[planType] || 'Unknown';
  };
  
  const getStatus = (position: Position) => {
    if (position.closed) return 'claimed';
    if (position.planType === 0 || position.planType === 1) return 'active'; 
    if (position.term > 0) {
      const maturity = Number(position.start) + Number(position.term);
      return Date.now() / 1000 >= maturity ? 'claimable' : 'active';
    }
    return 'active';
  };
  
  const status = getStatus(position);
  const statusStyles = {
    active: 'bg-green-900/50 text-green-300 border-green-600',
    claimable: 'bg-purple-900/50 text-purple-300 border-purple-600',
    claimed: 'bg-gray-900/50 text-gray-400 border-gray-600'
  };

  const getAPY = (planType: number) => {
    const apys = ['10%', '12%', '18%', '20%', '30%'];
    return apys[planType] || '0%';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4 backdrop-blur">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-white">{getPlanName(position.planType)} Plan</h4>
          <p className="text-gray-400 text-sm">{formatEther(position.principal)} STT</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-md border ${statusStyles[status as keyof typeof statusStyles]}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-400 mb-3">
        <span>APY: {getAPY(position.planType)}</span>
        <span>Interest: {interestAmount} STT</span>
      </div>
    </div>
  );
};

const SoloPlansSection = () => {
  const { address } = useAccount();
  const { data: rawPositions, isLoading } = useUserPositions(address || '', BigInt(0), BigInt(50));
  const positions = rawPositions as UserPositionsResult | undefined;
  
  const userPositions = positions?.[0] || [];

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-md p-6 min-h-[280px] backdrop-blur">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading your positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 min-h-[280px] backdrop-blur">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Solo Savings Plans</h2>
      </div>
      <div className="max-h-[200px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {userPositions.length > 0 ? (
          userPositions.map((position, index) => (
            <SoloPlanCard key={index} position={position} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No active positions yet</p>
            <p className="text-sm text-gray-500">Visit the deposit page to start saving</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SavingsPodsSection = () => {
  const { data: publicPods } = usePublicPods() as { data: PublicPodsResult | undefined };
  
  const podData = publicPods ? {
    ids: publicPods[0] || [],
    names: publicPods[1] || [],
    planTypes: publicPods[2] || [],
    aprs: publicPods[3] || [],
    contributions: publicPods[4] || [],
    joinedCounts: publicPods[5] || [],
  } : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 min-h-[280px] backdrop-blur">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Public Savings Pods</h2>
      </div>
      <div className="max-h-[200px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {podData && podData.ids.length > 0 ? (
          podData.ids.map((id: bigint, index: number) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-md p-4 backdrop-blur">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-white">{podData.names[index]}</h4>
                  <p className="text-gray-400 text-sm">{podData.joinedCounts[index].toString()}/5 members</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-md border bg-yellow-900/50 text-yellow-300 border-yellow-600">
                  OPEN
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Contribution:</span>
                  <span className="text-white">{formatEther(podData.contributions[index])} STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-purple-300">{(Number(podData.aprs[index]) / 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No public pods available</p>
            <p className="text-sm text-gray-500">Create one or join via Pod ID</p>
          </div>
        )}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletOverviewCard />
        <SavingsSummaryCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SaverLevelCard />
        <StreakCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SoloPlansSection />
        <SavingsPodsSection />
      </div>
    </div>
  );
};

export default Page;