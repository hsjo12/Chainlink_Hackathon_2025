# 🎟️ TicketAvailabilityConsumer

A Solidity smart contract that integrates with **Chainlink Functions** to:

- Fetch the remaining number of tickets for a given event
- Verify whether a specific ticket has been used

Designed for the **Sepolia testnet**. Requires a Chainlink Functions subscription.

---

## 🔧 Overview

This contract utilizes Chainlink Functions to:

- Fetch off-chain ticket availability data via an HTTP API
- Check if a ticket has been used via another HTTP endpoint
- Store and emit results on-chain for transparency and verifiability

---

## 📦 Features

- ✅ Off-chain data fetching using Chainlink Functions
- 📊 Stores latest ticket availability
- 🔍 Verifies individual ticket usage status
- 🗃️ Maintains a mapping of ticket usage results
- 📡 Emits detailed events on every request

---

## ⚙️ Deployment & Setup

- **Network:** Sepolia
- **Chainlink Router Address:**
  `0xb83E47C2bC239B3bf370bc41e1459A34b41238D0`
- **DON ID for Sepolia:**
  `0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000`
- **Gas Limit for Chainlink Request:** `300000`

---

## 📤 API Endpoints

### 🎫 Ticket Availability

- URL: `https://6841cf3ad48516d1d35cf71c.mockapi.io/tickets/{eventId}`
- Returns JSON with `remaining` field:
  ```json
  {
    "id": "1",
    "remaining": "39"
  }
   
### ✅ Ticket Verification
- URL: `https://6841cf3ad48516d1d35cf71c.mockapi.io/verifytickets/{ticketId}`
- Returns JSON with used field:
  ```json
  {
  "id": "abc123",
  "used": true
  }

---

### 🧪 Public Functions
- requestRemainingTickets
  ```solidity
  function requestRemainingTickets(uint64 subscriptionId, string[] calldata args)  
  external onlyOwner returns (bytes32)
  Sends a Chainlink request to check event ticket availability
  args[0] should be the event ID as a string

- verifyTicketUsage
  ```solidity 
  function verifyTicketUsage(uint64 subscriptionId, string calldata ticketId) 
  external onlyOwner returns (bytes32)

  Sends a Chainlink request to check if a ticket has been used.

- isTicketUsed
  ```solidity 
  function isTicketUsed(string calldata ticketId) 
  external view returns (bool)
  
  Reads the cached usage result of a ticket.

---

### 📡 Events
- Response	After a successful or failed availability request
- TicketVerified	After a successful or failed ticket verification

---

### 🧪 Testing Example