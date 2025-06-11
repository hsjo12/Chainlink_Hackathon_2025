// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;
import {TRANSACTION_FAILED} from "../errors/Errors.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {UUPSAccessControl} from "../proxy/UUPSAccessControl.sol";
/**
 * @title Treasury
 * @notice Holds and manages fees collected from ticket sales.
 * @dev Upgradeable contract using UUPS pattern with role-based access control.
 */
contract Treasury is UUPSAccessControl {
    /**
     * @notice Initialize the contract and access control.
     * @dev Calls internal initializer from UUPSAccessControl.
     */
    function initialize() external {
        __UUpsSet_init();
    }

    /**
     * @notice Withdraw all ETH balance from the contract to a specified address.
     * @param to Recipient address for ETH withdrawal.
     * @dev Only callable by accounts with MANAGER role.
     * Reverts with TRANSACTION_FAILED error if the transfer fails.
     */
    function withdrawETH(address to) external onlyRole(MANAGER) {
        uint256 balance = address(this).balance;
        (bool ok, ) = to.call{value: balance}("");
        if (!ok) revert TRANSACTION_FAILED();
    }

    /**
     * @notice Withdraw all ERC20 tokens of a specified token contract held by this contract.
     * @param to Recipient address for token withdrawal.
     * @param token ERC20 token contract address.
     * @dev Only callable by accounts with MANAGER role.
     */
    function withdrawToken(
        address to,
        address token
    ) external onlyRole(MANAGER) {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(to, balance);
    }

    /**
     * @notice Receive function to accept ETH transfers.
     */
    receive() external payable {}
}
