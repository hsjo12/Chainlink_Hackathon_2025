export const VIP = 0;
export const STANDARD = 1;
export const STANDING = 2;
export const ETH_USD_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
export const CRYPTO_CURRENCIES = [
  {
    id: "ETH",
    name: "ETH (Ether)",
    address: "0xf531B8F309Be94191af87605CfBf600D71C2cFe0",
    priceFeed: ETH_USD_PRICE_FEED,
    decimals: 18,
  },
  {
    id: "WBTC",
    name: "WBTC (Wrapped Bitcoin)",
    address: "0x29f2d40b0605204364af54ec677bd022da425d03",
    priceFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    decimals: 8,
  },
  {
    id: "WETH",
    name: "WETH (Wrapped Ether)",
    address: "0xf531B8F309Be94191af87605CfBf600D71C2cFe0",
    priceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    decimals: 18,
  },
  {
    id: "USDC",
    name: "USDC (USD Coin)",
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    priceFeed: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    decimals: 6,
  },
  {
    id: "USDT",
    name: "USDT (Tether)",
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    priceFeed: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    decimals: 6,
  },
];
