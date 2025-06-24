"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ConnectWallet from "./ConnectWallet";
import { useAppKitAccount } from "@reown/appkit/react";
import { checkOrganizer } from "@/lib/web3/smartContract/organizerRegistry";

export function HeaderMenu() {
  const { address, isConnected } = useAppKitAccount();
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await checkOrganizer(address);
      setIsOrganizer(result);
    })();
  }, [address, isConnected]);

  return (
    <div className="mb-12">
      <div className="flex justify-end">
        <ConnectWallet />
      </div>
      <section className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">Discover Events Around You</h1>
        <p className="text-gray-600 text-lg">
          Browse and explore events happening near you
        </p>
      </section>

      <nav className="flex justify-center gap-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Home
        </Link>
        {/*<Link href="/tickets" className="text-blue-600 hover:text-blue-800 font-medium">*/}
        {/*  Tickets*/}
        {/*</Link>*/}
        <Link
          href="/marketplace"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Marketplace
        </Link>

        {isOrganizer ? (
          <Link
            href="/create-event"
            className="text-green-600 hover:text-green-800 font-medium"
          >
            Approve
          </Link>
        ) : (
          <Link
            href="/create-event"
            className="text-green-600 hover:text-green-800 font-medium"
          >
            Create Event
          </Link>
        )}
      </nav>
    </div>
  );
}
