'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MdDashboard, 
  MdAccountBalanceWallet, 
  MdCallReceived, 
  MdGroups, 
  MdCalculate 
} from 'react-icons/md';

const tabs = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: MdDashboard,
    shortName: 'Home'
  },
  { 
    name: 'Solo Savings', 
    href: '/dashboard/deposit', 
    icon: MdAccountBalanceWallet,
    shortName: 'Deposit'
  },
  { 
    name: 'Savings Pods', 
    href: '/dashboard/pods', 
    icon: MdGroups,
    shortName: 'Pods'
  },
  { 
    name: 'Withdraw', 
    href: '/dashboard/withdraw', 
    icon: MdCallReceived,
    shortName: 'Withdraw'
  },
  { 
    name: 'Calculate Interest', 
    href: '/dashboard/interest', 
    icon: MdCalculate,
    shortName: 'Calculator'
  },
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

function DesktopTabNavigation() {
  const pathname = usePathname();
  
  return (
    <div className="hidden md:block border-b border-gray-800">
      <nav className="flex justify-center space-x-8 px-6" aria-label="Tabs">
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

function MobileBottomNavigation() {
  const pathname = usePathname();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/5 backdrop-blur border-t border-white/10">
      <nav className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors
                ${isActive ? 'text-purple-400' : 'text-gray-300'}
              `}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-purple-400' : 'text-gray-300'}`} />
              <span className={`text-xs font-medium truncate ${isActive ? 'text-purple-400' : 'text-gray-300'}`}>
                {tab.shortName}
              </span>
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
                <Link href="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
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

        {/* Desktop Tab Navigation */}
        <div className="max-w-7xl mx-auto w-full flex-shrink-0">
          <DesktopTabNavigation />
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNavigation />
      </div>
    </>
  );
}