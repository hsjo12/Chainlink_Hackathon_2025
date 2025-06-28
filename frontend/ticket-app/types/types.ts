export type EventDetails = [
  string, // Event title
  string, // Event symbol
  string, // URI
  string, // Description
  string, // Location
  number, // Start Date
  number // End Date
];

export type TierIds = number[];

export type TierInfo = [
  bigint, // Ticket Price in USD, add 8 decimals ex) ethers.parseUnits("200", 8)
  number, // Maximum number of tickets for this tier
  number, //  Number of tickets sold so far
  boolean
];

export type TicketType = {
  id: string;
  name: string;
  price: string;
  totalSupply: string;
};

export type PaymentTokenOption = {
  id: string;
  name: string;
  address: string;
  priceFeed: string;
  decimals: number;
};

export type Seat = [
  section: string, // Section or area of the venue (e.g., "A", "B", "Balcony", "Left Wing")
  seatNumber: string, // Specific seat identifier within the section (e.g., "A1", "B12", "R5")
  tier: number // 0 : VIP , 1 : STANDARD, 2 : STANDING
];

export type db_ticketType = {
  name: string;
  description: string | undefined;
  price: number;
  totalSupply: number;
  typeValue: number;
};
