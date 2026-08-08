'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import WalletButton from './WalletButton'
import Leaderboard from './Leaderboard'
import {
  SNAKE_PROGRAM_ID,
  RPC_ENDPOINT,
  gameStatePda,
  playerPda,
  getProgram,
} from '../lib/snake-program'

const BOARD_SIZE = 20
const GAME_SPEED = 150
const SWIPE_THRESHOLD = 30

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
  return { x: 0, y: 0 }
}

const toAdapterWallet = (
  publicKey: PublicKey,
  signTransaction: NonNullable<ReturnType<typeof useWallet>['signTransaction']>
) => ({
  publicKey,
  signTransaction,
  signAllTransactions: async (txs: Transaction[]) =>
    Promise.all(txs.map(tx => signTransaction(tx))),
})

interface DPadButtonProps {
  dx: number
  dy: number
  label: string
  onPress: (dx: number, dy: number) => void
}

function DPadButton({ dx, dy, label, onPress }: DPadButtonProps) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onPress(dx, dy) }}
      onClick={() => onPress(dx, dy)}
      className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-700 text-white text-2xl rounded-xl active:bg-gray-500 select-none touch-manipulation flex items-center justify-center"
      aria-label={`Move ${label}`}
    >
      {label === 'Up' ? '▲' : label === 'Down' ? '▼' : label === 'Left' ? '◀' : '▶'}
    </button>
  )
}

export default function SnakeGame() {
  const { publicKey, signTransaction } = useWallet()
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState(DEFAULT_FOOD)
  const [direction, setDirection] = useState({ dx: 1, dy: 0 })
  const [nextDirection, setNextDirection] = useState({ dx: 1, dy: 0 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [txSignature, setTxSignature] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  const changeDirection = useCallback((dx: number, dy: number) => {
    if (direction.dx + dx !== 0 || direction.dy + dy !== 0) {
      setNextDirection({ dx, dy })
    }
  }, [direction])

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setScore(0)
    setGameOver(false)
    setDirection({ dx: 1, dy: 0 })
    setNextDirection({ dx: 1, dy: 0 })
    setFood(generateFood(INITIAL_SNAKE))
    setIsPlaying(true)
  }, [])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const key = e.key
    e.preventDefault()
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const dirMap: Record<string, { dx: number; dy: number }> = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      }
      const newDir = dirMap[key]
      changeDirection(newDir.dx, newDir.dy)
    }
    if (key === ' ' || key === 'Space') {
      e.preventDefault()
      if (!isPlaying && !gameOver) startGame()
    }
  }, [changeDirection, isPlaying, gameOver, startGame])

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 1 : -1, 0)
    } else {
      changeDirection(0, dy > 0 ? 1 : -1)
    }
  }, [changeDirection])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleKeyPress, handleTouchStart, handleTouchEnd])

  const connect = useCallback(() => {
    return new Connection(RPC_ENDPOINT, 'confirmed')
  }, [])

  const checkInitialized = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      setIsInitialized(false)
      return
    }
    try {
      const connection = connect()
      const wallet = toAdapterWallet(publicKey, signTransaction)
      const program = getProgram(connection, wallet)
      const [gameState] = await gameStatePda(SNAKE_PROGRAM_ID)
      await program.account.gameState.fetch(gameState)
      setIsInitialized(true)
    } catch {
      setIsInitialized(false)
    }
  }, [publicKey, signTransaction, connect])

  const initializeGame = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      setTxStatus('error')
      return
    }
    setIsSubmitting(true)
    setTxStatus('submitting')
    try {
      const connection = connect()
      const wallet = toAdapterWallet(publicKey, signTransaction)
      const program = getProgram(connection, wallet)
      const [gameState] = await gameStatePda(SNAKE_PROGRAM_ID)
      const tx = await program.methods
        .initializeGame()
        .accountsStrict({
          gameState,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      setIsInitialized(true)
      setTxSignature(tx)
      setTxStatus('success')
    } catch (error) {
      console.error('initialize_game failed:', error)
      setTxStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [publicKey, signTransaction, connect])

  const submitScore = useCallback(async (finalScore: number) => {
    if (!publicKey || !signTransaction || !isInitialized || finalScore <= 0) return
    try {
      const connection = connect()
      const wallet = toAdapterWallet(publicKey, signTransaction)
      const program = getProgram(connection, wallet)
      const [gameState] = await gameStatePda(SNAKE_PROGRAM_ID)
      const [player] = await playerPda(SNAKE_PROGRAM_ID, publicKey)
      const tx = await program.methods
        .submitScore(new BN(finalScore))
        .accountsStrict({
          player,
          gameState,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      setTxSignature(tx)
      setTxStatus('success')
    } catch (error) {
      console.error('submit_score failed:', error)
      setTxStatus('error')
    }
  }, [publicKey, signTransaction, isInitialized, connect])

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return
    setDirection(nextDirection)
    const head = snake[0]
    const newHead = {
      x: head.x + nextDirection.dx,
      y: head.y + nextDirection.dy,
    }
    if (newHead.x < 0 || newHead.x >= BOARD_SIZE || newHead.y < 0 || newHead.y >= BOARD_SIZE) {
      setGameOver(true)
      setIsPlaying(false)
      return
    }
    if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      setGameOver(true)
      setIsPlaying(false)
      return
    }
    const newSnake = [newHead, ...snake]
    let newScore = score
    let newFood = food
    if (newHead.x === food.x && newHead.y === food.y) {
      newScore = score + 1
      setScore(newScore)
      newFood = generateFood(newSnake)
      setFood(newFood)
    } else {
      newSnake.pop()
    }
    setSnake(newSnake)
  }, [snake, food, score, gameOver, isPlaying, nextDirection])

  const resetGame = useCallback(() => {
    setGameOver(false)
    setIsPlaying(false)
    setSnake(INITIAL_SNAKE)
    setScore(0)
    setDirection({ dx: 1, dy: 0 })
    setNextDirection({ dx: 1, dy: 0 })
    setFood(generateFood(INITIAL_SNAKE))
    setTxStatus('')
  }, [])

  useEffect(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED)
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [isPlaying, gameOver, moveSnake])

  // Auto-submit score on-chain when game ends.
  useEffect(() => {
    if (gameOver && score > 0 && isInitialized) {
      window.setTimeout(() => submitScore(score), 0)
    }
  }, [gameOver, score, isInitialized, submitScore])

  useEffect(() => {
    if (publicKey) {
      window.setTimeout(() => checkInitialized(), 0)
    } else {
      window.setTimeout(() => setIsInitialized(false), 0)
    }
  }, [publicKey, checkInitialized])

  const cellSize = `min(${80 / BOARD_SIZE}vw, 20px)`

  const renderCell = (x: number, y: number) => {
    const isSnake = snake.some(seg => seg.x === x && seg.y === y)
    const isFood = food.x === x && food.y === y
    let className = 'border border-gray-700'
    if (isSnake) className += ' bg-green-500'
    if (isFood) className += ' bg-red-500'
    return <div key={`${x}-${y}`} className={className} style={{ width: cellSize, height: cellSize }} />
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-4 items-center">
        <WalletButton />
        {publicKey && !isInitialized && (
          <button
            onClick={initializeGame}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Initializing...' : 'Initialize Game'}
          </button>
        )}
      </div>
      {txStatus && (
        <div className={`text-sm ${txStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {txStatus === 'submitting' ? 'Submitting transaction...' :
            txStatus === 'success' ? `✅ Success! Signature: ${txSignature?.slice(0, 20)}...` :
            txStatus === 'error' ? '❌ Transaction failed' : ''}
        </div>
      )}
      <div className="relative">
        <div className="grid gap-0 border-2 border-gray-600" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize})` }}>
          {Array.from({ length: BOARD_SIZE }).map((_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => renderCell(x, y))
          )}
        </div>
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="text-4xl font-bold text-white">Game Over!</div>
            <div className="text-2xl text-white">Score: {score}</div>
            <div className="text-sm text-green-400 font-mono">Saving score on-chain...</div>
            <button
              onClick={resetGame}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Play Again
            </button>
          </div>
        )}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-500 text-white text-xl rounded hover:bg-green-600"
            >
              Start Game
            </button>
            <div className="text-white mt-2 text-sm">Use arrow keys or swipe/tap to control</div>
          </div>
        )}
      </div>
      <div className="text-white text-xl">Score: {score}</div>
      {isPlaying && (
        <div className="sm:hidden flex flex-col items-center gap-2 mt-2">
          <div className="flex gap-2">
            <div className="w-14" />
            <DPadButton dx={0} dy={-1} label="Up" onPress={changeDirection} />
            <div className="w-14" />
          </div>
          <div className="flex gap-2">
            <DPadButton dx={-1} dy={0} label="Left" onPress={changeDirection} />
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-800 text-gray-400 text-xs rounded-xl flex items-center justify-center">OK</div>
            <DPadButton dx={1} dy={0} label="Right" onPress={changeDirection} />
          </div>
          <div className="flex gap-2">
            <div className="w-14" />
            <DPadButton dx={0} dy={1} label="Down" onPress={changeDirection} />
            <div className="w-14" />
          </div>
        </div>
      )}
      {publicKey && <Leaderboard isInitialized={isInitialized} />}
    </div>
  )
}