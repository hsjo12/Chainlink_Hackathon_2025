// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {UUPSAccessControl} from "../proxy/UUPSAccessControl.sol";

/**
 * @title OrganizerRegistry
 * @notice Manages the list of approved event organizers who are allowed to create Ticket and TicketLaunchpad contracts.
 * @dev Uses UUPS upgradeable pattern with role-based access control.
 */
contract OrganizerRegistry is UUPSAccessControl {
    // keccak256(abi.encode(uint256(keccak256("ORGANIZER_REGISTRY_LOCATION")) - 1));
    bytes32 private constant ORGANIZER_REGISTRY_LOCATION =
        0x0e34be40f780293d810dbdc2a3771f1f7831fadb0251836c9fa67a6d52f2f3e7;

    /**
     * @dev Storage layout for the OrganizerRegistry contract.
     */
    struct OrganizerRegistryStorage {
        mapping(address => bool) isOrganizer; // Mapping of organizer address to approval status (true = approved)
    }

    /**
     * @notice Initialize the contract and access control.
     * @dev Calls internal initializer from UUPSAccessControl.
     */
    function initialize() external initializer {
        __UUpsSet_init();
    }

    function _getOrganizerRegistryLocation()
        internal
        pure
        returns (OrganizerRegistryStorage storage $)
    {
        assembly {
            $.slot := ORGANIZER_REGISTRY_LOCATION
        }
    }

    /**
     * @notice Sets the organizer approval status.
     * @dev Only accounts with MANAGER role can call this function.
     * @param organizer The address of the organizer to update.
     * @param approved True to approve the organizer, false to revoke approval.
     */
    function setOrganizer(
        address organizer,
        bool approved
    ) external onlyRole(MANAGER) {
        OrganizerRegistryStorage storage $ = _getOrganizerRegistryLocation();
        $.isOrganizer[organizer] = approved;
    }

    /**
     * @notice Checks if an address is an approved organizer.
     * @param user The address to check.
     * @return True if the address is an approved organizer, false otherwise.
     */
    function checkOrganizer(address user) external view returns (bool) {
        OrganizerRegistryStorage storage $ = _getOrganizerRegistryLocation();
        return $.isOrganizer[user];
    }
}
