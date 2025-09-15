'use client';

import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

const WalletBalanceCard = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4 backdrop-blur">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Available Balance</h3>
      <p className="text-2xl font-bold text-white">
        {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} STT
      </p>
    </div>
  );
};

const InfoCard = () => (
  <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
    <h3 className="text-lg font-semibold text-white mb-3">About Savings Pods</h3>
    <div className="space-y-2 text-sm text-gray-300">
      <p>• Pool resources with friends to earn higher yields together</p>
      <p>• Share the same savings plan terms and duration</p>
      <p>• Each member can contribute different amounts</p>
      <p>• Rewards distributed proportionally to contributions</p>
    </div>
  </div>
);

const JoinPodTab = () => {
  const [podId, setPodId] = useState('');
  const [amount, setAmount] = useState('');
  const [podInfo, setPodInfo] = useState(null);

  const searchPod = () => {
    // Mock pod lookup - replace with real contract call
    if (podId) {
      setPodInfo({
        id: podId,
        name: "DeFi Builders Pod",
        creator: "0x1234...5678",
        plan: "12 Month Fixed",
        apy: "35%",
        target: "10,000 STT",
        current: "7,500 STT",
        members: 6,
        maxMembers: 10,
        timeLeft: "2 days to join"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
        <h3 className="text-xl font-bold text-white mb-4">Join Existing Pod</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pod ID
            </label>
            <div className="flex space-x-2">
            <input
                type="text"
                value={podId}
                onChange={(e) => setPodId(e.target.value)}
                placeholder="Enter Pod ID (e.g., POD-12345)"
                className="w-40  md:flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
                onClick={searchPod}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors"
            >
                Search
            </button>
            </div>
          </div>

          {podInfo && (
            <div className="bg-white/10 border border-white/20 rounded-md p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{podInfo.name}</h4>
                  <p className="text-gray-400 text-sm">Created by {podInfo.creator}</p>
                </div>
                <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
                  {podInfo.apy} APY
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-400">Plan:</span>
                  <p className="text-white font-medium">{podInfo.plan}</p>
                </div>
                <div>
                  <span className="text-gray-400">Members:</span>
                  <p className="text-white font-medium">{podInfo.members}/{podInfo.maxMembers}</p>
                </div>
                <div>
                  <span className="text-gray-400">Progress:</span>
                  <p className="text-white font-medium">{podInfo.current}/{podInfo.target}</p>
                </div>
                <div>
                  <span className="text-gray-400">Join deadline:</span>
                  <p className="text-white font-medium">{podInfo.timeLeft}</p>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
                  style={{width: '75%'}}
                ></div>
              </div>
            </div>
          )}

          {podInfo && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Contribution (STT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <button className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors">
                Join Pod ({amount || '0'} STT)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreatePodTab = () => {
  const [selectedTerm, setSelectedTerm] = useState('6m');
  const [podName, setPodName] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [createdPodId, setCreatedPodId] = useState('');

  const terms = [
    { id: '6m', label: '6 Months', apy: 25, days: 180 },
    { id: '1y', label: '1 Year', apy: 35, days: 365 },
    { id: '2y', label: '2 Years', apy: 50, days: 730 }
  ];

  const selectedTermData = terms.find(term => term.id === selectedTerm);

  const createPod = () => {
    // Generate random pod ID
    const randomId = `POD-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    setCreatedPodId(randomId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
        <h3 className="text-xl font-bold text-white mb-4">Create New Pod</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pod Name
            </label>
            <input
              type="text"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              placeholder="e.g., DeFi Builders Pod"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Members
              </label>
              <input
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder="10"
                min="2"
                max="20"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Amount (STT)
              </label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Savings Plan
            </label>
            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
              {terms.map((term) => (
                <button
                  key={term.id}
                  onClick={() => setSelectedTerm(term.id)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTerm === term.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{selectedTermData?.label} Plan</p>
                <p className="text-gray-400 text-sm">{selectedTermData?.days} days duration</p>
              </div>
              <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
                {selectedTermData?.apy}% APY
              </div>
            </div>
          </div>

          <button 
            onClick={createPod}
            className="w-full py-3 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors"
          >
            Create Pod
          </button>

          {createdPodId && (
            <div className="bg-green-900/20 border border-green-600 rounded-md p-4">
              <h4 className="text-green-400 font-semibold mb-2">Pod Created Successfully!</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pod ID:</span>
                  <span className="text-white font-mono">{createdPodId}</span>
                </div>
                <p className="text-green-300 text-sm">
                  Share this Pod ID with your friends so they can join your savings pod.
                </p>
                <button 
                  onClick={() => navigator.clipboard.writeText(createdPodId)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition-colors"
                >
                  Copy Pod ID
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('join');

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Connect your wallet to join or create savings pods</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Savings Pods</h1>
        <p className="text-gray-400">Join friends or create group savings plans for higher yields</p>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WalletBalanceCard />
        <div className="lg:col-span-2">
          <InfoCard />
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-md backdrop-blur">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/10 rounded-t-lg p-1">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'join'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Join Pod
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Create Pod
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'join' ? <JoinPodTab /> : <CreatePodTab />}
        </div>
      </div>
    </div>
  );
};

export default Page;