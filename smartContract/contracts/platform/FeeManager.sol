// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {UUPSAccessControl} from "../proxy/UUPSAccessControl.sol";

/**
 * @title FeeManager
 * @notice Manages a fee rate and calculates fees based on the rate.
 * @dev Uses UUPS upgradeable pattern with role-based access control.
 */
contract FeeManager is UUPSAccessControl {
    // keccak256(abi.encode(uint256(keccak256("FEE_MANAGER_LOCATION")) - 1));
    bytes32 constant FEE_MANAGER_LOCATION =
        0x0883a0a917fea80562573e6afe782216fbb17a54ede6c467a2e8aaeadf791bda;
    uint256 constant BPS = 10_000;

    /**
     * @dev Storage layout for the FeeManager contract.
     */
    struct FeeManagerStorage {
        uint256 feeRate;
    }

    function _getFeeManagerLocation()
        internal
        pure
        returns (FeeManagerStorage storage $)
    {
        assembly {
            $.slot := FEE_MANAGER_LOCATION
        }
    }

    /**
     * @notice Initializes the FeeManager with the given fee rate.
     * @dev This function can only be called once due to the initializer modifier.
     * @param feeRate The fee rate in basis points (BPS). (e.g., 100 = 1%)
     */
    function initialize(uint256 feeRate) external initializer {
        __UUpsSet_init();
        FeeManagerStorage storage $ = _getFeeManagerLocation();
        $.feeRate = feeRate;
    }

    /**
     * @notice Set the fee rate in basis points.
     * @param rate Fee rate to set (in BPS).
     * @dev Only callable by addresses with MANAGER role.
     */
    function setFeeRate(uint256 rate) external onlyRole(MANAGER) {
        FeeManagerStorage storage $ = _getFeeManagerLocation();
        $.feeRate = rate;
    }

    /**
     * @notice Get the current fee rate.
     * @return The fee rate in basis points.
     */
    function getFeeRate() external view returns (uint256) {
        FeeManagerStorage storage $ = _getFeeManagerLocation();
        return $.feeRate;
    }

    /**
     * @notice Calculates the fee for a given amount based on the current fee rate.
     * @dev Used to find out how much fee is taken when selling tickets.
     * @param amount The amount on which the fee is to be calculated.
     * @return The calculated fee amount.
     */
    function calculateFee(uint256 amount) public view returns (uint256) {
        FeeManagerStorage storage $ = _getFeeManagerLocation();
        return (amount * $.feeRate) / BPS;
    }
}
