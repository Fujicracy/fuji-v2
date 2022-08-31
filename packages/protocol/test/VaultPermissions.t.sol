// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";

contract VaultTest is DSTestPlus {
  IVault public vault;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 ownerPkey = 0xA;
  uint operatorPkey = 0xB;
  address owner = vm.addr(ownerPkey);
  address operator = vm.addr(operatorPkey);

  uint256 public depositAmount = 10 * 1e18;
  uint256 public withdrawDelegated = 3 * 1e18;
  uint256 public borrowDelegated = 200 * 1e6;

  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant _PERMIT_ASSET_TYPEHASH =
    keccak256(
      "PermitAssets(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant _PERMIT_DEBT_TYPEHASH =
    keccak256(
      "PermitDebt(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

  struct Permit {
      address owner;
      address spender;
      uint256 value;
      uint256 nonce;
      uint256 deadline;
  }

  // computes the hash of a permit-asset
  function utils_getStructHashAsset(Permit memory _permit)
    public
    pure
    returns (bytes32)
  {
    return keccak256(
      abi.encode(
        _PERMIT_ASSET_TYPEHASH,
        _permit.owner,
        _permit.spender,
        _permit.value,
        _permit.nonce,
        _permit.deadline
      )
    );
  }

  // computes the hash of a permit-debt
  function utils_getStructHashDebt(Permit memory _permit)
    public
    pure
    returns (bytes32)
  {
    return keccak256(
      abi.encode(
        _PERMIT_DEBT_TYPEHASH,
        _permit.owner,
        _permit.spender,
        _permit.value,
        _permit.nonce,
        _permit.deadline
      )
    );
  }

  // computes the digest
  function utils_gethashTypedDataV4Digest(bytes32 domainSeperator_, bytes32 structHash_) external pure returns (bytes32) {
    return keccak256(abi.encodePacked("\x19\x01", domainSeperator_, structHash_));
  }

  function utils_setupOracle(address asset1, address asset2) internal {
    // WETH and DAI prices by Aug 12h 2022
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(528881643782407)
    );
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset2, asset1, 18),
      abi.encode(1889069940262927605990)
    );
  }

  function utils_doDeposit(uint256 amount, IVault v) public {
    deal(address(asset), owner, amount);

    vm.startPrank(owner);
    SafeERC20.safeApprove(asset, address(v), amount);
    v.deposit(amount, owner);
    vm.stopPrank();
  }

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    utils_setupOracle(address(asset), address(debtAsset));

    mockProvider = new MockProvider();

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(0)
    );

    vault.setActiveProvider(mockProvider);
  }

  function testFail_operatorTriesWithdraw() public {
    utils_doDeposit(depositAmount, vault);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated, operator, owner);
  }
}
