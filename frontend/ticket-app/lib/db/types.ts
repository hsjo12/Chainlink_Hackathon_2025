import { z } from "zod";

export const CreateEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  symbol: z.string().min(1, "Symbol is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Invalid URL format").optional(),
  bannerUrl: z.string().url("Invalid URL format").optional(),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().datetime("Invalid date format"),
  endDate: z.string().datetime("Invalid date format"),
  paymentTokens: z.array(z.string()).default(["ETH"]),
  organizerAddress: z.string().min(1, "Organizer address is required"),
  ticketAddress: z.string().min(1, "Ticket address is required"),
  launchpadAddress: z.string().min(1, "Launchpad address is required"),
  marketAddress: z.string().min(1, "Market address is required"),
  externalUrl: z.string().url("Invalid URL format").optional(),
  platformFeePercent: z.number().min(0).max(100).default(1.5),
  royaltyFeePercent: z.number().min(0).max(100).default(0.1),
  ticketTypes: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1).optional(),
        price: z.number().min(0),
        totalSupply: z.number().min(1),
        typeValue: z.number().min(0),
      })
    )
    .min(1),
  maxPerWallet: z.number().min(1).default(4),
});

export const updateEventSchema = CreateEventSchema.partial();

export const updateEventDetails = z.object({
  title: z.string().min(1, "Title is required"),
  symbol: z.string().min(1, "Symbol is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Invalid URL format").optional(),
  bannerUrl: z.string().url("Invalid URL format").optional(),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().datetime("Invalid date format"),
  endDate: z.string().datetime("Invalid date format"),
  externalUrl: z.string().url("Invalid URL format").optional(),
});

export const updateTicketTypes = z.object({
  ticketTypes: z.array(
    z.object({
      id: z.string().min(1, "TicketType ID is required"),
      price: z
        .string()
        .transform((val) => parseFloat(val))
        .refine((num) => !isNaN(num) && num > 0, {
          message: "Price must be a positive number",
        }),
      totalSupply: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((num) => !isNaN(num) && num > 0, {
          message: "TotalSupply must be a positive integer",
        }),
    })
  ),
});

export const updatePaymentTokens = z.object({
  paymentTokens: z.array(z.string()).default(["ETH"]),
});

// TicketType validation schema
const CreateTicketTypeSchema = z.object({
  id: z.string().uuid().optional(), // Assuming cuid() generates a unique string
  eventId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  totalSupply: z
    .number()
    .int()
    .positive("Total supply must be a positive integer"),
});

export const UpdateTicketTypeSchema = CreateTicketTypeSchema.partial();

// TicketValidation validation schema
export const CreateTicketValidationSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  tokenId: z.string().min(1, "Token ID is required"),
  eventId: z.string(),
  ticketTypeId: z.string(),
  isUsed: z.boolean().default(false),
  usedAt: z.date().optional(),
  validatedBy: z.string().optional(),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
});

export const UpdateTicketValidationSchema =
  CreateTicketValidationSchema.partial();

export interface ITicketValidationGetResponse {
  ticketValidation: {
    id: string;
    contractAddress: string;
    tokenId: string;
    eventId: string;
    ticketTypeId: string;
    isUsed: boolean;
    usedAt: string | null;
    validatedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Define the shape for the PUT request body based on your schema
export interface IUpdateTicketValidationPayload {
  isUsed: boolean;
  usedAt?: string;
  validatedBy?: string;
}

// Extend your ValidationResult interface to include more detailed ticket info
export interface IValidationResult {
  success: boolean;
  message: string;
  data?: {
    ticket: {
      id: string;
      tokenId: string;
      status: string; // e.g., "valid", "used", "invalid", "marked_used"
      usedAt: string | null; // Can be null if not used
      validatedBy: string | null; // Can be null if not used
      event: {
        title: string;
        location: string;
        startDate: string;
      };
      ticketType: {
        name: string;
        description: string;
      };
    };
  };
}

// Define the shape of the Event response
export interface EventResponse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  bannerUrl: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  timezone: string;
  organizerAddress: string;
  ticketAddress: string;
  launchpadAddress: string;
  marketAddress: string;
  platformFeePercent: string;
  royaltyFeePercent: string;
  maxPerWallet: number;
  createdAt: string;
  updatedAt: string;
  ticketTypes: EventTicketType[]; // Array of ticket types
}

// Define the shape of a single TicketType from the event response
interface EventTicketType {
  id: string;
  eventId: string;
  name: string; // This is the field we want to display
  description: string;
  price: string;
  currency: string;
  totalSupply: number;
}
