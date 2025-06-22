'use client'
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeaderMenu } from "@/app/components/HeaderMenu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Define cryptocurrency options
const cryptocurrencies = [
  { id: "usd", name: "USD" },
  { id: "eth", name: "Ethereum (ETH)" },
  { id: "btc", name: "Bitcoin (BTC)" },
  { id: "sol", name: "Solana (SOL)" },
  { id: "usdc", name: "USD Coin (USDC)" },
];

// Define ticket type interface
interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

export default function EditEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: "regular", name: "Regular", price: "", quantity: "" },
  ]);
  const [selectedCryptocurrencies, setSelectedCryptocurrencies] = useState<string[]>(["usd"]);
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

      const foundDefaultEvent = defaultEvents.find(e => e.id.toString() === eventId);

      if (foundDefaultEvent) {
        // Default events can't be edited, redirect to home
        alert("Default events cannot be edited.");
        router.push('/');
        return;
      }

      // Check localStorage for user-created events
      const storedEvents = localStorage.getItem('events');
      if (storedEvents) {
        try {
          const parsedEvents = JSON.parse(storedEvents);
          const foundEvent = parsedEvents.find((e: any) => e.id.toString() === eventId);

          if (foundEvent) {
            // Populate form with event data
            setTitle(foundEvent.title || "");
            setDescription(foundEvent.summary || "");
            setLocation(foundEvent.location || "");
            setDate(foundEvent.date || "");
            setImagePreview(foundEvent.image || null);
            
            // Format date if it's not in YYYY-MM-DD format
            if (foundEvent.date && !foundEvent.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              try {
                const dateObj = new Date(foundEvent.date);
                const formattedDate = dateObj.toISOString().split('T')[0];
                setDate(formattedDate);
              } catch (error) {
                console.error('Error formatting date:', error);
              }
            }

            // Set ticket types
            if (foundEvent.tickets && Array.isArray(foundEvent.tickets)) {
              const formattedTickets = foundEvent.tickets.map((ticket: any, index: number) => ({
                id: `ticket-${index + 1}`,
                name: ticket.type || "",
                price: ticket.price?.toString() || "",
                quantity: ticket.quantity?.toString() || ""
              }));
              setTicketTypes(formattedTickets.length > 0 ? formattedTickets : [{ id: "regular", name: "Regular", price: "", quantity: "" }]);
            }

            // Set cryptocurrencies
            if (foundEvent.cryptocurrencies && Array.isArray(foundEvent.cryptocurrencies)) {
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
            router.push('/');
          }
        } catch (error) {
          console.error('Error parsing stored events:', error);
          alert("Error loading event data.");
          router.push('/');
        }
      } else {
        // No events in localStorage, redirect to home
        alert("No events found.");
        router.push('/');
      }
    } else {
      // No eventId provided, redirect to home
      router.push('/');
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

  // Add a new ticket type
  const addTicketType = () => {
    const newId = `ticket-${ticketTypes.length + 1}`;
    setTicketTypes([
      ...ticketTypes,
      { id: newId, name: "", price: "", quantity: "" },
    ]);
  };

  // Remove a ticket type
  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((ticket) => ticket.id !== id));
    }
  };

  // Update ticket type details
  const updateTicketType = (id: string, field: keyof TicketType, value: string) => {
    setTicketTypes(
      ticketTypes.map((ticket) =>
        ticket.id === id ? { ...ticket, [field]: value } : ticket
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
      // For this demo, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create an updated event object
      const updatedEvent = {
        id: parseInt(eventId || "0"), // Use the existing ID
        title,
        date,
        location,
        summary: description,
        image: imagePreview, // In a real app, this would be a URL to the uploaded image
        tickets: ticketTypes.map(ticket => ({
          type: ticket.name,
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity),
        })),
        cryptocurrencies: selectedCryptocurrencies,
        tokenLink: tokenLink || null,
      };

      // Update the event in localStorage
      const storedEvents = JSON.parse(localStorage.getItem('events') || '[]');
      const updatedEvents = storedEvents.map((event: any) => 
        event.id.toString() === eventId ? updatedEvent : event
      );
      localStorage.setItem('events', JSON.stringify(updatedEvents));

      // Navigate to the home page
      router.push('/');
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
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold">Edit Event</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              
              <div className="space-y-4">
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
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
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
                        <Input
                          id={`${ticket.id}-name`}
                          value={ticket.name}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "name", e.target.value)
                          }
                          placeholder="e.g., Regular, VIP"
                          required
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
                        <Label htmlFor={`${ticket.id}-quantity`}>Quantity</Label>
                        <Input
                          id={`${ticket.id}-quantity`}
                          type="number"
                          min="1"
                          value={ticket.quantity}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "quantity", e.target.value)
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
                    {cryptocurrencies.map((crypto) => (
                      <div key={crypto.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`crypto-${crypto.id}`}
                          checked={selectedCryptocurrencies.includes(crypto.id)}
                          onChange={() => toggleCryptocurrency(crypto.id)}
                          className="mr-2"
                        />
                        <Label htmlFor={`crypto-${crypto.id}`} className="cursor-pointer">
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
                    If you have a custom token, provide the contract address or link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? "Updating Event..." : "Update Event"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}