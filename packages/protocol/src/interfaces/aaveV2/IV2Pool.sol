// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IV2Pool {
  struct ReserveConfigurationMap {
    //bit 0-15: LTV
    //bit 16-31: Liq. threshold
    //bit 32-47: Liq. bonus
    //bit 48-55: Decimals
    //bit 56: Reserve is active
    //bit 57: reserve is frozen
    //bit 58: borrowing is enabled
    //bit 59: stable rate borrowing enabled
    //bit 60-63: reserved
    //bit 64-79: reserve factor
    uint256 data;
  }

  struct ReserveData {
    //stores the reserve configuration
    ReserveConfigurationMap configuration;
    //the liquidity index. Expressed in ray
    uint128 liquidityIndex;
    //variable borrow index. Expressed in ray
    uint128 variableBorrowIndex;
    //the current supply rate. Expressed in ray
    uint128 currentLiquidityRate;
    //the current variable borrow rate. Expressed in ray
    uint128 currentVariableBorrowRate;
    //the current stable borrow rate. Expressed in ray
    uint128 currentStableBorrowRate;
    uint40 lastUpdateTimestamp;
    //tokens addresses
    address aTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    //address of the interest rate strategy
    address interestRateStrategyAddress;
    //the id of the reserve. Represents the position in the list of the active reserves
    uint8 id;
  }

  function flashLoan(
    address receiverAddress,
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata modes,
    address onBehalfOf,
    bytes calldata params,
    uint16 referralCode
  )
    external;

  function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128);

  function deposit(
    address _asset,
    uint256 _amount,
    address _onBehalfOf,
    uint16 _referralCode
  )
    external;

  function withdraw(address _asset, uint256 _amount, address _to) external;

  function borrow(
    address _asset,
    uint256 _amount,
    uint256 _interestRateMode,
    uint16 _referralCode,
    address _onBehalfOf
  )
    external;

  function repay(address _asset, uint256 _amount, uint256 _rateMode, address _onBehalfOf) external;

  function setUserUseReserveAsCollateral(address _asset, bool _useAsCollateral) external;

  function getReserveData(address asset) external view returns (ReserveData memory);
}
