"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeaderMenu } from "@/app/components/HeaderMenu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { toastMessage } from "@/lib/react-tostify/popup";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { buildTierValue, checkConnection } from "@/lib/web3/utils";
import { createTicketPair } from "@/lib/web3/smartContract/ticketFactory";
import { TicketType } from "@/types/types";
import { buildCreatePairParams } from "@/lib/web3/smartContract/buildCreatePairParams";
import {
  CRYPTO_CURRENCIES,
  STANDARD,
  STANDING,
  VIP,
} from "@/constants/constants";
import { checkOrganizer } from "@/lib/web3/smartContract/organizerRegistry";

// Define Ticket type
const ticketOptions = ["VIP", "STANDARD", "STANDING"];

export default function CreateEventPage() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const router = useRouter();
  const ticketIdCounter = useRef(1);
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
  >(["ETH"]);
  const [tokenLink, setTokenLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only event Organizer can visit this page
  useEffect(() => {
    if (!isConnected) return router.push("/");
    (async () => {
      const result = await checkOrganizer(address);
      if (!result) return router.push("/");
    })();
  }, [address]);

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

  // Add a new ticket type
  const addTicketType = () => {
    if (ticketTypes.length === ticketOptions.length) return;

    const unusedTypes = ticketOptions.filter(
      (type) => !ticketTypes.some((ticket) => ticket.name === type)
    );

    const newId = `ticket-${ticketIdCounter.current}`;

    const newTicket: TicketType = {
      id: newId,
      name: unusedTypes[0],
      price: "",
      quantity: "",
    };
    setTicketTypes([...ticketTypes, newTicket]);
    ticketIdCounter.current += 1;
  };

  // Remove a ticket type
  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((ticket) => ticket.id !== id));
    }
  };

  // Update ticket type details
  const updateTicketType = (
    id: string,
    field: keyof TicketType,
    value: string
  ) => {
    setTicketTypes(
      ticketTypes.map((ticket) =>
        ticket.id === id ? { ...ticket, [field]: value } : ticket
      )
    );
  };

  const updateTicketTypeName = (id: string, value: string) => {
    const isSelectedType = ticketTypes.find((ticket) => ticket.name === value);

    if (isSelectedType)
      return toastMessage(`${value} is already selected`, "warn");

    setTicketTypes(
      ticketTypes.map((ticket) =>
        ticket.id === id ? { ...ticket, name: value } : ticket
      )
    );
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if a wallet is connected
      checkConnection(isConnected);

      // In a real application, you would upload the image to a server
      // and save the event data to a database or blockchain

      // For this demo, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate params for the createTicketPair function
      const params = buildCreatePairParams(
        title,
        symbol,
        imagePreview,
        description,
        location,
        startDate,
        endDate,
        null, // image uris by tier
        ticketTypes,
        selectedCryptocurrencies,
        CRYPTO_CURRENCIES
      );

      // Interact with the createTicketPair function
      const result = await createTicketPair(walletProvider, params);
      if (!result) throw new Error("Transaction failed");

      // Return addresses and should store these into DB.
      const { ticket, ticketLaunchpad, market } = result;
      console.log(`ticket address : ${ticket}`);
      console.log(`ticketLaunchpad address : ${ticketLaunchpad}`);
      console.log(`market address : ${market} - mock market address`);

      // Create a new event object
      const newEvent = {
        id: Date.now(), // Generate a unique ID
        title,
        symbol,
        startDate,
        endDate,
        location,
        summary: description,
        image: imagePreview, // In a real app, this would be a URL to the uploaded image
        tickets: ticketTypes.map((ticket) => ({
          type: ticket.name,
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity),
          typeValue: buildTierValue(ticket.name),
        })),
        cryptocurrencies: selectedCryptocurrencies,
        tokenLink: tokenLink || null,
        ticketAddress: ticket,
        launchpadAddress: ticketLaunchpad,
        marketAddress: market,
      };

      // In a real application, you would save this to a database or blockchain
      console.log("New event created:", newEvent);

      // For demo purposes, we'll store it in localStorage to display on the home page
      const existingEvents = JSON.parse(localStorage.getItem("events") || "[]");
      localStorage.setItem(
        "events",
        JSON.stringify([...existingEvents, newEvent])
      );

      // Navigate to the home page
      router.push("/");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <HeaderMenu />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Event Details</h2>
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
                      Upload Image
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
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ticket Types</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTicketType}
                  className="flex items-center"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Ticket Type
                </Button>
              </div>

              <div className="space-y-6">
                {ticketTypes.map((ticket) => (
                  <div key={ticket.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Ticket Type</h3>
                      {ticketTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketType(ticket.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`${ticket.id}-name`}>Name</Label>
                        <Select
                          id={`${ticket.id}-name`}
                          value={ticket.name}
                          onChange={(e) =>
                            updateTicketTypeName(ticket.id, e.target.value)
                          }
                          required
                          className="w-full border border-input rounded-md p-2 text-sm"
                        >
                          {ticketOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
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
                              e.target.value
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
          </Card>

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
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? "Creating Event..." : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
