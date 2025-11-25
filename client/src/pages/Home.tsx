import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Link } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

export default function Home() {
  const { isConnected, address, connect, isLoading, error } = useWallet();

  const handleConnect = async () => {
    if (isConnected && address) {
      toast.info("Wallet already connected!");
      return;
    }
    const result = await connect();
    if (result === "Connected to OneWallet") {
      toast.success("Wallet connected successfully!");
    } else {
      toast.error(result || "Failed to connect wallet");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1
              className="text-4xl sm:text-6xl font-bold text-primary mb-4 animate-pulse"
              style={{ textShadow: "0 0 20px rgba(204, 255, 255, 1), 0 0 40px rgba(204, 255, 255, 0.6)" }}
            >
              ENDLESS RUNNER
            </h1>
            <p className="text-lg sm:text-2xl text-accent mb-8" style={{ textShadow: "0 0 10px rgba(255, 0, 255, 0.8)" }}>
              Jump. Dodge. Survive. Repeat.
            </p>
          </div>

          {/* Description */}
          <div className="bg-card border-2 border-primary rounded-xl p-6 sm:p-8 mb-8 shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-sm sm:text-base text-foreground mb-4">
              Test your reflexes in an endless world of obstacles. Jump over hazards, collect power-ups, and climb the leaderboard.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              More features coming soon: Abilities with skins, custom backgrounds and rewards.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/game">
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground text-sm font-bold px-8 py-3 rounded-xl hover:bg-accent transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                🎮 PLAY GAME
              </Button>
            </Link>
            <Button
              onClick={handleConnect}
              disabled={isLoading || isConnected}
              className="w-full sm:w-auto bg-secondary text-secondary-foreground text-sm font-bold px-8 py-3 rounded-xl hover:bg-accent transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "⏳ Connecting..." : isConnected ? "✅ Connected" : "🔗 CONNECT WALLET"}
            </Button>
          </div>

          {/* Additional Links */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center text-xs">
            <Link href="/skins">
              <Button variant="outline" className="w-full sm:w-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all hover:scale-105">
                🎨 VIEW SKINS
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-4 text-center text-xs text-muted-foreground">
        <p>Endless Runner © 2025 | Built with React, Phaser, and TailwindCSS</p>
      </footer>
    </div>
  );
}
