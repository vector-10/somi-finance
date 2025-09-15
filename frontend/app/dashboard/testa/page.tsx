"use client";


import React from 'react'
import { useAccount } from 'wagmi'
import { useUserPositions } from '@/hooks/usePool'

export default function TestPage() {
  const { address } = useAccount()
  const { data: positions, error } = useUserPositions(address || '', BigInt(0), BigInt(5))

  return (
    <div>
      <p>Wallet: {address}</p>
      <p>Positions: {positions ? 
        positions.map((p, i) => <div key={i}>Position {i}: {p.principal.toString()} STT</div>) 
        : 'Loading...'
        }</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}