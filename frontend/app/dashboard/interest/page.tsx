'use client';

import React, { useState, useEffect } from 'react';
import { TbMoneybag } from "react-icons/tb";


interface CalculationResults {
  principal: number;
  totalInterest: number;
  totalAmount: number;
  dailyInterest: number;
  apy: number;
  days: number;
}

interface APYRates {
  single: {
    flex: number;
    custom: number;
    '6m': number;
    '1y': number;
    '2y': number;
  };
  pods: {
    flex: number;
    custom: number;
    '6m': number;
    '1y': number;
    '2y': number;
  };
}

type SavingsType = 'single' | 'pods';
type PlanType = 'flex' | 'custom' | '6m' | '1y' | '2y';
type DurationUnit = 'days' | 'months' | 'years';

const Page = () => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('days');
  const [savingsType, setSavingsType] = useState('single');
  const [planType, setPlanType] = useState('custom');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<CalculationResults | null>(null);


  const apyRates: APYRates = {
    single: {
      flex: 10,
      custom: 12, 
      '6m': 18,
      '1y': 20,
      '2y': 30
    },
    pods: {
      flex: 12,
      custom: 15, 
      '6m': 20,
      '1y': 25,
      '2y': 50
    }
  };

  const getAPY = (type: SavingsType, plan: PlanType, days: number): number =>{
    if (plan === 'custom') {
      return days <= 150 ? apyRates[type].custom : apyRates[type]['6m'];
    }
    return apyRates[type][plan];
  };

  const convertDurationToDays = (value: string, unit: DurationUnit): number => {
    const numValue = parseFloat(value);
    switch (unit) {
      case 'days': return numValue;
      case 'months': return numValue * 30;
      case 'years': return numValue * 365;
      default: return numValue;
    }
  };

  const calculateInterest = () => {
    if (!amount) return;
    
    let days: number;
    if (planType === '6m') days = 180;
    else if (planType === '1y') days = 365;
    else if (planType === '2y') days = 730;
    else {
      if (!duration) return;
      days = convertDurationToDays(duration, durationUnit as DurationUnit);
    }
  
    setIsCalculating(true);
    
    setTimeout(() => {
      const principal = parseFloat(amount);
      const apy = getAPY(savingsType as SavingsType, planType as PlanType, days);
      
      const totalInterest = principal * (apy / 100) * (days / 365);
      const totalAmount = principal + totalInterest;
      const dailyInterest = totalInterest / days;
  
      setResults({
        principal,
        totalInterest,
        totalAmount,
        dailyInterest,
        apy,
        days
      });
      setIsCalculating(false);
    }, 2000);
  };


  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (planType === '6m' || planType === '1y' || planType === '2y') {
      if (amount) {
        calculateInterest();
      } else {
        setResults(null);
      }
    }

    else if (planType === 'flex' || planType === 'custom') {
      if (amount && duration) {
        calculateInterest();
      } else {
        setResults(null);
      }
    }
  }, [amount, duration, durationUnit, savingsType, planType]);

  const fixedTerms = [
    { id: '6m', label: '6 Months', days: 180 },
    { id: '1y', label: '1 Year', days: 365 },
    { id: '2y', label: '2 Years', days: 730 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Interest Calculator</h1>
        <p className="text-gray-400">Simulate potential yields for different savings plans and time periods</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Form */}
        <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur space-y-6">
          <h2 className="text-xl font-bold text-white">Calculate Your Returns</h2>
          
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deposit Amount (STT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Savings Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Savings Type
            </label>
            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setSavingsType('single')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  savingsType === 'single'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Solo Savings
              </button>
              <button
                onClick={() => setSavingsType('pods')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  savingsType === 'pods'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Savings Pods
              </button>
            </div>
          </div>

          {/* Plan Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plan Type
            </label>
            <div className="space-y-2">
              <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setPlanType('flex')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    planType === 'flex'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Flex Save
                </button>
                <button
                  onClick={() => setPlanType('custom')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    planType === 'custom'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Custom
                </button>
              </div>
              
              <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                {fixedTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => setPlanType(term.id)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      planType === term.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Input */}
          {(planType === 'flex' || planType === 'custom') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              {planType === 'custom' && (
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 150 days for custom duration
                </p>
              )}
            </div>
          )}

          {/* Current APY Display */}
          {amount && (planType !== 'custom' && planType !== 'flex' || duration) && (
            <div className="bg-white/10 rounded-md p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current APY:</span>
                <span className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
                  {(() => {
                    if (planType === 'custom' || planType === 'flex') {
                      const days = convertDurationToDays(duration, durationUnit as DurationUnit);
                      return getAPY(savingsType as SavingsType, planType as PlanType, days)
                    }
                    return getAPY(savingsType as SavingsType, planType as PlanType, 0)
                  })()}% APY
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Results Display */}
        <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-6">Projected Returns</h2>
          
          {isCalculating ? (
            <div className="flex items-center justify-center h-64">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400">Calculating your returns...</p>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-md p-4 text-center">
                  <p className="text-gray-400 text-sm">Initial Deposit</p>
                  <p className="text-2xl font-bold text-white">{results.principal.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">STT</p>
                </div>
                <div className="bg-white/10 rounded-md p-4 text-center">
                  <p className="text-gray-400 text-sm">Total Interest</p>
                  <p className="text-2xl font-bold text-green-400">{results.totalInterest.toFixed(4)}</p>
                  <p className="text-xs text-gray-500">STT</p>
                </div>
              </div>

              {/* Total Return */}
              <div className="bg-white/10 rounded-md p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Total Amount After {results.days} Days</p>
                <p className="text-4xl font-bold text-white mb-2">{results.totalAmount.toFixed(4)}</p>
                <p className="text-sm text-gray-400">STT</p>
                <div className="mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-sm text-lg font-bold inline-block">
                  {results.apy}% APY
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="bg-white/10 rounded-md p-4">
                <h3 className="text-white font-semibold mb-3">Daily Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Interest per day:</span>
                    <span className="text-green-400 font-medium">{results.dailyInterest.toFixed(6)} STT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-medium">{results.days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan type:</span>
                    <span className="text-white font-medium capitalize">
                      {savingsType} • {planType === 'flex' ? 'Flex Save' : 
                       planType === 'custom' ? 'Custom Duration' : 
                       fixedTerms.find(t => t.id === planType)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className=" text-green-500">
                <div className="text-4xl  mb-4"><TbMoneybag /></div>
                <p className="text-gray-400">Enter amount and duration to see projected returns</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;