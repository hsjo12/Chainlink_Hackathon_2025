import { z } from 'zod'

export enum CryptoCurrencyEnum {
  USDT = 'USDT',
  USDC = 'USDC',
}

export const CreateEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Invalid URL format').optional(),
  bannerUrl: z.string().url('Invalid URL format').optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid date format'),
  timezone: z.string().min(1, 'Timezone is required').default('UTC'),
  organizerAddress: z.string().min(1, 'Organizer address is required'),
  ticketAddress: z.string().min(1, 'Ticket address is required').optional(),
  launchpadAddress: z
    .string()
    .min(1, 'Launchpad address is required')
    .optional(),
  marketAddress: z.string().min(1, 'Market address is required').optional(),
  platformFeePercent: z
    .number()
    .min(0, 'Platform fee percentage must be at least 0')
    .max(100, 'Platform fee percentage cannot exceed 100')
    .default(1.5),
  royaltyFeePercent: z
    .number()
    .min(0, 'Royalty fee percentage must be at least 0')
    .max(100, 'Royalty fee percentage cannot exceed 100')
    .default(0.1),
  ticketTypes: z
    .array(
      z.object({
        name: z.string().min(1, 'Ticket type name is required'),
        description: z.string().min(1, 'Ticket type description is required'),
        price: z.number().min(0, 'Price must be at least 0'),
        currency: z
          .nativeEnum(CryptoCurrencyEnum)
          .default(CryptoCurrencyEnum.USDC),
        totalSupply: z.number().min(1, 'Total supply must be at least 1'),
      })
    )
    .min(1, 'At least one ticket type is required'),
  maxPerWallet: z
    .number()
    .min(1, 'Maximum tickets per wallet must be at least 1')
    .default(4),
})

export const updateEventSchema = CreateEventSchema.partial()

// TicketType validation schema
const CreateTicketTypeSchema = z.object({
  id: z.string().uuid().optional(), // Assuming cuid() generates a unique string
  eventId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number'),
  currency: z.nativeEnum(CryptoCurrencyEnum).default(CryptoCurrencyEnum.USDC),
  totalSupply: z
    .number()
    .int()
    .positive('Total supply must be a positive integer'),
})

export const UpdateTicketTypeSchema = CreateTicketTypeSchema.partial()

// TicketValidation validation schema
export const CreateTicketValidationSchema = z.object({
  contractAddress: z.string().min(1, 'Contract address is required'),
  tokenId: z.string().min(1, 'Token ID is required'),
  eventId: z.string(),
  ticketTypeId: z.string(),
  isUsed: z.boolean().default(false),
  usedAt: z.date().optional(),
  validatedBy: z.string().optional(),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
})

export const UpdateTicketValidationSchema =
  CreateTicketValidationSchema.partial()

export interface ITicketValidationGetResponse {
  ticketValidation: {
    id: string
    contractAddress: string
    tokenId: string
    eventId: string
    ticketTypeId: string
    isUsed: boolean
    usedAt: string | null
    validatedBy: string | null
    createdAt: string
    updatedAt: string
  }
}

// Define the shape for the PUT request body based on your schema
export interface IUpdateTicketValidationPayload {
  isUsed: boolean
  usedAt?: string
  validatedBy?: string
}

// Extend your ValidationResult interface to include more detailed ticket info
export interface IValidationResult {
  success: boolean
  message: string
  data?: {
    ticket: {
      id: string
      tokenId: string
      status: string // e.g., "valid", "used", "invalid", "marked_used"
      usedAt: string | null // Can be null if not used
      validatedBy: string | null // Can be null if not used
      event: {
        title: string
        location: string
        startDate: string
      }
      ticketType: {
        name: string
        description: string
      }
    }
  }
}

// Define the shape of the Event response
export interface EventResponse {
  id: string
  title: string
  description: string
  imageUrl: string
  bannerUrl: string
  category: string
  location: string
  startDate: string
  endDate: string
  timezone: string
  organizerAddress: string
  ticketAddress: string
  launchpadAddress: string
  marketAddress: string
  platformFeePercent: string
  royaltyFeePercent: string
  maxPerWallet: number
  createdAt: string
  updatedAt: string
  ticketTypes: EventTicketType[] // Array of ticket types
}

// Define the shape of a single TicketType from the event response
interface EventTicketType {
  id: string
  eventId: string
  name: string // This is the field we want to display
  description: string
  price: string
  currency: string
  totalSupply: number
}
