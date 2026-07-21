import type { Metadata } from 'next'
import { SolanaWalletProvider } from './components/WalletProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solana Snake',
  description: 'Classic Snake game with Solana blockchain integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-green-400 font-mono antialiased">
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
