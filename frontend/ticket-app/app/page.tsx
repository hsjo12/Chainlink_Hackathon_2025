'use client'
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import {HeaderMenu} from "@/app/components/HeaderMenu";
import Link from 'next/link';

// Default events
const defaultEvents = [
    {
        id: 1,
        title: "Tech Conference 2025",
        date: "June 20, 2025",
        location: "San Francisco, CA",
        summary: "Explore the latest in technology and innovation at Tech Conference 2025.",
    },
    {
        id: 2,
        title: "Art & Design Expo",
        date: "July 5, 2025",
        location: "New York, NY",
        summary: "A gathering of creative minds showcasing the best in contemporary art and design.",
    },
    {
        id: 3,
        title: "Startup Pitch Night",
        date: "August 15, 2025",
        location: "Austin, TX",
        summary: "Watch startups pitch their ideas to investors in a high-energy evening of innovation.",
    },
];

export default function Home() {
    const [events, setEvents] = useState(defaultEvents);

    // Load events from localStorage on client-side
    useEffect(() => {
        const storedEvents = localStorage.getItem('events');
        if (storedEvents) {
            try {
                const parsedEvents = JSON.parse(storedEvents);
                setEvents([...defaultEvents, ...parsedEvents]);
            } catch (error) {
                console.error('Error parsing stored events:', error);
            }
        }
    }, []);
    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <HeaderMenu/>
            {/*<section className="text-center mb-12">*/}
            {/*    <h1 className="text-4xl font-bold mb-2">Discover Events Around You</h1>*/}
            {/*    <p className="text-gray-600 text-lg">Browse and explore events happening near you</p>*/}
            {/*</section>*/}

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <Card key={event.id} className="rounded-2xl shadow-md overflow-hidden">
                        {event.image && (
                            <div className="w-full h-48 overflow-hidden">
                                <img 
                                    src={event.image} 
                                    alt={event.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-semibold mb-2">{event.title}</h2>
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {event.date}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                {event.location}
                            </div>
                            <p className="text-gray-700 mb-4">{event.summary}</p>
                            <div className="flex gap-2">
                                <Link href={`/tickets?eventId=${event.id}`}><Button>View Tickets</Button></Link>
                                {/*<Link href="/marketplace"><Button variant="outline">Marketplace</Button></Link>*/}
                                <Link href={`/edit-event?eventId=${event.id}`}><Button variant="outline">Edit Event</Button></Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>
        </main>
    );
}
