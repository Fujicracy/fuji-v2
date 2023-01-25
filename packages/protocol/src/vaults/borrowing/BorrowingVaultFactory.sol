// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BorrowingVaultFactory
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
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";

contract BorrowingVaultFactory is VaultDeployer {
  /// @dev Custom Errors
  error BorrowingVaultFactory__deployVault_failed();

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
   * @notice Constructor of a new {YieldVaultFactory}.
   * Requirements:
   * - Must comply with {VaultDeployer} requirements.
   *
   * @param chief_ address of {Chief}
   */
  constructor(address chief_) VaultDeployer(chief_) {}

  /**
   * @notice Deploys a new {BorrowingVault}.
   * Requirements:
   * - Must be called from {Chief} contract only.
   *
   * @param deployData The encoded data containing asset, debtAsset, oracle and providers
   */
  function deployVault(bytes memory deployData) external onlyChief returns (address vault) {
    (address asset, address debtAsset, address oracle, ILendingProvider[] memory providers) =
      abi.decode(deployData, (address, address, address, ILendingProvider[]));

    string memory assetSymbol = IERC20Metadata(asset).symbol();
    string memory debtSymbol = IERC20Metadata(debtAsset).symbol();

    // Example of `name_`: "Fuji-V2 WETH-DAI BorrowingVault".
    string memory name =
      string(abi.encodePacked("Fuji-V2 ", assetSymbol, "-", debtSymbol, " BorrowingVault"));
    // Example of `symbol_`: "fbvWETHDAI".
    string memory symbol = string(abi.encodePacked("fbv", assetSymbol, debtSymbol));

    bytes32 salt = keccak256(abi.encode(deployData, nonce));
    nonce++;

    bytes memory creationCode =
      LibBytes.concat(LibSSTORE2.read(_creationAddress1), LibSSTORE2.read(_creationAddress2));

    bytes memory bytecode = abi.encodePacked(
      creationCode, abi.encode(asset, debtAsset, oracle, chief, name, symbol, providers)
    );

    assembly {
      vault := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }
    if (vault == address(0)) revert BorrowingVaultFactory__deployVault_failed();

    _registerVault(vault, asset, salt);

    emit DeployBorrowingVault(vault, asset, debtAsset, name, symbol, salt);
  }

  /**
   * @notice Sets the bytecode for the BorrowingVault.
   *
   * @param creationCode The creationCode for the vault contracts
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
