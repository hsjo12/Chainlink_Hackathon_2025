#Chainlink_Hackathon_2025

## TicketAvailabilityConsumer

### Project Overview

`TicketAvailabilityConsumer` is a smart contract based on Chainlink Functions, designed to fetch the remaining ticket count of a specific event from an off-chain API.  
The contract calls a Chainlink Functions JavaScript script to perform cross-chain external data queries and stores the results on-chain for easy access by DApps.

This contract is designed for the Sepolia testnet and depends on Chainlink Functions subscriptions and the DON (Decentralized Oracle Network) configuration.

---

### Contract Features

- Sends requests to Chainlink Functions to get the remaining ticket count for a specified event  
- Listens for Chainlink oracle callbacks, parses the returned results, and saves them  
- Exposes the current ticket count through the `remainingTickets` variable for convenient frontend queries

---

### Dependencies

- Solidity ^0.8.19  
- Chainlink Functions contracts  
- Chainlink Functions Router address on the Sepolia testnet

---

### Deployment Instructions

1. Ensure you have a Sepolia testnet account with sufficient test ETH  
2. Create a Chainlink Functions subscription (subscriptionId) and fund it(https://functions.chain.link/sepolia)  
3. Configure the Router address and DON ID in the contract (defaults set to Sepolia)  
4. Deploy the contract using Hardhat or Remix

---

### Usage Instructions

#### Sending a Request

Call the contract’s `sendRequest` function, passing your Chainlink Functions subscription ID and the event ID as parameters. For example:

```js
const subscriptionId = 123;  // Your Chainlink subscription ID
const eventId = "abc123";    // The event ID you want to query
await contract.sendRequest(subscriptionId, [eventId]);
