// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Seat} from "../types/Seat.sol";
import {Tier, TierInfo} from "../types/TierInfo.sol";
import {MintSignatureParams, MintBatchSignatureParams} from "../types/MintSignature.sol";
import {LengthMismatch, ExceedsMaxSupply, UnacceptablePayment, InsufficientAmount, SeatAlreadyClaimed, TransactionFailed, LaunchpadMismatch, InvalidNonce, SignatureExpired, InvalidSignature, ZeroAddressNotAllowed} from "../errors/Errors.sol";
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
    address public ethUsdPriceFeed;

    mapping(address user => uint256 nonce) public nonces; // Maps user address to their current nonce
    mapping(Tier tier => TierInfo tierInfo) public tierInfo;

    /// @dev Tracks claimed seat numbers to prevent duplication.
    mapping(string seatNumber => bool used) public claimedSeatNumbers;

    mapping(address paymentToken => address priceFeed)
        public paymentTokenPriceFeeds;
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
     * @param tierInfoList An array of TierInfo structs for each tier, containing:
     *                     - priceUSD: Ticket price in USD with 8 decimals (following USDT standard).
     *                     - maxSupply: Maximum ticket supply for the tier.
     *                     - sold: Ignored during initialization; always reset to 0.
     * @param paymentTokens Supported payment token addresses.
     * @param priceFeeds Corresponding Chainlink price feeds for payment tokens.
     */
    function initialize(
        address owner,
        address ethUsdPriceFeed_,
        address config_,
        address ticket_,
        address authorizedSigner_,
        Tier[] memory tierIds,
        TierInfo[] calldata tierInfoList,
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) external initializer {
        __Ownable_init(owner);
        __ReentrancyGuard_init();

        if (
            ticket_ == address(0) ||
            config_ == address(0) ||
            authorizedSigner_ == address(0)
        ) revert ZeroAddressNotAllowed();
        ethUsdPriceFeed = ethUsdPriceFeed_;
        config = IConfig(config_);
        ticket = ITicket(ticket_);
        _authorizedSigner = authorizedSigner_;
        _updateTicketInfo(tierIds, tierInfoList);
        _updatePaymentTokens(paymentTokens, priceFeeds);
    }

    /**
     * @dev Updates the ticket information for each specified tier.
     * @param tierIds Array of tier enums to update.
     * @param tierInfoList Parallel array containing the new TierInfo data for each tier.
     *
     */
    function _updateTicketInfo(
        Tier[] memory tierIds,
        TierInfo[] calldata tierInfoList
    ) private {
        uint256 length = tierIds.length;
        if (length != tierInfoList.length) revert LengthMismatch();

        for (uint256 i; i < length; ) {
            TierInfo memory info = tierInfoList[i];

            tierInfo[tierIds[i]] = TierInfo({
                priceUSD: info.priceUSD,
                maxSupply: info.maxSupply,
                sold: 0,
                hasSeatNumbers: info.hasSeatNumbers
            });

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
        if (length != priceFeeds.length) revert LengthMismatch();
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
     * @param maxSupplies Corresponding new supplies.
     */
    function setTierMaxSupply(
        Tier[] memory tierIds,
        uint256[] calldata maxSupplies
    ) external onlyOwner {
        uint256 length = tierIds.length;
        if (length != maxSupplies.length) revert LengthMismatch();
        for (uint256 i; i < length; ) {
            tierInfo[tierIds[i]].maxSupply = maxSupplies[i];
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Updates the price in USD for each tier.
     * @param tierIds Array of tier enums.
     * @param tierPricesUSD Corresponding new prices in USD (decimals 8).
     */
    function setTierPrices(
        Tier[] memory tierIds,
        uint256[] calldata tierPricesUSD
    ) external onlyOwner {
        uint256 length = tierIds.length;
        if (length != tierPricesUSD.length) revert LengthMismatch();
        for (uint256 i; i < length; ) {
            tierInfo[tierIds[i]].priceUSD = tierPricesUSD[i];
            unchecked {
                i++;
            }
        }
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
        if (priceFeed == address(0)) revert UnacceptablePayment();

        uint256 ticketPrice = getPriceInToken(params.seat.tier, paymentToken);

        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            ticketPrice
        );

        IERC20(paymentToken).transferFrom(
            msg.sender,
            address(this),
            ticketPrice
        );

        IERC20(paymentToken).transfer(
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
        uint256 ticketPrice = getPriceInETH(params.seat.tier);
        if (msg.value < ticketPrice) revert InsufficientAmount();
        //Refund
        bool ok;
        if (msg.value > ticketPrice) {
            (ok, ) = msg.sender.call{value: msg.value - ticketPrice}("");
            if (!ok) revert TransactionFailed();
        }
        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            ticketPrice
        );
        (ok, ) = address(config.getTreasury()).call{value: platformFee}("");
        if (!ok) revert TransactionFailed();

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
        if (priceFeed == address(0)) revert UnacceptablePayment();

        Seat[] calldata seats = params.seats;

        uint256 totalTicketPrice = _calculateTotalTicketPriceToken(
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
        IERC20(paymentToken).transfer(currentTreasury, platformFee);

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
        Seat[] calldata seats = params.seats;

        uint256 totalTicketPrice = _calculateTotalTicketPriceETH(
            ethUsdPriceFeed,
            seats
        );

        if (msg.value < totalTicketPrice) revert InsufficientAmount();

        //Refund
        bool ok;
        if (msg.value > totalTicketPrice) {
            (ok, ) = msg.sender.call{value: msg.value - totalTicketPrice}("");
            if (!ok) revert TransactionFailed();
        }

        uint256 platformFee = IFeeManager(config.getFeeManager()).calculateFee(
            totalTicketPrice
        );

        (ok, ) = address(config.getTreasury()).call{value: platformFee}("");
        if (!ok) revert TransactionFailed();

        _mintTicketBatch(params);
    }

    /**
     * @dev A private function to verify signature and mint a single ticket.
     * @param params Mint parameters.
     */
    function _mintTicket(MintSignatureParams calldata params) private {
        Tier tier = params.seat.tier;
        string calldata seatNumber = params.seat.seatNumber;

        if (tierInfo[tier].sold + 1 > tierInfo[tier].maxSupply) {
            revert ExceedsMaxSupply();
        }

        if (tierInfo[tier].hasSeatNumbers) {
            if (claimedSeatNumbers[seatNumber]) revert SeatAlreadyClaimed();
            claimedSeatNumbers[seatNumber] = true;
        }

        _verify(params);
        ticket.mint(params.to, params.seat);
        tierInfo[tier].sold++;
    }

    /**
     * @dev A private function to verify signature and mint multiple tickets.
     * @param params Batch mint parameters.
     */
    function _mintTicketBatch(
        MintBatchSignatureParams calldata params
    ) private {
        _validateSeatAndSupply(params.seats);
        _verify(params);
        ticket.batchMint(params.to, params.seats);
    }

    /**
     * @notice Admin-only minting function for emergency or unsold ticket minting.
     * @param to Recipient address.
     * @param seats Array of seat details.
     */
    function adminMint(address to, Seat[] calldata seats) external onlyOwner {
        _validateSeatAndSupply(seats);
        ticket.batchMint(to, seats);
    }

    /**
     * @notice Validates that requested seats and supply are available before purchase.
     * @param seats Array of Seat structs, each containing `tier` and `seatNumber`.
     */
    function _validateSeatAndSupply(Seat[] calldata seats) private {
        uint256 len = seats.length;
        Tier tier;
        string calldata seatNumber;
        for (uint256 i = 0; i < len; ) {
            tier = seats[i].tier;
            seatNumber = seats[i].seatNumber;
            if (tierInfo[tier].sold + 1 > tierInfo[tier].maxSupply) {
                revert ExceedsMaxSupply();
            }
            if (tierInfo[tier].hasSeatNumbers) {
                if (claimedSeatNumbers[seatNumber]) revert SeatAlreadyClaimed();
                claimedSeatNumbers[seatNumber] = true;
            }
            tierInfo[tier].sold++;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @dev A private function to verify signature validity and nonce.
     * @param launchpad launchpad address.
     * @param to Recipient address.
     * @param nonce Expected nonce for replay protection.
     * @param deadline Signature expiration timestamp.
     * @param dataHash Hash of the signed data.
     * @param sig Signature bytes.
     */
    function _verify(
        address launchpad,
        address to,
        uint256 nonce,
        uint64 deadline,
        bytes32 dataHash,
        bytes calldata sig
    ) private {
        if (launchpad != address(this)) revert LaunchpadMismatch();
        if (nonces[to] != nonce) revert InvalidNonce();
        if (block.timestamp > deadline) revert SignatureExpired();
        if (_authorizedSigner != dataHash.toEthSignedMessageHash().recover(sig))
            revert InvalidSignature();
        unchecked {
            nonces[to] = nonce + 1;
        }
    }

    /**
     * @dev Overloaded signature verification for single mint params.
     * @param params Single mint parameters.
     */
    function _verify(MintSignatureParams calldata params) private {
        address launchpad = params.launchpad;
        address to = params.to;
        uint256 nonce = params.nonce;
        uint64 deadline = params.deadline;
        Seat calldata seat = params.seat;

        bytes32 hash = keccak256(
            abi.encode(
                launchpad,
                to,
                seat.section,
                seat.seatNumber,
                seat.tier,
                nonce,
                deadline
            )
        );

        _verify(launchpad, to, nonce, deadline, hash, params.signature);
    }

    /**
     * @dev Overloaded signature verification for batch mint params.
     * @param params Batch mint parameters.
     */
    function _verify(MintBatchSignatureParams calldata params) private {
        address launchpad = params.launchpad;
        address to = params.to;
        uint256 nonce = params.nonce;
        uint64 deadline = params.deadline;
        Seat[] calldata seats = params.seats;
        bytes32 hash = keccak256(
            abi.encode(launchpad, to, seats, nonce, deadline)
        );
        _verify(launchpad, to, nonce, deadline, hash, params.signature);
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
     * @notice Calculates the total price for multiple tickets when paying with ETH.
     * @dev Uses the ETH/USD Chainlink price feed to convert USD-denominated ticket prices into wei.
     * @param priceFeed Chainlink price feed address for ETH/USD.
     * @param seats Array of Seat structs representing the tickets to be purchased.
     * @return totalTicketPrice Total ticket price in wei.
     */
    function _calculateTotalTicketPriceETH(
        address priceFeed,
        Seat[] calldata seats
    ) private view returns (uint256 totalTicketPrice) {
        uint256 len = seats.length;
        uint256 priceInUSD = _getPriceFeed(priceFeed);

        for (uint256 i; i < len; ) {
            totalTicketPrice +=
                (tierInfo[seats[i].tier].priceUSD * 1e18) /
                priceInUSD;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Calculates the total price for multiple tickets when paying with an ERC20 token.
     * @dev Uses the provided ERC20 token's Chainlink price feed to convert USD-denominated ticket prices into token amounts.
     * @param priceFeed Chainlink price feed address for the ERC20 token/USD pair.
     * @param paymentToken ERC20 token address used for payment.
     * @param seats Array of Seat structs representing the tickets to be purchased.
     * @return totalTicketPrice Total ticket price in the smallest units of the ERC20 token.
     */
    function _calculateTotalTicketPriceToken(
        address priceFeed,
        address paymentToken,
        Seat[] calldata seats
    ) private view returns (uint256 totalTicketPrice) {
        uint256 len = seats.length;
        uint8 tokenDecimals = IERC20Metadata(paymentToken).decimals();
        uint256 priceInUSD = _getPriceFeed(priceFeed);

        for (uint256 i; i < len; ) {
            totalTicketPrice +=
                (tierInfo[seats[i].tier].priceUSD * (10 ** tokenDecimals)) /
                priceInUSD;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Returns the ticket price for a given tier denominated in ETH (wei).
     * @param tier The ticket Tier enum for which to fetch the price.
     * @return priceInETH The ticket price in wei, calculated from the USD price using the ETH/USD Chainlink feed.
     * @dev Uses the stored `priceUSD` (8 decimals) for the tier and divides by the latest ETH/USD price (8 decimals),
     *      scaling by 10^18 to convert to wei.
     */
    function getPriceInETH(Tier tier) public view returns (uint256) {
        uint256 priceInUSD = _getPriceFeed(ethUsdPriceFeed);
        return (tierInfo[tier].priceUSD * (10 ** 18)) / priceInUSD;
    }

    /**
     * @notice Returns the ticket price for a given tier denominated in an ERC20 payment token.
     * @param tier The ticket Tier enum for which to fetch the price.
     * @param paymentToken The ERC20 token address used for payment.
     * @return priceInToken The ticket price in the smallest unit of the payment token.
     * @dev Fetches the token’s decimal count, retrieves the latest USD price for the token via its Chainlink feed,
     *      then scales the tier’s USD price (8 decimals) by 10^tokenDecimals and divides by the feed price (8 decimals).
     */
    function getPriceInToken(
        Tier tier,
        address paymentToken
    ) public view returns (uint256) {
        uint8 tokenDecimals = IERC20Metadata(paymentToken).decimals();
        address tokenPriceFeed = paymentTokenPriceFeeds[paymentToken];
        uint256 priceInUSD = _getPriceFeed(tokenPriceFeed);
        return (tierInfo[tier].priceUSD * (10 ** tokenDecimals)) / priceInUSD;
    }

    /**
     * @notice Withdraw all ETH balance from the contract to a specified address.
     * @param to Recipient address for ETH withdrawal.
     */
    function withdrawETH(address to) external onlyOwner {
        uint256 balance = address(this).balance;
        (bool ok, ) = to.call{value: balance}("");
        if (!ok) revert TransactionFailed();
    }

    /**
     * @notice Withdraw all ERC20 tokens of a specified token contract held by this contract.
     * @param to Recipient address for token withdrawal.
     * @param token ERC20 token contract address.
     */
    function withdrawToken(address to, address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(to, balance);
    }
}
