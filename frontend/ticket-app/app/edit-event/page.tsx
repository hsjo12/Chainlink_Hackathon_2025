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
import { fetchEventById, updateEvents } from "@/lib/db/utils/events";
import { dbCreateEventParams } from "@/types/params";
import { formatDateForInput } from "@/lib/utils";
import ImageUploadButton from "../components/ImageUploadField";

// Define ticket type interface
interface TicketType {
  id: string;
  name: string;
  price: string;
  totalSupply: string;
}

export default function EditEventPage() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [searchedEvent, setSearchedEvent] = useState<any>({});

  const [launchpad, setLaunchpad] = useState("");
  const [title, setTitle] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: "vip", name: "VIP", price: "", totalSupply: "" },
  ]);
  const [selectedCryptocurrencies, setSelectedCryptocurrencies] = useState<
    string[]
  >(["usd"]);
  const [externalUrl, setExternalUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventFound, setEventFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load event data when component mounts
  useEffect(() => {
    if (!eventId) {
      toastMessage("Invalid Access", "error");
      return router.push("/");
    }

    let searchedEvent: dbCreateEventParams | null | undefined;
    (async () => {
      searchedEvent = await fetchEventById(eventId);

      if (!searchedEvent) {
        toastMessage("Invalid Access", "error");
        return router.push("/");
      }
      setSearchedEvent(searchedEvent);
      try {
        // Populate form with event data
        setTitle(searchedEvent.title || "");
        setSymbol(searchedEvent.symbol || "");
        setDescription(searchedEvent.description || "");
        setLocation(searchedEvent.location || "");
        setStartDate(formatDateForInput(searchedEvent.startDate) || "");
        setEndDate(formatDateForInput(searchedEvent.endDate) || "");
        setImagePreview(searchedEvent.imageUrl || null);
        setLaunchpad(searchedEvent.launchpadAddress);

        // Set ticket types
        if (
          searchedEvent.ticketTypes &&
          Array.isArray(searchedEvent.ticketTypes)
        ) {
          const formattedTickets = searchedEvent.ticketTypes.map(
            (ticket: any, index: number) => ({
              id: ticket.id,
              name: ticket.name || "",
              price: ticket.price?.toString() || "",
              totalSupply: ticket.totalSupply?.toString() || "",
            })
          );
          if (formattedTickets.length < 1) return;
          setTicketTypes(formattedTickets);
        }

        // Set paymentTokens
        if (
          searchedEvent.paymentTokens &&
          Array.isArray(searchedEvent.paymentTokens)
        ) {
          setSelectedCryptocurrencies(searchedEvent.paymentTokens);
        }

        // Set External Url
        if (searchedEvent.externalUrl) {
          setExternalUrl(searchedEvent.externalUrl);
        }

        setEventFound(true);
      } catch (error) {}
    })();
  }, [eventId, router]);

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

    if (field === "totalSupply") {
      let soldCount = await totalSoldTicket(launchpad, buildTierValue(name));
      if (Number(soldCount) > Number(value)) {
        setTicketTypes((prev) =>
          prev.map((ticket) =>
            ticket.id === id
              ? { ...ticket, totalSupply: String(Number(soldCount)) }
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
      if (!eventId) return toastMessage("Please refresh the page", "warn");
      const exURL = externalUrl === "" ? undefined : externalUrl;
      await updateEvents(eventId, "eventDetails", {
        title,
        symbol,
        description,
        imageUrl: imagePreview, // In a real app, this would be a URL to the uploaded image
        bannerUrl: undefined, // currently no banner function ""
        externalUrl: exURL, // currently no externalURL
        category: "General", // currently no category, so just "General"
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location,
      });

      // Interact with smart contract
      await setEventDetails(searchedEvent?.ticketAddress, walletProvider, [
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

      if (!eventId) return toastMessage("Please refresh the page", "warn");
      await updateEvents(eventId, "ticketTypes", {
        ticketTypes,
      });

      // Interact with smart contract
      await setTierMaxSupplyPrices(launchpad, walletProvider, ticketTypes);
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

      if (!eventId) return toastMessage("Please refresh the page", "warn");
      await updateEvents(eventId, "paymentOptions", {
        paymentTokens: selectedCryptocurrencies,
      });

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
                    <ImageUploadButton
                      type="button"
                      variant="outline"
                      size="default"
                      text={imagePreview ? "Change Image" : "Upload Image"}
                      setImagePreview={setImagePreview}
                    />

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
              <div>
                <Label htmlFor="externalUrl">External URL (Optional)</Label>
                <Input
                  id="externalUrl"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  If you would like to share more details, you can add them
                  here.
                </p>
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
                        <Label htmlFor={`${ticket.id}-totalSupply`}>
                          Quantity
                        </Label>
                        <Input
                          id={`${ticket.id}-totalSupply`}
                          type="number"
                          min="1"
                          value={ticket.totalSupply}
                          onChange={(e) =>
                            updateTicketType(
                              ticket.id,
                              "totalSupply",
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
