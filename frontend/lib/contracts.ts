import { Address } from 'viem'
import SavingsPoolAbi from '../abis/SavingsPool.json'
import PodsVaultAbi from '../abis/PodsVault.json'
import SavingsReceiptAbi from '../abis/SavingsReceipt1155.json'
import MockTreasuryAbi from '../abis/MockTreasury.json'

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
  },
  treasury: {
    address: process.env.NEXT_PUBLIC_TREASURY as Address,
    abi: MockTreasuryAbi
  }
} as const


export const PLAN_TYPES = {
  FLEX: 0,
  CUSTOM_DAYS: 1,
  FIXED_6M: 2,
  FIXED_1Y: 3,
  FIXED_2Y: 4
} as const


export const SOLO_APY = {
  FLEX: 1000,      
  CUSTOM: 1200,    
  FIXED_6M: 1800,  
  FIXED_1Y: 2000,  
  FIXED_2Y: 3000   
} as const

export const POD_APY = {
  FLEX: 1200,     
  CUSTOM: 1500,    
  FIXED_6M: 2000,  
  FIXED_1Y: 2500,  
  FIXED_2Y: 5000   
} as const