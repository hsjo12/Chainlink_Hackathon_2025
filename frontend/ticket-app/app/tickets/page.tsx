"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchasePopup } from "@/app/components/PurchasePopup";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ConnectWallet from "../components/ConnectWallet";
import { buildTierValue } from "@/lib/web3/utils";
import { availableTicket } from "@/lib/web3/smartContract/ticketLaunchpad";
import { toastMessage } from "@/lib/react-tostify/popup";
import { dbCreateEventParams } from "@/types/params";
import { fetchEventById } from "@/lib/db/utils/events";
import { ethers } from "ethers";

// Default ticket benefits to use if not provided
const defaultBenefits = {
  "General Admission": "Access to all general sessions and expo hall.",
  "VIP Pass": "Includes front-row seating and speaker meet & greet.",
  Regular: "Standard event access.",
  Premium: "Premium seating and exclusive content.",
  "Online Access": "Livestream access to all main sessions.",
};

type Ticket = {
  id: number;
  name: string;
  price: number | string;
  benefits?: string;
  totalSupply?: number;
  typeValue: number;
};

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [isPurchasePopupOpen, setIsPurchasePopupOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (!eventId) {
      toastMessage("Invalid Access", "error");
      void router.push("/");
      return;
    }

    (async () => {
      const searchedEvent = await fetchEventById(eventId);
      console.log(searchedEvent);
      if (!searchedEvent) {
        toastMessage("Invalid Access", "error");
        void router.push("/");
        return;
      }
      setEvent(searchedEvent);
      const formattedTickets = await Promise.all(
        searchedEvent.ticketTypes.map(async (ticket: Ticket, index: any) => {
          const benefits =
            defaultBenefits[ticket.name as keyof typeof defaultBenefits] ||
            `Access to ${searchedEvent.title || ""}`;

          const totalSupply = await availableTicket(
            searchedEvent.launchpadAddress || ethers.ZeroAddress,
            ticket.typeValue
          );

          return {
            id: index + 1,
            name: ticket.name,
            price: ticket.price,
            benefits,
            totalSupply,
          };
        })
      );
      console.log(formattedTickets);
      setTickets(formattedTickets);
    })();
  }, [eventId, router]);

  const updateAvailableTicket = async (type: string) => {
    const ticketTypeValue = buildTierValue(type);
    const totalSupply = await availableTicket(
      event.launchpadAddress,
      ticketTypeValue
    );

    setTickets((prevTickets) =>
      prevTickets.map(
        (t) =>
          t.name === type
            ? ({ ...t, totalSupply } as Ticket) // update only this ticket
            : t // leave all others untouched
      )
    );
  };

  const handlePurchase = (ticket: Ticket) => {
    console.log(ticket);
    setSelected(ticket);
    setIsPurchasePopupOpen(true);
  };

  const handlePurchaseComplete = () => {
    setPurchaseSuccess(true);
    // Reset success message after 3 seconds
    setTimeout(() => {
      setPurchaseSuccess(false);
    }, 3000);
  };

  // Format price for display
  const formatPrice = (price: number | string): string => {
    return `$${price}`;
  };

  return (
    <main className="min-h-screen bg-white p-6">
      {/* Success message */}
      {purchaseSuccess && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-500 text-white p-4 text-center animate-slide-up z-40">
          Purchase successful! Your ticket has been added to your wallet.
        </div>
      )}

      <div className="flex justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        <ConnectWallet />
      </div>

      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Get Your Tickets</h1>
        {event && (
          <p className="text-gray-600 text-lg">
            Choose a ticket type for {event.title}
          </p>
        )}
      </section>

      {tickets.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={`rounded-2xl shadow-md border ${
                selected?.id === ticket.id
                  ? "border-blue-500"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <h2 className="text-xl font-semibold mb-2">{ticket.name}</h2>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {formatPrice(ticket.price)}
                </p>
                <p className="text-gray-600 mb-2">{ticket.benefits}</p>
                {ticket.totalSupply && (
                  <p className="text-sm text-gray-500 mb-4">
                    {ticket.totalSupply} tickets available
                  </p>
                )}
                <Button
                  onClick={() => {
                    setSelected(ticket);
                    handlePurchase(ticket);
                  }}
                >
                  {selected?.id === ticket.id ? "Selected" : "Select Ticket"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No tickets available for this event.</p>
        </div>
      )}

      {/* Purchase Popup */}
      {selected && (
        <PurchasePopup
          isOpen={isPurchasePopupOpen}
          onClose={() => setIsPurchasePopupOpen(false)}
          ticketInfo={{
            name: selected.name,
            price: formatPrice(selected.price),
            eventName: event?.title,
            paymentTokens: event.paymentTokens,
            launchpad: event.launchpadAddress,
          }}
          onPurchaseComplete={handlePurchaseComplete}
          updateAvailableTicket={updateAvailableTicket}
          setSelected={setSelected}
        />
      )}
    </main>
  );
}
