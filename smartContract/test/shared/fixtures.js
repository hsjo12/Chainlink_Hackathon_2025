const { ethers } = require("hardhat");
const { deployProxy, deployContract } = require("./utilities");
const { FEE_RATE, SIGNER } = require("./constants");

async function setupContracts() {
  const [deployer, user1, user2, faucet] = await ethers.getSigners();

  // platform
  const feeManager = await deployProxy("FeeManager");
  const treasury = await deployProxy("Treasury");
  const organizerRegistry = await deployProxy("OrganizerRegistry");
  const config = await deployProxy("Config");

  //ticket
  const ticketFactory = await deployProxy("TicketFactory");
  const ticket = await deployContract("Ticket");
  const ticketLaunchpad = await deployContract("TicketLaunchpad");

  // Initialize
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
    SIGNER.address
  );

  return {
    deployer,
    user1,
    user2,
    faucet,
    feeManager,
    treasury,
    organizerRegistry,
    config,
    ticketFactory,
  };
}
module.exports = {
  setupContracts,
};
