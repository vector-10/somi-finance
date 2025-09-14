          ┌──────────────── Frontend (Next.js) ────────────────┐
          │  Wallet connect (RainbowKit/ConnectKit)            │
          │  Views: Solo, Pods, Receipt, Dashboard             │
          │  Actions: deposit/join, claim, early-exit          │
          └───────────────┬───────────────────┬────────────────┘
                          │                   │
                          │ tx calls          │ reads (RPC)
                          ▼                   ▼
                ┌─────────────────┐   ┌──────────────────────┐
                │  SavingsPool    │   │     PodsVault        │
                │  (Solo plans)   │   │  (Group pods vault)  │
                ├─────────────────┤   ├──────────────────────┤
 deposits/claim │ create/deposit  │   │ create/join/activate │ joins/claim
      STT  ───► │ accrue/claim    │   │ earlyExit/cancel     │ ───► STT
                │ mint/burn 1155  │   │ mint/burn 1155       │
                └──────┬──────────┘   └───────────┬──────────┘
                       │                         │
                       │ payout STT              │ payout STT
                       ▼                         ▼
                ┌─────────────────────────────────────────────┐
                │               MockTreasury (STT)            │
                │  holds STT; pays principal+yield;           │
                │  accumulates & redistributes penalties      │
                └─────────────────────────────────────────────┘
                               ▲
                               │ mint/burn receipts
                               │
                ┌─────────────────────────────────────────────┐
                │        SavingsReceipt (ERC-1155)            │
                │  tokenId: planId / podId; metadata;         │
                │  restricted transfer                        │
                └─────────────────────────────────────────────┘
                               ▲
                               │ events (Deposited, Claimed, PodCreated...)
                               │
                ┌─────────────────────────────────────────────┐
                │      Indexer (Subgraph / Ormi)              │
                │  aggregates totals, active pods, claims     │
                └─────────────────────────────────────────────┘
                               ▲
                               │ GraphQL/HTTP
                               ▼
          ┌────────────────── Dashboard UI ────────────────────┐
          │ totals, charts, leaderboards, recent activity      │
          └────────────────────────────────────────────────────┘
