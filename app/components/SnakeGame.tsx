'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@project-serum/anchor'
import WalletButton from './WalletButton'
import Leaderboard from './Leaderboard'
import idl from '../idl/snake_program.json'

const BOARD_SIZE = 20
const CELL_SIZE = 20
const GAME_SPEED = 150

// ✅ PROGRAM ID REAL - Bisa diganti kalo deploy
const REAL_PROGRAM_ID = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
const PROGRAM_ID = new PublicKey(REAL_PROGRAM_ID)
const RPC_ENDPOINT = 'https://api.devnet.solana.com'

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const DEFAULT_FOOD = { x: 15, y: 10 }

const generateFood = (snake: { x: number; y: number }[]) => {
  for (let i = 0; i < 5000; i++) {
    const food = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    }
    if (!snake.some(seg => seg.x === food.x && seg.y === food.y)) {
      return food
    }
  }
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!snake.some(seg => seg.x === x && seg.y === y)) {
        return { x, y }
      }
    }
  }
  return DEFAULT_FOOD
}

export default function SnakeGame() {
  const { connected, publicKey, signTransaction } = useWallet()
  const [isMounted, setIsMounted] = useState(false)
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [direction, setDirection] = useState({ dx: 1, dy: 0 })
  const [food, setFood] = useState(DEFAULT_FOOD)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txSignature, setTxSignature] = useState('')
  const [txStatus, setTxStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ SUBMIT KE BLOCKCHAIN (REAL)
  const submitScoreToBlockchain = useCallback(async (finalScore: number) => {
    if (!connected || !publicKey || !signTransaction) {
      console.log('⚠️ Wallet not connected')
      setTxStatus('error')
      return
    }

    setIsSubmitting(true)
    setTxStatus('submitting')
    setTxSignature('')

    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed')
      const provider = new AnchorProvider(
        connection,
        { publicKey, signTransaction },
        { commitment: 'confirmed' }
      )

      const program = new Program(idl as any, PROGRAM_ID, provider)

      const [gameStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from('game_state')],
        PROGRAM_ID
      )

      const [playerPDA] = await PublicKey.findProgramAddress(
        [Buffer.from('player'), publicKey.toBuffer()],
        PROGRAM_ID
      )

      const tx = await program.methods
        .submitScore(new BN(finalScore))
        .accounts({
          player: playerPDA,
          gameState: gameStatePDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction()

      const signature = await provider.sendAndConfirm!(tx)
      
      setTxSignature(signature)
      setTxStatus('success')
      console.log('✅ Score submitted! TX:', signature)
      
      // Simpan ke leaderboard
      const scores = JSON.parse(localStorage.getItem('snakeScores') || '[]')
      scores.push({ 
        player: publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4),
        score: finalScore,
        timestamp: Date.now(),
        tx: signature
      })
      localStorage.setItem('snakeScores', JSON.stringify(scores))

    } catch (error: any) {
      console.error('❌ Failed to submit score:', error)
      setTxStatus('error')
      
      // Handle error spesifik
      if (error.message?.includes('insufficient funds')) {
        alert('❌ Not enough SOL for transaction. Please get devnet SOL from faucet.')
      } else if (error.message?.includes('transaction simulation failed')) {
        alert('❌ Transaction simulation failed. Try again with more SOL.')
      } else {
        alert(`❌ Failed to submit score: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [connected, publicKey, signTransaction])

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setDirection({ dx: 1, dy: 0 })
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    setTxStatus('idle')
    setTxSignature('')
    setFood(generateFood(INITIAL_SNAKE))
  }, [])

  const updateGame = useCallback(() => {
    if (gameOver || isPaused) return

    setSnake(prevSnake => {
      const head = prevSnake[0]
      const newHead = {
        x: head.x + direction.dx,
        y: head.y + direction.dy,
      }

      // Wall collision
      if (newHead.x < 0 || newHead.x >= BOARD_SIZE || 
          newHead.y < 0 || newHead.y >= BOARD_SIZE) {
        setGameOver(true)
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('snakeHighScore', String(score))
        }
        if (connected && score > 0) {
          submitScoreToBlockchain(score)
        }
        return prevSnake
      }

      // Self collision
      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true)
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('snakeHighScore', String(score))
        }
        if (connected && score > 0) {
          submitScoreToBlockchain(score)
        }
        return prevSnake
      }

      const newSnake = [newHead, ...prevSnake]

      // Eat food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 1)
        setFood(generateFood(newSnake))
        return newSnake
      }

      newSnake.pop()
      return newSnake
    })
  }, [direction, food, gameOver, isPaused, score, highScore, connected, submitScoreToBlockchain])

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('snakeHighScore')
    if (saved) {
      setHighScore(parseInt(saved))
    }
    setFood(generateFood(INITIAL_SNAKE))
  }, [])

  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoopRef.current = setInterval(updateGame, GAME_SPEED)
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [updateGame, gameOver, isPaused])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        resetGame()
        return
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev)
        return
      }

      if (gameOver) return

      switch (e.key) {
        case 'ArrowUp':
          if (direction.dy === 0) setDirection({ dx: 0, dy: -1 })
          break
        case 'ArrowDown':
          if (direction.dy === 0) setDirection({ dx: 0, dy: 1 })
          break
        case 'ArrowLeft':
          if (direction.dx === 0) setDirection({ dx: -1, dy: 0 })
          break
        case 'ArrowRight':
          if (direction.dx === 0) setDirection({ dx: 1, dy: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction, gameOver, resetGame])

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-green-400 font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <h1 className="text-3xl md:text-4xl font-mono text-green-400">
          🐍 SNAKE
          <span className="text-xs text-zinc-600 ml-4">on Solana</span>
        </h1>
        <WalletButton />
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center">
          <div className="flex gap-6 text-green-400 font-mono text-base md:text-xl mb-4">
            <div>🍎 Score: <span className="font-bold">{score}</span></div>
            <div>🏆 High: <span className="text-yellow-400 font-bold">{highScore}</span></div>
            <div>
              {gameOver && '💀'}
              {isPaused && '⏸️'}
              {!gameOver && !isPaused && '▶️'}
            </div>
          </div>

          <div 
            className="relative border-4 border-green-400 bg-zinc-900"
            style={{
              width: BOARD_SIZE * CELL_SIZE,
              height: BOARD_SIZE * CELL_SIZE,
            }}
            suppressHydrationWarning
          >
            <div 
              className="absolute inset-0 grid opacity-10"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
              }}
            >
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => (
                <div key={i} className="border border-green-400/20" />
              ))}
            </div>

            {snake.map((seg, i) => (
              <div
                key={i}
                className="absolute bg-green-400 transition-all duration-75"
                style={{
                  left: seg.x * CELL_SIZE,
                  top: seg.y * CELL_SIZE,
                  width: CELL_SIZE - 1,
                  height: CELL_SIZE - 1,
                  boxShadow: i === 0 ? '0 0 20px #00ff41' : 'none',
                  borderRadius: i === 0 ? '4px' : '2px',
                }}
                suppressHydrationWarning
              />
            ))}

            <div
              className="absolute bg-red-500 animate-pulse"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
                borderRadius: '50%',
                boxShadow: '0 0 25px #ff0040',
              }}
              suppressHydrationWarning
            />
          </div>

          <div className="mt-4 text-zinc-600 font-mono text-xs md:text-sm flex flex-wrap gap-4 justify-center">
            <span>⬆️⬇️⬅️➡️ Move</span>
            <span>|</span>
            <span>⏸️ P = Pause</span>
            <span>|</span>
            <span>🔄 R = Restart</span>
            {connected && <span className="text-green-400">✅ Connected</span>}
          </div>

          {/* Status Transaksi */}
          {txStatus === 'submitting' && (
            <div className="mt-2 text-yellow-400 font-mono text-sm animate-pulse">
              ⏳ Submitting score to Solana...
            </div>
          )}
          
          {txStatus === 'success' && txSignature && (
            <div className="mt-2 text-green-400 font-mono text-xs text-center">
              ✅ TX: <a 
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-300"
              >
                {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
              </a>
            </div>
          )}

          {txStatus === 'error' && (
            <div className="mt-2 text-red-400 font-mono text-sm">
              ❌ Transaction failed
            </div>
          )}
        </div>

        <div className="w-full md:w-auto">
          <Leaderboard />
        </div>
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-green-400 p-6 md:p-8 rounded-lg text-center max-w-sm w-full">
            <h2 className="text-3xl md:text-4xl font-mono text-red-500 mb-4">💀 GAME OVER</h2>
            <p className="text-green-400 font-mono text-xl mb-2">
              Score: <span className="text-white font-bold">{score}</span>
            </p>
            <p className="text-yellow-400 font-mono text-lg mb-4">
              🏆 High Score: {highScore}
            </p>
            {connected && txStatus === 'success' && (
              <p className="text-xs text-green-400 font-mono mb-4 break-all">
                ✅ Saved! TX: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
              </p>
            )}
            {connected && txStatus === 'error' && (
              <p className="text-xs text-red-400 font-mono mb-4">
                ❌ Failed to save. Try again!
              </p>
            )}
            {!connected && (
              <p className="text-xs text-zinc-500 font-mono mb-4">
                🔒 Connect wallet to save scores
              </p>
            )}
            <button
              onClick={resetGame}
              className="px-6 md:px-8 py-3 bg-green-400 text-black font-mono font-bold text-lg md:text-xl rounded hover:bg-green-300 transition-all w-full"
            >
              🔄 Play Again
            </button>
            <p className="text-zinc-500 text-xs mt-4 font-mono">Press R or click button</p>
          </div>
        </div>
      )}
    </div>
  )
}
