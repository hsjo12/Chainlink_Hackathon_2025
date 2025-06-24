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
  number, // Ticket Price in USD
  number, // Maximum number of tickets for this tier
  number //  Number of tickets sold so far
];

export type TicketType = {
  id: string;
  name: string;
  price: string;
  quantity: string;
};
