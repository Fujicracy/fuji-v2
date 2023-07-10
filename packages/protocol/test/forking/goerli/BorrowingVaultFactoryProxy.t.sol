// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup2} from "../ForkingSetup2.sol";
import {AaveV3Goerli} from "../../../src/providers/goerli/AaveV3Goerli.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";

contract BorrowingVaultFactoryProxyTests is Routines, ForkingSetup2 {
  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  AaveV3Goerli aaveV3;

  function setUp() public {
    setUpFork("goerli");

    aaveV3 = AaveV3Goerli(getAddress("Aave_V3_Goerli"));
    vm.label(address(aaveV3), "AaveV3Goerli");
  }

  function test_one() public {
    vm.startPrank(msg.sender);

    setOrDeployChief(true);
    setOrDeployFujiOracle(true);
    setOrDeployBorrowingVaultFactory(true, true);

    if (chief.allowedVaultFactory(address(factory))) {
      deployBorrowingVaults();
      /*setBorrowingVaults();*/
    }
    /*assertEq(true, true);*/
  }
}
