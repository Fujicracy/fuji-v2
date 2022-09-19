// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnextHandler} from "nxtp/core/connext/interfaces/IConnextHandler.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";

contract DeployOptimismGoerli is ScriptPlus {
  IVault public vault;
  IWETH9 public weth;
  IConnextHandler public connextHandler;

  ConnextRouter public connextRouter;

  MockERC20 public mockDAI;
  MockProvider public mockProvider;
  MockOracle public mockOracle;

  function setUp() public {
    chainName = "optimism-goerli";

    weth = IWETH9(0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB);
    connextHandler = IConnextHandler(0xe37f1f55eab648dA87047A03CB03DeE3d3fe7eC7);
  }

  function run() public {
    vm.startBroadcast();

    mockDAI = new MockERC20("Test DAI", "tDAI");
    saveAddress("MockDAI", address(mockDAI));

    mockOracle = new MockOracle();
    saveAddress("MockOracle", address(mockOracle));

    mockProvider = new MockProvider();
    saveAddress("MockProvider", address(mockProvider));

    connextRouter = new ConnextRouter(weth, connextHandler);
    saveAddress("ConnextRouter", address(connextRouter));

    vault = new BorrowingVault(
      address(weth),
      getAddress("MockDAI"),
      getAddress("MockOracle"),
      address(0)
    );
    saveAddress("BorrowingVault", address(vault));

    BorrowingVault(getAddress("BorrowingVault")).setActiveProvider(
      MockProvider(getAddress("MockProvider"))
    );

    // WETH and DAI prices by Aug 12h 2022
    MockOracle(getAddress("MockOracle")).setPriceOf(
      address(weth), getAddress("MockDAI"), 528881643782407
    );
    MockOracle(getAddress("MockOracle")).setPriceOf(
      getAddress("MockDAI"), address(weth), 1889069940262927605990
    );

    vm.stopBroadcast();
  }
}
