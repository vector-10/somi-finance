import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '../lib/contracts'

export function usePool() {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deposit = async ({ planId, amountEth }: { planId: number; amountEth: string }) => {
    writeContract({
      ...contracts.savingsPool,
      functionName: 'deposit',
      args: [BigInt(planId)],
      value: parseEther(amountEth)
    })
  }

  const claim = async (planId: number) => {
    writeContract({
      ...contracts.savingsPool,
      functionName: 'claim',
      args: [BigInt(planId)]
    })
  }

  return {
    deposit,
    claim,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function usePreviewInterest(user: string, planId: number) {
  return useReadContract({
    ...contracts.savingsPool,
    functionName: 'previewInterest',
    args: [user, BigInt(planId)],
    query: { enabled: !!user }
  })
}