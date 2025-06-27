"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeaderMenu } from "@/app/components/HeaderMenu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ticket, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CRYPTO_CURRENCIES } from "@/constants/constants";
import { setEventDetails } from "@/lib/web3/smartContract/ticket";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { buildTierValue } from "@/lib/web3/utils";
import {
  setTierMaxSupplyPrices,
  setPaymentTokens,
  totalSoldTicket,
} from "@/lib/web3/smartContract/ticketLaunchpad";
import { getReadOnlyContract } from "@/lib/web3/provider";
import { toastMessage } from "@/lib/react-tostify/popup";

// Define ticket type interface
interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

export default function EditEventPage() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [launchpad, setLaunchpad] = useState("");
  const [title, setTitle] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: "vip", name: "VIP", price: "", quantity: "" },
  ]);
  const [selectedCryptocurrencies, setSelectedCryptocurrencies] = useState<
    string[]
  >(["usd"]);
  const [tokenLink, setTokenLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventFound, setEventFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load event data when component mounts
  useEffect(() => {
    if (eventId) {
      // First check default events
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

      const foundDefaultEvent = defaultEvents.find(
        (e) => e.id.toString() === eventId
      );

      if (foundDefaultEvent) {
        // Default events can't be edited, redirect to home
        alert("Default events cannot be edited.");
        router.push("/");
        return;
      }

      // Check localStorage for user-created events
      const storedEvents = localStorage.getItem("events");
      if (storedEvents) {
        try {
          const parsedEvents = JSON.parse(storedEvents);
          const foundEvent = parsedEvents.find(
            (e: any) => e.id.toString() === eventId
          );

          if (foundEvent) {
            // Populate form with event data
            setTitle(foundEvent.title || "");
            setSymbol(foundEvent.symbol || "");
            setDescription(foundEvent.summary || "");
            setLocation(foundEvent.location || "");
            setStartDate(foundEvent.startDate || "");
            setEndDate(foundEvent.endDate || "");
            setImagePreview(foundEvent.image || null);
            setLaunchpad(foundEvent.launchpadAddress);
            // Format date if it's not in YYYY-MM-DD format
            if (
              foundEvent.date &&
              !foundEvent.date.match(/^\d{4}-\d{2}-\d{2}$/)
            ) {
              try {
                const dateObj = new Date(foundEvent.date);
                const formattedDate = dateObj.toISOString().split("T")[0];
                // setDate(formattedDate);
              } catch (error) {
                console.error("Error formatting date:", error);
              }
            }

            // Set ticket types
            if (foundEvent.tickets && Array.isArray(foundEvent.tickets)) {
              const formattedTickets = foundEvent.tickets.map(
                (ticket: any, index: number) => ({
                  id: `ticket-${index + 1}`,
                  name: ticket.type || "",
                  price: ticket.price?.toString() || "",
                  quantity: ticket.quantity?.toString() || "",
                })
              );
              setTicketTypes(
                formattedTickets.length > 0
                  ? formattedTickets
                  : [
                      {
                        id: "regular",
                        name: "Regular",
                        price: "",
                        quantity: "",
                      },
                    ]
              );
            }

            // Set cryptocurrencies
            if (
              foundEvent.cryptocurrencies &&
              Array.isArray(foundEvent.cryptocurrencies)
            ) {
              setSelectedCryptocurrencies(foundEvent.cryptocurrencies);
            }

            // Set token link
            if (foundEvent.tokenLink) {
              setTokenLink(foundEvent.tokenLink);
            }

            setEventFound(true);
          } else {
            // Event not found, redirect to home
            alert("Event not found.");
            router.push("/");
          }
        } catch (error) {
          console.error("Error parsing stored events:", error);
          alert("Error loading event data.");
          router.push("/");
        }
      } else {
        // No events in localStorage, redirect to home
        alert("No events found.");
        router.push("/");
      }
    } else {
      // No eventId provided, redirect to home
      router.push("/");
    }
  }, [eventId, router]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update ticket type details
  const updateTicketType = async (
    id: string,
    field: keyof TicketType,
    value: string,
    name: string = ""
  ) => {
    setTicketTypes((prev) =>
      prev.map((ticket) =>
        ticket.id === id ? { ...ticket, [field]: value } : ticket
      )
    );

    if (field === "quantity") {
      let soldCount = await totalSoldTicket(launchpad, buildTierValue(name));
      if (Number(soldCount) > Number(value)) {
        setTicketTypes((prev) =>
          prev.map((ticket) =>
            ticket.id === id
              ? { ...ticket, quantity: String(Number(soldCount)) }
              : ticket
          )
        );
        return toastMessage(`Cannot set below sold (${soldCount})`, "warn");
      }
    }
  };

  // set start/end date
  const handleDateChange = (
    type: "start" | "end",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setDateError("");
    // set start / end date
    if (type === "start") {
      if (endDate && value > endDate) {
        setDateError("Start Date cannot be later than End Date.");
        return setStartDate("");
      } else if (new Date(value).getTime() < Date.now()) {
        setDateError("Start Date cannot be earlier than now.");
        return setStartDate("");
      }
      setStartDate(value);
    } else if (type === "end") {
      if (startDate && startDate > value) {
        setDateError("End Date cannot be earlier than Start Date.");
        return setEndDate("");
      } else if (new Date(value).getTime() < Date.now()) {
        setDateError("End Date cannot be earlier than now.");
        return setEndDate("");
      }
      setEndDate(value);
    }
  };

  // Toggle cryptocurrency selection
  const toggleCryptocurrency = (cryptoId: string) => {
    if (selectedCryptocurrencies.includes(cryptoId)) {
      setSelectedCryptocurrencies(
        selectedCryptocurrencies.filter((id) => id !== cryptoId)
      );
    } else {
      setSelectedCryptocurrencies([...selectedCryptocurrencies, cryptoId]);
    }
  };

  // Change event details
  const handleEventDetailSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);
      const storedEvents = JSON.parse(localStorage.getItem("events") || "[]");
      const foundEvent = storedEvents.find(
        (e: any) => e.id.toString() === eventId
      );

      // Localstorage update
      Object.assign(foundEvent, {
        title,
        symbol,
        image: imagePreview || "",
        summary: description,
        location,
        startDate,
        endDate,
      });
      const updatedEvents = storedEvents.map((ev: any) =>
        ev.id.toString() === eventId ? foundEvent : ev
      );
      localStorage.setItem("events", JSON.stringify(updatedEvents));

      // Interact with smart contract
      await setEventDetails(foundEvent.ticketAddress, walletProvider, [
        title,
        symbol,
        imagePreview || "",
        description,
        location,
        Math.floor(new Date(startDate).getTime() / 1000),
        Math.floor(new Date(endDate).getTime() / 1000),
      ]);
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change ticket types
  const handleTicketTypesSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);

      const storedEvents = JSON.parse(localStorage.getItem("events") || "[]");
      const foundEvent = storedEvents.find(
        (e: any) => e.id.toString() === eventId
      );

      // Localstorage update
      Object.assign(foundEvent, {
        tickets: ticketTypes.map((ticket) => ({
          type: ticket.name,
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity),
          typeValue: buildTierValue(ticket.name),
        })),
      });
      const updatedEvents = storedEvents.map((ev: any) =>
        ev.id.toString() === eventId ? foundEvent : ev
      );
      localStorage.setItem("events", JSON.stringify(updatedEvents));

      // Interact with smart contract
      await setTierMaxSupplyPrices(launchpad, walletProvider, ticketTypes);

      return;
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change payment options
  const handlePaymentOptionsSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);

      const storedEvents = JSON.parse(localStorage.getItem("events") || "[]");
      const foundEvent = storedEvents.find(
        (e: any) => e.id.toString() === eventId
      );

      // Localstorage update
      Object.assign(foundEvent, {
        cryptocurrencies: selectedCryptocurrencies,
        tokenLink: tokenLink || null,
      });
      const updatedEvents = storedEvents.map((ev: any) =>
        ev.id.toString() === eventId ? foundEvent : ev
      );
      localStorage.setItem("events", JSON.stringify(updatedEvents));

      // Interact with smart contract
      await setPaymentTokens(
        launchpad,
        walletProvider,
        selectedCryptocurrencies
      );
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eventFound) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <HeaderMenu />
        <div className="max-w-4xl mx-auto text-center py-12">
          <p>Loading event data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <HeaderMenu />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold">Edit Event</h1>
        </div>

        <form onSubmit={handleEventDetailSubmit}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="symbol">Ticket Symbol</Label>
                    <Input
                      id="symbol"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      placeholder="Enter event ticket symbol"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Event Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your event"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Event location"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => handleDateChange("start", e)}
                        onFocus={(e) => e.target.showPicker?.()}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => handleDateChange("end", e)}
                        onFocus={(e) => e.target.showPicker?.()}
                        required
                      />
                    </div>
                    {dateError && (
                      <p className="col-span-2 text-red-500 text-sm mt-1 ">
                        {dateError}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">Event Image</Label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      id="image"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                    {imagePreview && (
                      <div className="ml-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end pr-6">
              <Button type="submit" disabled={isSubmitting} className="px-6">
                Update
              </Button>
            </div>
          </Card>
        </form>
        <form onSubmit={handleTicketTypesSubmit}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ticket Types</h2>
              </div>

              <div className="space-y-6">
                {ticketTypes.map((ticket) => (
                  <div key={ticket.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Ticket Type</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`${ticket.id}-name`}>Name</Label>
                        <Input
                          id={`${ticket.id}-name`}
                          value={ticket.name}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "name", e.target.value)
                          }
                          placeholder="e.g., Regular, VIP"
                          required
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor={`${ticket.id}-price`}>Price</Label>
                        <Input
                          id={`${ticket.id}-price`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={ticket.price}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "price", e.target.value)
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor={`${ticket.id}-quantity`}>
                          Quantity
                        </Label>
                        <Input
                          id={`${ticket.id}-quantity`}
                          type="number"
                          min="1"
                          value={ticket.quantity}
                          onChange={(e) =>
                            updateTicketType(
                              ticket.id,
                              "quantity",
                              e.target.value,
                              ticket.name
                            )
                          }
                          placeholder="Number of tickets"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="flex justify-end pr-6">
              <Button type="submit" disabled={isSubmitting} className="px-6">
                Update
              </Button>
            </div>
          </Card>
        </form>
        <form onSubmit={handlePaymentOptionsSubmit}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Options</h2>

              <div className="space-y-4">
                <div>
                  <Label className="block mb-2">
                    Accept Payment In (select at least one)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CRYPTO_CURRENCIES.map((crypto) => (
                      <div key={crypto.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`crypto-${crypto.id}`}
                          checked={selectedCryptocurrencies.includes(crypto.id)}
                          disabled={crypto.id === "ETH"}
                          onChange={() => toggleCryptocurrency(crypto.id)}
                          className="mr-2"
                        />
                        <Label
                          htmlFor={`crypto-${crypto.id}`}
                          className="cursor-pointer"
                        >
                          {crypto.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="tokenLink">Token Link (Optional)</Label>
                  <Input
                    id="tokenLink"
                    value={tokenLink}
                    onChange={(e) => setTokenLink(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    If you have a custom token, provide the contract address or
                    link
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end pr-6">
              <Button type="submit" disabled={isSubmitting} className="px-6">
                Update
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </main>
  );
}
