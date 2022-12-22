// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {FujiOracle} from "../../src/FujiOracle.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {Chief} from "../../src/Chief.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {IVaultPermissions} from "../../src/interfaces/IVaultPermissions.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";

// How to add a new chain with its domain?
// 1. Add a domain ID. Domains originate from Connext (check their docs)
// 2. Create a fork and save it in "forks" mapping
// 3. Create a registry entry with addresses for reuiqred resources

contract ForkingSetup is CoreRoles, Test {
  uint32 public constant GOERLI_DOMAIN = 1735353714;
  uint32 public constant OPTIMISM_GOERLI_DOMAIN = 1735356532;
  uint32 public constant MUMBAI_DOMAIN = 9991;

  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 22222222; // TODO: replace with the real one
  uint32 public constant ARBITRUM_DOMAIN = 33333333; // TODO: replace with the real one
  uint32 public constant POLYGON_DOMAIN = 1886350457;
  //https://github.com/connext/chaindata/blob/main/crossChain.json

  uint256 public constant ALICE_PK = 0xA;
  address public ALICE = vm.addr(ALICE_PK);
  uint256 public constant BOB_PK = 0xB;
  address public BOB = vm.addr(BOB_PK);
  uint256 public constant CHARLIE_PK = 0xC;
  address public CHARLIE = vm.addr(CHARLIE_PK);

  uint32 originDomain;

  struct Registry {
    address weth;
    address usdc;
    address dai;
    address connext;
  }
  // domain => addresses registry

  mapping(uint256 => Registry) public registry;
  // domain => forkId
  mapping(uint256 => uint256) public forks;

  IVault public vault;
  Chief public chief;
  TimelockController public timelock;
  MockOracle mockOracle;

  address public collateralAsset;
  address public debtAsset;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");

    forks[GOERLI_DOMAIN] = vm.createFork("goerli");
    forks[OPTIMISM_GOERLI_DOMAIN] = vm.createFork("optimism_goerli");
    forks[MUMBAI_DOMAIN] = vm.createFork("mumbai");
    forks[MAINNET_DOMAIN] = vm.createFork("mainnet");
    forks[OPTIMISM_DOMAIN] = vm.createFork("optimism");
    forks[ARBITRUM_DOMAIN] = vm.createFork("arbitrum");
    forks[POLYGON_DOMAIN] = vm.createFork("polygon");

    Registry memory goerli = Registry({
      weth: 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6,
      usdc: address(0),
      dai: address(0),
      connext: 0x99A784d082476E551E5fc918ce3d849f2b8e89B6
    });
    registry[GOERLI_DOMAIN] = goerli;

    Registry memory optimismGoerli = Registry({
      weth: 0x74c6FD7D2Bc6a8F0Ebd7D78321A95471b8C2B806,
      usdc: address(0),
      dai: address(0),
      connext: 0x705791AD27229dd4CCf41b6720528AfE1bcC2910
    });
    registry[OPTIMISM_GOERLI_DOMAIN] = optimismGoerli;

    Registry memory mumbai = Registry({
      weth: 0xFD2AB41e083c75085807c4A65C0A14FDD93d55A9,
      usdc: address(0),
      dai: address(0),
      connext: 0xfeBBcfe9a88aadefA6e305945F2d2011493B15b4
    });
    registry[MUMBAI_DOMAIN] = mumbai;

    Registry memory mainnet = Registry({
      weth: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
      usdc: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
      dai: address(0),
      connext: address(0)
    });
    registry[MAINNET_DOMAIN] = mainnet;

    Registry memory optimism = Registry({
      weth: 0x4200000000000000000000000000000000000006,
      usdc: 0x7F5c764cBc14f9669B88837ca1490cCa17c31607,
      dai: address(0),
      connext: address(0)
    });
    registry[OPTIMISM_DOMAIN] = optimism;

    Registry memory arbitrum = Registry({
      weth: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1,
      usdc: 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8,
      dai: address(0),
      connext: address(0)
    });
    registry[ARBITRUM_DOMAIN] = arbitrum;

    Registry memory polygon = Registry({
      weth: 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619,
      usdc: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174,
      dai: 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063,
      connext: address(0)
    });
    registry[POLYGON_DOMAIN] = polygon;
  }

  function deploy(uint32 domain) public {
    Registry memory reg = registry[domain];
    if (reg.connext == address(0) && reg.weth == address(0) && reg.usdc == address(0)) {
      revert("No registry for this chain");
    }
    vm.selectFork(forks[domain]);

    originDomain = domain;

    if (reg.connext != address(0)) {
      vm.label(reg.connext, "Connext");
    }

    collateralAsset = reg.weth;
    vm.label(reg.weth, "WETH");

    if (reg.usdc == address(0)) {
      // mostly for testnets
      MockERC20 tDAI = new MockERC20("Test DAI", "tDAI");
      debtAsset = address(tDAI);
      vm.label(debtAsset, "testDAI");
    } else {
      debtAsset = reg.usdc;
      vm.label(debtAsset, "USDC");
    }

    // TODO: replace with real oracle
    mockOracle = new MockOracle();
    /*address[] memory empty = new address[](0);*/
    /*FujiOracle oracle = new FujiOracle(empty, empty, address(chief));*/
    // WETH and DAI prices by Nov 11h 2022
    mockOracle.setUSDPriceOf(collateralAsset, 796341757142697);
    mockOracle.setUSDPriceOf(debtAsset, 100000000);

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));
    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));

    vault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH-USDC Vault Shares",
      "fv2WETHUSDC"
    );
  }

  function _callWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(target, 0, callData, 0x00, 0x00);
    rewind(2 days);
  }

  function _grantRoleChief(bytes32 role, address account) internal {
    bytes memory sendData = abi.encodeWithSelector(chief.grantRole.selector, role, account);
    _callWithTimelock(address(chief), sendData);
  }

  function _setVaultProviders(IVault v, ILendingProvider[] memory providers) internal {
    bytes memory callData = abi.encodeWithSelector(IVault.setProviders.selector, providers);
    _callWithTimelock(address(v), callData);
  }

  function _getPermitBorrowArgs(
    LibSigUtils.Permit memory permit,
    uint256 ownerPrivateKey,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 structHash = LibSigUtils.getStructHashBorrow(permit);
    bytes32 digest =
      LibSigUtils.getHashTypedDataV4Digest(IVaultPermissions(vault_).DOMAIN_SEPARATOR(), structHash);
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
    deadline = permit.deadline;
  }

  function _getPermitWithdrawArgs(
    LibSigUtils.Permit memory permit,
    uint256 ownerPrivateKey,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 structHash = LibSigUtils.getStructHashWithdraw(permit);
    bytes32 digest =
      LibSigUtils.getHashTypedDataV4Digest(IVaultPermissions(vault_).DOMAIN_SEPARATOR(), structHash);
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
    deadline = permit.deadline;
  }

  function _getDepositAndBorrowCallData(
    uint256 amount,
    uint256 borrowAmount,
    address router,
    address vault_
  )
    internal
    returns (bytes memory callData)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(vault_, amount, ALICE, router);

    LibSigUtils.Permit memory permit =
      LibSigUtils.buildPermitStruct(ALICE, router, ALICE, borrowAmount, 0, vault_);

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, vault_);

    args[1] = abi.encode(vault_, ALICE, ALICE, borrowAmount, deadline, v, r, s);

    args[2] = abi.encode(vault_, borrowAmount, ALICE, ALICE);

    callData = abi.encode(actions, args);
  }
}
