"use client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import { useAppKit } from "@reown/appkit/react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useState } from "react";

export default function ConnectWallet() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return (
      <Button variant="ghost" size="default" className="relative ">
        <LoadingSpinner className="absolute inset-0 m-auto" />
        <span className="opacity-0">Connect</span>
      </Button>
    );
  }

  return (
    <>
      {isConnected ? (
        <Button
          onClick={() => open()}
          className="tracking-wider md:text-lg font-medium"
        >
          {address?.slice(0, 4)}...{address?.slice(-4)}
        </Button>
      ) : (
        <Button
          onClick={() => open()}
          className="tracking-wider md:text-lg font-medium"
        >
          Connect
        </Button>
      )}
    </>
  );
}
