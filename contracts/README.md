# Endless Runner NFT Smart Contract (OneChain Version)

This Move smart contract implements NFT-based skins for the Endless Runner game on the **OneChain Network**.  
Players can unlock and mint NFT skins based on their in-game scores, trade NFTs, and track scores on-chain.

---

## ✨ Features

- **Score-Based Skin Unlocking** – Players unlock skins automatically by reaching score thresholds.
- **NFT Minting** – Mint unique NFT skins once unlocked.
- **NFT Trading** – NFTs can be transferred between players using OneChain object transfers.
- **On-Chain Score Tracking** – Fully on-chain registry of player high scores.

---

## 🏅 Required Scores to Unlock Skins

| Skin          | Required Score|
|---------------|---------------|
| **Blue**      | 0 (default)   |
| **Red**       | 20            |
| **Green**     | 50            |
| **Yellow**    | 100           |
| **Purple**    | 250           |
| **Orange**    | 500           |

---

## 📦 Contract Overview

### Public Functions

- `update_score(registry, player, new_score, ctx)`  
  Updates a player's score on-chain.

- `get_player_score(registry, player)`  
  Returns player's current score.

- `can_unlock_skin(registry, player, skin_id)`  
  Checks if player meets the required threshold.

- `mint_skin_nft(registry, admin, player, skin_id, image_url, ctx)`  
  Mints an NFT for a skin the player has unlocked.

- `transfer_nft(nft, recipient, ctx)`  
  Transfers an NFT to another address.

---

## 🛠 Development

OneChain uses a Sui-compatible Move toolchain, but with the **OneChain CLI**.

### 1. Install OneChain CLI

```bash
curl --proto '=https' --tlsv1.2 -sSf https://cli.onelabs.cc/install.sh | sh

Or install manually:

cargo install --git https://github.com/one-chain-labs/onechain --locked one
```

2. Build the Contract
```bash
cd contracts
one move build


3. Deploy to OneChain Testnet

one client publish --gas-budget 100000000

4. Save Deployment IDs

After deployment, note down:

PACKAGE_ID

REGISTRY_ID (ScoreRegistry object ID)

ADMIN_CAP_ID (Admin capability object ID)

These must be added to:

client/src/lib/nft.ts
```

🌐 Frontend Integration

```bash
Install the OneChain TypeScript SDK:

npm install @onelabs/sui @onelabs/wallet


Use the OneChain Testnet RPC:

https://rpc-testnet.onelabs.cc:443

```
The frontend will:

Submit scores to the blockchain after each game

Check if skins are unlocked

Mint NFTs for eligible players

Enable NFT trading

Display high scores retrieved from the chain
```bash
📁 Project Structure
contracts/
  move.toml
  sources/
    endless_runner.move
```

🔐 Security Notes

Only the AdminCap holder is allowed to mint NFTs.

Score updates should be restricted to a trusted backend to prevent cheating.

Avoid unbounded vector growth in the score registry.

Use Move unit tests to validate logic.

📚 Useful Links

OneChain Docs: https://docs.onelabs.cc

OneChain SDK Docs: https://doc-testnet.onelabs.cc

OneChain Wallet SDK: https://www.npmjs.com/package/@onelabs/wallet