# 🐛 Debugging Guide

Complete guide for troubleshooting common issues during development of Solana Snake.

## 📋 Table of Contents
- [Anchor Installation Issues](#anchor-installation-issues)
- [Rust Version Compatibility](#rust-version-compatibility)
- [Hydration Mismatch](#hydration-mismatch)
- [Tailwind CSS Not Working](#tailwind-css-not-working)
- [Wallet Connection Issues](#wallet-connection-issues)
- [Solana Deployment Issues](#solana-deployment-issues)
- [Game Performance](#game-performance)

---

## 🔧 Anchor Installation Issues

### Error: `could not determine executable to run`

**Cause:** Node.js v24 + Vite compatibility issue

**Solution:** Use Next.js instead of Vite

```bash
npx create-next-app@latest snake-web3 --typescript --tailwind --eslint
Error: wasm-bindgen compilation fails
Cause: Rust version too new (1.97+) with Anchor v0.30.1

Solution: Use Rust 1.75 with Anchor v0.29.0

bash
# Install Rust 1.75
rustup install 1.75.0
rustup default 1.75.0

# Install Anchor v0.29.0
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked --force
Error: time crate compilation error
Error Message:

text
error[E0282]: type annotations needed for `Box<_>`
Solution: Use Rust 1.75.0 with Anchor v0.29.0

Error: failed to compile anchor-cli
Cause: Missing dependencies or Rust version mismatch

Solution:

bash
# Full cleanup
cargo uninstall anchor-cli
rustup default 1.75.0
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked --force
🦀 Rust Version Compatibility
Rust Version	Anchor Version	Status
1.75.0	0.29.0	✅ Working
1.75.0	0.30.1	⚠️ Unstable
1.97.1	0.30.1	❌ Fails (wasm-bindgen)
1.97.1	0.29.0	❌ Fails (wasm-bindgen)
Recommended Setup:

bash
rustc --version  # rustc 1.75.0
anchor --version # anchor-cli 0.29.0
🔄 Hydration Mismatch
Error Message
text
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
Cause
Using Math.random() or Date.now() in component render

Accessing localStorage or window during server render

Dynamic positioning of game elements

Solution
tsx
// ✅ Use useEffect for client-only code
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
  // Client-only logic here
}, [])

if (!isMounted) {
  return <div>Loading...</div>
}

// ✅ Use suppressHydrationWarning for dynamic elements
<div 
  style={{ left: food.x * CELL_SIZE }}
  suppressHydrationWarning
/>
🎨 Tailwind CSS Not Working
Error Message
text
@tailwind base not found
Solution
1. Verify configuration files:

bash
ls -la | grep -E "tailwind|postcss"
2. Check tailwind.config.js:

javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
3. Verify import in app/globals.css:

css
@import "tailwindcss";
4. Restart development server:

bash
npm run dev
🔌 Wallet Connection Issues
Error Message
text
Error: Could not establish connection to wallet
Solution
1. Install supported wallet:

Phantom

Solflare

Backpack

2. Switch to Devnet in wallet settings

3. Get test SOL from faucet:

bash
# Go to https://faucet.solana.com/
# Paste your wallet address
# Request 0.5 SOL
4. Check package versions:

json
{
  "@solana/wallet-adapter-react": "^0.15.x",
  "@solana/web3.js": "^1.73.x",
  "@project-serum/anchor": "^0.29.x"
}
🚀 Solana Deployment Issues
Error: insufficient funds
Cause: No SOL in wallet

Solution:

bash
# Check balance
solana balance --url devnet

# Request airdrop
solana airdrop 2 --url devnet
Error: program already exists
Solution:

bash
# Close existing program
solana program close --buffers

# Redeploy with new keypair
anchor deploy --provider.cluster devnet
🎮 Game Performance
Issue: Game lags or stutters
Solution
1. Adjust game speed:

tsx
const GAME_SPEED = 150 // Default (ms)
// Increase for slower game, decrease for faster
// Recommended: 100-200ms
2. Reduce board size:

tsx
const BOARD_SIZE = 20 // Default
// Try 15 or 18 for better performance
3. Disable animations in development:

tsx
// Remove or reduce transition-duration
className="absolute bg-green-400"
// Remove: transition-all duration-75
🔧 Common Commands
Development
bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
Anchor
bash
anchor build         # Build smart contract
anchor deploy        # Deploy to devnet
anchor test          # Run tests
Reset Everything
bash
rm -rf node_modules package-lock.json .next
npm install
npm run dev
Clear Next.js Cache
bash
rm -rf .next
npm run dev
📚 Useful Resources
Next.js Error Handling

React Hydration

Solana Web3 Docs

Anchor Documentation

Tailwind CSS Docs

Rust Installation

🔬 Known Issues
Issue	Status	Workaround
Hydration mismatch with food position	✅ Fixed	Use suppressHydrationWarning + useEffect
Anchor v0.30.1 with Rust 1.97	⚠️ Known	Use Rust 1.75 with Anchor v0.29.0
Wallet connection auto-connect delay	⚠️ Known	Manual connect works fine
Vite + Tailwind v24 compatibility	✅ Fixed	Use Next.js instead of Vite
📝 Troubleshooting Flowchart
text
Start
  │
  ├── Game not loading?
  │   └── Check: npm run dev → Clear .next → Reinstall
  │
  ├── Wallet won't connect?
  │   └── Check: Devnet selected → Sufficient SOL → Extension installed
  │
  ├── Scores not submitting?
  │   └── Check: Wallet connected → Sufficient SOL → Program deployed
  │
  └── Anchor build fails?
      └── Check: Rust 1.75 → Anchor 0.29 → Clean build
🤝 Contributing to This Guide
Found a new bug? Add it here:

Open a Pull Request with the issue

Include the error message and solution

Update the "Known Issues" table

Last Updated: July 21, 2026
