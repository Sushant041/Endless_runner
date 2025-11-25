import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";

export default function Header() {
  const { isConnected, address, disconnect, connect, isLoading } = useWallet();

  const formatAddress = (addr: string | null) => {
    if (!addr) return "Not Connected";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="w-full bg-card border-b border-primary shadow-lg">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all hover:scale-105">
          <img src={APP_LOGO} alt={APP_TITLE} className="w-10 h-10 rounded-lg" />
          <h1 className="text-primary text-sm font-bold hidden sm:block" style={{ textShadow: "0 0 10px rgba(204, 255, 255, 0.8)" }}>
            {APP_TITLE}
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground hidden sm:block">
                <span className="text-muted-foreground">Wallet: </span>
                <span className="text-accent font-mono">{formatAddress(address)}</span>
              </div>
              <Button
                onClick={disconnect}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Wallet className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
