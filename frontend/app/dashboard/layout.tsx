'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Deposit', href: '/dashboard/deposit' },
  { name: 'Withdraw', href: '/dashboard/withdraw' },
  { name: 'Savings Pods', href: '/dashboard/pods' },
  { name: 'Calculate Interest', href: '/dashboard/calculator' },
  { name: 'Subgraph', href: '/dashboard/subgraph' },
];

function TabNavigation() {
  const pathname = usePathname();
  
  return (
    <div className="border-b border-gray-800">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${isActive
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* DApp Header */}
      <header className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Somi Finance
              </Link>
              <div className="hidden sm:block text-sm text-gray-400">
                Somnia DeFi Savings Protocol
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-xs text-gray-400">
                Somnia Shannon Testnet
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto">
        <TabNavigation />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}