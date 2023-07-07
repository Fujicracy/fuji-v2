// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BorrowingVaultFactory
 *
 * @author Fujidao Labs
 *
 * @notice A factory contract through which new borrowing vaults are created.
 * This vault factory deploys (OZ implementation) ERC1967Proxies that
 * point to `masterImplementation` state variable as the targe
 * implementation of the proxy.
 */

import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC20, SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Create2Upgradeable} from
  "openzeppelin-contracts-upgradeable/contracts/utils/Create2Upgradeable.sol";

contract BorrowingVaultFactoryProxy is VaultDeployer {
  using SafeERC20 for IERC20;

  struct BVaultData {
    address asset;
    address debtAsset;
    string name;
    string symbol;
    bytes32 salt;
    bytes bytecode;
  }

  /// @dev Custom Errors
  error BorrowingVaultFactory__deployVault_noMasterImplementation();

  /**
   * @dev Emit when a new BorrowingVault is deployed.
   *
   * @param vault address
   * @param asset of this vault
   * @param debtAsset of this vault
   * @param name  of the tokenized asset shares
   * @param symbol of the tokenized aset shares
   * @param salt distinguishing this vault
   */
  event DeployBorrowingVault(
    address indexed vault,
    address indexed asset,
    address indexed debtAsset,
    string name,
    string symbol,
    bytes32 salt
  );

  /**
   * @dev Emit when `masterImplementation` address changes.
   *
   * @param implementation new address
   */
  event NewMasterImplementation(address implementation);

  uint256 public nonce;

  address public masterImplementation;

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
    if (masterImplementation == address(0)) {
      revert BorrowingVaultFactory__deployVault_noMasterImplementation();
    }

    uint256 initAssets = 1e6;

    BVaultData memory vdata;
    address futureVault;

    ///@dev Scoped section created to avoid stack too big error.
    {
      (address asset, address debtAsset, ILendingProvider[] memory providers) =
        abi.decode(deployData, (address, address, ILendingProvider[]));

      // Use tx.origin because it will pull assets from EOA who originated the `Chief.deployVault(...)`.
      IERC20(asset).safeTransferFrom(tx.origin, address(this), initAssets);

      vdata.asset = asset;
      vdata.debtAsset = debtAsset;

      string memory assetSymbol = IERC20Metadata(asset).symbol();
      string memory debtSymbol = IERC20Metadata(debtAsset).symbol();

      // Example of `name_`: "Fuji-V2 WETH-DAI BorrowingVault-1".
      vdata.name = string(
        abi.encodePacked("Fuji-V2 ", assetSymbol, "-", debtSymbol, " BorrowingVault", "-", nonce)
      );
      // Example of `symbol_`: "fbvWETHDAI-1".
      vdata.symbol = string(abi.encodePacked("fbv", assetSymbol, debtSymbol, "-", nonce));

      vdata.salt = keccak256(abi.encode(deployData, nonce, block.number));

      bytes memory initCall = abi.encodeWithSignature(
        "initialize(address,address,address,string,string,ILendingProvider[],uint256)",
        vdata.asset,
        vdata.debtAsset,
        chief,
        vdata.name,
        vdata.symbol,
        providers,
        initAssets
      );

      vdata.bytecode = abi.encodePacked(
        type(ERC1967Proxy).creationCode, abi.encode(masterImplementation, initCall)
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

    emit DeployBorrowingVault(
      vault, vdata.asset, vdata.debtAsset, vdata.name, vdata.symbol, vdata.salt
    );
  }

  /**
   * @notice Sets the implementation for further deployments of BorrowingVault proxies.
   * NOTE: This function DOES NOT upgrade previously deployed proxies.
   *
   * @param newMaster The new implementtion for the further proxy contracts
   *
   * @dev Requirements:
   * - Must be called from a timelock.
   * - Must allow to set address(0) if further proxy deployments shoudl be blocked.
   */
  function setMasterImplementation(address newMaster) external onlyTimelock {
    masterImplementation = newMaster;
    emit NewMasterImplementation(newMaster);
  }
}
