const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { deployProxy, deployContract } = require("../utils/utils.js");

const configModule = buildModule("ConfigModule", (m) => {
  const config = deployProxy(m, "Config");
  return { config };
});

const feeManagerModule = buildModule("FeeManagerModule", (m) => {
  const feeManager = deployProxy(m, "FeeManager");
  return { feeManager };
});

const treasuryModule = buildModule("TreasuryModule", (m) => {
  const treasury = deployProxy(m, "Treasury");
  return { treasury };
});

const organizerRegistryModule = buildModule("OrganizerRegistryModule", (m) => {
  const organizerRegistry = deployProxy(m, "OrganizerRegistry");
  return { organizerRegistry };
});

const ticketFactoryModule = buildModule("TicketFactoryModule", (m) => {
  const ticketFactory = deployProxy(m, "TicketFactory");
  return { ticketFactory };
});

const ticketModule = buildModule("TicketModule", (m) => {
  const ticket = deployContract(m, "Ticket");
  return { ticket };
});

const ticketLaunchpadModule = buildModule("TicketLaunchpadModule", (m) => {
  const ticketLaunchpad = deployContract(m, "TicketLaunchpad");
  return { ticketLaunchpad };
});

module.exports = {
  configModule,
  feeManagerModule,
  treasuryModule,
  organizerRegistryModule,
  ticketFactoryModule,
  ticketModule,
  ticketLaunchpadModule,
};
