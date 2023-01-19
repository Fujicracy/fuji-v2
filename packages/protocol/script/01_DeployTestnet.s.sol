// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVaultFactory} from "../src/vaults/borrowing/BorrowingVaultFactory.sol";
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

contract DeployTestnet is ScriptPlus {
  IWETH9 WETH;
  Chief chief;
  BorrowingVaultFactory factory;
  IConnext connextHandler;

  ConnextRouter connextRouter;

  MockProviderV0 mockProvider;
  MockOracle mockOracle;
  MockERC20 DAI;
  MockERC20 USDC;
  MockERC20 USDT;

  function setUp() public {
    chainName = "mumbai";

    WETH = IWETH9(getAddress("WETH"));
    connextHandler = IConnext(getAddress("ConnextHandler"));
  }

  function run() public {
    vm.startBroadcast();

    DAI = MockERC20(getAddress("MockDAI"));
    /*DAI = new MockERC20("Test DAI", "tDAI");*/
    /*saveAddress("MockDAI", address(DAI));*/

    USDC = MockERC20(getAddress("MockUSDC"));
    /*USDC = new MockERC20("Test USDC", "tUSDC");*/
    /*saveAddress("MockUSDC", address(USDC));*/

    USDT = MockERC20(getAddress("MockUSDT"));
    /*USDT = new MockERC20("Test USDT", "tUSDT");*/
    /*saveAddress("MockUSDT", address(USDT));*/

    mockOracle = MockOracle(getAddress("MockOracle"));
    /*mockOracle = new MockOracle();*/
    /*saveAddress("MockOracle", address(mockOracle));*/

    // WETH and DAI prices by Nov 11h 2022
    /*mockOracle.setUSDPriceOf(address(WETH), 796341757142697);*/
    /*mockOracle.setUSDPriceOf(address(DAI), 100000000);*/
    /*mockOracle.setUSDPriceOf(address(USDC), 100000000);*/
    /*mockOracle.setUSDPriceOf(address(USDT), 100000000);*/

    mockProvider = MockProviderV0(getAddress("MockProvider"));
    /*mockProvider = new MockProviderV0();*/
    /*saveAddress("MockProvider", address(mockProvider));*/

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief(true, true);*/
    /*saveAddress("Chief", address(chief));*/
    /*bytes32 REBALANCER_ROLE = keccak256("REBALANCER_ROLE");*/
    /*chief.grantRole(REBALANCER_ROLE, msg.sender);*/
    /*chief.setTimelock(msg.sender);*/

    /*connextRouter = new ConnextRouter(WETH, connextHandler, chief);*/
    /*saveAddress("ConnextRouter", address(connextRouter));*/

    factory = BorrowingVaultFactory(getAddress("BorrowingVaultFactory"));
    /*factory = new BorrowingVaultFactory(address(chief));*/
    /*saveAddress("BorrowingVaultFactory", address(factory));*/
    /*factory.setContractCode(vm.getCode("BorrowingVault.sol:BorrowingVault"));*/
    /*chief.allowVaultFactory(address(factory), true);*/

    /*_deployVault(address(WETH), address(DAI), "BorrowingVault-TESTDAI");*/
    _deployVault(address(WETH), address(USDC), "BorrowingVault-TESTUSDC");
    /*_deployVault(address(WETH), address(USDT), "BorrowingVault-TESTUSDT");*/

    vm.stopBroadcast();
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debtAsset, address(mockOracle)), 95
    );
    saveAddress(name, vault);

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    BorrowingVault(payable(vault)).setProviders(providers);

    BorrowingVault(payable(vault)).setActiveProvider(mockProvider);
  }
}
