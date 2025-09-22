import React, { useState } from 'react';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { useUserPods } from '@/hooks/useUserPods';
import { useVault } from '@/hooks/useVault';

interface Pod {
  id: bigint;
  name: string;
  description: string;
  status: 'FILLING' | 'ACTIVE' | 'FULL' | 'CLOSED' | 'CANCELLED';
  planType: number;
  contributionAmount: bigint;
  membersJoined: number;
  userRole: 'creator' | 'member';
  canCancel?: boolean;
  canClose?: boolean;
  canLeave?: boolean;
}

interface PodModalProps {
  pod: Pod | null; 
  isOpen: boolean;
  onClose: () => void;
  onRefetch: () => void;
}

const PodModal: React.FC<PodModalProps> = ({ pod, isOpen, onClose, onRefetch }) => {
  const { leavePod, cancelPod, closeForJoining, isPending } = useVault();

  if (!isOpen || !pod) return null;

  const handleAction = async (action: string) => {
    try {
      toast.loading(`${action}...`, { id: 'pod-action' });
      
      switch (action) {
        case 'Leave Pod':
          await leavePod(pod.id);
          break;
        case 'Cancel Pod':
          await cancelPod(pod.id);
          break;
        case 'Close Joining':
          await closeForJoining(pod.id);
          break;
      }
      
      toast.success(`${action} successful!`, { id: 'pod-action' });
      onRefetch(); 
      onClose();
    } catch {
      toast.error(`${action} failed`, { id: 'pod-action' });
    }
  };

  const getActions = () => {
    const actions = [];
    
    if (pod.userRole === 'creator') {
      if (pod.canCancel) actions.push('Cancel Pod');
      if (pod.canClose) actions.push('Close Joining');
    } else {
      if (pod.canLeave) actions.push('Leave Pod');
    }
    
    return actions;
  };

  const getPlanName = (planType: number) => {
    const types = ["Flex", "Custom", "6 Month", "1 Year", "2 Year"];
    return types[planType] || "Unknown";
  };

  const getAPY = (planType: number) => {
    const apys = [12, 15, 20, 25, 50];
    return apys[planType] || 0;
  };

  const statusConfig = {
    'FILLING': { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-600' },
    'ACTIVE': { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-600' },
    'FULL': { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-600' },
    'CLOSED': { bg: 'bg-gray-900/50', text: 'text-gray-400', border: 'border-gray-600' },
    'CANCELLED': { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-600' }
  };

  const config = statusConfig[pod.status as keyof typeof statusConfig];
  const actions = getActions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{pod.name}</h3>
            <p className="text-gray-400 text-sm">{pod.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Role:</span>
            <span className="text-white capitalize">{pod.userRole}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Plan:</span>
            <span className="text-white">{getPlanName(pod.planType)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">APY:</span>
            <span className="text-green-400">{getAPY(pod.planType)}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Contribution:</span>
            <span className="text-white">{formatEther(pod.contributionAmount)} STT</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Members:</span>
            <span className="text-white">{pod.membersJoined}/5</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`px-2 py-1 text-xs rounded-md border ${config.bg} ${config.text} ${config.border}`}>
              {pod.status}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {actions.length > 0 ? (
            actions.map((action) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                disabled={isPending}
                className={`w-full py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                  action === 'Cancel Pod' || action === 'Leave Pod'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isPending ? 'Processing...' : action}
              </button>
            ))
          ) : (
            <p className="text-gray-400 text-center py-2">No actions available</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MyPods: React.FC = () => {
  const { userPods, isLoading, createdPods, joinedPods, refetchUserPods } = useUserPods();
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('joinedPods count:', joinedPods.length);
  console.log('joinedPods:', joinedPods);

  const openModal = (pod: Pod) => {
    setSelectedPod(pod);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPod(null);
    setIsModalOpen(false);
  };

  const getPlanName = (planType: number) => {
    const types = ["Flex", "Custom", "6 Month", "1 Year", "2 Year"];
    return types[planType] || "Unknown";
  };

  const getAPY = (planType: number) => {
    const apys = [12, 15, 20, 25, 50];
    return apys[planType] || 0;
  };

  const statusConfig = {
    'FILLING': { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-600' },
    'ACTIVE': { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-600' },
    'FULL': { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-600' },
    'CLOSED': { bg: 'bg-gray-900/50', text: 'text-gray-400', border: 'border-gray-600' },
    'CANCELLED': { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-600' }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4">My Pods</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4">My Pods</h3>
        
        {userPods.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            You haven't created or joined any pods yet
          </p>
        ) : (
          <div className="space-y-4">
            {createdPods.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-300 mb-2">Created by You</h4>
                <div className="space-y-2">
                  {createdPods.map((pod) => {
                    const config = statusConfig[pod.status];
                    return (
                      <div
                        key={pod.id.toString()}
                        className="bg-white/10 rounded-md p-3 cursor-pointer hover:bg-white/15 transition-colors"
                        onClick={() => openModal(pod)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{pod.name}</p>
                            <p className="text-gray-400 text-sm">
                              Pod #{pod.id.toString()} • {pod.membersJoined}/5 members • {getPlanName(pod.planType)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 text-sm font-medium">
                              {getAPY(pod.planType)}% APY
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-md border ${config.bg} ${config.text} ${config.border}`}>
                              {pod.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">
                            {formatEther(pod.contributionAmount)} STT per member
                          </span>
                          <span className="text-purple-400 text-xs">CREATOR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {joinedPods.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-300 mb-2">Joined Pods</h4>
                <div className="space-y-2">
                  {joinedPods.map((pod) => {
                    const config = statusConfig[pod.status];
                    return (
                      <div
                        key={pod.id.toString()}
                        className="bg-white/10 rounded-md p-3 cursor-pointer hover:bg-white/15 transition-colors"
                        onClick={() => openModal(pod)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{pod.name}</p>
                            <p className="text-gray-400 text-sm">
                              Pod #{pod.id.toString()} • {pod.membersJoined}/5 members • {getPlanName(pod.planType)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 text-sm font-medium">
                              {getAPY(pod.planType)}% APY
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-md border ${config.bg} ${config.text} ${config.border}`}>
                              {pod.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">
                            {formatEther(pod.contributionAmount)} STT contributed
                          </span>
                          <span className="text-blue-400 text-xs">MEMBER</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PodModal
        pod={selectedPod}
        isOpen={isModalOpen}
        onClose={closeModal}
        onRefetch={refetchUserPods} 
        />
    </>
  );
};

export default MyPods;