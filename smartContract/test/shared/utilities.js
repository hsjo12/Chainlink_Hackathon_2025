const { ethers } = require("hardhat");
const { AbiCoder, keccak256, hashMessage, getBytes } = require("ethers");

const {
  USDC_WHALE_ON_ETH_MAIN_NET,
  USDC_ADDRESS_ON_ETH_MAIN_NET,
  VIP_PRICE,
  VIP_MAX_SUPPLY,
  STANDARD_PRICE,
  STANDARD_MAX_SUPPLY,
  EVENT_NAME,
  EVENT_SYMBOL,
  EVENT_IMAGE_URI,
  EVENT_DESCRIPTION,
  EVENT_START_TIME,
  EVENT_END_TIME,
  ETH_USD_PRICE_FEED_ON_ETH_MAIN_NET,
  USDC_USD_PRICE_FEED_ON_ETH_MAIN_NET,
  VIP,
  STANDARD,
  STANDARD_EVENT_IMAGE_URI,
  VIP_EVENT_IMAGE_URI,
  SIGNER,
  STANDING_PRICE,
  STANDING_MAX_SUPPLY,
  STANDING_EVENT_IMAGE_URI,
  STANDING,
  EVENT_LOCATION,
} = require("./constants");

const deployProxy = async (logicName, initializer = "0x") => {
  const Logic = await ethers.getContractFactory(logicName);
  const logic = await Logic.deploy();

  const Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await Proxy.deploy(logic.target, initializer);

  const instance = await ethers.getContractAt(logicName, proxy.target);
  return instance;
};

const deployContract = async (contractName) => {
  const Instance = await ethers.getContractFactory(contractName);
  const instance = await Instance.deploy();
  return instance;
};

const feeCalculator = (amount, fee) => {
  return (amount * fee) / 10_000n;
};

const faucetUSDC = async (to, amount) => {
  const whale = await ethers.getImpersonatedSigner(USDC_WHALE_ON_ETH_MAIN_NET);
  const usdc = await ethers.getContractAt(
    "IERC20",
    USDC_ADDRESS_ON_ETH_MAIN_NET
  );
  await usdc.connect(whale).transfer(to, amount);
};

const getUSDCWhaleOnETHMainNet = async () => {
  return await ethers.getImpersonatedSigner(USDC_WHALE_ON_ETH_MAIN_NET);
};

const getUSDCContractOnETHMainNet = async () => {
  return await ethers.getContractAt("IERC20", USDC_ADDRESS_ON_ETH_MAIN_NET);
};

const getSampleEventStructSet = () => {
  return {
    ethUsdPriceFeed: ETH_USD_PRICE_FEED_ON_ETH_MAIN_NET,
    eventDetails: [
      EVENT_NAME,
      EVENT_SYMBOL,
      EVENT_IMAGE_URI,
      EVENT_DESCRIPTION,
      EVENT_LOCATION,
      EVENT_START_TIME,
      EVENT_END_TIME,
    ],

    tierIds: [VIP, STANDARD, STANDING],
    imageURIByTier: [
      VIP_EVENT_IMAGE_URI,
      STANDARD_EVENT_IMAGE_URI,
      STANDING_EVENT_IMAGE_URI,
    ],

    tierInfoList: [
      [VIP_PRICE, VIP_MAX_SUPPLY, 0, true],
      [STANDARD_PRICE, STANDARD_MAX_SUPPLY, 0, true],
      [STANDING_PRICE, STANDING_MAX_SUPPLY, 0, false],
    ],
    paymentTokens: [USDC_ADDRESS_ON_ETH_MAIN_NET],
    priceFeeds: [USDC_USD_PRICE_FEED_ON_ETH_MAIN_NET],
  };
};

function getExpectedTokenURI(eventDetails, tierImageURI, seat, tokenId) {
  let seatTier = "";
  if (seat.tier == VIP) seatTier = "VIP";
  if (seat.tier == STANDARD) seatTier = "STANDARD";
  if (seat.tier == STANDING) seatTier = "STANDING";
  const metadata = {
    name: `${eventDetails.name}#${tokenId}`,
    description: eventDetails.description,
    image: tierImageURI,
    attributes: [
      {
        trait_type: "Section",
        value: seat.section,
      },
      {
        trait_type: "Seat Number",
        value: seat.seatNumber,
      },
      {
        trait_type: "Tier",
        value: seatTier,
      },
      {
        trait_type: "Location",
        value: "Mala Vida, Austin, TX",
      },
      {
        trait_type: "Start Time",
        display_type: "date",
        value: eventDetails.startTime.toString(),
      },
      {
        trait_type: "End Time",
        display_type: "date",
        value: eventDetails.endTime.toString(),
      },
    ],
  };

  return JSON.stringify(metadata);
}

const getSampleSeat = () => {
  return ["A", "A-1", 0];
};

const getSampleMultipleSeats = () => {
  return [
    ["A", "A-1", 0],
    ["A", "A-2", 0],
    ["B", "B-22", 1],
  ];
};

const getSampleStandingSeat = () => {
  return ["STANDING", "STANDING", 2];
};
const getSampleMultipleStandingSeats = () => {
  return [
    ["STANDING", "STANDING", 2],
    ["STANDING", "STANDING", 2],
    ["STANDING", "STANDING", 2],
  ];
};
const getMintSignatureParams = async (
  launchpad,
  to,
  seat,
  nonce,
  deadline,
  _signer = null
) => {
  const signer = _signer || SIGNER;

  const [section, seatNumber, tier] = seat;

  const abiCoder = AbiCoder.defaultAbiCoder();
  const encoded = abiCoder.encode(
    ["address", "address", "string", "string", "uint8", "uint256", "uint64"],
    [launchpad, to, section, seatNumber, tier, nonce, deadline]
  );
  const hash = keccak256(encoded);
  const signature = await signer.signMessage(getBytes(hash));

  return [launchpad, to, seat, nonce, deadline, signature];
};

const getMintBatchSignatureParams = async (
  launchpad,
  to,
  seats,
  nonce,
  deadline,
  _signer = null
) => {
  const signer = _signer || SIGNER;

  const abiCoder = AbiCoder.defaultAbiCoder();

  const encoded = abiCoder.encode(
    [
      "address",
      "address",
      "tuple(string section, string seatNumber, uint8 tier)[]",
      "uint256",
      "uint64",
    ],
    [launchpad, to, seats, nonce, deadline]
  );

  const hash = keccak256(encoded);
  const signature = await signer.signMessage(getBytes(hash));

  return [launchpad, to, seats, nonce, deadline, signature];
};

module.exports = {
  deployProxy,
  deployContract,
  feeCalculator,
  faucetUSDC,
  getUSDCWhaleOnETHMainNet,
  getUSDCContractOnETHMainNet,
  getSampleEventStructSet,
  getExpectedTokenURI,
  getSampleSeat,
  getSampleMultipleSeats,
  getSampleStandingSeat,
  getSampleMultipleStandingSeats,
  getMintSignatureParams,
  getMintBatchSignatureParams,
};
