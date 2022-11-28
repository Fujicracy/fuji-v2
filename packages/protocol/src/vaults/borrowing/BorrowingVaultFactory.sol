// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {VaultDeployer} from "../../abstracts/VaultDeployer.sol";
import {LibSSTORE2} from "../../libraries/LibSSTORE2.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract BorrowingVaultFactory is VaultDeployer {
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

  address public creationAddress;

  constructor(address _chief) VaultDeployer(_chief) {}

  /**
   * Deploys a new "BorrowingVault".
   * @param deployData The encoded data containing asset, debtAsset and oracle.
   */
  function deployVault(bytes memory deployData) external onlyChief returns (address vault) {
    (address asset, address debtAsset, address oracle) =
      abi.decode(deployData, (address, address, address));

    string memory assetSymbol = IERC20Metadata(asset).symbol();
    string memory debtSymbol = IERC20Metadata(debtAsset).symbol();

    // name_, ex: Fuji-V2 WETH-DAI BorrowingVault
    string memory name =
      string(abi.encodePacked("Fuji-V2 ", assetSymbol, "-", debtSymbol, " BorrowingVault"));
    // symbol_, ex: fbvWETHDAI
    string memory symbol = string(abi.encodePacked("fbv", assetSymbol, debtSymbol));

    bytes32 salt = keccak256(abi.encode(deployData, nonce));
    nonce++;

    bytes memory bytecode = abi.encodePacked(
      LibSSTORE2.read(creationAddress), abi.encode(asset, debtAsset, oracle, chief, name, symbol)
    );

    assembly {
      vault := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }
    if (vault == address(0)) revert BorrowingVaultFactory__deployVault_failed();

    _registerVault(vault, asset, salt);

    emit DeployBorrowingVault(vault, asset, debtAsset, name, symbol, salt);
  }

  /**
   * Sets the bytecode for the BorrowingVault.
   * @param creationCode The creationCode for the vault contract.
   */
  function setContractCode(bytes calldata creationCode) external onlyTimelock {
    creationAddress = LibSSTORE2.write(creationCode);
  }
}
