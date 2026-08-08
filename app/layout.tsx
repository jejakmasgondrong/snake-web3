import type { Metadata } from 'next'
import { SolanaWalletProvider } from './components/WalletProvider'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snake-web3.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Solana Snake — Web3 Leaderboard Game on Solana',
    template: '%s — Solana Snake',
  },
  description:
    'Play the classic Snake game reimagined for Web3. Submit your score on-chain, compete on the Solana devnet leaderboard, and prove your high score is real. Free, no login required.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Solana Snake — Classic Game, On-Chain Scores',
    description:
      'Classic Snake with a Solana twist. Every high score is stored on-chain on the devnet leaderboard.',
    url: '/',
    type: 'website',
    siteName: 'Solana Snake',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Snake — Classic Game, On-Chain Scores',
    description:
      'Classic Snake with a Solana twist. Every high score is stored on-chain on the devnet leaderboard.',
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Solana Snake',
              description:
                'Classic Snake game with an on-chain leaderboard on the Solana devnet. Connect your wallet, play, and submit your high score.',
              applicationCategory: 'GameApplication',
              url: siteUrl,
              operatingSystem: 'Any',
            }),
          }}
        />
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
