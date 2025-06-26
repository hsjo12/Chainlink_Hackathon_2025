"use client";

import { HeroHeader } from "@/components/blocks/hero-section-1";
import { TicketCard } from "../components/TicketCard";
import { Spotlight } from "@/components/ui/spotlight-new";

// Define ticket type interface
interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

const Page = () => {
  const isCreator = false;
  const tickets = [
    {
      name: "Tech Conference 2025#001",
      description: "A ticket for the Tech Conference in 2025.",
      image:
        "https://i.ibb.co/fdb3ZBcV/Screenshot-2025-06-22-at-1-54-16-PM.png",
      attributes: [
        {
          trait_type: "Section",
          value: "STANDING",
        },
        {
          trait_type: "Seat Number",
          value: "STANDING",
        },
        {
          trait_type: "Tier",
          value: "STANDING",
        },
        {
          trait_type: "Location",
          value: "Mala Vida, Austin, TX",
        },
        {
          trait_type: "Start Time",
          display_type: "date",
          value: 1750435599,
        },
        {
          trait_type: "End Time",
          display_type: "date",
          value: 1751435599,
        },
      ],
    },
    {
      name: "Music Festival 2025#002",
      description: "A ticket for the Music Festival in 2025.",
      image:
        "https://i.ibb.co/p6MmfRRr/Screenshot-2025-06-22-at-1-56-39-PM.png",
      attributes: [
        {
          trait_type: "Section",
          value: "VIP",
        },
        {
          trait_type: "Seat Number",
          value: "A12",
        },
        {
          trait_type: "Tier",
          value: "GOLD",
        },
        {
          trait_type: "Location",
          value: "Central Park, New York, NY",
        },
        {
          trait_type: "Start Time",
          display_type: "date",
          value: 1760435599,
        },
        {
          trait_type: "End Time",
          display_type: "date",
          value: 1761435599,
        },
      ],
    },
    {
      name: "Tech Conference 2025#001",
      description: "A ticket for the Tech Conference in 2025.",
      image:
        "https://i.ibb.co/fdb3ZBcV/Screenshot-2025-06-22-at-1-54-16-PM.png",
      attributes: [
        {
          trait_type: "Section",
          value: "STANDING",
        },
        {
          trait_type: "Seat Number",
          value: "STANDING",
        },
        {
          trait_type: "Tier",
          value: "STANDING",
        },
        {
          trait_type: "Location",
          value: "Mala Vida, Austin, TX",
        },
        {
          trait_type: "Start Time",
          display_type: "date",
          value: 1750435599,
        },
        {
          trait_type: "End Time",
          display_type: "date",
          value: 1751435599,
        },
      ],
    },
    {
      name: "Music Festival 2025#002",
      description: "A ticket for the Music Festival in 2025.",
      image:
        "https://i.ibb.co/p6MmfRRr/Screenshot-2025-06-22-at-1-56-39-PM.png",
      attributes: [
        {
          trait_type: "Section",
          value: "VIP",
        },
        {
          trait_type: "Seat Number",
          value: "A12",
        },
        {
          trait_type: "Tier",
          value: "GOLD",
        },
        {
          trait_type: "Location",
          value: "Central Park, New York, NY",
        },
        {
          trait_type: "Start Time",
          display_type: "date",
          value: 1760435599,
        },
        {
          trait_type: "End Time",
          display_type: "date",
          value: 1761435599,
        },
      ],
    },
    {
      name: "Tech Conference 2025#001",
      description: "A ticket for the Tech Conference in 2025.",
      image:
        "https://i.ibb.co/fdb3ZBcV/Screenshot-2025-06-22-at-1-54-16-PM.png",
      attributes: [
        {
          trait_type: "Section",
          value: "STANDING",
        },
        {
          trait_type: "Seat Number",
          value: "STANDING",
        },
        {
          trait_type: "Tier",
          value: "STANDING",
        },
        {
          trait_type: "Location",
          value: "Mala Vida, Austin, TX",
        },
        {
          trait_type: "Start Time",
          display_type: "date",
          value: 1750435599,
        },
        {
          trait_type: "End Time",
          display_type: "date",
          value: 1751435599,
        },
      ],
    },
    {
      name: "Music Festival 2025#002",
      description: "A ticket for the Music Festival in 2025.",
      image:
        "https://i.ibb.co/p6MmfRRr/Screenshot-2025-06-22-at-1-56-39-PM.png",
      attributes: [
        {
          trait_type: "Section",
          value: "VIP",
        },
        {
          trait_type: "Seat Number",
          value: "A12",
        },
        {
          trait_type: "Tier",
          value: "GOLD",
        },
        {
          trait_type: "Location",
          value: "Central Park, New York, NY",
        },
        {
          trait_type: "Start Time",
          display_type: "date",
          value: 1760435599,
        },
        {
          trait_type: "End Time",
          display_type: "date",
          value: 1761435599,
        },
      ],
    },
  ];

  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden mt-30">
        <Spotlight />
        {isCreator ? (
          <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-8 text-center">My Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Events will be mapped here */}
            </div>
          </div>
        ) : (
          <div className="container max-w-[90%] mx-auto py-4 px-2">
            <h1 className="text-4xl font-bold mb-12 ">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-22">
              {tickets.map((ticket, index) => (
                <TicketCard key={index} {...ticket} />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Page;
