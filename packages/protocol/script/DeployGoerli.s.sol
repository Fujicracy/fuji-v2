// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnextHandler} from "nxtp/core/connext/interfaces/IConnextHandler.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {MockProvider} from "../test/utils/mocks/MockProvider.sol";
import {MockERC20} from "../test/utils/mocks/MockERC20.sol";
import {MockOracle} from "../test/utils/mocks/MockOracle.sol";

contract DeployGoerli is ScriptPlus {
  IVault public vault;
  IWETH9 public weth;
  IConnextHandler public connextHandler;

  ConnextRouter public connextRouter;

  MockERC20 public mockDAI;
  MockProvider public mockProvider;
  MockOracle public mockOracle;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);

  function setUp() public {
    weth = IWETH9(0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6);
    connextHandler = IConnextHandler(0xB4C1340434920d70aD774309C75f9a4B679d801e);
  }

  function run() public {
    vm.startBroadcast();
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePkey, "digest");
    console.log(v);

    mockDAI = new MockERC20("Test DAI", "tDAI");
    /*saveAddress("./deployments/goerli/MockDAI", address(mockDAI));*/

    mockOracle = new MockOracle();
    /*saveAddress("./deployments/goerli/MockOracle", address(mockOracle));*/

    mockProvider = new MockProvider();
    /*saveAddress("./deployments/goerli/MockProvider", address(mockProvider));*/

    connextRouter = new ConnextRouter(weth, connextHandler);
    /*saveAddress("./deployments/goerli/ConnextRouter", address(connextRouter));*/

    vault = new BorrowingVault(
      address(weth),
      address(mockDAI),
      address(mockOracle),
      address(0)
    );
    /*saveAddress("./deployments/goerli/BorrowingVault", address(vault));*/

    vault.setActiveProvider(mockProvider);

    // WETH and DAI prices by Aug 12h 2022
    mockOracle.setPriceOf(address(weth), address(mockDAI), 528881643782407);
    mockOracle.setPriceOf(address(mockDAI), address(weth), 1889069940262927605990);

    vm.stopBroadcast();
  }
}
