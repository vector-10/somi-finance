import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '../lib/contracts'

export function useVault() {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const joinPod = async ({ podId, amountEth }: { podId: number; amountEth: string }) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'joinPod',
      args: [BigInt(podId)],
      value: parseEther(amountEth)
    })
  }

  const earlyExit = async (podId: number) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'earlyExit',
      args: [BigInt(podId)]
    })
  }

  const claim = async (podId: number) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'claim',
      args: [BigInt(podId)]
    })
  }

  const activatePod = async (podId: number) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'activatePod',
      args: [BigInt(podId)]
    })
  }

  return {
    joinPod,
    earlyExit,
    claim,
    activatePod,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  }
}