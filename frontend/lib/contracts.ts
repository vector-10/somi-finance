import { Address } from 'viem'
import SavingsPoolAbi from '../abis/SavingsPool.json'
import PodsVaultAbi from '../abis/PodsVault.json'
import SavingsReceiptAbi from '../abis/SavingsReceipt1155.json'

export const contracts = {
  savingsPool: {
    address: process.env.NEXT_PUBLIC_POOL as Address,
    abi: SavingsPoolAbi
  },
  podsVault: {
    address: process.env.NEXT_PUBLIC_VAULT as Address, 
    abi: PodsVaultAbi
  },
  receipt: {
    address: process.env.NEXT_PUBLIC_RECEIPT as Address,
    abi: SavingsReceiptAbi
  }
} as const