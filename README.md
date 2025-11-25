# Endless Runner – Web3 NFT Edition (OneChain)

A fully on-chain Endless Runner game featuring:

- 🧩 NFT-based character skins  
- 🏆 On-chain score tracking  
- 🎒 NFT ownership and inventory system  
- 🔄 Player-to-player NFT trading  
- ⚡ Live blockchain integration using OneChain

This project includes both the **Move smart contract** and the **React/TypeScript frontend**.

---

# 🚀 Project Overview

The Endless Runner game now supports **NFT skins** that players can unlock by achieving high scores.  
Once unlocked, skins can be **minted as NFTs**, **equipped in-game**, and **traded** with other players on the **OneChain blockchain**.

---

# 📦 Smart Contract


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

### Test the Integration

1. Connect your OneWallet
2. Play the game and achieve scores
3. Check the Skins page to see which skins you can unlock
4. Mint NFTs for unlocked skins
5. Trade NFTs with other addresses

## How It Works

### Gameplay Flow

1. **Play Game**: Player plays and achieves a score
2. **Submit Score**: Score is automatically submitted to blockchain (if wallet connected)
3. **Check Unlocks**: Player can see which skins they've unlocked
4. **Mint NFT**: Player mints NFT for unlocked skin
5. **Use Skin**: Player equips the NFT skin in-game
6. **Trade**: Player can transfer NFT to another address

### Unlocking Skins

- Scores are tracked on-chain in the ScoreRegistry
- Each skin has a required score threshold
- Players can mint NFTs once they reach the required score
- NFTs are unique and owned by the player's wallet address

### Trading NFTs

- Players can transfer NFTs to any address
- Transfer is executed on-chain via smart contract
- Ownership is updated immediately
- NFTs can be traded on any OneChain marketplace

## Features

✅ Score-based NFT unlocking
✅ On-chain score tracking
✅ NFT minting for unlocked skins
✅ NFT ownership verification
✅ NFT trading/transfer functionality
✅ Real-time unlock status display
✅ Player score display
✅ Owned NFTs gallery

## Next Steps

1. Deploy the smart contract to OneChain testnet/mainnet
2. Update contract addresses in `client/src/lib/nft.ts`
3. Test the full flow: play → score → unlock → mint → trade
4. Consider adding:
   - NFT marketplace integration
   - Rarity system
   - Special edition skins
   - On-chain leaderboard

## Notes

- The contract uses Move language (similar to Sui)
- All transactions require gas fees
- Scores are stored permanently on-chain
- NFTs are fully tradeable and transferable
- The system is ready for production after contract deployment
