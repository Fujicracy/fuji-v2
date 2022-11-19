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
import {MockProviderV0} from "../src/mocks/MockProviderV0.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeploySystem is ScriptPlus {
  IVault public vault;
  IWETH9 public weth;
  IConnext public connextHandler;
  Chief public chief;

  ConnextRouter public connextRouter;

  MockProviderV0 public mockProvider;
  MockOracle public mockOracle;

  function setUp() public {
    chainName = "optimism-goerli";

    weth = IWETH9(getAddress("WETH"));
    connextHandler = IConnext(getAddress("ConnextHandler"));
  }

  function run() public {
    vm.startBroadcast();

    MockERC20 DAI = MockERC20(getAddress("MockDAI"));
    /*MockERC20 DAI = new MockERC20("Test DAI", "tDAI");*/
    /*saveAddress("MockDAI", address(DAI));*/

    MockERC20 USDC = MockERC20(getAddress("MockUSDC"));
    /*MockERC20 USDC = new MockERC20("Test USDC", "tUSDC");*/
    /*saveAddress("MockUSDC", address(USDC));*/

    MockERC20 USDT = MockERC20(getAddress("MockUSDT"));
    /*MockERC20 USDT = new MockERC20("Test USDT", "tUSDT");*/
    /*saveAddress("MockUSDT", address(USDT));*/

    mockOracle = MockOracle(getAddress("MockOracle"));
    /*mockOracle = new MockOracle();*/
    /*saveAddress("MockOracle", address(mockOracle));*/

    // WETH and DAI prices by Nov 11h 2022
    /*mockOracle.setUSDPriceOf(address(weth), 796341757142697);*/
    /*mockOracle.setUSDPriceOf(address(DAI), 100000000);*/
    /*mockOracle.setUSDPriceOf(address(USDC), 100000000);*/
    /*mockOracle.setUSDPriceOf(address(USDT), 100000000);*/

    mockProvider = MockProviderV0(getAddress("MockProvider"));
    /*mockProvider = new MockProviderV0();*/
    /*saveAddress("MockProvider", address(mockProvider));*/
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief();*/
    /*saveAddress("Chief", address(chief));*/
    /*bytes32 REBALANCER_ROLE = keccak256("REBALANCER_ROLE");*/
    /*chief.grantRole(REBALANCER_ROLE, msg.sender);*/
    /*chief.setTimelock(msg.sender);*/

    /*connextRouter = new ConnextRouter(weth, connextHandler, chief);*/
    /*saveAddress("ConnextRouter", address(connextRouter));*/

    /*BorrowingVault vaultDAI = BorrowingVault(payable(getAddress("BorrowingVault-TESTDAI")));*/
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
    /*vaultUSDT.setActiveProvider(mockProvider);*/

    vm.stopBroadcast();
  }
}
