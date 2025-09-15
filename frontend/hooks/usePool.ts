import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts, PLAN_TYPES } from '../lib/contracts'

export function usePool() {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deposit = async ({ 
    planType, 
    customDays = 0, 
    amountEth 
  }: { 
    planType: number; 
    customDays?: number; 
    amountEth: string 
  }) => {
    writeContract({
      ...contracts.savingsPool,
      functionName: 'deposit',
      args: [planType, customDays],
      value: parseEther(amountEth)
    })
  }

  const closePosition = async (positionId: bigint) => {
    writeContract({
      ...contracts.savingsPool,
      functionName: 'closePosition',
      args: [positionId]
    })
  }

  const checkpoint = async (positionId: bigint) => {
    writeContract({
      ...contracts.savingsPool,
      functionName: 'checkpoint',
      args: [positionId]
    })
  }

  return {
    deposit,
    closePosition,
    checkpoint,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function usePreviewInterest(positionId: bigint) {
  return useReadContract({
    ...contracts.savingsPool,
    functionName: 'previewInterest',
    args: [positionId],
    query: { enabled: !!positionId }
  })
}


export function useUserPositions(
  userAddress: string, 
  cursor: bigint = 0n, 
  size: bigint = 10n
) {
  return useReadContract({
    ...contracts.savingsPool,
    functionName: 'getUserPositionsPaginated',
    args: [userAddress, cursor, size],
    query: { enabled: !!userAddress }
  })
}