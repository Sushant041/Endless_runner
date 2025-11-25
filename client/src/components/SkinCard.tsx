import { Button } from "@/components/ui/button";
import { useNFT } from "@/contexts/NFTContext";
import { useWallet } from "@/contexts/WalletContext";
import { STRING_TO_SKIN_ID, REQUIRED_SCORES } from "@/lib/nft";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, Coins } from "lucide-react";

interface SkinCardProps {
  id: string;
  name: string;
  thumbnail: string;
  onEquip: (skinId: string) => void;
  onMint?: (skinId: string) => void;
  equippedSkin: string;
}

export default function SkinCard({ id, name, thumbnail, onEquip, onMint, equippedSkin }: SkinCardProps) {
  const { isConnected } = useWallet();
  const { playerScore, canUnlock, isUnlocked, isLoading } = useNFT();
  const skinId = STRING_TO_SKIN_ID[id];
  const requiredScore = REQUIRED_SCORES[skinId as keyof typeof REQUIRED_SCORES] || 0;
  const unlocked = isUnlocked(skinId);
  const canUnlockSkin = canUnlock(skinId);

  const handleEquip = () => {
    if (isConnected && !unlocked) {
      return; // Can't equip if not owned (when wallet connected)
    }
    onEquip(id);
  };

  const handleMint = () => {
    if (onMint) {
      onMint(id);
    }
  };

  return (
    <div className={`bg-card border-2 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
      unlocked ? "border-accent" : "border-primary opacity-75"
    }`}>
      <div className="relative w-full aspect-square bg-background rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-accent hover:border-primary transition-colors">
        <img
          src={thumbnail}
          alt={name}
          className="w-full h-full object-cover transition-transform hover:scale-110"
        />
        {unlocked && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              Owned
            </Badge>
          </div>
        )}
        {!unlocked && isConnected && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-500 text-white">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          </div>
        )}
      </div>
      <h3 className="text-primary text-xs font-bold mb-2 text-center" style={{ textShadow: "0 0 8px rgba(204, 255, 255, 0.6)" }}>
        {name}
      </h3>
      
      {isConnected && (
        <div className="mb-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Coins className="w-3 h-3" />
            <span>Score: {requiredScore}</span>
          </div>
          {!canUnlockSkin && (
            <p className="text-xs text-destructive mt-1">
              Need {requiredScore - playerScore} more points
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {isConnected && !unlocked && canUnlockSkin && (
          <Button
            onClick={handleMint}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-accent transition-all shadow-md hover:scale-105 active:scale-95"
          >
            {isLoading ? "Minting..." : "MINT NFT"}
          </Button>
        )}
        <Button
          onClick={handleEquip}
          disabled={!isConnected || !unlocked}
          className="w-full bg-accent text-accent-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {unlocked && equippedSkin !== id ? "EQUIP" : unlocked && equippedSkin === id ? "EQUIPPED" : isConnected ? "LOCKED" : "connect wallet to equip"}
        </Button>
      </div>
    </div>
  );
}
