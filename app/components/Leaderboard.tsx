'use client'

import { useState, useEffect, useCallback } from 'react'
import { Connection, Transaction } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { RPC_ENDPOINT, getProgram } from '../lib/snake-program'

interface LeaderboardEntry {
  player: string
  bestScore: number
  gamesPlayed: number
}

const PROGRAM_VERSION = '0.1.0'

export default function Leaderboard({ isInitialized }: { isInitialized: boolean }) {
  const { connected, publicKey, signTransaction } = useWallet()
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    if (!connected || !isInitialized || !publicKey || !signTransaction) return
    setLoading(true)
    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed')
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: Transaction[]) =>
          Promise.all(txs.map(tx => signTransaction(tx))),
      }
      const program = getProgram(connection, wallet)
      const accounts = await program.account.playerAccount.all()
      const sorted = accounts
        .map(a => ({
          player: a.account.authority.toString(),
          bestScore: a.account.bestScore.toNumber(),
          gamesPlayed: a.account.gamesPlayed.toNumber(),
        }))
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, 10)
      setScores(sorted)
    } catch (error) {
      console.error('fetch leaderboard failed:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }, [connected, isInitialized, publicKey, signTransaction])

  useEffect(() => {
    window.setTimeout(() => fetchLeaderboard(), 0)
    const interval = setInterval(fetchLeaderboard, 15000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  if (!connected) {
    return (
      <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4 w-full max-w-xs">
        <p className="text-zinc-500 text-sm font-mono text-center">
          🔒 Connect wallet to see leaderboard
        </p>
      </div>
    )
  }

  const myBest = publicKey
    ? scores.find(s => s.player === publicKey.toString())?.bestScore ?? 0
    : 0

  return (
    <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4 w-full max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-400 font-mono text-lg flex items-center gap-2">
          🏆 Leaderboard
          <span className="text-xs text-zinc-500">(top 10 on-chain)</span>
        </h3>
        <span className="text-[10px] text-zinc-600 font-mono border border-zinc-800 rounded px-1.5 py-0.5">
          v{PROGRAM_VERSION}
        </span>
      </div>

      {!isInitialized ? (
        <p className="text-zinc-500 text-sm font-mono text-center">
          Initializing game first...
        </p>
      ) : loading ? (
        <p className="text-zinc-500 text-sm font-mono text-center">Loading...</p>
      ) : scores.length === 0 ? (
        <p className="text-zinc-500 text-sm font-mono text-center">No scores yet. Be the first!</p>
      ) : (
        <div className="space-y-1">
          {scores.map((entry, index) => (
            <div
              key={entry.player}
              className={`flex justify-between font-mono text-sm py-1 px-2 rounded ${
                publicKey && entry.player === publicKey.toString()
                  ? 'bg-green-500/10 border border-green-500/30'
                  : ''
              }`}
            >
              <span className="text-zinc-300 truncate mr-2">
                {index === 0 && '🥇 '}
                {index === 1 && '🥈 '}
                {index === 2 && '🥉 '}
                {index >= 3 && `#${index + 1} `}
                {entry.player.toString().slice(0, 4)}...{entry.player.toString().slice(-4)}
              </span>
              <span className="text-green-400 font-bold">{entry.bestScore}</span>
            </div>
          ))}
        </div>
      )}

      {publicKey && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-500 font-mono">
            <span>Your best: {myBest}</span>
            <span>Games: {scores.find(s => s.player === publicKey.toString())?.gamesPlayed ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  )
}