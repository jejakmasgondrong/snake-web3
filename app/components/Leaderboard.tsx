'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

interface Score {
  player: string
  score: number
  timestamp: number
  tx?: string
}

export default function Leaderboard() {
  const { connected, publicKey } = useWallet()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (connected) {
      setLoading(true)
      const stored = localStorage.getItem('snakeScores')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sorted = parsed.sort((a: Score, b: Score) => b.score - a.score)
        setScores(sorted.slice(0, 10))
      } else {
        setScores([])
      }
      setLoading(false)
    } else {
      setScores([])
    }
  }, [connected])

  if (!connected) {
    return (
      <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4 w-full max-w-xs">
        <p className="text-zinc-500 text-sm font-mono text-center">
          🔒 Connect wallet to see leaderboard
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4 w-full max-w-xs">
      <h3 className="text-green-400 font-mono text-lg mb-3 flex items-center gap-2">
        🏆 Leaderboard
        <span className="text-xs text-zinc-500">(top 10)</span>
      </h3>
      
      {loading ? (
        <p className="text-zinc-500 text-sm font-mono text-center">Loading...</p>
      ) : scores.length === 0 ? (
        <p className="text-zinc-500 text-sm font-mono text-center">No scores yet. Be the first!</p>
      ) : (
        <div className="space-y-1">
          {scores.map((score, index) => (
            <div 
              key={index} 
              className={`flex justify-between font-mono text-sm py-1 px-2 rounded ${
                publicKey && score.player === publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4)
                  ? 'bg-green-500/10 border border-green-500/30'
                  : ''
              }`}
            >
              <span className="text-zinc-300">
                {index === 0 && '🥇 '}
                {index === 1 && '🥈 '}
                {index === 2 && '🥉 '}
                {index >= 3 && `#${index + 1} `}
                {score.player}
              </span>
              <span className="text-green-400 font-bold">{score.score}</span>
            </div>
          ))}
        </div>
      )}
      
      {publicKey && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-500 font-mono">
            <span>Your best: {scores.find(s => s.player === publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4))?.score || 0}</span>
          </div>
        </div>
      )}
    </div>
  )
}
