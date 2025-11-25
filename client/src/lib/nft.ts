import { Transaction } from "@onelabs/sui/transactions";
import type { SuiClient } from "@onelabs/sui/client";
import type { WalletWithRequiredFeatures } from "@onelabs/wallet-standard";

// Helper to execute transaction with wallet
async function executeTransaction(
  wallet: WalletWithRequiredFeatures,
  transaction: Transaction,
  client: SuiClient
): Promise<string> {
  // Get the sign and execute feature
  const signAndExecute = wallet.features["sui:signAndExecuteTransaction"];
  if (!signAndExecute) {
    throw new Error("Wallet does not support signAndExecuteTransaction");
  }
  
  // Sign and execute - pass transaction directly, wallet will build it
  const result = await signAndExecute.signAndExecuteTransaction({
    transaction: transaction,
    account: wallet.accounts[0],
    chain: wallet.chains[0],
  });

  return result.digest;
}

// Contract addresses (update these after deployment)
// OneChain Testnet RPC
export const ONECHAIN_RPC = "https://rpc-testnet.onelabs.cc";

// Your Deployed Contract Address
export const PACKAGE_ID = "0x7f56fe8961f20d4c54e1c8b5b21b032f8a7e8dd8cfa66fd1a565dcac5cc9dfe8";

// The Shared Score Registry (Public Read/Write for Game Logic)
export const REGISTRY_ID = "0x6d709f5d431c3557703309db51ca634b4d52c2644fe83c6828d5e70d06e0cf12";

// Admin Capability (Optional for frontend, usually for backend admin dashboards)
export const ADMIN_CAP_ID = "0xd08e69a74a3adbeae3477228c3e60bb064dab6a11ec5b065d90ff7584aeb3ba6";

// Module Name (Must match your Move code)
export const MODULE_NAME = "runner_nft";

// Skin IDs matching the contract
export const SKIN_IDS = {
  BLUE: 0,
  RED: 1,
  GREEN: 2,
  YELLOW: 3,
  PURPLE: 4,
  ORANGE: 5,
} as const;

// Required scores for each skin
export const REQUIRED_SCORES = {
  [SKIN_IDS.BLUE]: 0,
  [SKIN_IDS.RED]: 20,
  [SKIN_IDS.GREEN]: 50,
  [SKIN_IDS.YELLOW]: 100,
  [SKIN_IDS.PURPLE]: 250,
  [SKIN_IDS.ORANGE]: 500,
} as const;

// Map skin IDs to string IDs
export const SKIN_ID_TO_STRING: Record<number, string> = {
  [SKIN_IDS.BLUE]: "runner-blue",
  [SKIN_IDS.RED]: "runner-red",
  [SKIN_IDS.GREEN]: "runner-green",
  [SKIN_IDS.YELLOW]: "runner-yellow",
  [SKIN_IDS.PURPLE]: "runner-purple",
  [SKIN_IDS.ORANGE]: "runner-orange",
};

export const STRING_TO_SKIN_ID: Record<string, number> = {
  "runner-blue": SKIN_IDS.BLUE,
  "runner-red": SKIN_IDS.RED,
  "runner-green": SKIN_IDS.GREEN,
  "runner-yellow": SKIN_IDS.YELLOW,
  "runner-purple": SKIN_IDS.PURPLE,
  "runner-orange": SKIN_IDS.ORANGE,
};

export interface RunnerSkinNFT {
  id: string;
  skin_id: number;
  name: string;
  image_url: string;
  unlocked_at_score: number;
  minted_at: number;
}

/**
 * Update player score on-chain
 */
export async function updateScore(
  score: number,
  wallet: WalletWithRequiredFeatures,
  client: SuiClient
): Promise<string> {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  const tx = new Transaction();
  tx.moveCall({
    package: PACKAGE_ID,
    module: "runner_nft",
    function: "update_score",
    arguments: [
      tx.object(REGISTRY_ID),        // registry: &mut ScoreRegistry
      tx.pure.u64(score),             // new_score: u64
      // ctx: &TxContext is automatically provided by the transaction
    ],
  });

  return await executeTransaction(wallet, tx, client);
}

/**
 * Get player's current score from blockchain
 * Queries ScoreUpdated events to find the latest score for the player
 */
export async function getPlayerScore(
  playerAddress: string,
  client: SuiClient
): Promise<number> {
  try {
    // Query ScoreUpdated events to get the latest score
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::runner_nft::ScoreUpdated`,
      },
      limit: 100, // Get recent events
      order: "descending",
    });

    // Find the latest score for this player
    for (const event of events.data) {
      if (event.parsedJson && typeof event.parsedJson === 'object') {
        const eventData = event.parsedJson as any;
        if (eventData.player === playerAddress) {
          return Number(eventData.new_score) || 0;
        }
      }
    }

    // If no events found, return 0
    return 0;
  } catch (error) {
    console.error("Error getting player score from blockchain:", error);
    // Fallback to localStorage on error
    return getLocalStorageScore();
  }
}

/**
 * Get score from localStorage as fallback
 */
function getLocalStorageScore(): number {
  if (typeof window !== "undefined") {
    const highScore = localStorage.getItem("endless-runner-high-score");
    if (highScore) {
      return parseInt(highScore, 10);
    }
  }
  return 0;
}

/**
 * Check if player can unlock a skin
 */
export async function canUnlockSkin(
  playerAddress: string,
  skinId: number,
  client: SuiClient
): Promise<boolean> {
  try {
    // Check locally based on score
    const playerScore = await getPlayerScore(playerAddress, client);
    const requiredScore = REQUIRED_SCORES[skinId as keyof typeof REQUIRED_SCORES] || 0;
    return playerScore >= requiredScore;
  } catch (error) {
    console.error("Error checking unlock status:", error);
    return false;
  }
}

/**
 * Mint NFT for unlocked skin
 */
export async function mintSkinNFT(
  skinId: number,
  imageUrl: string,
  wallet: WalletWithRequiredFeatures,
  client: SuiClient
): Promise<string> {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  // Convert imageUrl string to bytes (vector<u8>)
  const imageUrlBytes = Array.from(new TextEncoder().encode(imageUrl));

  const tx = new Transaction();
  tx.moveCall({
    package: PACKAGE_ID,
    module: "runner_nft",
    function: "mint_skin_nft",
    arguments: [
      tx.object(REGISTRY_ID),        // registry: &mut ScoreRegistry
      tx.pure.u8(skinId),             // skin_id: u8
      tx.pure.vector("u8", imageUrlBytes), // image_url: vector<u8>
      // ctx: &mut TxContext is automatically provided by the transaction
    ],
  });

  return await executeTransaction(wallet, tx, client);
}

/**
 * Transfer NFT to another address (for trading)
 */
export async function transferNFT(
  nftId: string,
  recipientAddress: string,
  wallet: WalletWithRequiredFeatures,
  client: SuiClient
): Promise<string> {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  const tx = new Transaction();
  tx.moveCall({
    package: PACKAGE_ID,
    module: "runner_nft",
    function: "transfer_nft",
    arguments: [
      tx.object(nftId),
      tx.pure.address(recipientAddress),
    ],
  });

  return await executeTransaction(wallet, tx, client);
}

/**
 * Get all NFTs owned by a player
 */
export async function getOwnedNFTs(
  playerAddress: string,
  client: SuiClient
): Promise<RunnerSkinNFT[]> {
  try {
    const objects = await client.getOwnedObjects({
      owner: playerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::runner_nft::RunnerSkinNFT`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    return objects.data
      .map((obj) => {
        if (obj.data?.content && "fields" in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return {
            id: obj.data.objectId,
            skin_id: Number(fields.skin_id),
            name: fields.name,
            image_url: fields.image_url,
            unlocked_at_score: Number(fields.unlocked_at_score),
            minted_at: Number(fields.minted_at),
          };
        }
        return null;
      })
      .filter((nft): nft is RunnerSkinNFT => nft !== null);
  } catch (error) {
    console.error("Error getting owned NFTs:", error);
    return [];
  }
}

