'use client';

import React, { useState, useEffect } from 'react';
import { VscLightbulbSparkle } from "react-icons/vsc";
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { usePool } from '@/hooks/usePool';
import { PLAN_TYPES } from '@/lib/contracts';
import { toast } from 'sonner';


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
  const { deposit, isPending, isConfirming, isSuccess, error, hash } = usePool();

  useEffect(() => {
    if (isPending) {
      toast.loading('Initiating transaction...', { id: 'flex-deposit' });
    } else if (isConfirming) {
      toast.loading('Confirming transaction...', { id: 'flex-deposit' });
    } else if (isSuccess) {
      toast.success(`Flex Save deposit successful! ${amount} STT deposited at 10% APY`, { 
        id: 'flex-deposit',
        action: hash ? {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.somnia.network/tx/${hash}`, '_blank')
        } : undefined
      });
      setAmount('');
    } else if (error) {
      toast.error(`Deposit failed: ${error.message}`, { id: 'flex-deposit' });
    }
  }, [isPending, isConfirming, isSuccess, error, hash, amount]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }
    
    try {
      await deposit({
        planType: PLAN_TYPES.FLEX,
        customDays: 0,
        amountEth: amount
      });
    } catch (err) {
      console.error('Deposit failed:', err);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Flex Save</h3>
          <p className="text-gray-400 text-sm">Withdraw anytime with earned interest</p>
        </div>
        <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
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
            step="0.01"
            min="0"
            disabled={isPending || isConfirming}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
        </div>
        
        <button 
          onClick={handleDeposit}
          disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? 'Processing...' : 'Deposit to Flex Save'}
        </button>
      </div>
    </div>
  );
};

const CustomDurationCard = () => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const { deposit, isPending, isConfirming, isSuccess, error, hash } = usePool();
  
  const apy = 12;

  useEffect(() => {
    if (isPending) {
      toast.loading('Initiating custom duration deposit...', { id: 'custom-deposit' });
    } else if (isConfirming) {
      toast.loading('Confirming transaction...', { id: 'custom-deposit' });
    } else if (isSuccess) {
      toast.success(`Custom duration deposit successful! ${amount} STT locked for ${duration} days at 12% APY`, { 
        id: 'custom-deposit',
        action: hash ? {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.somnia.network/tx/${hash}`, '_blank')
        } : undefined
      });
      setAmount('');
      setDuration('');
    } else if (error) {
      toast.error(`Deposit failed: ${error.message}`, { id: 'custom-deposit' });
    }
  }, [isPending, isConfirming, isSuccess, error, hash, amount, duration]);

  const handleDeposit = async () => {
    if (!amount || !duration || parseFloat(amount) <= 0 || parseInt(duration) <= 0) {
      toast.error('Please enter valid amount and duration');
      return;
    }
    if (parseInt(duration) > 150) {
      toast.error('Maximum duration is 150 days');
      return;
    }
    
    try {
      await deposit({
        planType: PLAN_TYPES.CUSTOM_DAYS,
        customDays: parseInt(duration),
        amountEth: amount
      });
    } catch (err) {
      console.error('Deposit failed:', err);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Custom Duration</h3>
          <p className="text-gray-400 text-sm">Set your own timeframe (up to 150 days)</p>
        </div>
        <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
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
            step="0.01"
            min="0"
            disabled={isPending || isConfirming}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
            disabled={isPending || isConfirming}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
        </div>
        
        <div className="text-sm text-gray-400">
          Estimated yield: {amount && duration ? (parseFloat(amount) * (apy/100) * (parseInt(duration)/365)).toFixed(4) : '0.0000'} STT
        </div>
        
        <button 
          onClick={handleDeposit}
          disabled={isPending || isConfirming || !amount || !duration || parseFloat(amount) <= 0 || parseInt(duration) <= 0 || parseInt(duration) > 150}
          className="w-full py-3 bg-purple-600 hover:bg-purple-800 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? 'Processing...' : 'Deposit Custom Duration'}
        </button>

        <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded">
          ⚠️ Early withdrawal forfeits all interest. You'll only get your principal back.
        </div>
      </div>
    </div>
  );
};

const FixedTermCard = () => {
  const [selectedTerm, setSelectedTerm] = useState('6m');
  const [amount, setAmount] = useState('');
  const { deposit, isPending, isConfirming, isSuccess, error, hash } = usePool();
  
  const terms = [
    { id: '6m', label: '6 Months', apy: 18, days: 180, planType: PLAN_TYPES.FIXED_6M },
    { id: '1y', label: '1 Year', apy: 20, days: 365, planType: PLAN_TYPES.FIXED_1Y },
    { id: '2y', label: '2 Years', apy: 30, days: 730, planType: PLAN_TYPES.FIXED_2Y }
  ];
  
  const selectedTermData = terms.find(term => term.id === selectedTerm);

  useEffect(() => {
    if (isPending) {
      toast.loading(`Initiating ${selectedTermData?.label} fixed term deposit...`, { id: 'fixed-deposit' });
    } else if (isConfirming) {
      toast.loading('Confirming transaction...', { id: 'fixed-deposit' });
    } else if (isSuccess) {
      toast.success(`${selectedTermData?.label} deposit successful! ${amount} STT locked at ${selectedTermData?.apy}% APY`, { 
        id: 'fixed-deposit',
        action: hash ? {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.somnia.network/tx/${hash}`, '_blank')
        } : undefined
      });
      setAmount('');
    } else if (error) {
      toast.error(`Deposit failed: ${error.message}`, { id: 'fixed-deposit' });
    }
  }, [isPending, isConfirming, isSuccess, error, hash, amount, selectedTermData]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0 || !selectedTermData) {
      toast.error('Please enter a valid deposit amount');
      return;
    }
    
    try {
      await deposit({
        planType: selectedTermData.planType,
        customDays: 0,
        amountEth: amount
      });
    } catch (err) {
      console.error('Deposit failed:', err);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Fixed Term Savings</h3>
          <p className="text-gray-400 text-sm">Higher yields for longer commitments</p>
        </div>
        <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
          {selectedTermData?.apy}% APY
        </div>
      </div>
      
      <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mb-6">
        {terms.map((term) => (
          <button
            key={term.id}
            onClick={() => {
              setSelectedTerm(term.id);
              toast.info(`Selected ${term.label} plan with ${term.apy}% APY`);
            }}
            disabled={isPending || isConfirming}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
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
            step="0.01"
            min="0"
            disabled={isPending || isConfirming}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
        
        <button 
          onClick={handleDeposit}
          disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? 'Processing...' : `Lock ${selectedTermData?.label} Term`}
        </button>

        <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded">
          ⚠️ Early withdrawal forfeits all interest. You'll only get your principal back.
        </div>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Solo Deposit</h1>
        <p className="text-gray-400">Choose your savings plan and start earning yields on Somnia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WalletBalanceCard />
        <div className="lg:col-span-2">
          <CalculatorTipCard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FlexSaveCard />
        <CustomDurationCard />
      </div>

      <div className="max-w-4xl mx-auto">
        <FixedTermCard />
      </div>
    </div>
  );
};

export default Page;