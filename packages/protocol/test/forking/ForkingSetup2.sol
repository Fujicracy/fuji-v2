// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Test} from "forge-std/Test.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVaultUpgradeable} from "../../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {BorrowingVaultBeaconFactory} from
  "../../src/vaults/borrowing/BorrowingVaultBeaconFactory.sol";
import {FujiOracle} from "../../src/FujiOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {IVaultPermissions} from "../../src/interfaces/IVaultPermissions.sol";
import {Chief} from "../../src/Chief.sol";
import {IWETH9} from "../../src/abstracts/WETH9.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IConnext} from "../../src/interfaces/connext/IConnext.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";
import {IFujiOracle} from "../../src/interfaces/IFujiOracle.sol";
import {ConnextRouter} from "../../src/routers/ConnextRouter.sol";

contract ForkingSetup2 is CoreRoles, Test {
  using SafeERC20 for IERC20;
  using Address for address;

  struct PriceFeed {
    string asset;
    address chainlink;
  }

  struct NestedMapping {
    string asset1;
    string asset2;
    address market;
    string name;
  }

  struct SimpleMapping {
    string asset;
    address market;
    string name;
  }

  struct Vault {
    string name;
    address addr;
  }

  struct VaultConfig {
    string collateral;
    string debt;
    uint256 liqRatio;
    uint256 maxLtv;
    string name;
    string[] providers;
    uint256 rating;
  }

  struct YieldVaultConfig {
    string asset;
    string name;
    string[] providers;
    uint256 rating;
  }

  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 1869640809;
  uint32 public constant ARBITRUM_DOMAIN = 1634886255;
  uint32 public constant POLYGON_DOMAIN = 1886350457;
  uint32 public constant GNOSIS_DOMAIN = 6778479;
  uint32 public constant GOERLI_DOMAIN = 1735353714;
  uint32 public constant OPTIMISM_GOERLI_DOMAIN = 1735356532;
  uint32 public constant MUMBAI_DOMAIN = 9991;

  uint256 public constant ALICE_PK = 0xA;
  address public ALICE = vm.addr(ALICE_PK);
  uint256 public constant BOB_PK = 0xB;
  address public BOB = vm.addr(BOB_PK);
  uint256 public constant CHARLIE_PK = 0xC;
  address public CHARLIE = vm.addr(CHARLIE_PK);
  address public INITIALIZER = vm.addr(0x111A13); // arbitrary address

  Chief chief;
  ConnextRouter connextRouter;
  TimelockController timelock;
  IFujiOracle oracle;
  BorrowingVaultBeaconFactory factory;
  address implementation;

  Vault[] allVaults;

  address connextCore;

  uint256 public constant DEFAULT_MAX_LTV = 75e16; // 75%
  uint256 public constant DEFAULT_LIQ_RATIO = 82.5e16; // 82.5%

  string chainName;
  string configJson;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");
    vm.label(INITIALIZER, "initializer");
  }

  function setUpFork() public {
    chainName = vm.envString("CHAIN_NAME");
    vm.createSelectFork(chainName);

    string memory path = string.concat("deploy-configs/", chainName, ".json");
    configJson = vm.readFile(path);
  }

  function setUpNamedFork(string memory chain) public {
    chainName = chain;
    vm.createSelectFork(chainName);

    string memory path = string.concat("deploy-configs/", chainName, ".json");
    configJson = vm.readFile(path);
  }

  function setOrDeployChief(bool deploy) internal {
    if (deploy) {
      chief = new Chief(true, false);
    } else {
      chief = Chief(getAddress("Chief"));
    }
    vm.label(address(chief), "Chief");
    timelock = TimelockController(payable(chief.timelock()));
    vm.label(address(timelock), "Timelock");
  }

  function setOrDeployConnextRouter(bool deploy) internal {
    if (deploy) {
      connextCore = readAddrFromConfig("ConnextCore");
      address weth = readAddrFromConfig("WETH");

      connextRouter = new ConnextRouter(IWETH9(weth), IConnext(connextCore), Chief(chief));
    } else {
      connextRouter = ConnextRouter(payable(getAddress("ConnextRouter")));
    }
  }

  function setOrDeployFujiOracle(bool deploy) internal {
    bytes memory raw = vm.parseJson(configJson, ".price-feeds");
    PriceFeed[] memory list = abi.decode(raw, (PriceFeed[]));

    uint256 len = list.length;

    if (deploy) {
      address[] memory addrs = new address[](len);
      address[] memory feeds = new address[](len);
      for (uint256 i; i < len; i++) {
        addrs[i] = readAddrFromConfig(list[i].asset);
        vm.label(addrs[i], list[i].asset);
        feeds[i] = list[i].chainlink;
      }
      oracle = new FujiOracle(addrs, feeds, address(chief));
    } else {
      oracle = FujiOracle(getAddress("FujiOracle"));
    }
    vm.label(address(oracle), "FujiOracle");
  }

  function setOrDeployBorrowingVaultFactory(bool deployFactory, bool deployImplementation) internal {
    if (deployFactory) {
      if (deployImplementation) {
        implementation = address(new BorrowingVaultUpgradeable());
      } else {
        implementation = getAddress("BorrowingVaultUpgradeable");
      }
      factory = new BorrowingVaultBeaconFactory(address(chief), implementation);
    } else {
      factory = BorrowingVaultBeaconFactory(getAddress("BorrowingVaultBeaconFactory"));
      implementation = getAddress("BorrowingVaultUpgradeable");
    }
    vm.label(address(factory), "BorrowingVaultBeaconFactory");

    if (!chief.allowedVaultFactory(address(factory))) {
      bytes memory data2 =
        abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true);
      _callWithTimelock(address(chief), data2);
    }
  }

  function setOrDeployBorrowingVaults(bool deploy) internal {
    bytes memory raw = vm.parseJson(configJson, ".borrowing-vaults");
    VaultConfig[] memory vaults = abi.decode(raw, (VaultConfig[]));

    uint256 minCollateral = 1e6;

    uint256 len = vaults.length;
    address collateral;
    address debt;
    string memory name;
    uint256 rating;
    uint256 liqRatio;
    uint256 maxLtv;
    string[] memory providerNames;

    for (uint256 i; i < len; i++) {
      collateral = readAddrFromConfig(vaults[i].collateral);
      debt = readAddrFromConfig(vaults[i].debt);
      name = vaults[i].name;
      rating = vaults[i].rating;
      liqRatio = vaults[i].liqRatio;
      maxLtv = vaults[i].maxLtv;
      providerNames = vaults[i].providers;

      if (deploy) {
        uint256 providersLen = providerNames.length;
        ILendingProvider[] memory providers = new ILendingProvider[](providersLen);
        for (uint256 j; j < providersLen; j++) {
          providers[j] = ILendingProvider(getAddress(providerNames[j]));
        }

        if (IERC20(collateral).allowance(msg.sender, address(factory)) < minCollateral) {
          IERC20(collateral).safeIncreaseAllowance(address(factory), minCollateral);
        }
        deal(collateral, msg.sender, minCollateral);
        address v =
          chief.deployVault(address(factory), abi.encode(collateral, debt, providers), rating);
        allVaults.push(Vault(name, v));
        vm.label(v, name);

        _callWithTimelock(
          v, abi.encodeWithSelector(BorrowingVaultUpgradeable.setOracle.selector, address(oracle))
        );
        _callWithTimelock(
          v,
          abi.encodeWithSelector(BorrowingVaultUpgradeable.setLtvFactors.selector, maxLtv, liqRatio)
        );
      } else {
        address addr = getAddress(name);
        allVaults.push(Vault(name, addr));
        vm.label(addr, name);
      }
    }
  }

  function getAddress(string memory contractName) internal view returns (address addr) {
    require(bytes(chainName).length != 0, "Set 'chainName' in setUp()");

    addr = _getAddress(string.concat("deployments/", chainName, "/", contractName));
  }

  function getAddressAt(
    string memory contractName,
    string memory _chainName
  )
    internal
    view
    returns (address addr)
  {
    addr = _getAddress(string.concat("deployments/", _chainName, "/", contractName));
  }

  function readAddrFromConfig(string memory key) internal returns (address) {
    return vm.parseJsonAddress(configJson, string.concat(".", key));
  }

  function _getAddress(string memory path) internal view returns (address addr) {
    string memory content = vm.readFile(path);
    addr = vm.parseAddress(content);
  }

  function _callWithTimelock(address target, bytes memory callData) internal {
    vm.prank(address(timelock));
    target.functionCall(callData);
    /*timelock.schedule(target, 0, callData, 0x00, 0x00, 1.5 days);*/
    /*vm.warp(block.timestamp + 2 days);*/
    /*timelock.execute(target, 0, callData, 0x00, 0x00);*/
    /*rewind(2 days);*/
  }

  function getDepositAndBorrow(
    address beneficiary,
    uint256 beneficiaryPrivateKey,
    uint256 depositAmount,
    uint256 borrowAmount,
    address router,
    address vault
  )
    internal
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(vault, depositAmount, beneficiary, beneficiary);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(vault, beneficiary, beneficiary, borrowAmount);
    args[2] = abi.encode(vault, borrowAmount, beneficiary, beneficiary);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    // Replace permit action arguments, now with the signature values.
    args[1] = _buildPermitAsBytes(
      "BORROW",
      beneficiary,
      beneficiaryPrivateKey,
      router,
      beneficiary,
      borrowAmount,
      0,
      vault,
      actionArgsHash
    );

    return (actions, args);
  }

  function getPaybackAndWithdraw(
    address beneficiary,
    uint256 beneficiaryPrivateKey,
    uint256 paybackAmount,
    uint256 withdrawAmount,
    address router,
    address vault
  )
    internal
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.PermitWithdraw;
    actions[2] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(vault, paybackAmount, beneficiary, beneficiary);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(vault, beneficiary, beneficiary, withdrawAmount);
    args[2] = abi.encode(vault, withdrawAmount, beneficiary, beneficiary);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    // Replace permit action arguments, now with the signature values.
    args[1] = _buildPermitAsBytes(
      "WITHDRAW",
      beneficiary,
      beneficiaryPrivateKey,
      router,
      beneficiary,
      withdrawAmount,
      0,
      vault,
      actionArgsHash
    );

    return (actions, args);
  }

  function _buildPermitAsBytes(
    string memory action,
    address owner,
    uint256 ownerPKey,
    address operator,
    address receiver,
    uint256 amount,
    uint256 plusNonce,
    address vault,
    bytes32 actionArgsHash
  )
    internal
    returns (bytes memory arg)
  {
    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      owner, operator, receiver, amount, plusNonce, vault, actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitArgs(action, permit, ownerPKey, vault);

    arg = abi.encode(vault, owner, receiver, amount, deadline, v, r, s);
  }

  function _getPermitArgs(
    string memory action,
    LibSigUtils.Permit memory permit,
    uint256 ownerPKey,
    address vault
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 structHash = keccak256(abi.encodePacked(action))
      == keccak256(abi.encodePacked("BORROW"))
      ? LibSigUtils.getStructHashBorrow(permit)
      : LibSigUtils.getStructHashWithdraw(permit);
    bytes32 digest =
      LibSigUtils.getHashTypedDataV4Digest(IVaultPermissions(vault).DOMAIN_SEPARATOR(), structHash);
    (v, r, s) = vm.sign(ownerPKey, digest);
    deadline = permit.deadline;
  }
}
