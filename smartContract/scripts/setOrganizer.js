const { ethers } = require("hardhat");
const OrganizerRegistry = require("../deployments/abi/OrganizerRegistry.json");
const main = async () => {
  const organizerRegistry = await ethers.getContractAt(
    "OrganizerRegistry",
    OrganizerRegistry.address
  );

  await organizerRegistry.setOrganizer(
    "0xb3a05C548418C3eE59c3f96c6832cF7e898D1682",
    true
  );
};
main().catch(console.error);
