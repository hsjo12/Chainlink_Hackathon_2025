"use client";

import { HeroHeader } from "@/components/blocks/hero-section-1";
import { TicketCard } from "../components/TicketCard";
import { Spotlight } from "@/components/ui/spotlight-new";
import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { fetchCreatedEventsByAddressAndTickets } from "@/lib/db/utils/events";
import { checkOrganizer } from "@/lib/web3/smartContract/organizerRegistry";
import { EventCard } from "../components/EventCard";
import { getNFTsForOwner, isoToEpoch } from "@/lib/utils";

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
  const [tickets, setTickets] = useState<any[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  useEffect(() => {
    if (!address) return;
    (async () => {
      const result = await checkOrganizer(address);
      setIsOrganizer(result);
      const res = await fetchCreatedEventsByAddressAndTickets(address);
      const ownedNfts = await getNFTsForOwner(address);

      const filteredNfts = ownedNfts.ownedNfts.filter((nft: any) =>
        res.ticketAddresses.includes(nft.contract.address)
      );

      const ticketsInJson = filteredNfts.map((nft: any) =>
        JSON.parse(nft.raw.tokenUri)
      );

      setEvents(res.events);
      setTickets(ticketsInJson);
    })();
  }, [address]);

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
                  {events?.map((event, i) => {
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
