const { ethers, ignition } = require("hardhat");
const {
  configModule,
  feeManagerModule,
  treasuryModule,
  organizerRegistryModule,
  ticketFactoryModule,
  ticketModule,
  ticketLaunchpadModule,
} = require("../ignition/modules/AllModules.js");
const { FEE_RATE, SIGNER } = require("../test/shared/constants.js");
const { createDeploymentArtifacts } = require("./utils/utils.js");

const main = async () => {
  // Deploy
  const { config } = await ignition.deploy(configModule);
  const { feeManager } = await ignition.deploy(feeManagerModule);
  const { treasury } = await ignition.deploy(treasuryModule);
  const { organizerRegistry } = await ignition.deploy(organizerRegistryModule);
  const { ticketFactory } = await ignition.deploy(ticketFactoryModule);
  const { ticket } = await ignition.deploy(ticketModule);
  const { ticketLaunchpad } = await ignition.deploy(ticketLaunchpadModule);

  // Initialize
  await config.initialize(
    feeManager.target,
    treasury.target,
    organizerRegistry.target
  );
  await feeManager.initialize(FEE_RATE);
  await treasury.initialize();
  await organizerRegistry.initialize();

  await ticketFactory.initialize(
    ticket.target,
    ticketLaunchpad.target,
    config.target,
    SIGNER.address
  );

  // Create Artifacts
  createDeploymentArtifacts(config, "Config");
  createDeploymentArtifacts(feeManager, "FeeManager");
  createDeploymentArtifacts(treasury, "Treasury");
  createDeploymentArtifacts(organizerRegistry, "OrganizerRegistry");
  createDeploymentArtifacts(ticketFactory, "TicketFactory");
};

main().catch(console.error);
