# NFT Implementation Guide

## Overview

The Endless Runner game now supports NFT-based skins that can be unlocked through gameplay and traded on the blockchain.

## Architecture

### Smart Contract (`contracts/sources/runner_nft.move`)
- **ScoreRegistry**: Tracks player scores on-chain
- **RunnerSkinNFT**: NFT structure for each skin
- **Score-based unlocking**: Each skin requires a minimum score
- **Trading support**: NFTs can be transferred between addresses

### Frontend Integration

1. **NFTContext** (`client/src/contexts/NFTContext.tsx`)
   - Manages NFT state
   - Handles minting and trading
   - Syncs with blockchain

2. **NFT Library** (`client/src/lib/nft.ts`)
   - Blockchain interaction functions
   - Score submission
   - NFT queries and transactions

3. **Updated Components**:
   - **Skins Page**: Shows unlock status, allows minting
   - **SkinCard**: Displays lock status and required scores
   - **NFTTrading**: Component for transferring NFTs
   - **Game Page**: Submits scores to blockchain

## Workflow

### 1. Playing the Game
- Player plays and achieves a score
- Score is automatically submitted to blockchain (if wallet connected)
- Score is stored in ScoreRegistry

### 2. Unlocking Skins
- Player checks which skins they can unlock based on their score
- If score meets requirement, player can mint the NFT
- NFT is minted and transferred to player's wallet

### 3. Using Skins
- Player can equip any NFT they own
- Equipped skin is saved to localStorage
- Skin is applied to the runner in-game

### 4. Trading NFTs
- Player can transfer NFTs to other addresses
- Transfer is executed on-chain
- NFT ownership is updated

## Deployment Steps

1. **Deploy Smart Contract**:
   ```bash
   cd contracts
   sui move build
   sui client publish --gas-budget 100000000
   ```

2. **Update Contract Addresses**:
   - Copy the package ID, registry ID, and admin cap ID from deployment
   - Update `client/src/lib/nft.ts` with these addresses

3. **Test the Integration**:
   - Connect wallet
   - Play game and achieve scores
   - Unlock and mint NFTs
   - Test trading functionality

## Score Requirements

| Skin | Required Score |
|------|---------------|
| Blue | 0 (default) |
| Red | 100 |
| Green | 500 |
| Yellow | 1,000 |
| Purple | 2,500 |
| Orange | 5,000 |

## Future Enhancements

- NFT marketplace integration
- Rarity system
- Special edition skins
- Score leaderboard on-chain
- NFT staking rewards

