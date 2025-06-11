// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {UUPSAccessControl} from "../proxy/UUPSAccessControl.sol";

/**
 * @title Config
 * @notice Stores global configuration addresses such as FeeManager and Treasury contracts.
 * @dev Uses UUPS upgradeable pattern with access control.
 */
contract Config is UUPSAccessControl {
    // keccak256(abi.encode(uint256(keccak256("CONFIG_LOCATION")) - 1));
    bytes32 private constant CONFIG_LOCATION =
        0x0883a0a917fea80562573e6afe782216fbb17a54ede6c467a2e8aaeadf791bda;

    /**
     * @dev Storage layout for the Config contract.
     */
    struct ConfigStorage {
        address feeManager;
        address treasury;
    }

    function _getConfigLocation()
        internal
        pure
        returns (ConfigStorage storage $)
    {
        assembly {
            $.slot := CONFIG_LOCATION
        }
    }

    /**
     * @notice Initializes the Config contract with FeeManager and Treasury addresses.
     * @param feeManager Address of the FeeManager contract.
     * @param treasury Address of the Treasury contract.
     */
    function initialize(
        address feeManager,
        address treasury
    ) external initializer {
        ConfigStorage storage $ = _getConfigLocation();
        $.feeManager = feeManager;
        $.treasury = treasury;
    }

    /**
     * @notice Sets the FeeManager contract address.
     * @param feeManager The new FeeManager contract address.
     */
    function setFeeManager(address feeManager) external onlyRole(MANAGER) {
        ConfigStorage storage $ = _getConfigLocation();
        $.feeManager = feeManager;
    }

    /**
     * @notice Sets the Treasury contract address.
     * @param treasury The new Treasury contract address.
     */
    function setTreasury(address treasury) external onlyRole(MANAGER) {
        ConfigStorage storage $ = _getConfigLocation();
        $.treasury = treasury;
    }

    /**
     * @notice Returns the current FeeManager contract address.
     * @return The address of the FeeManager contract.
     */
    function getFeeManager() external view returns (address) {
        ConfigStorage storage $ = _getConfigLocation();
        return $.feeManager;
    }

    /**
     * @notice Returns the current Treasury contract address.
     * @return The address of the Treasury contract.
     */
    function getTreasury() external view returns (address) {
        ConfigStorage storage $ = _getConfigLocation();
        return $.treasury;
    }
}
