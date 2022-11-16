// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {IWETH9} from "../src/abstracts/WETH9.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployGoerli is ScriptPlus {
  IVault public vault;
  IWETH9 public weth;
  IConnext public connextHandler;
  Chief public chief;

  ConnextRouter public connextRouter;

  MockProvider public mockProvider;
  MockOracle public mockOracle;

  function setUp() public {
    chainName = "goerli";

    /*weth = IWETH9(getAddress("WETH"));*/
    weth = IWETH9(0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1);
    connextHandler = IConnext(getAddress("ConnextHandler"));
  }

  function run() public {
    vm.startBroadcast();

    /*MockERC20 DAI = MockERC20(getAddress("MockDAI"));*/
    /*MockERC20 USDC = MockERC20(getAddress("MockUSDC"));*/
    /*MockERC20 USDT = MockERC20(getAddress("MockUSDT"));*/
    MockERC20 DAI = new MockERC20("Test DAI", "tDAI");
    saveAddress("MockDAI", address(DAI));

    /*mockOracle = MockOracle(getAddress("MockOracle"));*/
    mockOracle = new MockOracle();
    saveAddress("MockOracle", address(mockOracle));

    // WETH and DAI prices by Nov 11h 2022
    mockOracle.setUSDPriceOf(address(weth), 796341757142697);
    mockOracle.setUSDPriceOf(address(DAI), 100000000);
    /*mockOracle.setUSDPriceOf(address(USDC), 100000000);*/
    /*mockOracle.setUSDPriceOf(address(USDT), 100000000);*/

    /*mockProvider = MockProvider(getAddress("MockProvider"));*/
    mockProvider = new MockProvider();
    saveAddress("MockProvider", address(mockProvider));
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    /*chief = Chief(getAddress("Chief"));*/
    chief = new Chief();
    saveAddress("Chief", address(chief));
    bytes32 REBALANCER_ROLE = keccak256("REBALANCER_ROLE");
    chief.grantRole(REBALANCER_ROLE, msg.sender);
    chief.setTimelock(msg.sender);

    connextRouter = new ConnextRouter(weth, connextHandler, chief);
    saveAddress("ConnextRouter", address(connextRouter));

    BorrowingVault vaultDAI = new BorrowingVault(
      address(weth),
      address(DAI),
      address(mockOracle),
      address(chief),
      "Fuji-V2 TEST-DAI Vault Shares",
      "fv2TESTDAI"
    );
    saveAddress("BorrowingVault-TESTDAI", address(vaultDAI));
    vaultDAI.setProviders(providers);
    vaultDAI.setActiveProvider(mockProvider);

    /*BorrowingVault vaultUSDC = new BorrowingVault(*/
    /*address(weth),*/
    /*address(USDC),*/
    /*address(mockOracle),*/
    /*address(chief),*/
    /*"Fuji-V2 TEST-USDC Vault Shares",*/
    /*"fv2TESTUSDC"*/
    /*);*/
    /*saveAddress("BorrowingVault-TESTUSDC", address(vaultUSDC));*/
    /*vaultUSDC.setProviders(providers);*/
    /*vaultUSDC.setActiveProvider(mockProvider);*/

    /*BorrowingVault vaultUSDT = new BorrowingVault(*/
    /*address(weth),*/
    /*address(USDT),*/
    /*address(mockOracle),*/
    /*address(chief),*/
    /*"Fuji-V2 TEST-USDT Vault Shares",*/
    /*"fv2TESTUSDT"*/
    /*);*/
    /*saveAddress("BorrowingVault-TESTUSDT", address(vaultUSDT));*/
    /*vaultUSDT.setProviders(providers);*/

    vm.stopBroadcast();
  }
}
