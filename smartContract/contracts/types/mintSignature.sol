// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import {Seat} from "./Seat.sol";

/**
 * @dev Parameters required for minting a single ticket with an off-chain signature.
 */
struct MintSignatureParams {
    address to; // Recipient address of the minted ticket
    Seat seat; // Seat details to be minted
    uint256 nonce; // Unique nonce to prevent replay attacks
    uint256 deadline; // Expiration timestamp for the signature
    bytes signature; // Off-chain signature authorizing the mint
}

/**
 * @dev Parameters required for minting multiple tickets in a batch with a single off-chain signature.
 */
struct MintBatchSignatureParams {
    address to; // Recipient address of the minted tickets
    Seat[] seats; // Array of seat details to be minted
    uint256 nonce; // Unique nonce to prevent replay attacks
    uint256 deadline; // Expiration timestamp for the signature
    bytes signature; // Off-chain signature authorizing the batch mint
}
