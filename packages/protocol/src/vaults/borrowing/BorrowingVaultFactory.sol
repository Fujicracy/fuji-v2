// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {BorrowingVault} from "./BorrowingVault.sol";
import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract BorrowingVaultFactory is VaultDeployer {
  uint256 public nonce;

  constructor(address _chief) VaultDeployer(_chief) {}

  function deployVault(bytes memory _deployData) external onlyChief returns (address vault) {
    (address asset, address debtAsset, address oracle) =
      abi.decode(_deployData, (address, address, address));

    string memory assetName = IERC20Metadata(asset).name();
    string memory assetSymbol = IERC20Metadata(asset).symbol();

    // name_, ex: Fuji-V2 Dai Stablecoin BorrowingVault Shares
    string memory name = string(abi.encodePacked("Fuji-V2 ", assetName, " BorrowingVault Shares"));
    // symbol_, ex: fbvDAI
    string memory symbol = string(abi.encodePacked("fbv", assetSymbol));

    bytes32 salt = keccak256(abi.encode(_deployData, nonce));
    nonce++;
    vault = address(new BorrowingVault{salt: salt}(asset, debtAsset, oracle, chief, name, symbol));
    _registerVault(vault, asset, salt);
  }
}
