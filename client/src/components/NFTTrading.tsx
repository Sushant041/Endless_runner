import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNFT } from "@/contexts/NFTContext";
import { useWallet } from "@/contexts/WalletContext";
import { useCurrentWallet, useSuiClient } from "@onelabs/dapp-kit";
import { transferNFT } from "@/lib/nft";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface NFTTradingProps {
  nftId: string;
  skinName: string;
}

export default function NFTTrading({ nftId, skinName }: NFTTradingProps) {
  const { isConnected } = useWallet();
  const { currentWallet } = useCurrentWallet();
  const client = useSuiClient();
  const { refreshNFTs } = useNFT();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleTransfer = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!recipientAddress || recipientAddress.length < 10) {
      toast.error("Please enter a valid recipient address");
      return;
    }

    if (!currentWallet) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setIsTransferring(true);
      const loadingToast = toast.loading("Transferring NFT...");
      
      const txDigest = await transferNFT(nftId, recipientAddress, currentWallet, client);
      
      toast.success("NFT transferred successfully!", {
        id: loadingToast,
        description: `Transaction: ${txDigest.slice(0, 8)}...`,
      });

      await refreshNFTs();
      setIsOpen(false);
      setRecipientAddress("");
    } catch (error: any) {
      console.error("Error transferring NFT:", error);
      // Dismiss loading toast if it exists
      toast.dismiss();
      toast.error(error.message || "Failed to transfer NFT");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Send className="w-4 h-4 mr-2" />
          Trade NFT
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trade {skinName} NFT</DialogTitle>
          <DialogDescription>
            Transfer this NFT to another address. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Recipient Address</label>
            <Input
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleTransfer}
              disabled={isTransferring || !recipientAddress}
              className="flex-1"
            >
              {isTransferring ? "Transferring..." : "Transfer NFT"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

