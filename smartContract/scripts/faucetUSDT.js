const { ethers } = require("hardhat");

const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";

async function main() {
  const [deployer] = await ethers.getSigners();

  // USDT
  const usdt = await ethers.getContractAt("IERC20", USDT);

  // AAVE Faucet
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_SEPOLIA
  );

  await aaveFaucet.mint(USDT, deployer.address, ethers.parseUnits("20", 6));
}

main().catch(console.error);
