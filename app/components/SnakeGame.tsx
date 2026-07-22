'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import WalletButton from './WalletButton'
import Leaderboard from './Leaderboard'
import idl from '../../idl/snake_program.json'

// MOCK MODE - skip blockchain for Vercel deployment
const SKIP_BLOCKCHAIN = true

const BOARD_SIZE = 20
const CELL_SIZE = 20
const GAME_SPEED = 150

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
  return { x: 0, y: 0 }
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
  const [gameKey, setGameKey] = useState<PublicKey | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const key = e.key
    e.preventDefault()
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const directions = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      }
      const newDir = directions[key as keyof typeof directions]
      if (direction.dx + newDir.dx !== 0 || direction.dy + newDir.dy !== 0) {
        setNextDirection(newDir)
      }
    }
    if (key === ' ' || key === 'Space') {
      e.preventDefault()
      if (!isPlaying && !gameOver) startGame()
    }
  }, [direction, isPlaying, gameOver])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const getGameAccount = useCallback(async () => {
    if (!publicKey) return null
    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed')
      const provider = new AnchorProvider(connection, { publicKey, signTransaction } as any, {})
      let program: any
      if (!SKIP_BLOCKCHAIN) {
        program = new Program(idl as any, PROGRAM_ID, provider)
        const [gamePda] = await PublicKey.findProgramAddress(
          [Buffer.from('game'), publicKey.toBuffer()],
          PROGRAM_ID
        )
        try {
          const gameAccount = await program.account.game.fetch(gamePda)
          return { gamePda, gameAccount }
        } catch {
          return null
        }
      } else {
        return { gamePda: PublicKey.default, gameAccount: null }
      }
    } catch {
      return null
    }
  }, [publicKey, signTransaction])

  const initializeGame = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      setTxStatus('error')
      return
    }
    setIsSubmitting(true)
    setTxStatus('submitting')
    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed')
      const provider = new AnchorProvider(connection, { publicKey, signTransaction } as any, {})
      let program: any
      if (!SKIP_BLOCKCHAIN) {
        program = new Program(idl as any, PROGRAM_ID, provider)
        const [gamePda] = await PublicKey.findProgramAddress(
          [Buffer.from('game'), publicKey.toBuffer()],
          PROGRAM_ID
        )
        const tx = await program.methods
          .initializeGame(BOARD_SIZE)
          .accounts({
            game: gamePda,
            player: publicKey,
            systemProgram: PublicKey.default,
          })
          .rpc()
        setGameKey(gamePda)
        setIsInitialized(true)
        setTxSignature(tx)
        setTxStatus('success')
      } else {
        console.log('🔷 MOCK: initializeGame')
        setGameKey(PublicKey.default)
        setIsInitialized(true)
        setTxStatus('success')
        setTxSignature('mock_tx_123')
      }
    } catch (error) {
      console.error(error)
      setTxStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [publicKey, signTransaction])

  const startGame = useCallback(() => {
    if (!isInitialized && publicKey) {
      initializeGame()
    }
    setSnake(INITIAL_SNAKE)
    setScore(0)
    setGameOver(false)
    setDirection({ dx: 1, dy: 0 })
    setNextDirection({ dx: 1, dy: 0 })
    setFood(generateFood(INITIAL_SNAKE))
    setIsPlaying(true)
  }, [isInitialized, publicKey, initializeGame])

  const moveSnake = useCallback(async () => {
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
    let newSnake = [newHead, ...snake]
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
    if (publicKey && isInitialized && gameKey && !SKIP_BLOCKCHAIN) {
      try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed')
        const provider = new AnchorProvider(connection, { publicKey, signTransaction } as any, {})
        const program = new Program(idl as any, PROGRAM_ID, provider)
        let directionEnum = ''
        if (nextDirection.dx === 0 && nextDirection.dy === -1) directionEnum = 'Up'
        else if (nextDirection.dx === 0 && nextDirection.dy === 1) directionEnum = 'Down'
        else if (nextDirection.dx === -1 && nextDirection.dy === 0) directionEnum = 'Left'
        else if (nextDirection.dx === 1 && nextDirection.dy === 0) directionEnum = 'Right'
        if (directionEnum) {
          await program.methods
            .moveSnake({ [directionEnum.toLowerCase()]: {} })
            .accounts({
              game: gameKey,
              player: publicKey,
            })
            .rpc()
        }
      } catch (error) {
        console.error('Error saving move to blockchain:', error)
      }
    }
  }, [snake, food, score, gameOver, isPlaying, nextDirection, direction, publicKey, isInitialized, gameKey, signTransaction])

  const resetGame = useCallback(async () => {
    setGameOver(false)
    setIsPlaying(false)
    setSnake(INITIAL_SNAKE)
    setScore(0)
    setDirection({ dx: 1, dy: 0 })
    setNextDirection({ dx: 1, dy: 0 })
    setFood(generateFood(INITIAL_SNAKE))
    setTxStatus('')
    if (publicKey && gameKey && !SKIP_BLOCKCHAIN) {
      try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed')
        const provider = new AnchorProvider(connection, { publicKey, signTransaction } as any, {})
        const program = new Program(idl as any, PROGRAM_ID, provider)
        await program.methods
          .resetGame()
          .accounts({
            game: gameKey,
            player: publicKey,
          })
          .rpc()
      } catch (error) {
        console.error('Error resetting game:', error)
      }
    }
  }, [publicKey, gameKey, signTransaction])

  useEffect(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED)
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [isPlaying, gameOver, moveSnake])

  useEffect(() => {
    if (publicKey) {
      getGameAccount().then(result => {
        if (result?.gameAccount) {
          setIsInitialized(true)
          setGameKey(result.gamePda)
        }
      })
    }
  }, [publicKey, getGameAccount])

  const renderCell = (x: number, y: number) => {
    const isSnake = snake.some(seg => seg.x === x && seg.y === y)
    const isFood = food.x === x && food.y === y
    let className = 'w-5 h-5 border border-gray-700'
    if (isSnake) className += ' bg-green-500'
    if (isFood) className += ' bg-red-500'
    return <div key={`${x}-${y}`} className={className} />
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
        <div className="grid grid-cols-20 gap-0 border-2 border-gray-600">
          {Array.from({ length: BOARD_SIZE }).map((_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => renderCell(x, y))
          )}
        </div>
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="text-4xl font-bold text-white">Game Over!</div>
            <div className="text-2xl text-white">Score: {score}</div>
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
              {publicKey && !isInitialized ? 'Initialize & Start' : 'Start Game'}
            </button>
            <div className="text-white mt-2 text-sm">Use arrow keys to control</div>
          </div>
        )}
      </div>
      <div className="text-white text-xl">Score: {score}</div>
      {publicKey && gameKey && <Leaderboard />}
    </div>
  )
}
