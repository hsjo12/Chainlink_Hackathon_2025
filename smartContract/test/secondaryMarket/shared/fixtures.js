const { ethers } = require("hardhat");
const { deployProxy, deployContract } = require("../../shared/utilities");
const { getSampleEventStructSet } = require("../../shared/utilities");
const { FEE_RATE } = require("../../shared/constants");
const { PLATFORM_FEE_PERCENT } = require("./constants");

// Add getSampleSeat function definition
function getSampleSeat() {
  return {
    section: "A",
    seatNumber: "A-1",
    tier: 0 // VIP ticket
  };
}

async function setupSecondaryMarketContracts() {
  const [deployer, seller, buyer, manager] = await ethers.getSigners();
  
  // Deploy platform contracts
  const feeManager = await deployProxy("FeeManager");
  const treasury = await deployProxy("Treasury");
  const organizerRegistry = await deployProxy("OrganizerRegistry");
  const config = await deployProxy("Config");
  
  // Deploy ticket contracts
  const ticketFactory = await deployProxy("TicketFactory");
  const ticket = await deployContract("Ticket");
  const ticketLaunchpad = await deployContract("TicketLaunchpad");
  
  // Initialize platform contracts
  await feeManager.initialize(FEE_RATE);
  await treasury.initialize();
  await organizerRegistry.initialize();
  await config.initialize(
    feeManager.target,
    treasury.target,
    organizerRegistry.target
  );
  await ticketFactory.initialize(
    ticket.target,
    ticketLaunchpad.target,
    config.target,
    deployer.address // Use deployer as signer
  );
  
  // Deploy Chainlink Functions mock contract
  const mockRouter = await deployContract("MockFunctionsRouter");
  
  // Deploy secondary market contract
  const secondaryMarket = await deployProxy("SecondaryMarket");
  
  // Initialize secondary market
  const minListingDuration = 3600; // 1 hour
  const maxListingDuration = 604800; // 1 week
  const subscriptionId = 123;
  
  
  await secondaryMarket.initialize(
    treasury.target,
    PLATFORM_FEE_PERCENT, 
    minListingDuration,
    maxListingDuration,
    mockRouter.target,
    subscriptionId
  );
  
  // Set roles
  // Use hardcoded values from UUPSAccessControl.sol
  const MANAGER_ROLE = "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
  await secondaryMarket.grantRole(MANAGER_ROLE, manager.address);
  
  // Create a test ticket
  await organizerRegistry.setOrganizer(deployer.address, true);
  const eventStructSet = getSampleEventStructSet();
  await ticketFactory.createTicketPair(
    eventStructSet.ethUsdPriceFeed,
    eventStructSet.eventDetails,
    eventStructSet.tierIds,
    eventStructSet.imageURIByTier,
    eventStructSet.tierInfoList,
    eventStructSet.paymentTokens,
    eventStructSet.priceFeeds
  );
  
  const ticketAddress = (await ticketFactory.getTicketListByUser(deployer.address))[0];
  const ticketContract = await ethers.getContractAt("Ticket", ticketAddress);
  
  // Mint a ticket for seller
  // 修改这一行
  const sampleSeat = getSampleSeat();
  await ticketLaunchpad.adminMint(seller.address, [sampleSeat]);
  
  // Set supported NFT contract for secondary market
  await secondaryMarket.connect(manager).setSupportedContract(ticketContract.target, true);
  
  return {
    deployer,
    seller,
    buyer,
    manager,
    secondaryMarket,
    ticketContract,
    mockRouter,
    treasury,
    feeManager,
    config
  };
}

module.exports = {
  setupSecondaryMarketContracts,
  getSampleSeat
};