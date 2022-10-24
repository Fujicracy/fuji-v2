// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {YieldVault} from "./YieldVault.sol";
import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract YieldVaultFactory is VaultDeployer {
  uint256 public nonce;

  constructor(address _chief) VaultDeployer(_chief) {}

  function deployVault(bytes memory _deployData) external onlyChief returns (address vault) {
    (address asset) = abi.decode(_deployData, (address));

    string memory assetName = IERC20Metadata(asset).name();
    string memory assetSymbol = IERC20Metadata(asset).symbol();

    // name_, ex: Fuji-V2 Dai Stablecoin YieldVault Shares
    string memory name = string(abi.encodePacked("Fuji-V2 ", assetName, " YieldVault Shares"));
    // symbol_, ex: fyvDAI
    string memory symbol = string(abi.encodePacked("fyv", assetSymbol));

    bytes32 salt = keccak256(abi.encode(_deployData, nonce));
    nonce++;
    vault = address(new YieldVault{salt: salt}(asset, chief, name, symbol));
    _registerVault(vault, asset, salt);
  }
}
