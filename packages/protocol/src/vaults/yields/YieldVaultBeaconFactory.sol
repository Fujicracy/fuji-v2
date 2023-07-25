// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title YieldVaultBeaconFactory
 *
 * @author Fujidao Labs
 *
 * @notice A factory contract through which new yield vaults are created.
 */

import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";
import {IERC20, SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {VaultBeaconProxy} from "../VaultBeaconProxy.sol";
import {IBeacon} from "openzeppelin-contracts/contracts/proxy/beacon/IBeacon.sol";
import {Create2Upgradeable} from
  "openzeppelin-contracts-upgradeable/contracts/utils/Create2Upgradeable.sol";
import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {IChief} from "../../interfaces/IChief.sol";

contract YieldVaultBeaconFactory is IBeacon, VaultDeployer {
  using SafeERC20 for IERC20;
  using Strings for uint256;

  struct YVaultData {
    address asset;
    string name;
    string symbol;
    bytes32 salt;
    bytes bytecode;
  }

  /// @dev Custom Errors
  error YieldVaultFactory__deployVault_noImplementation();
  error YieldVaultFactory__setImplementation_notContract();

  /**
   * @dev Emit when a new YieldVault is deployed.
   *
   * @param vault address
   * @param asset of this vault
   * @param name  of the tokenized asset shares
   * @param symbol of the tokenized aset shares
   * @param salt distinguishing this vault
   */
  event DeployYieldVault(
    address indexed vault, address indexed asset, string name, string symbol, bytes32 salt
  );

  /**
   * @dev Emitted when the implementation returned by the beacon is changed.
   *
   * @param implementation address
   */
  event Upgraded(address indexed implementation);

  uint256 public nonce;

  address private _implementation;

  /**
   * @notice Constructor of a new {YieldVaultFactory}.
   *
   * @param chief_ address of {Chief}
   * @param implementation_ address of the master YieldVault.sol
   *
   * @dev Requirements:
   * - Must comply with {VaultDeployer} requirements.
   */
  constructor(address chief_, address implementation_) VaultDeployer(chief_) {
    _setImplementation(implementation_);
  }

  /**
   * @dev Returns the current implementation address.
   */
  function implementation() public view virtual override returns (address) {
    return _implementation;
  }

  /**
   * @notice Deploys a new {YieldVault}.
   *
   * @param deployData The encoded data containing asset and providers
   *
   * @dev Requirements:
   * - Must be called from {Chief} contract only.
   */
  function deployVault(bytes memory deployData) external onlyChief returns (address vault) {
    if (implementation() == address(0)) {
      revert YieldVaultFactory__deployVault_noImplementation();
    }

    uint256 initAssets = 1e6;

    YVaultData memory vdata;
    address futureVault;

    ///@dev Scoped section created to avoid stack too big error.
    {
      (address asset, ILendingProvider[] memory providers) =
        abi.decode(deployData, (address, ILendingProvider[]));

      // Use tx.origin because it will pull assets from EOA who originated the `Chief.deployVault(...)`.
      IERC20(asset).safeTransferFrom(tx.origin, address(this), initAssets);

      vdata.asset = asset;

      string memory assetSymbol = IERC20Metadata(asset).symbol();

      // Example of `name_`: "Fuji-V2 WETH YieldVault-1".
      vdata.name =
        string(abi.encodePacked("Fuji-V2 ", assetSymbol, " YieldVault", "-", nonce.toString()));
      // Example of `symbol_`: "fyvWETH-1".
      vdata.symbol = string(abi.encodePacked("fyv", assetSymbol, "-", nonce.toString()));

      vdata.salt = keccak256(abi.encode(deployData, nonce, block.number));

      bytes memory initCall = abi.encodeWithSignature(
        "initialize(address,address,string,string,address[])",
        vdata.asset,
        chief,
        vdata.name,
        vdata.symbol,
        providers
      );

      vdata.bytecode = abi.encodePacked(
        type(VaultBeaconProxy).creationCode, abi.encode(address(this), initCall, address(chief))
      );

      // Predict address to safeIncreaseAllowance to future vault initialization of shares.
      futureVault = Create2Upgradeable.computeAddress(vdata.salt, keccak256(vdata.bytecode));

      // Allow future vault to pull assets from factory for deployment.
      IERC20(asset).safeIncreaseAllowance(futureVault, initAssets);

      nonce++;
    }

    // Create2 Library reverts if returned address is zero.
    vault = Create2Upgradeable.deploy(0, vdata.salt, vdata.bytecode);
    require(vault == futureVault, "Addresses not equal");

    _registerVault(vault, vdata.asset, vdata.salt);

    emit DeployYieldVault(vault, vdata.asset, vdata.name, vdata.symbol, vdata.salt);

    IVault(vault).deposit(initAssets, IChief(chief).timelock());
  }

  /**
   * @dev Upgrades the beacon to a new implementation.
   *
   * Emits an {Upgraded} event.
   *
   * @dev Requirements:
   *
   * - msg.sender must be the timelock.
   * - `newImplementation` must be a contract.
   */
  function upgradeTo(address newImplementation) public virtual onlyTimelock {
    _setImplementation(newImplementation);
    emit Upgraded(newImplementation);
  }

  /**
   * @notice Sets the implementation contract address for this beacon
   *
   * @param newImplementation The new implementtion for the further proxy contracts
   * @dev Requirements:
   *
   * - `newImplementation` must be a contract.
   */

  function _setImplementation(address newImplementation) private {
    if (!Address.isContract(newImplementation)) {
      revert YieldVaultFactory__setImplementation_notContract();
    }
    _implementation = newImplementation;
  }
}
