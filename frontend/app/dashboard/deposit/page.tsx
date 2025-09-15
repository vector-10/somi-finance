'use client';

import React, { useState } from 'react';
import { VscLightbulbSparkle } from "react-icons/vsc";
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

const CalculatorTipCard = () => (
  <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold"><VscLightbulbSparkle /></span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Pro Tip</h3>
        <p className="text-gray-300 text-sm">
          Use our Calculate Interest tab to simulate different deposit amounts and time periods 
          to maximize your potential yields before committing to a savings plan.
        </p>
      </div>
    </div>
  </div>
);

const FlexSaveCard = () => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Flex Save</h3>
          <p className="text-gray-400 text-sm">Lowest commitment, flexible duration</p>
        </div>
        <div className="px-3 py-1  text-green-600 border border-green-600 rounded-sm text-sm font-bold">
          10% APY
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deposit Amount (STT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duration (Days)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            min="1"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <button className="w-full py-3 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors">
          Deposit to Flex Save
        </button>
      </div>
    </div>
  );
};

const CustomDurationCard = () => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  
  const calculateAPY = (days: number) => {
    if (days <= 30) return 12;
    if (days <= 60) return 14;
    if (days <= 90) return 16;
    if (days <= 120) return 18;
    return 20; 
  };
  
  const apy = duration ? calculateAPY(parseInt(duration)) : 12;

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Custom Duration</h3>
          <p className="text-gray-400 text-sm">Set your own timeframe (up to 150 days)</p>
        </div>
        <div className="px-3 py-1 text-green-600 border border-green-600  rounded-sm text-sm font-bold">
          {apy}% APY
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deposit Amount (STT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duration (Days) - Max 150 days
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="90"
            min="1"
            max="150"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="text-sm text-gray-400">
          Estimated yield: {amount && duration ? (parseFloat(amount) * (apy/100) * (parseInt(duration)/365)).toFixed(4) : '0.0000'} STT
        </div>
        
        <button className="w-full py-3 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors">
          Deposit Custom Duration
        </button>
      </div>
    </div>
  );
};

const FixedTermCard = () => {
  const [selectedTerm, setSelectedTerm] = useState('6m');
  const [amount, setAmount] = useState('');
  
  const terms = [
    { id: '6m', label: '6 Months', apy: 25, days: 180 },
    { id: '1y', label: '1 Year', apy: 35, days: 365 },
    { id: '2y', label: '2 Years', apy: 50, days: 730 }
  ];
  
  const selectedTermData = terms.find(term => term.id === selectedTerm);

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Fixed Term Savings</h3>
          <p className="text-gray-400 text-sm">Higher yields for longer commitments</p>
        </div>
        <div className="px-3 py-1 text-green-600 border border-green-600  rounded-sm text-sm font-bold">
          {selectedTermData?.apy}% APY
        </div>
      </div>
      
      {/* Term Selection Tabs */}
      <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mb-6">
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
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deposit Amount (STT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="bg-white/10 rounded-md p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Duration:</span>
              <p className="text-white font-medium">{selectedTermData?.days} days</p>
            </div>
            <div>
              <span className="text-gray-400">Est. Yield:</span>
              <p className="text-white font-medium">
                {amount && selectedTermData ? 
                  (parseFloat(amount) * (selectedTermData.apy/100) * (selectedTermData.days/365)).toFixed(4) 
                  : '0.0000'} STT
              </p>
            </div>
          </div>
        </div>
        
        <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors">
          Lock {selectedTermData?.label} Term
        </button>
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
          <p className="text-gray-500">Connect your wallet to start depositing and earning yields</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Solo Deposit</h1>
        <p className="text-gray-400">Choose your savings plan and start earning yields on Somnia</p>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WalletBalanceCard />
        <div className="lg:col-span-2">
          <CalculatorTipCard />
        </div>
      </div>

      {/* Savings Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FlexSaveCard />
        <CustomDurationCard />
      </div>

      {/* Fixed Term Card - Full Width */}
      <div className="max-w-4xl mx-auto">
        <FixedTermCard />
      </div>
    </div>
  );
};

export default Page;