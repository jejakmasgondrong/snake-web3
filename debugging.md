# Debugging: Vercel Deployment Error

## ❌ Error Occurred

During Vercel deployment, the build failed with the following error:
./app/components/SnakeGame.tsx:9:1
Module not found: Can't resolve '../idl/snake_program.json'

text

## 🔍 Root Cause

The file `snake_program.json` (IDL from Anchor program) is missing from the path `app/idl/`.

### Why is this file missing?
- This file should be generated from the `snake-program` (Anchor program) repository
- Since `snake-program` is a separate repository, its IDL is not automatically available in `snake-web3`
- In local environments, this file might exist but is not committed to Git (often in `.gitignore`)

## ✅ Solution

### Solution 1: Using Dummy IDL (Current)

For deployment and UI demo purposes, we use a dummy IDL file:

**File:** `app/idl/snake_program.json`
```json
{
  "version": "0.1.0",
  "name": "snake_program",
  "instructions": []
}
Reasons:

Vercel build can succeed without needing the actual Anchor program deployed

UI and other features can still be tested

No need to set up a local Solana validator for deployment

Limitations:

On-chain features will not work until the actual IDL is available

Cannot interact with the real Snake program

Solution 2: Using Actual IDL (Future Improvement)
For production, we need to use the actual IDL:

Build snake-program:

bash
cd ../snake-program
anchor build
Copy IDL to snake-web3:

bash
cp target/idl/snake_program.json ../snake-web3/app/idl/
Commit and push:

bash
cd ../snake-web3
git add app/idl/snake_program.json
git commit -m "feat: add actual IDL for production"
git push
🔗 Related Issues
Anchor program repository: jejakmasgondrong/snake-program

IDL documentation: https://docs.solana.com/idl

📝 Notes
Dummy IDL is only for build purposes and UI demos

For on-chain testing, use Solana devnet and deploy the actual program

Environment variable for RPC endpoint: NEXT_PUBLIC_SOLANA_RPC

📅 Last Updated
21 July 2026

Status: 🟡 Temporary (Dummy IDL) → 🔵 Target: Using Actual IDL
