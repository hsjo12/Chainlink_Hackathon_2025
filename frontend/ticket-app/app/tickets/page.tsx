'use client'
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


type Ticket = {
    id:number;
    type:string;
    price:string;
    benefits:string;
}

const ticketOptions:Ticket[] = [
    {
        id: 1,
        type: "General Admission",
        price: "$49",
        benefits: "Access to all general sessions and expo hall.",
    },
    {
        id: 2,
        type: "VIP Pass",
        price: "$129",
        benefits: "Includes front-row seating and speaker meet & greet.",
    },
    {
        id: 3,
        type: "Online Access",
        price: "$19",
        benefits: "Livestream access to all main sessions.",
    },
];

export default function Page() {
    const [selected, setSelected] = useState<Ticket | null>(null);

    const handlePurchase = (ticket:Ticket) => {
        alert(`You selected the ${ticket.type} for ${ticket.price}`);
    };

    return (
        <main className="min-h-screen bg-white p-6">
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-2">Get Your Tickets</h1>
                <p className="text-gray-600 text-lg">Choose a ticket type for Tech Conference 2025</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {ticketOptions.map((ticket) => (
                    <Card
                        key={ticket.id}
                        className={`rounded-2xl shadow-md border ${
                            selected?.id === ticket.id ? "border-blue-500" : "border-gray-200"
                        }`}
                    >
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <h2 className="text-xl font-semibold mb-2">{ticket.type}</h2>
                            <p className="text-2xl font-bold text-blue-600 mb-2">{ticket.price}</p>
                            <p className="text-gray-600 mb-4">{ticket.benefits}</p>
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
        </main>
    );
}
