// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IV3Pool {
  struct ReserveConfigurationMap {
  //bit 0-15: LTV
  //bit 16-31: Liq. threshold
  //bit 32-47: Liq. bonus
  //bit 48-55: Decimals
  //bit 56: reserve is active
  //bit 57: reserve is frozen
  //bit 58: borrowing is enabled
  //bit 59: stable rate borrowing enabled
  //bit 60: asset is paused
  //bit 61: borrowing in isolation mode is enabled
  //bit 62-63: reserved
  //bit 64-79: reserve factor
  //bit 80-115 borrow cap in whole tokens, borrowCap == 0 => no cap
  //bit 116-151 supply cap in whole tokens, supplyCap == 0 => no cap
  //bit 152-167 liquidation protocol fee
  //bit 168-175 eMode category
  //bit 176-211 unbacked mint cap in whole tokens, unbackedMintCap == 0 => minting disabled
  //bit 212-251 debt ceiling for isolation mode with (ReserveConfiguration::DEBT_CEILING_DECIMALS) decimals
  //bit 252-255 unused
    uint256 data;
  }

  struct ReserveData {
  //stores the reserve configuration
    ReserveConfigurationMap configuration;
    //the liquidity index. Expressed in ray
    uint128 liquidityIndex;
    //the current supply rate. Expressed in ray
    uint128 currentLiquidityRate;
    //variable borrow index. Expressed in ray
    uint128 variableBorrowIndex;
    //the current variable borrow rate. Expressed in ray
    uint128 currentVariableBorrowRate;
    //the current stable borrow rate. Expressed in ray
    uint128 currentStableBorrowRate;
    //timestamp of last update
    uint40 lastUpdateTimestamp;
    //the id of the reserve. Represents the position in the list of the active reserves
    uint16 id;
    //aToken address
    address aTokenAddress;
    //stableDebtToken address
    address stableDebtTokenAddress;
    //variableDebtToken address
    address variableDebtTokenAddress;
    //address of the interest rate strategy
    address interestRateStrategyAddress;
    //the current treasury balance, scaled
    uint128 accruedToTreasury;
    //the outstanding unbacked aTokens minted through the bridging feature
    uint128 unbacked;
    //the outstanding debt borrowed against this asset in isolation mode
    uint128 isolationModeTotalDebt;
  }

  function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

  function withdraw(address asset, uint256 amount, address to) external returns (uint256);

  function borrow(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    uint16 referralCode,
    address onBehalfOf
  )
    external;

  function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf)
    external
    returns (uint256);

  function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external;

  function flashLoanSimple(
    address receiverAddress,
    address asset,
    uint256 amount,
    bytes calldata params,
    uint16 referralCode
  )
    external;

  function getReserveData(address asset) external view returns (ReserveData memory);
}
