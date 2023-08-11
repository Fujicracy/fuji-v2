// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Spark
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with Spark.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {AaveV3Common, IV3Pool, AaveEModeHelper} from "../AaveV3Common.sol";

contract Spark is AaveV3Common {
  /**
   * @dev Returns the {IV3Pool} pool to interact with Spark
   */
  function _getPool() internal pure override returns (IV3Pool) {
    return IV3Pool(0xC13e21B648A5Ee794902342038FF3aDAB66BE987);
  }

  ///@inheritdoc AaveV3Common
  function _getAaveEModeHelper() internal pure override returns (AaveEModeHelper) {
    return AaveEModeHelper(0xeAcb50131a46a7b8C750c03ba336f2632fDb0344);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Spark";
  }
}
