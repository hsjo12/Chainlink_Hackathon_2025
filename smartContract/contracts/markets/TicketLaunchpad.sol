// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Seat, Tier} from "../types/Seat.sol";
import {MintSignatureParams, MintBatchSignatureParams} from "../types/mintSignature.sol";
import {UNACCEPTABLE_PAYMENT, INSUFFICIENT_AMOUNT, TRANSACTION_FAILED, NONCE_ALREADY_USED, SIGNATURE_EXPIRED, INVALID_SIGNATURE, ZERO_ADDRESS_NOT_ALLOWED} from "../errors/Errors.sol";
import {ITicket} from "../interfaces/ITicket.sol";
import {IFeeManager} from "../interfaces/IFeeManager.sol";
import {IConfig} from "../interfaces/IConfig.sol";
import {AggregatorV3Interface} from "../interfaces/chainlink/dataFeed/AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title Ticket Launchpad Contract
 * @notice Handles ticket sales with signature-based mint authorization, supports payments in ETH or ERC20 tokens.
 * @dev Integrates Chainlink price feeds for dynamic pricing.
 */
contract TicketLaunchpad is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    ITicket public ticket;
    IConfig public config;
    address private _authorizedSigner;

    mapping(address user => uint256 nonce) public nonces; // Maps user address to their current nonce
    mapping(Tier tier => uint256 priceInUSD) public tierPricesInUSD;
    mapping(address paymentToken => address priceFeed)
        public paymentTokenPriceFeeds;
    Tier[] private _supportedTiers;
    address[] private _supportedPaymentTokens;

    /**
     * @dev Constructor disables initializers to prevent implementation contract misuse.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with necessary configurations.
     * @param owner The owner address (event organizer).
     * @param config_ Address of config contract providing feeManager and treasury.
     * @param ticket_ Address of the ticket (ERC721) contract.
     * @param authorizedSigner_ Address authorized to sign mint approvals.
     * @param tierIds Array of Tier enums supported.
     * @param tierPricesUSD Corresponding prices (in USD, 8 decimals following USDT decimal) for each tier.
     * @param paymentTokens Supported payment token addresses.
     * @param priceFeeds Corresponding Chainlink price feeds for payment tokens.
     */
    function initialize(
        address owner,
        address config_,
        address ticket_,
        address authorizedSigner_,
        Tier[] memory tierIds,
        uint256[] calldata tierPricesUSD,
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) external initializer {
        __Ownable_init(owner);
        __ReentrancyGuard_init();

        if (
            ticket_ == address(0) ||
            config_ == address(0) ||
            authorizedSigner_ == address(0)
        ) revert ZERO_ADDRESS_NOT_ALLOWED();

        config = IConfig(config_);
        ticket = ITicket(ticket_);
        _authorizedSigner = authorizedSigner_;
        _updateTierPrices(tierIds, tierPricesUSD);
        _updatePaymentTokens(paymentTokens, priceFeeds);
    }

    /**
     * @dev Updates the supported tiers and their corresponding USD prices.
     *      Clears previous tier prices before setting new ones.
     * @param tierIds Array of tier enums to be supported.
     * @param tierPricesUSD Array of prices in USD corresponding to each tier.
     */
    function _updateTierPrices(
        Tier[] memory tierIds,
        uint256[] calldata tierPricesUSD
    ) private {
        uint256 length = _supportedTiers.length;
        for (uint256 i; i < length; ) {
            tierPricesInUSD[_supportedTiers[i]] = 0;
            unchecked {
                i++;
            }
        }

        delete _supportedTiers;
        length = tierIds.length;
        Tier tier;
        for (uint256 i; i < length; ) {
            tier = Tier(tierIds[i]);
            _supportedTiers.push(tier);
            tierPricesInUSD[tier] = tierPricesUSD[i];
            unchecked {
                i++;
            }
        }
    }

    /**
     * @dev Updates the list of supported payment tokens and their Chainlink price feeds.
     *      Clears previous token-priceFeed mappings before setting new ones.
     * @param paymentTokens Array of ERC20 token addresses (address(0) for ETH).
     * @param priceFeeds Corresponding Chainlink price feed addresses for each token.
     */
    function _updatePaymentTokens(
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) private {
        uint256 length = _supportedPaymentTokens.length;
        for (uint256 i; i < length; ) {
            paymentTokenPriceFeeds[_supportedPaymentTokens[i]] = address(0);
            unchecked {
                i++;
            }
        }
        delete _supportedPaymentTokens;

        length = paymentTokens.length;
        address token;
        for (uint256 i; i < length; ) {
            token = paymentTokens[i];
            _supportedPaymentTokens.push(token);
            paymentTokenPriceFeeds[token] = priceFeeds[i];
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Updates the price in USD for each tier.
     * @param tierIds Array of tier enums.
     * @param tierPricesUSD Corresponding new prices in USD.
     */
    function setTierPrices(
        Tier[] memory tierIds,
        uint256[] calldata tierPricesUSD
    ) external onlyOwner {
        _updateTierPrices(tierIds, tierPricesUSD);
    }

    /**
     * @notice Updates supported payment tokens and their Chainlink price feeds.
     * @param paymentTokens Array of token addresses.
     * @param priceFeeds Corresponding Chainlink price feed addresses.
     */
    function setPaymentTokens(
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) external onlyOwner {
        _updatePaymentTokens(paymentTokens, priceFeeds);
    }

    /**
     * @notice Purchases a ticket using an ERC20 token.
     * @param paymentToken ERC20 token address used for payment.
     * @param params Parameters including recipient, seat, nonce, deadline, signature.
     */
    function payWithToken(
        address paymentToken,
        MintSignatureParams calldata params
    ) external {
        address priceFeed = paymentTokenPriceFeeds[paymentToken];
        if (priceFeed == address(0)) revert UNACCEPTABLE_PAYMENT();
        uint256 priceUSD = tierPricesInUSD[params.seat.tier];
        uint256 totalTicketPrice = convertUsdToPaymentToken(
            priceFeed,
            paymentToken,
            priceUSD
        );

        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            totalTicketPrice
        );

        IERC20(paymentToken).transferFrom(
            msg.sender,
            address(this),
            totalTicketPrice
        );

        IERC20(paymentToken).transferFrom(
            address(this),
            IConfig(config).getTreasury(),
            platformFee
        );

        _mintTicket(params);
    }

    /**
     * @notice Purchases a ticket using ETH.
     * @param params Parameters including recipient, seat, nonce, deadline, signature.
     * @dev Refunds excess ETH if sent.
     */
    function payWithETH(
        MintSignatureParams calldata params
    ) external payable nonReentrant {
        // ETH/USD feed on sepolia
        address ethUsdPriceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

        uint256 priceUSD = tierPricesInUSD[params.seat.tier];
        uint256 totalTicketPrice = convertUsdToPaymentToken(
            ethUsdPriceFeed,
            address(0),
            priceUSD
        );
        if (msg.value < totalTicketPrice) revert INSUFFICIENT_AMOUNT();
        //Refund
        bool ok;
        if (msg.value > totalTicketPrice) {
            (ok, ) = msg.sender.call{value: msg.value - totalTicketPrice}("");
            if (!ok) revert TRANSACTION_FAILED();
        }
        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            totalTicketPrice
        );
        (ok, ) = address(config.getTreasury()).call{value: platformFee}("");
        if (!ok) revert TRANSACTION_FAILED();

        _mintTicket(params);
    }

    /**
     * @notice Purchases multiple tickets in batch using an ERC20 token.
     * @param paymentToken ERC20 token address used for payment.
     * @param params Batch mint parameters including recipient, seats array, nonce, deadline, signature.
     */
    function payBatchWithToken(
        address paymentToken,
        MintBatchSignatureParams calldata params
    ) external {
        address priceFeed = paymentTokenPriceFeeds[paymentToken];
        if (priceFeed == address(0)) revert UNACCEPTABLE_PAYMENT();

        Seat[] calldata seats = params.seats;

        uint256 totalTicketPrice = _calculateTotalTicketPrice(
            priceFeed,
            paymentToken,
            seats
        );

        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            totalTicketPrice
        );

        IERC20(paymentToken).transferFrom(
            msg.sender,
            address(this),
            totalTicketPrice
        );

        address currentTreasury = IConfig(config).getTreasury();
        IERC20(paymentToken).transferFrom(
            address(this),
            currentTreasury,
            platformFee
        );

        _mintTicketBatch(params);
    }

    /**
     * @notice Purchases multiple tickets in batch using ETH.
     * @param params Batch mint parameters including recipient, seats array, nonce, deadline, signature.
     * @dev Refunds excess ETH if sent.
     */
    function payBatchWithETH(
        MintBatchSignatureParams calldata params
    ) external payable nonReentrant {
        // ETH/USD on sepolia
        address ethUsdPriceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

        Seat[] calldata seats = params.seats;

        uint256 totalTicketPrice = _calculateTotalTicketPrice(
            ethUsdPriceFeed,
            address(0),
            seats
        );

        if (msg.value < totalTicketPrice) revert INSUFFICIENT_AMOUNT();

        //Refund
        bool ok;
        if (msg.value > totalTicketPrice) {
            (ok, ) = msg.sender.call{value: msg.value - totalTicketPrice}("");
            if (!ok) revert TRANSACTION_FAILED();
        }

        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            totalTicketPrice
        );

        (ok, ) = address(config.getTreasury()).call{value: platformFee}("");
        if (!ok) revert TRANSACTION_FAILED();

        _mintTicketBatch(params);
    }

    /**
     * @dev A private function to verify signature and mint a single ticket.
     * @param params Mint parameters.
     */
    function _mintTicket(MintSignatureParams calldata params) private {
        _verify(params);
        ticket.mint(params.to, params.seat);
    }

    /**
     * @dev A private function to verify signature and mint multiple tickets.
     * @param params Batch mint parameters.
     */
    function _mintTicketBatch(
        MintBatchSignatureParams calldata params
    ) private {
        _verify(params);
        ticket.batchMint(params.to, params.seats);
    }

    /**
     * @dev A private function to verify signature validity and nonce.
     * @param to Recipient address.
     * @param nonce Expected nonce for replay protection.
     * @param deadline Signature expiration timestamp.
     * @param dataHash Hash of the signed data.
     * @param sig Signature bytes.
     */
    function _verify(
        address to,
        uint256 nonce,
        uint256 deadline,
        bytes32 dataHash,
        bytes calldata sig
    ) private {
        if (nonces[to] != nonce) revert NONCE_ALREADY_USED();
        if (block.timestamp > deadline) revert SIGNATURE_EXPIRED();
        if (_authorizedSigner != dataHash.toEthSignedMessageHash().recover(sig))
            revert INVALID_SIGNATURE();
        unchecked {
            nonces[to] = nonce + 1;
        }
    }

    /**
     * @dev Overloaded signature verification for single mint params.
     * @param params Single mint parameters.
     */
    function _verify(MintSignatureParams calldata params) private {
        address to = params.to;
        uint256 nonce = params.nonce;
        uint256 deadline = params.deadline;
        Seat calldata seat = params.seat;
        bytes32 hash = keccak256(
            abi.encode(
                to,
                seat.section,
                seat.seatNumber,
                seat.tier,
                nonce,
                deadline
            )
        );
        _verify(to, nonce, deadline, hash, params.signature);
    }

    /**
     * @dev Overloaded signature verification for batch mint params.
     * @param params Batch mint parameters.
     */
    function _verify(MintBatchSignatureParams calldata params) private {
        address to = params.to;
        uint256 nonce = params.nonce;
        uint256 deadline = params.deadline;
        Seat[] calldata seats = params.seats;
        bytes32 hash = keccak256(abi.encode(to, seats, nonce, deadline));
        _verify(to, nonce, deadline, hash, params.signature);
    }

    /**
     * @dev Retrieves latest price from Chainlink price feed.
     * @param priceFeed Address of Chainlink price feed contract.
     * @return priceInUSD Price with 8 decimals as per Chainlink feed.
     */
    function _getPriceFeed(
        address priceFeed
    ) private view returns (uint256 priceInUSD) {
        AggregatorV3Interface aggregator = AggregatorV3Interface(priceFeed);
        (, int256 answer, , , ) = aggregator.latestRoundData();
        priceInUSD = uint256(answer);
    }

    /**
     * @dev Calculates the total price in payment token for multiple seats.
     * @param priceFeed Chainlink price feed address for payment token.
     * @param paymentToken ERC20 token address (or zero for ETH).
     * @param seats Array of seats to calculate prices for.
     * @return totalTicketPrice Total price in smallest units of payment token.
     */
    function _calculateTotalTicketPrice(
        address priceFeed,
        address paymentToken,
        Seat[] calldata seats
    ) private view returns (uint256 totalTicketPrice) {
        uint256 len = seats.length;
        uint256 priceUSD;
        for (uint256 i; i < len; ) {
            priceUSD = tierPricesInUSD[seats[i].tier];
            totalTicketPrice += convertUsdToPaymentToken(
                priceFeed,
                paymentToken,
                priceUSD
            );
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Converts a USD price amount into payment token amount using Chainlink price feed.
     * @param priceFeed Chainlink price feed address.
     * @param paymentToken ERC20 token address (address(0) if ETH).
     * @param ticketPriceInUSD Price in USD with 8 decimals.
     * @return Amount in payment token smallest units.
     */
    function convertUsdToPaymentToken(
        address priceFeed,
        address paymentToken,
        uint256 ticketPriceInUSD
    ) public view returns (uint256) {
        uint8 tokenDecimals = paymentToken == address(0)
            ? 18
            : IERC20Metadata(paymentToken).decimals();
        uint256 priceInUSD = _getPriceFeed(priceFeed);
        return (ticketPriceInUSD * (10 ** tokenDecimals)) / priceInUSD;
    }
}
