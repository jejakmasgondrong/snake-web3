'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function WalletButton() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="flex items-center gap-4">
      {connected && publicKey && (
        <span className="text-green-400 text-sm font-mono hidden sm:inline">
          🟢 {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
      )}
      <WalletMultiButton className="!bg-green-500 !hover:bg-green-600 !text-black !font-mono !px-4 !py-2 !rounded-lg !transition-all !text-sm" />
    </div>
  )
}
