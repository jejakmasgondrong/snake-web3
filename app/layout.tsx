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
        <footer className="border-t border-green-900/50 py-4 text-center">
          <a
            href="https://www.linkedin.com/in/rsatriya-wicaksana-56b026ab/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-700 hover:text-green-400 transition-colors"
          >
            Built by RSatriya · Contact Me
          </a>
        </footer>
      </body>
    </html>
  )
}
