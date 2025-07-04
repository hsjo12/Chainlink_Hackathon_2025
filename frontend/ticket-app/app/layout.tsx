import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppKit from "@/lib/reown/appKit";
import { ToastContainer } from "react-toastify";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketChain",
  description: "TicketChain",
};

function ScreenSizeWarning() {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 lg:hidden">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-8 py-10 max-w-sm text-center">
        <div className="w-12 h-12 mx-auto mb-6 rounded-lg bg-zinc-800 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-white text-xl font-semibold mb-3">
          Better Experience Awaits
        </h2>

        <p className="text-zinc-400 text-sm leading-relaxed">
          This app is optimized for larger screens. Please switch to a desktop
          or tablet for the best experience.
        </p>
      </div>
    </div>
  );
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastContainer />
        <ScreenSizeWarning />

        {/* Suspense boundary for client components */}
        <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
          <AppKit>{children}</AppKit>
        </Suspense>
      </body>
    </html>
  );
}
