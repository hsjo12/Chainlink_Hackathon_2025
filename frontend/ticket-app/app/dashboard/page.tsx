"use client";

import { HeroHeader } from "@/components/blocks/hero-section-1";
import { TicketCard } from "../components/TicketCard";
import { Spotlight } from "@/components/ui/spotlight-new";
import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { fetchCreatedEventsByAddress } from "@/lib/db/utils/events";
import { checkOrganizer } from "@/lib/web3/smartContract/organizerRegistry";
import { EventCard } from "../components/EventCard";
import { isoToEpoch } from "@/lib/utils";

// Define ticket type interface
interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

const Page = () => {
  const { address, isConnected } = useAppKitAccount();
  const [events, setEvents] = useState<any[]>([]);
  const [ticket, setTicket] = useState<any[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  useEffect(() => {
    (async () => {
      const result = await checkOrganizer(address);
      setIsOrganizer(result);
      const res = await fetchCreatedEventsByAddress();
      setEvents(res);
    })();
  }, [address]);

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

        <div className="container mx-auto p-4">
          <h1 className="text-5xl font-bold mb-8 text-center tracking-[0.25rem] ">
            DASHBOARD
          </h1>

          {isOrganizer ? (
            <div className="flex flex-col mx-auto w-[90%] gap-10">
              <div className="flex flex-col w-full gap-6">
                <h1 className="text-4xl font-bold">My created event</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event, i) => {
                    return (
                      <EventCard
                        key={i}
                        title={event.title}
                        description={event.description}
                        image={event.imageUrl}
                        startDate={isoToEpoch(event.startDate)}
                        location={event.location}
                        eventId={event.id}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col w-full gap-6">
                <h1 className="text-4xl font-bold">My ticket</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tickets.map((ticket, index) => (
                    <TicketCard key={index} {...ticket} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full gap-6">
              <h1 className="text-4xl font-bold">My ticket</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-22">
                {tickets.map((ticket, index) => (
                  <TicketCard key={index} {...ticket} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Page;
