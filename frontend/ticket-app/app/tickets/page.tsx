"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchasePopup } from "@/app/components/PurchasePopup";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ConnectWallet from "../components/ConnectWallet";
import { buildTierValue } from "@/lib/web3/utils";
import { availableTicket } from "@/lib/web3/smartContract/ticketLaunchpad";

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
  type: string;
  price: number | string;
  benefits?: string;
  quantity?: number;
};

// Default events with tickets for the sample events
const defaultEvents = [
  {
    id: 1,
    title: "Tech Conference 2025",
    tickets: [
      {
        id: 1,
        type: "General Admission",
        price: 49,
        benefits: "Access to all general sessions and expo hall.",
        quantity: 200,
      },
      {
        id: 2,
        type: "VIP Pass",
        price: 129,
        benefits: "Includes front-row seating and speaker meet & greet.",
        quantity: 50,
      },
      {
        id: 3,
        type: "Online Access",
        price: 19,
        benefits: "Livestream access to all main sessions.",
        quantity: 500,
      },
    ],
  },
  {
    id: 2,
    title: "Art & Design Expo",
    tickets: [
      {
        id: 1,
        type: "Regular Entry",
        price: 35,
        benefits: "Access to all exhibition areas.",
        quantity: 300,
      },
      {
        id: 2,
        type: "Premium Pass",
        price: 85,
        benefits: "Includes workshop access and exhibition catalog.",
        quantity: 100,
      },
    ],
  },
  {
    id: 3,
    title: "Startup Pitch Night",
    tickets: [
      {
        id: 1,
        type: "Attendee",
        price: 25,
        benefits: "Watch startup pitches and network with entrepreneurs.",
        quantity: 150,
      },
      {
        id: 2,
        type: "Investor Pass",
        price: 150,
        benefits:
          "Premium seating, exclusive networking reception, and pitch deck access.",
        quantity: 30,
      },
    ],
  },
];

export default function Page() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [isPurchasePopupOpen, setIsPurchasePopupOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    // Find the event by ID
    if (eventId) {
      // First check default events
      const foundDefaultEvent = defaultEvents.find(
        (e) => e.id.toString() === eventId
      );

      if (foundDefaultEvent) {
        setEvent(foundDefaultEvent);
        setTickets(foundDefaultEvent.tickets);
        return;
      }

      // If not found in default events, check localStorage
      const storedEvents = localStorage.getItem("events");
      if (storedEvents) {
        try {
          const parsedEvents = JSON.parse(storedEvents);
          const foundEvent = parsedEvents.find(
            (e: any) => e.id.toString() === eventId
          );

          if (foundEvent) {
            setEvent(foundEvent);
            // Format tickets to match our Ticket type
            if (foundEvent.tickets && Array.isArray(foundEvent.tickets)) {
              (async () => {
                const formattedTickets = await Promise.all(
                  foundEvent.tickets.map(async (ticket: any, index: number) => {
                    const benefits =
                      defaultBenefits[
                        ticket.type as keyof typeof defaultBenefits
                      ] || `Access to ${foundEvent.title}`;

                    // fetch remaining quantity
                    const quantity = await availableTicket(
                      foundEvent.launchpadAddress,
                      ticket.typeValue
                    );
                    return {
                      id: index + 1,
                      type: ticket.type,
                      price: ticket.price,
                      benefits,
                      quantity,
                    };
                  })
                );

                setTickets(formattedTickets);
              })();
            }
          }
        } catch (error) {
          console.error("Error parsing stored events:", error);
        }
      }
    } else {
      // If no eventId is provided, show tickets for the first default event
      setEvent(defaultEvents[0]);
      setTickets(defaultEvents[0].tickets);
    }
  }, [eventId]);

  const updateAvailableTicket = async (type: string) => {
    const ticketTypeValue = buildTierValue(type);
    const quantity = await availableTicket(
      event.launchpadAddress,
      ticketTypeValue
    );

    setTickets((prevTickets) =>
      prevTickets.map(
        (t) =>
          t.type === type
            ? ({ ...t, quantity } as Ticket) // update only this ticket
            : t // leave all others untouched
      )
    );
  };

  const handlePurchase = (ticket: Ticket) => {
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
    if (typeof price === "number") {
      return `$${price}`;
    }
    return price.toString();
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
                <h2 className="text-xl font-semibold mb-2">{ticket.type}</h2>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {formatPrice(ticket.price)}
                </p>
                <p className="text-gray-600 mb-2">{ticket.benefits}</p>
                {ticket.quantity && (
                  <p className="text-sm text-gray-500 mb-4">
                    {ticket.quantity} tickets available
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
            type: selected.type,
            price: formatPrice(selected.price),
            eventName: event?.title,
            cryptocurrencies: event.cryptocurrencies,
            launchpad: event.launchpadAddress,
          }}
          onPurchaseComplete={handlePurchaseComplete}
          updateAvailableTicket={updateAvailableTicket}
        />
      )}
    </main>
  );
}
