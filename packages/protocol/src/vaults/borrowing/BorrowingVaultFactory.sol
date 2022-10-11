// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {BorrowingVault} from "./BorrowingVault.sol";
import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "forge-std/console.sol";

contract BorrowingVaultFactory is VaultDeployer {
  constructor(address _chief) VaultDeployer(_chief) {}

  function deployVault(bytes memory _deployData) external returns (address vault) {
    // TODO add access restriction
    (address asset, address debtAsset, address oracle) =
      abi.decode(_deployData, (address, address, address));

    string memory assetName = IERC20Metadata(asset).name();
    string memory assetSymbol = IERC20Metadata(asset).symbol();

    // name_, ex: Fuji-V2 Dai Stablecoin Vault Shares
    string memory name = string(abi.encodePacked("Fuji-V2 ", assetName, " BorrowingVault Shares"));
    // symbol_, ex: fvbDAI
    string memory symbol = string(abi.encodePacked("fbv", assetSymbol));

    // @dev Salt is not actually needed since `_deployData` is part of creationCode and already contains the salt.
    bytes32 salt = keccak256(_deployData);
    vault = address(new BorrowingVault{salt: salt}(asset, debtAsset, oracle, chief, name, symbol));
    _registerVault(vault, asset, salt);
  }
}
