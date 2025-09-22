"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import MyPods from "@/app/dashboard/components/MyPods";
import { formatEther } from "viem";
import { toast } from "sonner";
import {
  useVault,
  usePodDetails,
  usePodMemberCount,
  usePublicPods,
  useIsJoinable,
} from "@/hooks/useVault";
import { PLAN_TYPES } from "@/lib/contracts";

interface PodDetails {
  creator: string;
  name: string;
  description: string;
  isPublic: boolean;
  planType: number;
  aprBps: number;
  term: number;
  contributionAmount: bigint;
  activated: boolean;
  cancelled: boolean;
  closedForJoining: boolean;
  startTime: number;
  maturityTime: number;
  membersJoined: number;
  activeMembers: number;
  totalDeposited: bigint;
}

interface MemberCount {
  membersJoined: bigint;
  activeMembers: bigint;
}

interface PublicPodsResult {
  0: bigint[];
  1: string[];
  2: number[];
  3: number[];
  4: bigint[];
  5: number[];
}

interface UseVaultHook {
  createPod: (params: any) => Promise<{ podId: bigint }>;
  joinPod: (params: { podId: bigint; amountEth: string }) => Promise<void>;
  closeForJoining: (podId: bigint) => Promise<void>;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  hash: string | null;
}

const WalletBalanceCard = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4 backdrop-blur">
      <h3 className="text-sm font-medium text-gray-400 mb-2">
        Available Balance
      </h3>
      <p className="text-2xl font-bold text-white">
        {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : "0.0000"}{" "}
        STT
      </p>
    </div>
  );
};

const InfoCard = () => (
  <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
    <h3 className="text-lg font-semibold text-white mb-3">
      About Savings Pods
    </h3>
    <div className="space-y-2 text-sm text-gray-300">
      <p>• All members contribute the same fixed amount set by creator</p>
      <p>• Pods auto-activate when 3+ members join, max 5 members total</p>
      <p>• Creator can close joining manually or it auto-closes at 5 members</p>
      <p>• Earn higher APY rates compared to solo savings plans</p>
      <p>• Fixed plans: no interest until maturity, full interest after</p>
    </div>
  </div>
);

const JoinPodTab = () => {
  const [podId, setPodId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const { data: publicPods } = usePublicPods() as { data: PublicPodsResult | undefined };
  const podData = publicPods
  ? {
      ids: publicPods[0] || [],
      names: publicPods[1] || [],
      planTypes: publicPods[2] || [],
      aprs: publicPods[3] || [],
      contributions: publicPods[4] || [],
      joinedCounts: publicPods[5] || [],
    }
  : null;

  const {
    data: podDetails,
    isLoading: isLoadingDetails,
    error: podError,
  } = usePodDetails(podId ? BigInt(podId) : BigInt(0)) as {
    data: PodDetails | undefined;
    isLoading: boolean;
    error: any;
  };
  console.log('JoinPod - Pod details:', podDetails);

  
  const { data: memberCount } = usePodMemberCount(
    podId ? BigInt(podId) : BigInt(0)
  ) as { data: MemberCount | undefined };
  
  const { data: isJoinable } = useIsJoinable(podId ? BigInt(podId) : BigInt(0)) as { data: boolean | undefined };

  // FIXED: Updated to use the single joinPod function
  const { joinPod, isPending, isConfirming, isSuccess, error } = useVault();

  const searchPod = () => {
    if (!podId) {
      toast.error("Please enter a Pod ID");
      return;
    }
    setIsSearching(true);
    setSearchAttempted(true);
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleJoinPod = async () => {
    const contributionAmount = podDetails?.contributionAmount;
    
    if (!podDetails || !podId || !contributionAmount) return;
    
    try {
      toast.loading("Joining pod...", { id: "join-pod" });
      await joinPod({
        podId: BigInt(podId),
        amountEth: formatEther(contributionAmount),
      });
    } catch (err) {
      console.error("Join pod failed:", err);
      toast.error("Failed to join pod", { id: "join-pod" });
    }
  };

  // Handle join success
  useEffect(() => {
    if (isSuccess) {
      toast.success("Successfully joined pod! Check your dashboard.", { id: "join-pod" });
    }
  }, [isSuccess]);

  // Handle join error
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message}`, { id: "join-pod" });
    }
  }, [error]);

  const getPlanName = (planType: number) => {
    const types = ["Flex", "Custom", "6 Month", "1 Year", "2 Year"];
    return types[planType] || "Unknown";
  };

  const getAPY = (planType: number) => {
    const apys = [12, 15, 20, 25, 50];
    return apys[planType] || 0;
  };

  const getPodStatus = () => {
    if (!podDetails) return 'UNKNOWN';
    if (podDetails.cancelled) return 'CANCELLED';
    if (podDetails.activated) return 'ACTIVE';
    if (!isJoinable && currentMembers === 5) return 'FULL';
    if (!isJoinable) return 'CLOSED';
    return 'FILLING';
  };


  const podExists =
    podDetails &&
    podDetails.creator !== "0x0000000000000000000000000000000000000000";
    const contributionAmount = (podDetails as any)?.[7]
  ? formatEther((podDetails as any)[7])
  : "0";
  const currentMembers = memberCount?.membersJoined ? Number(memberCount.membersJoined) : 0;
  const activeMembers = memberCount ? Number(memberCount.activeMembers) : 0;
  const status = getPodStatus();

  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    'FILLING': { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-600' },
    'ACTIVE': { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-600' },
    'FULL': { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-600' },
    'CLOSED': { bg: 'bg-gray-900/50', text: 'text-gray-400', border: 'border-gray-600' },
    'CANCELLED': { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-600' },
    'UNKNOWN': { bg: 'bg-gray-900/50', text: 'text-gray-400', border: 'border-gray-600' }
  };

  const config = statusConfig[status];
  const canJoin = isJoinable && !isPending && !isConfirming;

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
        <h3 className="text-xl font-bold text-white mb-4">Join Existing Pod</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pod ID (Numeric)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={podId}
                onChange={(e) => setPodId(e.target.value)}
                placeholder="e.g., 1"
                className="w-40 md:flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={searchPod}
                disabled={!podId || isSearching}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {isLoadingDetails && searchAttempted && (
            <div className="bg-white/10 border border-white/20 rounded-md p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-3"></div>
                <p className="text-gray-400">Loading pod details...</p>
              </div>
            </div>
          )}

          {searchAttempted && !isLoadingDetails && (!podExists || podError) && (
            <div className="bg-red-900/20 border border-red-600 rounded-md p-4">
              <p className="text-red-400">Pod not found or doesn't exist</p>
            </div>
          )}

          {podExists && !isLoadingDetails && (
            <div className="bg-white/10 border border-white/20 rounded-md p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {podDetails.name}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {podDetails.description}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Created by {podDetails?.creator?.slice(0, 6) || "Unknown"}...
                    {podDetails?.creator?.slice(-4) || ""}
                  </p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold mb-2">
                    {getAPY(podDetails.planType)}% APY
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-md border ${config.bg} ${config.text} ${config.border}`}>
                    {status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-400">Plan:</span>
                  <p className="text-white font-medium">
                    {getPlanName(podDetails.planType)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Members:</span>
                  <p className="text-white font-medium">
                    {currentMembers}/5 joined
                    {status === 'FILLING' && ` (${Math.max(0, 3 - currentMembers)} more to activate)`}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">
                    Contribution (per member):
                  </span>
                  <p className="text-white font-medium">
                    {contributionAmount} STT
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <p className="text-white font-medium">
                    {status === 'FULL' ? 'Pod Full (5/5)' :
                     status === 'CLOSED' ? 'Joining Closed by Creator' :
                     status === 'CANCELLED' ? 'Pod Cancelled' :
                     status === 'ACTIVE' ? 'Pod Active' :
                     `Open for joining`}
                  </p>
                </div>
              </div>

              {podDetails.term > 0 && (
                <div className="bg-white/10 rounded-md p-3 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-medium ml-2">
                      {Math.floor(podDetails.term / 86400)} days
                    </span>
                    {podDetails.activated && (
                      <>
                        <br />
                        <span className="text-gray-400">Started:</span>
                        <span className="text-white font-medium ml-2">
                          {new Date(
                            Number(podDetails.startTime) * 1000
                          ).toLocaleDateString()}
                        </span>
                        <br />
                        <span className="text-gray-400">Matures:</span>
                        <span className="text-white font-medium ml-2">
                          {new Date(
                            Number(podDetails.maturityTime) * 1000
                          ).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleJoinPod}
                disabled={!canJoin}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'FULL' ? 'Pod Full' :
                 status === 'CLOSED' ? 'Joining Closed' :
                 status === 'CANCELLED' ? 'Pod Cancelled' :
                 status === 'ACTIVE' ? 'Pod Already Active' :
                 isPending || isConfirming ? 'Processing...' :
                 `Join Pod (${contributionAmount} STT)`}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
  <h3 className="text-lg font-bold text-white mb-4">
    {podId ? `Search Results for Pod #${podId}` : 'Available Public Pods'}
  </h3>
  
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
        {podData && podData.ids.length > 0 ? (
          podData.ids
            .filter((id: bigint) => podId ? id.toString() === podId : true)
            .map((id: bigint, originalIndex: number) => {
              const index = podData.ids.indexOf(id);
              return (
                <div key={index} className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{podData.names[index]}</h4>
                        <p className="text-gray-400 text-sm">Pod #{id.toString()} • {podData.joinedCounts[index]}/5 members</p>
                      </div>
                      <div className="text-right">
                        <div className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">
                          {(Number(podData.aprs[index]) / 100).toFixed(1)}% APY
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{formatEther(podData.contributions[index])} STT</span>
                      <button 
                          onClick={() => {
                            setPodId(id.toString());
                            setSearchAttempted(true);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
                        >
                          View Details
                        </button>
                    </div>
                  </div>
              );
            })
        ) : (
          <p className="text-gray-400 text-center py-8">No pods found</p>
        )}
      </div>
    </div>
    </div>
  );
};

const CreatePodTab = ({ onPodCreated }: { onPodCreated?: () => void }) => {
  const [selectedTerm, setSelectedTerm] = useState("6m");
  const [podName, setPodName] = useState("");
  const [podDescription, setPodDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [customDays, setCustomDays] = useState("");
  const [createdPodId, setCreatedPodId] = useState<string | null>(null);

  const { createPod, closeForJoining, isPending, isConfirming, isSuccess, error, hash } =
    useVault();

  const terms = [
    { id: "flex", label: "Flex Save", apy: 12, planType: PLAN_TYPES.FLEX },
    {
      id: "custom",
      label: "Custom Days",
      apy: 15,
      planType: PLAN_TYPES.CUSTOM_DAYS,
    },
    { id: "6m", label: "6 Months", apy: 20, planType: PLAN_TYPES.FIXED_6M },
    { id: "1y", label: "1 Year", apy: 25, planType: PLAN_TYPES.FIXED_1Y },
    { id: "2y", label: "2 Years", apy: 50, planType: PLAN_TYPES.FIXED_2Y },
  ];

  const selectedTermData = terms.find((term) => term.id === selectedTerm);

  const handleCreatePod = async () => {
    if (!podName || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (
      selectedTerm === "custom" &&
      (!customDays || parseInt(customDays) <= 0 || parseInt(customDays) > 150)
    ) {
      toast.error("Custom duration must be between 1-150 days");
      return;
    }
  
    try {
      toast.loading("Creating pod...", { id: "create-pod" });
      
      console.log("About to call createPod...");
      const result = await createPod({
        name: podName,
        description: podDescription || `${podName} savings pod`,
        isPublic,
        contributionAmountEth: contributionAmount,
        planType: selectedTermData?.planType || 0,
        customDays: selectedTerm === "custom" ? parseInt(customDays) : 0,
      });
      
      console.log("CreatePod result:", result);
      console.log("Pod ID extracted:", result.podId);
      
      if (result.podId) {
        setCreatedPodId(result.podId.toString());
        toast.success(`Pod created! ID: ${result.podId}`, { id: "create-pod" });
      }
      
      onPodCreated?.();
    } catch (err) {
      console.error("Create pod failed:", err);
      toast.error("Failed to create pod", { id: "create-pod" });
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message}`, { id: "create-pod" });
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
        <h3 className="text-xl font-bold text-white mb-4">Create New Pod</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pod Name
            </label>
            <input
              type="text"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              placeholder="e.g., DeFi Builders Pod"
              disabled={isPending || isConfirming}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={podDescription}
              onChange={(e) => setPodDescription(e.target.value)}
              placeholder="Describe your pod's purpose or goals..."
              disabled={isPending || isConfirming}
              rows={2}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contribution Amount (STT per member)
            </label>
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="1000"
              step="0.01"
              min="0"
              disabled={isPending || isConfirming}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              All members must contribute exactly this amount (max 5 members)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visibility
            </label>
            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setIsPublic(true)}
                disabled={isPending || isConfirming}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                  isPublic
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setIsPublic(false)}
                disabled={isPending || isConfirming}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                  !isPublic
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                Private
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Savings Plan
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {terms.slice(0, 2).map((term) => (
                <button
                  key={term.id}
                  onClick={() => setSelectedTerm(term.id)}
                  disabled={isPending || isConfirming}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedTerm === term.id
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"
                  }`}
                >
                  {term.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 bg-white/10 rounded-lg p-1">
              {terms.slice(2).map((term) => (
                <button
                  key={term.id}
                  onClick={() => setSelectedTerm(term.id)}
                  disabled={isPending || isConfirming}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedTerm === term.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>

          {selectedTerm === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Duration (Days)
              </label>
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="90"
                min="1"
                max="150"
                disabled={isPending || isConfirming}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maximum 150 days for custom duration
              </p>
            </div>
          )}

          <div className="bg-white/10 rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">
                  {selectedTermData?.label} Plan
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedTerm === "flex"
                    ? "Flexible duration"
                    : selectedTerm === "custom"
                    ? `${customDays || 0} days duration`
                    : selectedTerm === "6m"
                    ? "180 days duration"
                    : selectedTerm === "1y"
                    ? "365 days duration"
                    : "730 days duration"}
                </p>
              </div>
              <div className="px-3 py-1 text-green-600 border border-green-600 rounded-sm text-sm font-bold">
                {selectedTermData?.apy}% APY
              </div>
            </div>
          </div>

          <button
            onClick={handleCreatePod}
            disabled={
              isPending ||
              isConfirming ||
              !podName ||
              !contributionAmount ||
              parseFloat(contributionAmount) <= 0 ||
              (selectedTerm === "custom" &&
                (!customDays ||
                  parseInt(customDays) <= 0 ||
                  parseInt(customDays) > 150))
            }
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors disabled:opacity-50"
          >
            {isPending || isConfirming ? "Creating Pod..." : "Create Pod"}
          </button>

          {createdPodId && (
          <div className="bg-green-900/20 border border-green-600 rounded-md p-4">
            <h4 className="text-green-400 font-semibold mb-2">Pod Created Successfully!</h4>
            <div className="flex items-center justify-between bg-white/10 rounded p-3">
              <span className="text-white font-mono">Pod ID: #{createdPodId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdPodId);
                  toast.success("Pod ID copied!");
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
              >
                Copy ID
              </button>
            </div>
            <p className="text-green-300 text-sm mt-2">
              Share this ID with friends to invite them to your pod.
            </p>
          </div>
        )}

          {selectedTerm !== "flex" && (
            <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded">
              ⚠️ Fixed and custom plans: Early exit before maturity forfeits all
              interest. You'll only get your principal back.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PublicPodsPreview = () => {
  const { data: publicPods, refetch } = usePublicPods() as {
    data: PublicPodsResult | undefined;
    refetch: () => void;
  };

  const podData = publicPods
  ? {
      ids: publicPods[0] || [],
      names: publicPods[1] || [],
      planTypes: publicPods[2] || [],
      aprs: publicPods[3] || [],
      contributions: publicPods[4] || [],
      joinedCounts: publicPods[5] || [],
    }
  : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6 backdrop-blur">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Public Pods</h3>
        <button
          onClick={() => refetch()}
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {podData && podData.ids.length > 0 ? (
          podData.ids.slice(0, 3).map((id: bigint, index: number) => (
            <div key={index} className="bg-white/10 rounded-md p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">
                    {podData.names[index]}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Pod #{id.toString()} •{" "}
                    {podData.joinedCounts[index].toString()}/5 members
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 font-medium">
                    {formatEther(podData.contributions[index])} STT
                  </p>
                  <p className="text-green-400 text-sm">
                    {(Number(podData.aprs[index]) / 100).toFixed(1)}% APY
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">
            No public pods available
          </p>
        )}
      </div>
    </div>
  );
};

const Page = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("join");

  // Get refetch function from public pods
  const { refetch: refetchPublicPods } = usePublicPods() as {
    refetch: () => void;
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500">
            Connect your wallet to join or create savings pods
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Savings Pods</h1>
        <p className="text-gray-400">
          Join friends or create group savings plans for higher yields
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WalletBalanceCard />
        <InfoCard />
        <MyPods />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-md backdrop-blur">
        <div className="flex space-x-1 bg-white/10 rounded-t-lg p-1">
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "join"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            Join Pod
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            Create Pod
          </button>
        </div>

        <div className="p-6">
          {activeTab === "join" ? <JoinPodTab /> : <CreatePodTab onPodCreated={refetchPublicPods} />}
        </div>
      </div>
    </div>
  );
};

export default Page;