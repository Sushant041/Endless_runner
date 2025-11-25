# NFT System Implementation - Setup Guide

## Overview

The Endless Runner game now supports NFT-based skins that players can unlock through gameplay and trade on the OneChain blockchain.

## What's Been Implemented

### 1. Smart Contract (`contracts/sources/runner_nft.move`)
- **ScoreRegistry**: Tracks all player scores on-chain
- **RunnerSkinNFT**: NFT structure for each skin
- **Score-based unlocking**: Each skin requires a minimum score
- **Trading support**: NFTs can be transferred between addresses

### 2. Frontend Integration

#### NFT Context (`client/src/contexts/NFTContext.tsx`)
- Manages NFT state and ownership
- Handles minting and trading operations
- Syncs with blockchain

#### NFT Library (`client/src/lib/nft.ts`)
- Blockchain interaction functions
- Score submission to blockchain
- NFT queries and transactions
- Trading functionality

#### Updated Components
- **Skins Page**: Shows unlock status, required scores, and minting
- **SkinCard**: Displays lock status, required scores, and mint button
- **NFTTrading**: Component for transferring NFTs to other addresses
- **Game Page**: Automatically submits scores to blockchain

## Score Requirements

| Skin | Required Score | Description |
|------|---------------|-------------|
| Blue | 0 | Default skin, always unlocked |
| Red | 100 | Unlock at 100 points |
| Green | 500 | Unlock at 500 points |
| Yellow | 1,000 | Unlock at 1,000 points |
| Purple | 2,500 | Unlock at 2,500 points |
| Orange | 5,000 | Unlock at 5,000 points |

## Deployment Steps

### 1. Deploy Smart Contract

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

After deployment, you'll receive:
- Package ID
- Registry Object ID (ScoreRegistry)
- Admin Cap Object ID

### 2. Update Contract Addresses

Edit `client/src/lib/nft.ts` and update:
```typescript
export const PACKAGE_ID = "0xYOUR_PACKAGE_ID";
export const REGISTRY_ID = "0xYOUR_REGISTRY_ID";
export const ADMIN_CAP_ID = "0xYOUR_ADMIN_CAP_ID";
```

### 3. Test the Integration

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




