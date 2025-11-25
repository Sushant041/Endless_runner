import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useWallet } from "./WalletContext";
import { useCurrentWallet, useSuiClient } from "@onelabs/dapp-kit";
import { 
  getOwnedNFTs, 
  getPlayerScore, 
  canUnlockSkin, 
  mintSkinNFT,
  REQUIRED_SCORES,
  SKIN_IDS,
  type RunnerSkinNFT 
} from "@/lib/nft";
import { toast } from "sonner";

interface NFTContextType {
  ownedNFTs: RunnerSkinNFT[];
  playerScore: number;
  isLoading: boolean;
  refreshNFTs: () => Promise<void>;
  refreshScore: () => Promise<void>;
  mintNFT: (skinId: number) => Promise<void>;
  canUnlock: (skinId: number) => boolean;
  isUnlocked: (skinId: number) => boolean;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export function NFTProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useWallet();
  const { currentWallet } = useCurrentWallet();
  const client = useSuiClient();
  const [ownedNFTs, setOwnedNFTs] = useState<RunnerSkinNFT[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshNFTs = useCallback(async () => {
    if (!isConnected || !address) {
      setOwnedNFTs([]);
      return;
    }

    try {
      setIsLoading(true);
      const nfts = await getOwnedNFTs(address, client);
      setOwnedNFTs(nfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast.error("Failed to load NFTs");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, client]);

  const refreshScore = useCallback(async () => {
    if (!isConnected || !address) {
      // Use localStorage score when wallet not connected
      if (typeof window !== "undefined") {
        const highScore = localStorage.getItem("endless-runner-high-score");
        setPlayerScore(highScore ? parseInt(highScore, 10) : 0);
      } else {
        setPlayerScore(0);
      }
      return;
    }

    try {
      const score = await getPlayerScore(address, client);
      setPlayerScore(score);
    } catch (error) {
      console.error("Error fetching score:", error);
      // Fallback to localStorage on error
      if (typeof window !== "undefined") {
        const highScore = localStorage.getItem("endless-runner-high-score");
        setPlayerScore(highScore ? parseInt(highScore, 10) : 0);
      }
    }
  }, [isConnected, address, client]);

  const mintNFT = useCallback(async (skinId: number) => {
    if (!isConnected || !currentWallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if already owns this NFT
      const alreadyOwned = ownedNFTs.some(nft => nft.skin_id === skinId);
      if (alreadyOwned) {
        toast.info("You already own this NFT!");
        return;
      }

      // Check if can unlock
      const canUnlockCheck = await canUnlockSkin(address!, skinId, client);
      if (!canUnlockCheck) {
        toast.error(`You need a score of ${REQUIRED_SCORES[skinId as keyof typeof REQUIRED_SCORES]} to unlock this skin!`);
        return;
      }

      // Get image URL for the skin
      const imageUrl = getSkinImageUrl(skinId);
      
      const loadingToast = toast.loading("Minting NFT...");
      const txDigest = await mintSkinNFT(skinId, imageUrl, currentWallet, client);
      toast.success("NFT minted successfully!", {
        id: loadingToast,
        description: `Transaction: ${txDigest.slice(0, 8)}...`,
      });

      // Refresh NFTs
      await refreshNFTs();
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      // Dismiss loading toast if it exists
      toast.dismiss();
      toast.error(error.message || "Failed to mint NFT");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, currentWallet, address, ownedNFTs, refreshNFTs, client]);

  const canUnlock = useCallback((skinId: number): boolean => {
    const requiredScore = REQUIRED_SCORES[skinId as keyof typeof REQUIRED_SCORES] || 0;
    return playerScore >= requiredScore;
  }, [playerScore]);

  const isUnlocked = useCallback((skinId: number): boolean => {
    return ownedNFTs.some(nft => nft.skin_id === skinId);
  }, [ownedNFTs]);

  // Refresh data when wallet connects/disconnects or account changes
  useEffect(() => {
    if (isConnected && address) {
      refreshNFTs();
      refreshScore();
    } else {
      setOwnedNFTs([]);
      // Still load localStorage score when not connected
      refreshScore();
    }
  }, [isConnected, address, refreshNFTs, refreshScore]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAccountChange = () => {
      console.log("Account changed, refreshing NFT data...");
      if (isConnected && address) {
        refreshNFTs();
        refreshScore();
      }
    };

    window.addEventListener("walletAccountChanged", handleAccountChange);
    return () => {
      window.removeEventListener("walletAccountChanged", handleAccountChange);
    };
  }, [isConnected, address, refreshNFTs, refreshScore]);

  // Also listen for localStorage changes to update score
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = () => {
      if (!isConnected || !address) {
        refreshScore();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check on mount and when game might update score
    const interval = setInterval(() => {
      if (!isConnected || !address) {
        refreshScore();
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isConnected, address, refreshScore]);

  return (
    <NFTContext.Provider
      value={{
        ownedNFTs,
        playerScore,
        isLoading,
        refreshNFTs,
        refreshScore,
        mintNFT,
        canUnlock,
        isUnlocked,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
}

export function useNFT() {
  const context = useContext(NFTContext);
  if (context === undefined) {
    throw new Error("useNFT must be used within an NFTProvider");
  }
  return context;
}

// Helper function to get skin image URL
function getSkinImageUrl(skinId: number): string {
  const skinImages: Record<number, string> = {
    [SKIN_IDS.BLUE]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23003366' width='64' height='64'/%3E%3Crect fill='%2300CCFF' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%2300CCFF' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%2300CCFF' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
    [SKIN_IDS.RED]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23330000' width='64' height='64'/%3E%3Crect fill='%23FF3333' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FF3333' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FF3333' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
    [SKIN_IDS.GREEN]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23003300' width='64' height='64'/%3E%3Crect fill='%2300FF00' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%2300FF00' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%2300FF00' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
    [SKIN_IDS.YELLOW]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23333300' width='64' height='64'/%3E%3Crect fill='%23FFFF00' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FFFF00' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FFFF00' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
    [SKIN_IDS.PURPLE]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23330033' width='64' height='64'/%3E%3Crect fill='%23FF00FF' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FF00FF' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FF00FF' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
    [SKIN_IDS.ORANGE]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23330000' width='64' height='64'/%3E%3Crect fill='%23FF9900' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FF9900' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FF9900' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  };
  return skinImages[skinId] || skinImages[SKIN_IDS.BLUE];
}

