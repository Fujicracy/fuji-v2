// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BorrowingVaultFactory
 *
 * @author Fujidao Labs
 *
 * @notice A factory contract through which new borrowing vaults are created.
 * The BorrowingVault contract is quite big in size. Creating new instances of it with
 * `new BorrowingVault()` makes the factory contract exceed the 24K limit. That's why
 * we use an approach found at Fraxlend. We split and store the BorrowingVault bytecode
 * in two different locations and when used they get concatanated and deployed by using assembly.
 * ref: https://github.com/FraxFinance/fraxlend/blob/main/src/contracts/FraxlendPairDeployer.sol
 */

import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {LibSSTORE2} from "../../libraries/LibSSTORE2.sol";
import {LibBytes} from "../../libraries/LibBytes.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract BorrowingVaultFactory2 is VaultDeployer {
  struct BVaultData {
    bytes bytecode;
    address asset;
    address debtAsset;
    string name;
    string symbol;
    bytes32 salt;
  }

  /// @dev Custom Errors
  error BorrowingVaultFactory__deployVault_failed();
  error BorrowingVaultFactory__deployVault_noContractCode();

  event DeployBorrowingVault(
    address indexed vault,
    address indexed asset,
    address indexed debtAsset,
    string name,
    string symbol,
    bytes32 salt
  );

  uint256 public nonce;

  address private _creationAddress1;
  address private _creationAddress2;

  /**
   * @notice Constructor of a new {BorrowingVaultFactory}.
   *
   * @param chief_ address of {Chief}
   *
   * @dev Requirements:
   * - Must comply with {VaultDeployer} requirements.
   */
  constructor(address chief_) VaultDeployer(chief_) {}

  /**
   * @notice Deploys a new {BorrowingVault}.
   *
   * @param deployData The encoded data containing asset, debtAsset, oracle and providers
   *
   * @dev Requirements:
   * - Must be called from {Chief} contract only.
   */
  function deployVault(bytes memory deployData) external onlyChief returns (address vault) {
    BVaultData memory vdata;
    ///@dev Scoped section created to avoid stack too big error.
    {
      (address asset, address debtAsset) = abi.decode(deployData, (address, address));

      vdata.asset = asset;
      vdata.debtAsset = debtAsset;

      string memory assetSymbol = IERC20Metadata(asset).symbol();
      string memory debtSymbol = IERC20Metadata(debtAsset).symbol();

      // Example of `name_`: "Fuji-V2 WETH-DAI BorrowingVault".
      vdata.name =
        string(abi.encodePacked("Fuji-V2 ", assetSymbol, "-", debtSymbol, " BorrowingVault"));
      // Example of `symbol_`: "fbvWETHDAI".
      vdata.symbol = string(abi.encodePacked("fbv", assetSymbol, debtSymbol));

      vdata.salt = keccak256(abi.encode(deployData, nonce));
      nonce++;

      bytes memory creationCode =
        LibBytes.concat(LibSSTORE2.read(_creationAddress1), LibSSTORE2.read(_creationAddress2));

      if (creationCode.length == 0) revert BorrowingVaultFactory__deployVault_noContractCode();

      vdata.bytecode = abi.encodePacked(
        creationCode, abi.encode(asset, debtAsset, chief, vdata.name, vdata.symbol)
      );
    }

    bytes32 salt_ = vdata.salt;
    bytes memory bytecode_ = vdata.bytecode;

    assembly {
      vault := create2(0, add(bytecode_, 32), mload(bytecode_), salt_)
    }
    if (vault == address(0)) revert BorrowingVaultFactory__deployVault_failed();

    _registerVault(vault, vdata.asset, vdata.salt);

    emit DeployBorrowingVault(
      vault, vdata.asset, vdata.debtAsset, vdata.name, vdata.symbol, vdata.salt
    );
  }

  /**
   * @notice Gets the bytecode for the BorrowingVault.
   *
   */
  function getContractCode() external view returns (bytes memory creationCode) {
    creationCode =
      LibBytes.concat(LibSSTORE2.read(_creationAddress1), LibSSTORE2.read(_creationAddress2));
  }

  /**
   * @notice Sets the bytecode for the BorrowingVault.
   *
   * @param creationCode The creationCode for the vault contracts
   *
   * @dev Requirements:
   * - Must be called from a timelock.
   */
  function setContractCode(bytes calldata creationCode) external onlyTimelock {
    bytes memory firstHalf = LibBytes.slice(creationCode, 0, 13000);
    _creationAddress1 = LibSSTORE2.write(firstHalf);
    if (creationCode.length > 13000) {
      bytes memory secondHalf = LibBytes.slice(creationCode, 13000, creationCode.length - 13000);
      _creationAddress2 = LibSSTORE2.write(secondHalf);
    }
  }
}
