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
