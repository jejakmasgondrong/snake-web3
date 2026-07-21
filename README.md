# 🐍 Solana Snake

A classic Snake game built with Next.js 15 and TypeScript, integrated with Solana blockchain for on-chain leaderboards and score tracking.

![Solana Snake Game](https://img.shields.io/badge/Solana-Snake-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Anchor](https://img.shields.io/badge/Anchor-0.29-purple)

## 🎮 Features

- **Classic Snake Gameplay** – Smooth controls with keyboard arrows
- **Solana Wallet Integration** – Connect with Phantom, Solflare, or Backpack
- **On-Chain Leaderboard** – Top scores stored permanently on Solana Devnet
- **Anchor Smart Contract** – Secure and verifiable score storage
- **Local High Score** – Save your best score in browser storage
- **Responsive Design** – Play on desktop or mobile
- **Real-time Feedback** – Score updates and game state indicators

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling and responsive design |
| Solana Web3.js | Blockchain interaction |
| @solana/wallet-adapter | Wallet connection |
| Anchor 0.29.0 | Smart contract framework |
| Rust 1.75.0 | Smart contract language |

## 📋 Prerequisites

- Node.js 18+ (v24 compatible)
- Rust 1.75.0
- Anchor CLI 0.29.0
- Solana CLI 1.18.17
- A Solana wallet (Phantom, Solflare, or Backpack)
- Solana Devnet SOL for transaction fees (get from [faucet](https://faucet.solana.com/))

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/snake-web3.git
cd snake-web3
2. Install frontend dependencies
bash
npm install
3. Set up environment variables
bash
cp .env.example .env.local
# Edit .env.local with your configuration
4. Start the development server
bash
npm run dev
Open http://localhost:3000 to play!

5. Deploy smart contract (optional)
bash
cd ../snake-program
anchor build
anchor deploy --provider.cluster devnet
🎯 Game Controls
Key	Action
⬆️ / ⬇️ / ⬅️ / ➡️	Move snake
P	Pause / Resume
R	Restart game
Space	Restart from game over
🔗 Wallet Connection
Click "Connect Wallet" button in the top-right corner

Select your preferred wallet (Phantom, Solflare, or Backpack)

Approve the connection request

Your wallet address will appear when connected

Scores are automatically submitted to the blockchain when game over

🏆 Leaderboard
The leaderboard displays the top 10 scores stored on Solana:

Your best score is highlighted in green

Connected wallet shows your rank

Real-time updates after each game

📁 Project Structure
text
snake-web3/
├── app/
│   ├── components/
│   │   ├── SnakeGame.tsx      # Main game logic
│   │   ├── WalletButton.tsx   # Wallet connection UI
│   │   ├── Leaderboard.tsx    # Score display
│   │   └── WalletProvider.tsx # Solana context
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── public/                    # Static assets
├── idl/                       # Anchor IDL
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
🧪 Testing
bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
🚧 Upcoming Features
□ Real-time leaderboard fetching from blockchain
□ SPL token rewards for high scores
□ NFT badges for top players
□ Multiplayer mode
□ Power-ups and obstacles
🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License
Distributed under the MIT License. See LICENSE for more information.

🙏 Acknowledgments
Next.js – React framework

Solana – Blockchain platform

Anchor – Solana framework

Tailwind CSS – CSS framework

Wallet Adapter – Solana wallet integration

Made with ❤️ for the Solana ecosystem
