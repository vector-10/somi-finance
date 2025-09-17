import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from 'wagmi'
import { parseEther, decodeEventLog } from 'viem'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { contracts } from '../lib/contracts'

interface CreatePodParams {
  name: string;
  description: string;
  isPublic: boolean;
  contributionAmountEth: string;
  planType: number;
  customDays?: number;
}

export function useVault() {
  const { writeContract, writeContractAsync, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const config = useConfig()

  const createPod = async ({
    name,
    description,
    isPublic,
    contributionAmountEth,
    planType,
    customDays = 0
  }: CreatePodParams) => {
    try {
      const hash = await writeContractAsync({
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
      });      
      const receipt = await waitForTransactionReceipt(config, { hash });
      
      let podId: bigint | undefined;
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ 
            abi: contracts.podsVault.abi, 
            data: log.data, 
            topics: log.topics, 
            strict: false 
          });
          console.log("Decoded event:", ev);
          if (ev.eventName === 'PodCreated' && ev.args && ev.args.length > 0) {
            console.log("Found PodCreated event!");
            console.log("Event args:", ev.args);
            podId = ev.args[0] as bigint;
            break;
          }
        } catch (logError) {
          console.log("Error decoding log:", logError);
        }
      }
      
      return { hash, podId };
    } catch (error) {
      console.error("=== CREATE POD ERROR ===");
      console.error("Error details:", error);
      throw error;
    }
  };

  // FIXED: Remove the old joinPod function and consolidate into one
  const joinPod = async ({ podId, amountEth }: { podId: bigint; amountEth: string }) => {
    console.log("=== JOIN POD START ===");
    console.log("Pod ID:", podId);
    console.log("Amount ETH:", amountEth);
    console.log("Parsed amount:", parseEther(amountEth));
    
    try {
      const result = await writeContractAsync({
        ...contracts.podsVault,
        functionName: 'joinPod',
        args: [podId],
        value: parseEther(amountEth)
      });
      console.log("Join pod transaction submitted:", result);
      return result;
    } catch (error) {
      console.error("=== JOIN POD ERROR ===");
      console.error(error);
      throw error;
    }
  }


  const leavePod = async (podId: bigint) => {
    try {
      const result = await writeContractAsync({
        ...contracts.podsVault,
        functionName: 'leavePod',
        args: [podId]
      });
      return result;
    } catch (error) {
      console.error("=== LEAVE POD ERROR ===");
      console.error(error);
      throw error;
    }
  }

  const cancelPod = async (podId: bigint) => {
    writeContract({
      ...contracts.podsVault,
      functionName: 'cancelPod',
      args: [podId]
    })
  }

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
    leavePod,
    cancelPod,
    closeForJoining,
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

export function usePublicPods() {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'getPublicPods',
    args: [],
    query: { 
      refetchInterval: 10000 
    }
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

export function useIsJoinable(podId: bigint) {
  return useReadContract({
    ...contracts.podsVault,
    functionName: 'isJoinable',
    args: [podId],
    query: { enabled: !!podId }
  })
}