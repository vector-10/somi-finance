'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Solo Deposit', href: '/dashboard/deposit' },
  { name: 'Withdraw', href: '/dashboard/withdraw' },
  { name: 'Savings Pods', href: '/dashboard/pods' },
  { name: 'Calculate Interest', href: '/dashboard/calculator' },
];

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1A2333;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4B5563;
  }
  
  /* Apply to main content area */
  main::-webkit-scrollbar {
    width: 8px;
  }
  main::-webkit-scrollbar-track {
    background: #111827;
    border-radius: 4px;
  }
  main::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 4px;
  }
  main::-webkit-scrollbar-thumb:hover {
    background: #4B5563;
  }
`;

function TabNavigation() {
  const pathname = usePathname();
  
  return (
    <div className="border-b border-gray-800">
      <nav className="flex justify-center space-x-8 px-6 " aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors
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
    <>
      <style jsx global>{scrollbarStyles}</style>
      <div className="h-screen text-white bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(107,70,193,0.25),transparent),radial-gradient(40%_30%_at_100%_10%,rgba(59,130,246,0.18),transparent)] flex flex-col">
        {/* Grid overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
        {/* Fixed DApp Header */}
        <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5 flex-shrink-0">
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
                <ConnectButton />
              </div>
            </div>
          </div>
        </header>

        {/* Fixed Tab Navigation */}
        <div className="max-w-7xl mx-auto w-full flex-shrink-0">
          <TabNavigation />
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}