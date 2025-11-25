import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import SkinCard from "@/components/SkinCard";
import NFTTrading from "@/components/NFTTrading";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useNFT } from "@/contexts/NFTContext";
import { useWallet } from "@/contexts/WalletContext";
import { SKIN_IDS, REQUIRED_SCORES, STRING_TO_SKIN_ID } from "@/lib/nft";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Skin {
  id: string;
  name: string;
  thumbnail: string;
}

const SKINS: Skin[] = [
  {
    id: "runner-blue",
    name: "Blue Runner",
    thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23003366' width='64' height='64'/%3E%3Crect fill='%2300CCFF' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%2300CCFF' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%2300CCFF' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  },
  {
    id: "runner-red",
    name: "Red Runner",
    thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23330000' width='64' height='64'/%3E%3Crect fill='%23FF3333' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FF3333' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FF3333' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  },
  {
    id: "runner-green",
    name: "Green Runner",
    thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23003300' width='64' height='64'/%3E%3Crect fill='%2300FF00' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%2300FF00' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%2300FF00' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  },
  {
    id: "runner-yellow",
    name: "Yellow Runner",
    thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23333300' width='64' height='64'/%3E%3Crect fill='%23FFFF00' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FFFF00' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FFFF00' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  },
  {
    id: "runner-purple",
    name: "Purple Runner",
    thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23330033' width='64' height='64'/%3E%3Crect fill='%23FF00FF' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FF00FF' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FF00FF' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  },
  {
    id: "runner-orange",
    name: "Orange Runner",
    thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23330000' width='64' height='64'/%3E%3Crect fill='%23FF9900' x='16' y='8' width='32' height='24'/%3E%3Crect fill='%23FF9900' x='8' y='32' width='16' height='24'/%3E%3Crect fill='%23FF9900' x='40' y='32' width='16' height='24'/%3E%3C/svg%3E",
  },
];

const SELECTED_SKIN_KEY = "endless-runner-selected-skin";

export default function Skins() {
  const { isConnected } = useWallet();
  const { playerScore, ownedNFTs, canUnlock, isUnlocked, mintNFT, isLoading } = useNFT();
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SELECTED_SKIN_KEY) || "runner-blue";
    }
    return "runner-blue";
  });

  const handleEquip = (skinId: string) => {
    const numericId = STRING_TO_SKIN_ID[skinId];
    
    // Check if user owns the NFT (if wallet is connected)
    if (isConnected && !isUnlocked(numericId)) {
      toast.error("You don't own this NFT! Mint it first.");
      return;
    }

    setEquippedSkin(skinId);
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_SKIN_KEY, skinId);
    }
  };

  const handleMint = async (skinId: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const numericId = STRING_TO_SKIN_ID[skinId];
    await mintNFT(numericId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1
              className="text-3xl sm:text-5xl font-bold text-primary mb-4"
              style={{ textShadow: "0 0 20px rgba(204, 255, 255, 1)" }}
            >
              CHARACTER SKINS
            </h1>
            <p className="text-sm sm:text-base text-accent">
              Unlock skins by achieving high scores! Each skin is an NFT you can own and trade.
            </p>
          </div>

          {/* Player Stats */}
          {isConnected && (
            <div className="bg-card border-2 border-primary rounded-xl p-4 sm:p-6 mb-8 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Score</p>
                  <p className="text-2xl font-bold text-accent">{playerScore}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Owned NFTs</p>
                  <p className="text-2xl font-bold text-primary">{ownedNFTs.length} / 6</p>
                </div>
              </div>
            </div>
          )}

          {/* Currently Equipped */}
          <div className="bg-card border-2 border-accent rounded-xl p-4 sm:p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Currently Equipped:</p>
            <p 
              className="text-lg sm:text-2xl font-bold text-accent"
              style={{ textShadow: "0 0 10px rgba(0, 204, 255, 0.6)" }}
            >
              {SKINS.find((s) => s.id === equippedSkin)?.name || "Blue Runner"}
            </p>
          </div>

          {/* Tabs for Skins and Owned NFTs */}
          <Tabs defaultValue="all-skins" className="mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all-skins">All Skins</TabsTrigger>
              <TabsTrigger value="my-nfts">My NFTs ({ownedNFTs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all-skins">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SKINS.map((skin) => (
                  <SkinCard
                    key={skin.id}
                    id={skin.id}
                    name={skin.name}
                    thumbnail={skin.thumbnail}
                    onEquip={handleEquip}
                    onMint={handleMint}
                    equippedSkin={equippedSkin}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="my-nfts">
              {ownedNFTs.length === 0 ? (
                <div className="text-center py-12 bg-card border-2 border-primary rounded-xl">
                  <p className="text-muted-foreground mb-4">You don't own any NFTs yet!</p>
                  <p className="text-sm text-muted-foreground">
                    Play the game and achieve high scores to unlock NFTs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedNFTs.map((nft) => {
                    const skin = SKINS.find(s => STRING_TO_SKIN_ID[s.id] === nft.skin_id);
                    if (!skin) return null;
                    
                    return (
                      <div
                        key={nft.id}
                        className="bg-card border-2 border-accent rounded-xl p-4 shadow-lg"
                      >
                        <div className="w-full aspect-square bg-background rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-accent">
                          <img
                            src={skin.thumbnail}
                            alt={skin.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="text-primary text-xs font-bold mb-2 text-center">
                          {skin.name}
                        </h3>
                        <div className="text-xs text-muted-foreground mb-4 space-y-1">
                          <p>Unlocked at: {nft.unlocked_at_score} points</p>
                          <p className="font-mono text-[10px] break-all">ID: {nft.id.slice(0, 12)}...</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleEquip(skin.id)}
                            className="w-full bg-accent text-accent-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary"
                          >
                            EQUIP
                          </Button>
                          <NFTTrading nftId={nft.id} skinName={skin.name} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Back Button */}
          <div className="flex justify-center">
            <Link href="/">
              <Button className="bg-secondary text-secondary-foreground text-sm font-bold px-6 py-2 rounded-lg hover:bg-accent transition-all shadow-md hover:scale-105 active:scale-95">
                ← BACK TO HOME
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-4 text-center text-xs text-muted-foreground">
        <p>Endless Runner © 2025</p>
      </footer>
    </div>
  );
}
