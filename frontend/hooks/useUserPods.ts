import { useReadContract, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { readContract } from 'wagmi/actions'
import { useConfig } from 'wagmi'
import { contracts } from '../lib/contracts'

interface UserPod {
  id: bigint;
  name: string;
  description: string;
  planType: number;
  contributionAmount: bigint;
  membersJoined: number;
  activeMembers: number;
  activated: boolean;
  cancelled: boolean;
  closedForJoining: boolean;
  creator: string;
  userRole: 'creator' | 'member';
  canLeave: boolean;
  canCancel: boolean;
  canClose: boolean;
  status: 'FILLING' | 'ACTIVE' | 'CANCELLED' | 'CLOSED' | 'FULL';
}

interface MembershipStatus {
  joined: boolean;
  closed: boolean;
  joinedAt: number;
  receiptId: bigint;
}

export function useUserPods() {
  const { address } = useAccount();
  const config = useConfig();
  const [userPods, setUserPods] = useState<UserPod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: nextPodId } = useReadContract({
    ...contracts.podsVault,
    functionName: 'nextPodId',
    args: [],
    query: { enabled: !!address }
  });

  useEffect(() => {
    if (!address || !nextPodId) {
      setUserPods([]);
      return;
    }

    const fetchUserPods = async () => {
      setIsLoading(true);
      const pods: UserPod[] = [];
      
      try {
        const podIds = Array.from({ length: Number(nextPodId) }, (_, i) => BigInt(i + 1));
        
        for (const id of podIds) {
          const [podDetails, membership] = await Promise.all([
            readContract(config, {
              ...contracts.podsVault,
              functionName: 'getPodDetails',
              args: [id]
            }),
            readContract(config, {
              ...contracts.podsVault,
              functionName: 'member',
              args: [id, address as `0x${string}`]
            })
          ]);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const podData = podDetails as any;
          const memberData = membership as MembershipStatus;
          console.log('MyPods - Pod details:', podData);
          console.log('Contract address:', contracts.podsVault.address);

          if (podData && (podData[0] === address || memberData?.joined)) {
            const isCreator = podData[0] === address;
            const isMember = memberData?.joined && !memberData?.closed;
            
            if (isCreator || isMember) {
              const membersJoined = Number(podData[13]);
              const activated = podData[8];
              const cancelled = podData[11];
              const closedForJoining = podData[12];

              let status: UserPod['status'] = 'FILLING';
              if (cancelled) status = 'CANCELLED';
              else if (activated) status = 'ACTIVE';
              else if (closedForJoining && membersJoined === 5) status = 'FULL';
              else if (closedForJoining) status = 'CLOSED';

              pods.push({
                id,
                name: podData[1],
                description: podData[2],
                planType: podData[4],
                contributionAmount: podData[7],
                membersJoined,
                activeMembers: Number(podData[14]),
                activated,
                cancelled,
                closedForJoining,
                creator: podData[0],
                userRole: isCreator ? 'creator' : 'member',
                canLeave: isMember && !cancelled,
                canCancel: isCreator && !activated && !cancelled,
                canClose: isCreator && !cancelled && !closedForJoining,
                status
              });
            }
          }
        }
        
        setUserPods(pods);
      } catch (error) {
        console.error('Error fetching user pods:', error);
        setUserPods([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPods();
  }, [address, nextPodId, config]);

  return {
    userPods,
    isLoading,
    createdPods: userPods.filter(p => p.userRole === 'creator'),
    joinedPods: userPods.filter(p => p.userRole === 'member'),
    refetchUserPods: () => {
      if (address && nextPodId) {
        const fetchUserPods = async () => {
          setIsLoading(true);
          const pods: UserPod[] = [];
          
          try {
            const podIds = Array.from({ length: Number(nextPodId) }, (_, i) => BigInt(i + 1));
            
            for (const id of podIds) {
              const [podDetails, membership] = await Promise.all([
                readContract(config, {
                  ...contracts.podsVault,
                  functionName: 'getPodDetails',
                  args: [id]
                }),
                readContract(config, {
                  ...contracts.podsVault,
                  functionName: 'member',
                  args: [id, address as `0x${string}`]
                })
              ]);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const podData = podDetails as any;
              const memberData = membership as MembershipStatus;

              if (podData && (podData[0] === address || memberData?.joined)) {
                const isCreator = podData[0] === address;
                const isMember = memberData?.joined && !memberData?.closed;
                
                if (isCreator || isMember) {
                  const membersJoined = Number(podData[13]);
                  const activated = podData[8];
                  const cancelled = podData[11];
                  const closedForJoining = podData[12];

                  let status: UserPod['status'] = 'FILLING';
                  if (cancelled) status = 'CANCELLED';
                  else if (activated) status = 'ACTIVE';
                  else if (closedForJoining && membersJoined === 5) status = 'FULL';
                  else if (closedForJoining) status = 'CLOSED';

                  pods.push({
                    id,
                    name: podData[1],
                    description: podData[2],
                    planType: podData[4],
                    contributionAmount: podData[7],
                    membersJoined,
                    activeMembers: Number(podData[14]),
                    activated,
                    cancelled,
                    closedForJoining,
                    creator: podData[0],
                    userRole: isCreator ? 'creator' : 'member',
                    canLeave: isMember && !cancelled,
                    canCancel: isCreator && !activated && !cancelled,
                    canClose: isCreator && !cancelled && !closedForJoining,
                    status
                  });
                }
              }
            }
            
            setUserPods(pods);
          } catch (error) {
            console.error('Error fetching user pods:', error);
            setUserPods([]);
          } finally {
            setIsLoading(false);
          }
        };
        fetchUserPods();
      }
    }
  };
}