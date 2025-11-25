import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useConnectWallet, useDisconnectWallet, useWallets, useCurrentWallet } from "@onelabs/dapp-kit";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<string | undefined>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isOneWalletInstalled: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useWallets();
  const { mutate: connectWallet, isPending: isConnecting } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { currentWallet, isConnected: sdkConnected, connectionStatus } = useCurrentWallet();
  
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOneWalletInstalled, setIsOneWalletInstalled] = useState(false);
  
  // Track previous address to detect account changes
  const prevAddressRef = useRef<string | null>(null);

  // Check for OneWallet installation
  useEffect(() => {
    const oneWallet = wallets.find(w => w.name.toLowerCase().includes('one') || w.name.toLowerCase().includes('onechain'));
    setIsOneWalletInstalled(!!oneWallet || wallets.length > 0);
  }, [wallets]);

  // Sync SDK connection state with our state and detect account changes
  useEffect(() => {
    if (sdkConnected && currentWallet) {
      setIsConnected(true);
      // Get address from current wallet
      const walletAddress = currentWallet.accounts?.[0]?.address || null;
      
      // Detect account change
      if (walletAddress && prevAddressRef.current && prevAddressRef.current !== walletAddress) {
        console.log("Account changed from", prevAddressRef.current, "to", walletAddress);
        // Trigger a custom event for account change
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("walletAccountChanged", { 
            detail: { oldAddress: prevAddressRef.current, newAddress: walletAddress } 
          }));
        }
      }
      
      setAddress(walletAddress);
      prevAddressRef.current = walletAddress;
      
      if (walletAddress && typeof window !== "undefined") {
        localStorage.setItem("onechain_address", walletAddress);
      }
    } else {
      setIsConnected(false);
      setAddress(null);
      prevAddressRef.current = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("onechain_address");
      }
    }
  }, [sdkConnected, currentWallet]);

  // Connect Function using OneChain SDK
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Find OneWallet from available wallets
      const oneWallet = wallets.find(w => 
        w.name.toLowerCase().includes('one') || 
        w.name.toLowerCase().includes('onechain') ||
        w.name.toLowerCase() === 'onewallet'
      ) || wallets[0]; // Fallback to first available wallet

      if (!oneWallet) {
        setIsConnected(false);
        setAddress(null);
        setError("OneWallet is not installed. Please install the OneChain OneWallet extension.");
        setIsLoading(false);
        return "OneWallet is not installed. Please install the OneChain OneWallet extension.";
      }

      // Use SDK's connect function
       connectWallet(
        { wallet: oneWallet },
        {
          onSuccess: () => {
            setIsLoading(false);
            // State will be updated by the useEffect that watches sdkConnected
          },
          onError: (err: any) => {
            setIsLoading(false);
            setError(err.message || "Failed to connect to OneWallet");
            console.error("OneWallet connection error:", err);
          },
        }
      );
      return "Connected to OneWallet";
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Failed to connect to OneWallet");
      console.error("OneWallet connection error:", err);
      return "Failed to connect to OneWallet";
    }
  }, [wallets, connectWallet]);

  // Disconnect Function
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use SDK's disconnect function
      disconnectWallet(undefined, {
        onSuccess: () => {
          setIsConnected(false);
          setAddress(null);
          prevAddressRef.current = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("onechain_address");
          }
          setIsLoading(false);
        },
        onError: (err: any) => {
          console.error("Error disconnecting:", err);
          // Still clear local state even if disconnect fails
          setIsConnected(false);
          setAddress(null);
          prevAddressRef.current = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("onechain_address");
          }
          setError(err.message || "Failed to disconnect");
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      console.error("Error disconnecting:", err);
      // Still clear local state even if disconnect fails
      setIsConnected(false);
      setAddress(null);
      prevAddressRef.current = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("onechain_address");
      }
      setError(err.message || "Failed to disconnect");
      setIsLoading(false);
    }
  }, [disconnectWallet]);

  // Update isLoading based on SDK state
  useEffect(() => {
    setIsLoading(isConnecting || connectionStatus === "connecting");
  }, [isConnecting, connectionStatus]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connect,
        disconnect,
        isLoading,
        error,
        isOneWalletInstalled
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

