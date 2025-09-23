// import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
// import { parseEther } from 'viem'
// import { contracts } from '../lib/contracts'

// export function usePool() {
//   const { writeContract, data: hash, error, isPending } = useWriteContract()
//   const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

//   const deposit = async ({ 
//     planType, 
//     customDays = 0, 
//     amountEth 
//   }: { 
//     planType: number; 
//     customDays?: number; 
//     amountEth: string 
//   }) => {
//     writeContract({
//       ...contracts.savingsPool,
//       functionName: 'deposit',
//       args: [planType, customDays],
//       value: parseEther(amountEth)
//     })
//   }

//   const closePosition = async (positionId: bigint) => {
//     writeContract({
//       ...contracts.savingsPool,
//       functionName: 'closePosition',
//       args: [positionId]
//     })
//   }

//   const checkpoint = async (positionId: bigint) => {
//     writeContract({
//       ...contracts.savingsPool,
//       functionName: 'checkpoint',
//       args: [positionId]
//     })
//   }

//   return {
//     deposit,
//     closePosition,
//     checkpoint,
//     isPending,
//     isConfirming,
//     isSuccess,
//     error,
//     hash
//   }
// }

// export function usePreviewInterest(positionId: bigint) {
//   return useReadContract({
//     ...contracts.savingsPool,
//     functionName: 'previewInterest',
//     args: [positionId],
//     query: { enabled: !!positionId }
//   })
// }


// export function useUserPositions(
//   userAddress: string, 
//   cursor: bigint = BigInt(0),   
//   size: bigint = BigInt(10)    
// ) {
//   return useReadContract({
//     ...contracts.savingsPool,
//     functionName: 'getUserPositionsPaginated',
//     args: [userAddress, cursor, size],
//     query: { enabled: !!userAddress }
//   })
// }



import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from 'wagmi'
import { parseEther } from 'viem'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { contracts } from '../lib/contracts'

export function usePool() {
  const { writeContract, writeContractAsync, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const config = useConfig()

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

  // Add this new batch function
  const claimMultiplePositions = async (positionIds: bigint[]) => {
    const results = [];
    
    for (let i = 0; i < positionIds.length; i++) {
      const positionId = positionIds[i];
      try {
        console.log(`Claiming position ${i + 1}/${positionIds.length}: ${positionId.toString()}`);
        
        const hash = await writeContractAsync({
          ...contracts.savingsPool,
          functionName: 'closePosition',
          args: [positionId]
        });
        
        const receipt = await waitForTransactionReceipt(config, { hash });
        
        results.push({ 
          positionId, 
          success: true, 
          hash, 
          receipt 
        });
        
        console.log(`Position ${positionId.toString()} claimed successfully`);
        
        // Delay between transactions
        if (i < positionIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`Failed to claim position ${positionId.toString()}:`, error);
        results.push({ 
          positionId, 
          success: false, 
          error 
        });
        // Continue with next position even if this one fails
      }
    }
    
    return results;
  };

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
    claimMultiplePositions, // Add this
    checkpoint,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  }
}

// Keep your existing functions unchanged
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
  cursor: bigint = BigInt(0),
  size: bigint = BigInt(10)
) {
  return useReadContract({
    ...contracts.savingsPool,
    functionName: 'getUserPositionsPaginated',
    args: [userAddress, cursor, size],
    query: { enabled: !!userAddress }
  })
}