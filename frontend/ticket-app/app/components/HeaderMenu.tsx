import React from "react";
import Link from "next/link";

export function HeaderMenu() {
  return (
    <div className="mb-12">
      <section className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">Discover Events Around You</h1>
        <p className="text-gray-600 text-lg">Browse and explore events happening near you</p>
      </section>

      <nav className="flex justify-center gap-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          Home
        </Link>
        {/*<Link href="/tickets" className="text-blue-600 hover:text-blue-800 font-medium">*/}
        {/*  Tickets*/}
        {/*</Link>*/}
        <Link href="/marketplace" className="text-blue-600 hover:text-blue-800 font-medium">
          Marketplace
        </Link>
        <Link href="/create-event" className="text-green-600 hover:text-green-800 font-medium">
          Create Event
        </Link>
      </nav>
    </div>
  );
}
