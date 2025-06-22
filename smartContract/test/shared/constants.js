const { ethers } = require("ethers");
require("dotenv").config();

const SIGNER = new ethers.Wallet(process.env.PK);

const FEE_RATE = 100n; // 1%
const USDC_WHALE_ON_ETH_MAIN_NET = "0x01b8697695EAb322A339c4bf75740Db75dc9375E";
const USDC_ADDRESS_ON_ETH_MAIN_NET =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ETH_USD_PRICE_FEED_ON_ETH_MAIN_NET =
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const USDC_USD_PRICE_FEED_ON_ETH_MAIN_NET =
  "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";

// MOCK EVENT DETAILS
const EVENT_NAME = "TestEvent";
const EVENT_SYMBOL = "TestEventSymbol";
const EVENT_IMAGE_URI = "https://Cover.jpg";
const EVENT_DESCRIPTION = "TestEventDescription";
const EVENT_LOCATION = "Mala Vida, Austin, TX";
const EVENT_START_TIME = BigInt(Math.floor(new Date().getTime() / 1000));
const EVENT_END_TIME = BigInt(Math.floor(new Date().getTime() / 1000) + 3_600);
const VIP = 0;
const VIP_EVENT_IMAGE_URI = "https://VIP.jpg";
const VIP_PRICE = ethers.parseUnits("200", 8); // $200 with 8 decimals
const VIP_MAX_SUPPLY = 200n;

const STANDARD = 1;
const STANDARD_EVENT_IMAGE_URI = "https://STANDARD.jpg";
const STANDARD_PRICE = ethers.parseUnits("100", 8); // $100 with 8 decimals
const STANDARD_MAX_SUPPLY = 1000n;

const STANDING = 2;
const STANDING_EVENT_IMAGE_URI = "https://STANDING.jpg";
const STANDING_PRICE = ethers.parseUnits("50", 8); // $100 with 8 decimals
const STANDING_MAX_SUPPLY = 1000n;
module.exports = {
  SIGNER,
  FEE_RATE,
  USDC_WHALE_ON_ETH_MAIN_NET,
  USDC_ADDRESS_ON_ETH_MAIN_NET,
  ETH_USD_PRICE_FEED_ON_ETH_MAIN_NET,
  USDC_USD_PRICE_FEED_ON_ETH_MAIN_NET,
  EVENT_NAME,
  EVENT_SYMBOL,
  EVENT_IMAGE_URI,
  EVENT_DESCRIPTION,
  EVENT_LOCATION,
  EVENT_START_TIME,
  EVENT_END_TIME,
  VIP,
  VIP_EVENT_IMAGE_URI,
  VIP_PRICE,
  VIP_MAX_SUPPLY,
  STANDARD,
  STANDARD_EVENT_IMAGE_URI,
  STANDARD_PRICE,
  STANDARD_MAX_SUPPLY,
  STANDING,
  STANDING_EVENT_IMAGE_URI,
  STANDING_PRICE,
  STANDING_MAX_SUPPLY,
};
