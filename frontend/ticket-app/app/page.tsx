"use client";
import React, { useEffect, useState } from "react";
import { HeroSection } from "@/components/blocks/hero-section-1";

// Default events
const defaultEvents = [
  {
    id: 1,
    title: "Tech Conference 2025",
    date: "June 20, 2025",
    location: "San Francisco, CA",
    summary:
      "Explore the latest in technology and innovation at Tech Conference 2025.",
  },
  {
    id: 2,
    title: "Art & Design Expo",
    date: "July 5, 2025",
    location: "New York, NY",
    summary:
      "A gathering of creative minds showcasing the best in contemporary art and design.",
  },
  {
    id: 3,
    title: "Startup Pitch Night",
    date: "August 15, 2025",
    location: "Austin, TX",
    summary:
      "Watch startups pitch their ideas to investors in a high-energy evening of innovation.",
  },
];

export default function Home() {
  return <HeroSection />;
}
