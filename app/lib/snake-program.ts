import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import idl from '../idl/snake_program.json'
import { SnakeProgram } from './snake_program'

export const SNAKE_PROGRAM_ID = new PublicKey(
  (idl as unknown as { address: string }).address
)

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'

export interface AdapterWallet {
  publicKey: PublicKey
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>
}

export async function gameStatePda(programId: PublicKey) {
  return PublicKey.findProgramAddress([Buffer.from('game_state')], programId)
}

export async function playerPda(
  programId: PublicKey,
  authority: PublicKey
) {
  return PublicKey.findProgramAddress(
    [Buffer.from('player'), authority.toBuffer()],
    programId
  )
}

export function getProgram(
  connection: Connection,
  wallet: AdapterWallet
): Program<SnakeProgram> {
  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    { commitment: 'confirmed' }
  )
  // Anchor 0.32 reads the program id from `idl.address`.
  const patched = {
    ...(idl as unknown as Record<string, unknown>),
    address: SNAKE_PROGRAM_ID.toBase58(),
  }
  return new Program<SnakeProgram>(patched as SnakeProgram, provider)
}