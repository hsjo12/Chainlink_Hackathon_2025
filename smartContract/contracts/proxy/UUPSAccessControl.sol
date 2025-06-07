// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title UUPSAccessControl
 * @notice Combines UUPSUpgradeable and AccessControlUpgradeable into a single reusable base contract.
 */
abstract contract UUPSAccessControl is
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    /**
     * @notice Only this role can upgrade contracts
     * @dev keccak256("UPGRADER")
     */
    bytes32 constant UPGRADER =
        0xa615a8afb6fffcb8c6809ac0997b5c9c12b8cc97651150f14c8f6203168cff4c;

    /**
     * @notice Only this role can interact with set up functions
     * @dev keccak256("MANAGER")
     */
    bytes32 constant MANAGER =
        0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;

    /// @dev Disables initializers to prevent the implementation contract from being initialized and potentially hijacked.
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes UUPS upgradeability and role-based access control.
     * @dev Call this within the proxy-based contract’s initializer to:
     *      1. Initialize AccessControlUpgradeable.
     *      2. Initialize UUPSUpgradeable.
     *      3. Grant DEFAULT_ADMIN_ROLE, UPGRADER, and MANAGER to msg.sender.
     */
    function __UUpsSet_init() internal onlyInitializing {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER, msg.sender);
        _grantRole(MANAGER, msg.sender);
    }

    /**
     * @notice Returns the current implementation contract address.
     * @return The address of the current implementation contract.
     */
    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER) {}
}
