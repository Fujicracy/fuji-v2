// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import "nxtp/core/connext/libraries/LibConnextStorage.sol";
import "nxtp/core/connext/interfaces/IConnextHandler.sol";
import "nxtp/core/connext/interfaces/IExecutor.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IERC20Mintable.sol";
import "./interfaces/IRouter.sol";
import "./helpers/PeripheryPayments.sol";

// TODO inherit from SelfPermit, Multicall
// for additional functionalitites
// ref: https://github.com/fei-protocol/ERC4626/blob/main/src/ERC4626RouterBase.sol
contract XRouter is PeripheryPayments {
  IConnextHandler public connext;
  IExecutor public executor;

  enum Action {
    Deposit,
    Withdraw,
    Borrow,
    Payback,
    //    FlashLoan,
    BridgeTransfer
  }

  // ref: https://docs.nomad.xyz/developers/environments/domain-chain-ids
  mapping(uint256 => address) public routerByDomain;

  // A modifier for permissioned function calls.
  // Note: This is an important security consideration. If your target
  //       contract function is meant to be permissioned, it must check
  //       that the originating call is from the correct domain and contract.
  //       Also, check that the msg.sender is the Connext Executor address.
  modifier onlyConnextExecutor(uint256 originDomain) {
    require(
      // TODO subject to change in the new version of amarok
      /*IExecutor(msg.sender).originSender() == routerByDomain[originDomain] &&*/
      /*IExecutor(msg.sender).origin() == uint32(originDomain) &&*/
      msg.sender == address(executor),
      "Expected origin contract on origin domain called by Executor"
    );
    _;
  }

  // -------> On testnet ONLY
  address public connextTestToken;

  // <------

  constructor(IWETH9 weth, IConnextHandler connext_) PeripheryPayments(weth) {
    connext = connext_;
    executor = connext.executor();
  }

  function depositAndBorrow(IVault vault, uint256 depositAmount, uint256 borrowAmount) external {
    pullToken(ERC20(vault.asset()), depositAmount, address(this));

    vault.deposit(depositAmount, msg.sender);
    vault.borrow(borrowAmount, msg.sender, msg.sender);
  }

  function depositToVault(IVault vault, uint256 amount) external {
    pullToken(ERC20(vault.asset()), amount, address(this));

    vault.deposit(amount, msg.sender);
  }

  function withdrawFromVault(IVault vault, uint256 amount) external {
    vault.withdraw(amount, msg.sender, msg.sender);
  }

  function depositETHAndBorrow(IVault vault, uint256 borrowAmount) external payable {
    wrapWETH9();
    vault.deposit(msg.value, msg.sender);
    vault.borrow(borrowAmount, msg.sender, msg.sender);
  }

  // Move the whole deposit to another strategy on the same chain.
  function switchVaults(IVault vaultFrom, IVault vaultTo, uint256 amount) external {
    vaultFrom.withdraw(amount, address(this), msg.sender);
    vaultTo.deposit(amount, msg.sender);
  }

  // 1. Deposit and Borrow on origin chain
  // 2. Bridge borrowed asset to dest chain
  function depositBorrowAndBridge(
    uint256 destDomain,
    IVault vault,
    uint256 amount,
    uint256 borrowAmount
  )
    external
  {
    // TODO verify vault
    require(routerByDomain[destDomain] != address(0), "No router on dest domain");

    pullToken(ERC20(vault.asset()), amount, address(this));

    vault.deposit(amount, msg.sender);
    vault.borrow(borrowAmount, address(this), msg.sender);

    _bridgeTransfer(destDomain, vault.debtAsset(), borrowAmount, msg.sender);
  }

  // 1. Bridge collateral asset to dest chain
  // 2. Deposit and Borrow on dest chain
  function bridgeDepositAndBorrow(
    uint256 destDomain,
    address destVault,
    address asset,
    uint256 amount,
    uint256 borrowAmount
  )
    external
  {
    // verify destVault exists on destDomain?
    require(routerByDomain[destDomain] != address(0), "No router on dest domain");

    pullToken(ERC20(asset), amount, address(this));

    // ------> On testnet ONLY
    // cannot transfer anything else than TEST token
    // that's why we pull user's asset but we bridge TEST token
    IERC20Mintable(connextTestToken).mint(address(this), amount);
    // <------

    Action[] memory actions = new Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = Action.Deposit;
    args[0] = abi.encode(amount, msg.sender);

    actions[1] = Action.Borrow;
    args[1] = abi.encode(borrowAmount, msg.sender, msg.sender);

    bytes memory params = abi.encode(destVault, asset, amount, actions, args);

    bytes4 selector = bytes4(keccak256("bridgeCall(uint256,bytes)"));

    bytes memory callData = abi.encodeWithSelector(selector, connext.domain(), params);

    _bridgeTransferWithCalldata(destDomain, asset, amount, callData);
  }

  // NOTE: This doesn't work because of Connext reentrancy guard
  // 1. Bridge collateral asset to dest chain
  // 2. Deposit and Borrow on dest chain
  // 3. Transfer borrowed asset to 3rd chain
  function bridgeDepositBorrowAndTransfer(
    uint256 destDomain,
    uint256 transferDomain,
    address destVault,
    address asset,
    uint256 amount,
    uint256 borrowAmount,
    address transferAsset
  )
    external
  {
    // verify destVault exists on destDomain?

    pullToken(ERC20(asset), amount, address(this));

    // ------> On testnet ONLY
    // cannot transfer anything else than TEST token
    // that's why we pull user's asset but we bridge TEST token
    IERC20Mintable(connextTestToken).mint(address(this), amount);
    // <------

    Action[] memory actions = new Action[](3);
    bytes[] memory args = new bytes[](3);

    actions[0] = Action.Deposit;
    args[0] = abi.encode(amount, msg.sender);

    actions[1] = Action.Borrow;
    args[1] = abi.encode(borrowAmount, routerByDomain[destDomain], msg.sender);

    actions[2] = Action.BridgeTransfer;
    args[2] = abi.encode(transferDomain, transferAsset, borrowAmount, msg.sender);

    bytes memory params = abi.encode(destVault, asset, amount, actions, args);

    bytes4 selector = bytes4(keccak256("bridgeCall(uint256,bytes)"));

    bytes memory callData = abi.encodeWithSelector(selector, connext.domain(), params);

    _bridgeTransferWithCalldata(destDomain, asset, amount, callData);
  }

  // Move deposit to another strategy on a different chain.
  // function teleportDeposit(...) external;

  // callable only from the bridge
  function bridgeCall(uint256 originDomain, bytes memory params)
    external
    onlyConnextExecutor(originDomain) // nonReentrant?
  {
    (
      address vault,
      address bridgedAsset,
      uint256 bridgedAmount,
      Action[] memory actions,
      bytes[] memory args
    ) = abi.decode(params, (address, address, uint256, Action[], bytes[]));

    // TODO pull bridgedAsset whatever it is
    bridgedAsset;
    // If using fast liquidity "bridgedAmount" will be less than the one passed
    // from origin domain because of the fees. That's why in pullTokens we
    // have to account for the fee. If we are using sposored vaults, we don't
    // need to handle it here.
    /*pullToken(ERC20(connextTestToken), bridgedAmount, address(this));*/

    // -------> On testnet ONLY
    IERC20Mintable(address(WETH9)).mint(address(this), bridgedAmount);
    // <------

    IVault v = IVault(vault);
    uint256 len = actions.length;
    for (uint256 i = 0; i < len; i++) {
      if (actions[i] == Action.Deposit) {
        (uint256 amount, address receiver) = abi.decode(args[i], (uint256, address));
        approve(ERC20(v.asset()), vault, amount);
        v.deposit(amount, receiver);
      } else if (actions[i] == Action.Withdraw) {
        (uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (uint256, address, address));
        v.withdraw(amount, receiver, owner);
      } else if (actions[i] == Action.Borrow) {
        (uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (uint256, address, address));
        v.borrow(amount, receiver, owner);
      } else if (actions[i] == Action.Payback) {
        (uint256 amount, address receiver) = abi.decode(args[i], (uint256, address));
        approve(ERC20(v.debtAsset()), vault, amount);
        v.payback(amount, receiver);
      } else if (actions[i] == Action.BridgeTransfer) {
        (uint256 domain, address asset, uint256 amount, address receiver) =
          abi.decode(args[i], (uint256, address, uint256, address));
        _bridgeTransfer(domain, asset, amount, receiver); //      } else if (actions[i] == Action.FlashLoan) {
          //        _initiateFlashLoan(args[i]);
          //        // flashloan should be already repaid here
          //      } else if (actions[i] == Action.Liquidate) {
          //        IVault(vault).liquidate();
      }
    }
  }

  //  function _initiateFlashLoan(bytes32 args) internal {
  //    // 1. Decode args and call Flasher
  //    // 2. Flasher receives the flashloan and calls flashOperation() of Router
  //    //    for the rest of the actions
  //  }

  //  function flashOperation() external onlyFlasher {
  //    // Pull flashed amount
  //
  //    // 1. Close Own Position - current vault.flashClose()
  //    // vault.payback()
  //    // vault.withdraw() - needs approval/permit from user beforehand
  //    // or
  //    // 2. Liquidations
  //    // vault.liquidate();
  //
  //    // Transfer back to the Flasher so it handles payback
  //    // to the flashloan provider
  //  }

  function _bridgeTransfer(uint256 destDomain, address asset, uint256 amount, address receiver)
    internal
  {
    // ------> On testnet ONLY
    // cannot transfer anything else than TEST token
    // that's why we need to mint some TEST tokens
    IERC20Mintable(connextTestToken).mint(address(this), amount);
    // <------

    CallParams memory callParams = CallParams({
      to: receiver,
      callData: "", // empty here because we're only sending funds
      originDomain: uint32(connext.domain()),
      destinationDomain: uint32(destDomain),
      agent: receiver, // address allowed to transaction on destination side in addition to relayers
      recovery: receiver, // fallback address to send funds to if execution fails on destination side
      forceSlow: false, // option to force Nomad slow path (~30 mins) instead of paying 0.05% fee
      receiveLocal: false, // option to receive the local Nomad-flavored asset instead of the adopted asset
      callback: address(0), // zero address because we don't expect a callback
      callbackFee: 0, // fee paid to relayers; relayers don't take any fees on testnet
      relayerFee: 0, // fee paid to relayers; relayers don't take any fees on testnet
      slippageTol: 9995
    });

    asset;
    XCallArgs memory xcallArgs = XCallArgs({
      params: callParams,
      // ------> On testnet ONLY
      // replace connextTestToken by asset
      transactingAssetId: connextTestToken,
      // <------
      amount: amount
    });

    connext.xcall(xcallArgs);
  }

  function _bridgeTransferWithCalldata(
    uint256 destDomain,
    address asset,
    uint256 amount,
    bytes memory callData
  )
    internal
  {
    CallParams memory callParams = CallParams({
      to: routerByDomain[destDomain],
      callData: callData,
      originDomain: uint32(connext.domain()),
      destinationDomain: uint32(destDomain),
      agent: msg.sender, // address allowed to transaction on destination side in addition to relayers
      recovery: msg.sender, // fallback address to send funds to if execution fails on destination side
      forceSlow: false, // option to force Nomad slow path (~30 mins) instead of paying 0.05% fee
      receiveLocal: false, // option to receive the local Nomad-flavored asset instead of the adopted asset
      callback: address(0), // this contract implements the callback
      callbackFee: 0, // fee paid to relayers; relayers don't take any fees on testnet
      relayerFee: 0, // fee paid to relayers; relayers don't take any fees on testnet
      slippageTol: 9995 // tolerate .05% slippage
    });

    asset;
    XCallArgs memory xcallArgs = XCallArgs({
      params: callParams,
      // ------> On testnet ONLY
      // replace connextTestToken by asset
      transactingAssetId: connextTestToken,
      // <------
      amount: amount
    });

    connext.xcall(xcallArgs);
  }

  ///////////////////////
  /// Admin functions ///
  ///////////////////////

  function setRouter(uint256 domain, address router) external {
    // TODO only owner
    // TODO verify params
    routerByDomain[domain] = router;
  }

  // -------> On testnet ONLY
  function setTestnetToken(address token) external {
    connextTestToken = token;
    approve(ERC20(token), address(connext), type(uint256).max);
  } // <------
}
