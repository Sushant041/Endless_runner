import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import PhaserGame from "@/components/PhaserGame";
import { Link } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { useNFT } from "@/contexts/NFTContext";
import { useCurrentWallet, useSuiClient } from "@onelabs/dapp-kit";
import { updateScore } from "@/lib/nft";
import { toast } from "sonner";

const HIGH_SCORE_KEY = "endless-runner-high-score";
const SELECTED_SKIN_KEY = "endless-runner-selected-skin";

export default function Game() {
  const { isConnected, address, connect } = useWallet();
  const { currentWallet } = useCurrentWallet();
  const client = useSuiClient();
  const { refreshScore, playerScore } = useNFT();
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [isScoreLoaded, setIsScoreLoaded] = useState(false);

  const formatAddress = (addr: string | null) => {
    if (!addr) return "Not Connected";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Load high score from blockchain when wallet is connected
  // Don't start game until score is loaded
  useEffect(() => {
    const loadHighScore = async () => {
      if (isConnected && address) {
        setIsLoadingScore(true);
        setIsScoreLoaded(false);
        try {
          await refreshScore();
          // High score will be updated via playerScore from NFTContext
          setIsScoreLoaded(true);
        } catch (error) {
          console.error("Error loading high score:", error);
          // Still allow game to start even if score fetch fails
          setIsScoreLoaded(true);
        } finally {
          setIsLoadingScore(false);
        }
      } else {
        setHighScore(0);
        setIsScoreLoaded(false);
      }
    };

    loadHighScore();
  }, [isConnected, address, refreshScore]);

  // Update high score when playerScore changes (fetched from blockchain)
  useEffect(() => {
    if (isConnected && address) {
      if (playerScore >= 0) {
        setHighScore(playerScore);
      }
    } else {
      setHighScore(0);
    }
  }, [playerScore, isConnected, address]);

  const handleGameOver = async (coinsCollected: number) => {
    setFinalScore(coinsCollected);
    
    const isRecord = coinsCollected > highScore;
    setIsNewRecord(isRecord);
    if (isRecord) {
      setHighScore(coinsCollected);
    }
    
    if (isRecord && isConnected && address && currentWallet) {
      try {
        setIsSubmittingScore(true);
        const loadingToast = toast.loading("Submitting coins to blockchain...");
        await updateScore(coinsCollected, currentWallet, client);
        await refreshScore();
        toast.success("Run recorded on-chain!", {
          id: loadingToast,
        });
      } catch (error: any) {
        console.error("Error submitting score:", error);
        toast.dismiss();
        toast.error("Failed to submit coins to blockchain");
      } finally {
        setIsSubmittingScore(false);
      }
    } else if (!isRecord) {
      toast.info("Coins below your best run — keep pushing!");
    }
    
    setGameOver(true);
  };

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
  };

  const handleRestart = () => {
    setGameOver(false);
    setFinalScore(0);
    setCurrentScore(0);
    setIsNewRecord(false);
    setGameKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* HUD Bar */}
      <div className="bg-card border-b border-primary px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-xs sm:text-sm">
              <span className="text-muted-foreground">Coins: </span>
              <span 
                className="text-accent font-bold text-xl transition-all"
                style={{ textShadow: "0 0 10px rgba(0, 204, 255, 0.8)" }}
              >
                {currentScore || finalScore}
              </span>
            </div>
            {highScore > 0 && (
              <div className="text-xs sm:text-sm">
                <span className="text-muted-foreground">Best: </span>
                <span className="text-primary font-bold">{highScore}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block space-x-2">
            <span>
              Jump with <kbd className="px-2 py-1 bg-background border border-accent rounded text-accent">SPACE</kbd> / Click
            </span>
            <span>
              Slide with <kbd className="px-2 py-1 bg-background border border-accent rounded text-accent">↓</kbd>
            </span>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          Wallet: <span className="text-accent">{formatAddress(address)}</span>
        </div>
      </div>

      {/* Game Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {!isConnected ? (
          <div className="w-full max-w-2xl bg-card border-2 border-primary rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-4xl font-bold text-primary mb-4" style={{ textShadow: "0 0 20px rgba(204, 255, 255, 0.8)" }}>
              Wallet Required
            </h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to play the game and track your scores on the blockchain.
            </p>
            <Button
              onClick={connect}
              className="bg-primary text-primary-foreground text-sm font-bold px-8 py-3 rounded-lg hover:bg-accent transition-all shadow-md hover:scale-105 active:scale-95"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            {!isScoreLoaded ? (
              <div className="w-full flex flex-col items-center justify-center py-12">
                <div className="bg-card border-2 border-primary rounded-2xl p-8 sm:p-12 text-center shadow-2xl max-w-md">
                  <div className="mb-4">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-primary mb-2" style={{ textShadow: "0 0 10px rgba(204, 255, 255, 0.8)" }}>
                    Loading Your Coins
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fetching your best coin run from blockchain...
                  </p>
                </div>
              </div>
            ) : (
              <PhaserGame 
                key={gameKey} 
                onGameOver={handleGameOver} 
                onScoreUpdate={handleScoreUpdate}
                selectedSkin={typeof window !== "undefined" ? localStorage.getItem(SELECTED_SKIN_KEY) || "runner-blue" : "runner-blue"}
              />
            )}
          </div>
        )}
      </main>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-card border-4 border-primary rounded-2xl p-8 sm:p-12 text-center shadow-2xl max-w-md mx-4 animate-in zoom-in-95 duration-300">
            <h2
              className="text-3xl sm:text-5xl font-bold text-destructive mb-6 animate-pulse"
              style={{ textShadow: "0 0 20px rgba(255, 0, 0, 0.8)" }}
            >
              GAME OVER
            </h2>
            <div className="bg-background rounded-lg p-6 mb-8 border-2 border-accent">
              {isNewRecord && (
                <div className="mb-4 animate-pulse">
                  <p className="text-sm sm:text-base font-bold text-primary" style={{ textShadow: "0 0 10px rgba(204, 255, 255, 0.8)" }}>
                    🎉 NEW RECORD! 🎉
                  </p>
                </div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Coins Collected</p>
              <p 
                className="text-4xl sm:text-6xl font-bold text-accent"
                style={{ textShadow: "0 0 15px rgba(0, 204, 255, 0.8)" }}
              >
                {finalScore}
              </p>
              {highScore > 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Best Run: <span className="text-primary font-bold">{highScore}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleRestart}
                className="flex-1 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-lg hover:bg-accent transition-all shadow-md hover:scale-105 active:scale-95"
              >
                🔄 RESTART
              </Button>
              <Link href="/" className="flex-1">
                <Button className="w-full bg-secondary text-secondary-foreground text-sm font-bold py-3 rounded-lg hover:bg-accent transition-all shadow-md hover:scale-105 active:scale-95">
                  🏠 GO HOME
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
