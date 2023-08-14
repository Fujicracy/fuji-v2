// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title AaveV3Optimism
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with AaveV3.
 */

import {AaveV3Common, IV3Pool, AaveEModeHelper} from "../AaveV3Common.sol";

contract AaveV3Optimism is AaveV3Common {
  ///@inheritdoc AaveV3Common

  function _getPool() internal pure override returns (IV3Pool) {
    return IV3Pool(0x794a61358D6845594F94dc1DB02A252b5b4814aD);
  }

  ///@inheritdoc AaveV3Common
  function _getAaveEModeHelper() internal pure override returns (AaveEModeHelper) {
    return AaveEModeHelper(0x1085BAa80b2BfB2f0E55822Ce2F547D95aeAe7a4);
  }

  ///@inheritdoc AaveV3Common
  function providerName() public pure override returns (string memory) {
    return "Aave_V3_Optimism";
  }
}
