┌────────────────────────────── Frontend (Next.js App Router) ──────────────────────────────┐
│  UI Pages: /solo  /pods  /receipts  /dashboard                                             │
│  Wallet: RainbowKit + wagmi                                                                │
│  Data: TanStack Query cache, viem format/parse (no subgraph)                               │
│  Hooks: usePoolV2()  useVaultV2()  useReceipt()  +  useVaultDebug() (diagnostics)          │
│  UX: toasts/confetti, event-driven refetch, exact STT value checks                         │
└───────────────┬───────────────────────────────┬───────────────────────────────┬────────────┘
                │                               │                               │
                │ writes (tx)                   │ reads (RPC calls)             │ watch events
                ▼                               ▼                               ▼
        ┌────────────────┐               ┌────────────────┐               ┌─────────────────────┐
        │  wagmi actions │               │  viem/wagmi    │               │  watchContractEvent │
        │  writeContract │               │  readContract  │               │  (Pods/Pool/Receipt)│
        └───────┬────────┘               └────────┬───────┘               └───────────┬─────────┘
                │  value: STT (parseEther)        │                                   │ decode logs
                │  chain guard = 50312            │                                   │ -> invalidate queries
                ▼                                  ▼                                   ▼
        ┌──────────────────────────────────────────────────────────────────────────────────────┐
        │                          Somnia Shannon Testnet (chainId 50312)                      │
        │      RPC: NEXT_PUBLIC_RPC_URL                                                         │
        │                                                                                       │
        │  ┌───────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────┐ │
        │  │  SavingsPoolV2        │   │        PodsVaultV2        │   │ SavingsReceipt1155  │ │
        │  │  (solo savings)       │   │  (group pods)             │   │ (ERC1155 receipts)  │ │
        │  │ deposit/close/checkpt │   │ create/join/leave/...     │   │ mint + tier upgrades│ │
        │  │ events: Position*     │   │ events: Pod*/Member*      │   │ tierOf/balanceOf    │ │
        │  └──────────┬────────────┘   └──────────┬────────────────┘   └──────────┬──────────┘ │
        │             │ principal back             │ principal back                 │ receiptId │
        │             │                            │                                 ▲          │
        │             ▼                            ▼                                 │          │
        │        ┌───────────────────────────────────────────┐                       │          │
        │        │              Treasury (payOut)            │<──────── interest ────┘          │
        │        │       (MockTreasuryV2 optional)           │                                  │
        │        └───────────────────────────────────────────┘                                  │
        └──────────────────────────────────────────────────────────────────────────────────────┘

Notes (no subgraph):
- All state comes from direct reads: getUserPositionsPaginated, getPublicPods, getPodDetails,
  getPodMemberCount, preview*Interest, isJoinable, tierOf, balanceOf.
- New IDs come from **events**:
  • PositionOpened → positionId (solo) == receiptId
  • PodCreated → podId (vault)
  Decode with viem `decodeEventLog` and update UI immediately.
- Money flow: native STT only. No ERC-20 approvals. Exact contribution required on join.
- Early exit rules enforced on-chain; UI shows warnings and blocks when `isJoinable == false`.
