// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {BorrowingVault} from "./BorrowingVault.sol";
import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";

contract BorrowingVaultFactory is VaultDeployer {
  constructor(address _chief) VaultDeployer(_chief) {}

  function deployVault(bytes memory _deployData) external returns (address vault) {
    (address asset, address debtAsset, address oracle) =
      abi.decode(_deployData, (address, address, address));

    // @dev Salt is not actually needed since `_deployData` is part of creationCode and already contains the salt.
    bytes32 salt = keccak256(_deployData);
    vault = address(new BorrowingVault{salt: salt}(asset, debtAsset, oracle, chief, "1"));
    _registerVault(vault, asset, salt);
  }
}
