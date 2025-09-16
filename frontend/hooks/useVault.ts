import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '../lib/contracts'

export function useVault() {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createPod = async ({
    name,
    description,
    isPublic,
    contributionAmountEth,
    planType,
    customDays = 0
  }: {
    name: string;
    description: string;
    isPublic: boolean;
    contributionAmountEth: string;
    planType: number;
    customDays?: number;
  }) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'createPod',
      args: [
        name,
        description,
        isPublic,
        parseEther(contributionAmountEth),
        planType,
        customDays
      ]
    })
  }

  const joinPod = async (podId: bigint) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'joinPod',
      args: [podId],
    })
  }

  const joinPodWithAmount = async ({ podId, amountEth }: { podId: bigint; amountEth: string }) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'joinPod',
      args: [podId],
      value: parseEther(amountEth)
    })
  }

  const leavePod = async (podId: bigint) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'leavePod',
      args: [podId]
    })
  }

  const cancelPod = async (podId: bigint) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'cancelPod',
      args: [podId]
    })
  }

  // NEW: Close pod for joining
  const closeForJoining = async (podId: bigint) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'closeForJoining',
      args: [podId]
    })
  }

  const setPodVisibility = async (podId: bigint, isPublic: boolean) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'setPodVisibility',
      args: [podId, isPublic]
    })
  }

  const updatePodMetadata = async (podId: bigint, name: string, description: string) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'updatePodMetadata',
      args: [podId, name, description]
    })
  }

  const checkpoint = async (podId: bigint) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'checkpoint',
      args: [podId]
    })
  }

  return {
    createPod,
    joinPod,
    joinPodWithAmount,
    leavePod,
    cancelPod,
    closeForJoining, // NEW
    setPodVisibility,
    updatePodMetadata,
    checkpoint,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function usePodDetails(podId: bigint) {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'getPodDetails',
    args: [podId],
    query: { enabled: !!podId }
  })
}

// UPDATED: No pagination parameters needed
export function usePublicPods() {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'getPublicPods',
    args: []
  })
}

export function usePodMemberCount(podId: bigint) {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'getPodMemberCount',
    args: [podId],
    query: { enabled: !!podId }
  })
}

export function usePreviewMemberInterest(podId: bigint, userAddress: string) {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'previewMemberInterest',
    args: [podId, userAddress],
    query: { enabled: !!podId && !!userAddress }
  })
}

// NEW: Check if pod is joinable
export function useIsJoinable(podId: bigint) {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'isJoinable',
    args: [podId],
    query: { enabled: !!podId }
  })
}