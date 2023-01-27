// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title YieldVaultFactory
 *
 * @author Fujidao Labs
 *
 * @notice A factory contract through which new yield vaults are created.
 */

import {YieldVault} from "./YieldVault.sol";
import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";

contract YieldVaultFactory is VaultDeployer {
  uint256 public nonce;

  /**
   * @notice Constructor of a new {YieldVaultFactory}.
   *
   * @param chief_ address of {Chief}
   *
   * @dev Requirements:
   * - Must comply with {VaultDeployer} requirements.
   */
  constructor(address chief_) VaultDeployer(chief_) {}

  /**
   * @notice Deploys a new {YieldVault}.
   *
   * @param deployData The encoded data containing asset and providers
   *
   * @dev Requirements:
   * - Must be called from {Chief} contract only.
   */
  function deployVault(bytes memory deployData) external onlyChief returns (address vault) {
    (address asset, ILendingProvider[] memory providers) =
      abi.decode(deployData, (address, ILendingProvider[]));

    string memory assetName = IERC20Metadata(asset).name();
    string memory assetSymbol = IERC20Metadata(asset).symbol();

    // Example of `name_`: "Fuji-V2 Dai Stablecoin YieldVault".
    string memory name = string(abi.encodePacked("Fuji-V2 ", assetName, " YieldVault Shares"));
    // Example of `symbol_`: "fyvDAI".
    string memory symbol = string(abi.encodePacked("fyv", assetSymbol));

    bytes32 salt = keccak256(abi.encode(deployData, nonce));
    nonce++;
    vault = address(new YieldVault{salt: salt}(asset, chief, name, symbol, providers));
    _registerVault(vault, asset, salt);
  }
}
