// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
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

  MockERC20 public mockDAI;
  MockProvider public mockProvider;
  MockOracle public mockOracle;

  function setUp() public {
    chainName = "optimism-goerli";

    weth = IWETH9(getAddress("WETH"));
    connextHandler = IConnext(getAddress("ConnextHandler"));
  }

  function run() public {
    vm.startBroadcast();

    /*mockDAI = MockERC20(getAddress("MockDAI"))*/
    mockDAI = new MockERC20("Test DAI", "tDAI");
    saveAddress("MockDAI", address(mockDAI));

    /*mockOracle = MockOracle(getAddress("MockOracle"));*/
    mockOracle = new MockOracle();
    saveAddress("MockOracle", address(mockOracle));

    /*mockProvider = MockProvider(getAddress("MockProvider"));*/
    mockProvider = new MockProvider();
    saveAddress("MockProvider", address(mockProvider));

    /*chief = Chief(getAddress("Chief"));*/
    chief = new Chief();
    saveAddress("Chief", address(chief));
    bytes32 REBALANCER_ROLE = keccak256("REBALANCER_ROLE");
    chief.grantRole(REBALANCER_ROLE, msg.sender);
    chief.setTimelock(msg.sender);

    connextRouter = new ConnextRouter(weth, connextHandler, chief);
    saveAddress("ConnextRouter", address(connextRouter));

    vault = new BorrowingVault(
      address(weth),
      address(mockDAI),
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );
    saveAddress("BorrowingVault-DAI", address(vault));

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    vault.setProviders(providers);
    vault.setActiveProvider(mockProvider);

    // WETH and DAI prices by Nov 11h 2022
    mockOracle.setUSDPriceOf(address(weth), 796341757142697);
    mockOracle.setUSDPriceOf(address(mockDAI), 100000000);

    vm.stopBroadcast();
  }
}
