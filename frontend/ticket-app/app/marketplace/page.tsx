'use client'
import React, { useState } from "react";
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchasePopup } from "@/app/components/PurchasePopup";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";

// Define ticket type with all required fields
type Ticket = {
    id: number;
    eventName: string;
    date: string;
    type: string;
    price: number;
    currency: string;
    ticketsSold: number;
}

// Sample data for tickets
const ticketData: Ticket[] = [
    {
        id: 1,
        eventName: "Tech Conference 2025",
        date: "June 15, 2025",
        type: "General Admission",
        price: 49,
        currency: "USD",
        ticketsSold: 120
    },
    {
        id: 2,
        eventName: "Tech Conference 2025",
        date: "June 15, 2025",
        type: "VIP Pass",
        price: 129,
        currency: "USD",
        ticketsSold: 45
    },
    {
        id: 3,
        eventName: "Music Festival",
        date: "July 10, 2025",
        type: "Standard Entry",
        price: 79,
        currency: "USD",
        ticketsSold: 230
    },
    {
        id: 4,
        eventName: "Music Festival",
        date: "July 10, 2025",
        type: "Premium Access",
        price: 159,
        currency: "USD",
        ticketsSold: 85
    },
    {
        id: 5,
        eventName: "Sports Championship",
        date: "August 5, 2025",
        type: "Regular Seat",
        price: 65,
        currency: "USD",
        ticketsSold: 310
    },
    {
        id: 6,
        eventName: "Sports Championship",
        date: "August 5, 2025",
        type: "Premium Seat",
        price: 150,
        currency: "USD",
        ticketsSold: 95
    }
];

// Currency conversion rates (relative to USD)
const currencyRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 150.25,
    CAD: 1.36
};

// Function to calculate event type popularity
const calculatePopularity = () => {
    const eventCounts: Record<string, number> = {};

    ticketData.forEach(ticket => {
        if (eventCounts[ticket.eventName]) {
            eventCounts[ticket.eventName] += ticket.ticketsSold;
        } else {
            eventCounts[ticket.eventName] = ticket.ticketsSold;
        }
    });

    return Object.entries(eventCounts).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / ticketData.reduce((sum, ticket) => sum + ticket.ticketsSold, 0)) * 100)
    }));
};

export default function MarketplacePage() {
    const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof currencyRates>("USD");
    const [isPurchasePopupOpen, setIsPurchasePopupOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    // Convert price to selected currency
    const convertPrice = (price: number, currency: keyof typeof currencyRates) => {
        return (price * currencyRates[currency]).toFixed(2);
    };

    const handlePurchaseClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsPurchasePopupOpen(true);
    };

    const handlePurchaseComplete = () => {
        setPurchaseSuccess(true);
        // Reset success message after 3 seconds
        setTimeout(() => {
            setPurchaseSuccess(false);
        }, 3000);
    };

    const popularityData = calculatePopularity();

    return (
        <main className="min-h-screen bg-white p-6">
            {/* Success message */}
            {purchaseSuccess && (
                <div className="fixed bottom-0 left-0 right-0 bg-green-500 text-white p-4 text-center animate-slide-up z-40">
                    Purchase successful! Your ticket has been added to your wallet.
                </div>
            )}
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Events
            </Link>

            <section className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Ticket Marketplace</h1>
                <p className="text-gray-600 text-lg mb-4">Browse available tickets for upcoming events</p>

                <div className="flex justify-center gap-2 mb-6">
                    <span className="text-gray-700">Select Currency:</span>
                    <select 
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value as keyof typeof currencyRates)}
                        className="border rounded px-2 py-1"
                    >
                        {Object.keys(currencyRates).map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                        ))}
                    </select>
                </div>
            </section>

            <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
                {/* Ticket Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
                    {ticketData.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="rounded-xl shadow-md border border-gray-200 hover:border-blue-300 transition-all"
                        >
                            <CardContent className="p-6">
                                <div className="mb-4">
                                    <CardTitle className="text-xl font-bold">{ticket.eventName}</CardTitle>
                                    <CardDescription className="text-gray-500">{ticket.date}</CardDescription>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-semibold text-lg">{ticket.type}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {selectedCurrency} {convertPrice(ticket.price, selectedCurrency)}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500">Tickets Sold: {ticket.ticketsSold}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="px-6 pb-6 pt-0">
                                <Button 
                                    className="w-full"
                                    onClick={() => handlePurchaseClick(ticket)}
                                >
                                    Purchase Ticket
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </section>

                {/* Popularity Graph */}
                <section className="w-full md:w-1/3 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Event Type Popularity</h2>
                    <div className="space-y-4">
                        {popularityData.map((item, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>{item.type}</span>
                                    <span>{item.percentage}% ({item.count} sold)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-blue-600 h-2.5 rounded-full" 
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Purchase Popup */}
            {selectedTicket && (
                <PurchasePopup
                    isOpen={isPurchasePopupOpen}
                    onClose={() => setIsPurchasePopupOpen(false)}
                    ticketInfo={{
                        type: selectedTicket.type,
                        price: parseFloat(convertPrice(selectedTicket.price, selectedCurrency)),
                        eventName: selectedTicket.eventName,
                        currency: selectedCurrency
                    }}
                    onPurchaseComplete={handlePurchaseComplete}
                />
            )}
        </main>
    );
}
