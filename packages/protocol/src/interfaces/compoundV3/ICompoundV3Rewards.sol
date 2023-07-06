// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ICompoundV3
 *
 * @author Fujidao Labs
 *
 * @notice Methods to interact with Compound V3 Rewards.
 * This interface has been reduced from the Rewards main interface.
 */
interface ICompoundV3Rewards {
  struct RewardConfig {
    address token;
    uint64 rescaleFactor;
    bool shouldUpscale;
  }

  struct RewardOwed {
    address token;
    uint256 owed;
  }

  function rewardConfig(address comet) external view returns (RewardConfig memory);

  function getRewardOwed(address comet, address account) external returns (RewardOwed memory);

  function claim(address comet, address src, bool shouldAccrue) external;

  function claimTo(address comet, address src, address to, bool shouldAccrue) external;
}
