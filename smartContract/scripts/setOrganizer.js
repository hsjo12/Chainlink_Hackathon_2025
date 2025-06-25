const { ethers } = require("hardhat");
const OrganizerRegistry = require("../deployments/abi/OrganizerRegistry.json");
const main = async () => {
  const organizerRegistry = await ethers.getContractAt(
    "OrganizerRegistry",
    OrganizerRegistry.address
  );

  await organizerRegistry.setOrganizer(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    true
  );
};
main().catch(console.error);
