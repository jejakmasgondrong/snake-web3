import SnakeGame from './components/SnakeGame'

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-green-400">
          Solana Snake — Classic Game with On-Chain High Scores
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-green-700">
          Snake, the arcade classic, gets a Web3 upgrade. Connect your Solana
          wallet, play your best run, and submit your score straight to the
          Solana devnet leaderboard. No login, no account — your wallet is your
          identity and every submitted high score is verifiable on-chain.
        </p>
      </header>
      <SnakeGame />
      <section className="mt-8 rounded-lg border border-green-900/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-green-500">
          How to Play
        </h2>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-green-700">
          <li>Connect your Solana wallet (Phantom or Solflare).</li>
          <li>Play with the arrow keys or on-screen controls.</li>
          <li>Beat your best run and submit your score on-chain.</li>
          <li>Climb the leaderboard — every entry is stored on Solana devnet.</li>
        </ol>
      </section>
    </main>
  )
}
