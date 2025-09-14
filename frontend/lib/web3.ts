import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL!] }
  }
})

export const config = getDefaultConfig({
  appName: 'Somi Finance',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [somniaShannon],
  ssr: true
})

export { somniaShannon }