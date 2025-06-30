## TicketChain

Ticketchain is a decentralized ticketing platform that transforms how tickets are issued, purchased, and resold. By leveraging Web3 technologies, Ticketchain eliminates fraud, ensures true ticket ownership, and empowers event organizers with transparent and secure revenue streams.

## QUICK Demo

- [Demo](https://ticketchain-rho.vercel.app/)

## Requirement

- [Hardhat](https://hardhat.org/)
- [Node](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/downloads)
- [Alchemy](https://www.alchemy.com/)
- [Openzeppelin defender](https://www.openzeppelin.com/defender)
- [Uploadthing](https://uploadthing.com/)
- [Prisma](https://www.prisma.io/docs/orm/prisma-schema/data-model/models)
- [Neon](https://neon.com/)

  In order to deploy contract you will need:

1. **Ensure you have the following prerequisites:**

   - $ETH on ETH Sepolia Testnet.
   - ETH Sepolia Testnet RPC endpoint.

2. **Create a `.env` file with the following content in smartContract:**
   ```env
   ALCHEMY_RPC_KEY="Alchemy RPC"
   PK="Deployer private key"
   ```
3. **Create a `.env` file with the following content in frontend:**
   ```env
   NEXT_PUBLIC_CHAIN_ID = "11155111"
   NEXT_PUBLIC_PROJECT_ID = ""
   NEXT_PUBLIC_RPC = "https://ethereum-sepolia-rpc.publicnode.com"
   NEXT_PUBLIC_SIGNATURE_WEBHOOK = ""
   DATABASE_URL=""
   UPLOADTHING_TOKEN=""
   ```

## Set-up

1. **Deploy all contracts to Sepolia**

   Run the Hardhat deployment script:

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Move ABI files to the frontend**
   After deployment, ABI files will be generated in the `deployments` folder.
   Copy them to your frontend project:

   ```bash
   frontend/ticket-app/smartContracts/abis
   ```

3. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

4. **Run the website**
   From the frontend directory, start the Next.js app:
   ```bash
   npm run dev
   ```

## Chainlink Integration Files

1. **Data feed**

- [contracts/market/TicketLaunchpad.sol](https://github.com/hsjo12/Chainlink_Hackathon_2025/blob/main/smartContract/contracts/markets/TicketLaunchpad.sol) - Fetch the price from a data feed and ensure the received amount corresponds to the fetched price.

2. **Chainlink Function**
   [contracts/secondaryMarket/SecondaryMarketCore.sol](https://github.com/hsjo12/Chainlink_Hackathon_2025/blob/main/smartContract/contracts/secondaryMarket/SecondaryMarketCore.sol) - Retrieve ticket usage data via a Chainlink Function and, upon listing, check whether the ticket has been used to prevent fraudulent listings.

## Deployment

#### Sepolia

| Name                | Address                                    |
| ------------------- | ------------------------------------------ |
| `Config`            | 0x01AbD13ff659d75233F25016230B40AF842cf25B |
| `FeeManager`        | 0xDEAe5Fe045Ca7FA0a6206A1434c2C23033da6BAb |
| `OrganizerRegistry` | 0x519990bAfb605d97a51D801E56C73348CA5b54bE |
| `TicketFactory`     | 0x3A3f2644B85a5c9B2C5624dA3d7b931Bf1532620 |
| `Treasury`          | 0x1DD1a23b068dB802582F8D733C4cb289c85644f1 |
