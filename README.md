# Somi Finance

## Problem Statement

Traditional savings platforms are controlled by centralized bodies and other DeFi protocols which enable savings offer significantly low yields are extremely hard to navigate for new and web3 users (one of the general causes of low crypto adoption) and lack any social engagement to encourage savings and investment cultures.

## Solution (Somi Finance)

**The first DeFi savings application built entirely on Somnia L1 blockchain.** Somi Finance is built to tackle problems of blockchain adoption, social engagement and encouragement to develop savings culture and also features like group savings pods to earn high yields and keep users engaged.

> **NOTE**: For testnet version, transaction currency is **$STT**.

## Key Features

**(a) Gamified Savings Experience** with savings levels (Gold, Silver and Bronze)

**(b) Solo Savings plans** (with yields) to fit user savings appetite with (flex save, fixed time deposits and more)

**(c) Savings Pods**, a feature enabling minimum of 3 and a maximum of 5 users to pool resources together to earn significantly higher yields. This feature alone boosts ecosystem engagement, offers real-time compounding yields for users.

## Key Innovations

**(a) Automated Pod Economics**: Pods self-activate when minimum members join, auto-close at capacity.

**(b) Dual Savings Architecture**: Individual pools (solo) + collaborative pods (group) in one platform.

**(c) Progressive NFT System**: Receipt tokens upgrade based on participation milestones.

**(d) Yield Simulator**: A smart contract enabled yields calculator which enables users see potential rewards at the end of savings periods in the future which aids in decision making, and a smooth user experience.

## Technical Achievements

- **Smart Contract Security**: ReentrancyGuard, Pausable, access controls
- **Gas Optimization**: Efficient storage patterns, batch operations
- **Blockchain Reliability**: Built on Somnia for fast, cost-effective transactions with sub-second finality

## Contract Addresses

- **PodsVault**: `0xf53e27ee3e7769732f3ca1fed5abafb54332a8d0`
- **SavingsPool**: `0x40548B98679Eb94b0c436E6f68D7d5ac7aBD16DA`
- **SavingsReceipt1155**: `0xa38ad47f738aeb8aca331776dabd72ffc7f3bdab`
- **MockTreasury**: `0xa0288fef682041d51c7f0770688c69e3397b9d51`

## Tech Stack

**Solidity**, **Foundry**, **Remix** (for debugging), **Next.js** (TypeScript), **Wagmi**, **Viem**, **Tailwindcss**

## User Experience Focus

One key feature of Somi Finance is its **intuitive user interface** which offers a smooth user experience enabling users navigate and make decisions quickly (the first 20 seconds discourage most users from most savings platforms).

Somi Finance is built to be **mobile friendly** to enable on-the-go savings decisions and user interactions. A **mobile First Approach** is one of the key principles to driving user adoption!

## Benefits for Ecosystem and Somnia Team

The benefits of a platform like Somnia DeFi platform go both ways:

- **For users**: High yields and social engagements plus low barrier to blockchain entry
- **For the Somnia team**: Access to liquidity for investments, ecosystem project funds and potentially loaning in the future

It boosts community confidence in the L1 chain and keeps the protocol strong.

---

> **NOTE**: The Somi Finance team would continue to develop and scale this project no matter the outcome of the hackathon and would sincerely love the ecosystem support.



```
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
```