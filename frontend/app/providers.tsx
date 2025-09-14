'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config, somniaShannon } from '../lib/web3';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, 
      gcTime: 1000 * 60 * 60 * 24, 
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={somniaShannon}
          showRecentTransactions={true}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}