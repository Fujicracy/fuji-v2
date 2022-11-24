// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IVault} from "../interfaces/IVault.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract MockRebalancerManager {
  // custom errors
  error RebalancerManager__checkAssetsAmount_invalidAmount();
  error RebalancerManager__checkDebtAmount_invalidAmount();
  error RebalancerManager__getFlashloan_flashloanFailed();
  error RebalancerManager__getFlashloan_notEmptyEntryPoint();
  error RebalancerManager__completeRebalance_invalidEntryPoint();

  bytes32 private _entryPoint;

  constructor() {}

  function rebalanceVault(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    external
    returns (bool success)
  {
    _checkAssetsAmount(vault, assets, from);

    if (vault.debtAsset() == address(0)) {
      vault.rebalance(assets, 0, from, to, 0);
    } else {
      _checkDebtAmount(vault, debt, from);

      _getFlashloan(vault, assets, debt, from, to, flasher, setToAsActiveProvider);
    }

    if (setToAsActiveProvider) {
      vault.setActiveProvider(to);
    }

    success = true;
  }

  function _checkAssetsAmount(IVault vault, uint256 amount, ILendingProvider from) internal view {
    uint256 assetsAtProvider = from.getDepositBalance(address(vault), vault);
    if (amount > assetsAtProvider) {
      revert RebalancerManager__checkAssetsAmount_invalidAmount();
    }
  }

  function _checkDebtAmount(IVault vault, uint256 amount, ILendingProvider from) internal view {
    uint256 debtAtProvider = from.getBorrowBalance(address(vault), vault);
    if (amount > debtAtProvider) {
      revert RebalancerManager__checkDebtAmount_invalidAmount();
    }
  }

  function _checkAndSetEntryPoint(bytes memory requestorCall) internal {
    if (_entryPoint != "") {
      revert RebalancerManager__getFlashloan_notEmptyEntryPoint();
    }
    _entryPoint = keccak256(abi.encode(requestorCall));
  }

  function _checkReentry(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    internal
    view
  {
    bytes memory requestorCalldata = abi.encodeWithSelector(
      MockRebalancerManager.completeRebalance.selector,
      vault,
      assets,
      debt,
      from,
      to,
      flasher,
      setToAsActiveProvider
    );
    bytes32 hashCheck = keccak256(abi.encode(requestorCalldata));
    if (_entryPoint != hashCheck) {
      revert RebalancerManager__completeRebalance_invalidEntryPoint();
    }
  }

  function _getFlashloan(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    internal
  {
    bytes memory requestorCall = abi.encodeWithSelector(
      MockRebalancerManager.completeRebalance.selector,
      vault,
      assets,
      debt,
      from,
      to,
      flasher,
      setToAsActiveProvider
    );

    _checkAndSetEntryPoint(requestorCall);
    address debtAsset = vault.debtAsset();
    flasher.initiateFlashloan(debtAsset, debt, address(this), requestorCall);
  }

  function completeRebalance(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    external
    returns (bool success)
  {
    _checkReentry(vault, assets, debt, from, to, flasher, setToAsActiveProvider);

    MockERC20 debtAsset = MockERC20(vault.debtAsset());

    if (debtAsset.balanceOf(address(this)) != debt) {
      revert RebalancerManager__getFlashloan_flashloanFailed();
    }

    debtAsset.approve(address(vault), debt);

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debt);

    vault.rebalance(assets, debt, from, to, flashloanFee);

    debtAsset.transfer(address(flasher), debt + flashloanFee);

    // re-init
    _entryPoint = "";
    success = true;
  }
}
