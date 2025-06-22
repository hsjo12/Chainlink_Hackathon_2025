"use client";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
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
      <ShimmerButton>
        <LoadingSpinner className="absolute inset-0 m-auto" />
        <span className="opacity-0">Connect Wallet</span>
      </ShimmerButton>
    );
  }

  return (
    <>
      {isConnected ? (
        <ShimmerButton onClick={() => open()}>
          <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
            {address?.slice(0, 4)}...{address?.slice(-4)}
          </span>
        </ShimmerButton>
      ) : (
        <ShimmerButton onClick={() => open()}>
          <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
            Connect Wallet
          </span>
        </ShimmerButton>
      )}
    </>
  );
}
