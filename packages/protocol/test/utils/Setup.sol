// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {IConnextHandler} from "nxtp/core/connext/interfaces/IConnextHandler.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {ConnextRouter} from "../../src/routers/ConnextRouter.sol";
import {MockProvider} from "../../src/mocks/MockProvider.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {IWETH9} from "../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {DSTestPlus} from "./DSTestPlus.sol";

contract Setup is DSTestPlus {
  struct Registry {
    address weth;
    address connextHandler;
  }

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);
  uint256 bobPkey = 0xB;
  address bob = vm.addr(bobPkey);

  uint256 goerliFork;
  uint256 optimismGoerliFork;

  uint32 originDomain;
  uint32 destDomain;

  mapping(uint256 => Registry) private registry;

  IVault public vault;
  ConnextRouter public connextRouter;

  IConnextHandler public connextHandler;
  address public connextWETH;

  address public collateralAsset;
  address public debtAsset;
  address public oracle;

  constructor() {
    goerliFork = vm.createFork("goerli");
    optimismGoerliFork = vm.createFork("optimism_goerli");

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");

    Registry memory goerli = Registry({
      weth: 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6,
      connextHandler: 0xB4C1340434920d70aD774309C75f9a4B679d801e
    });
    registry[GOERLI_DOMAIN] = goerli;

    Registry memory optimismGoerli = Registry({
      weth: 0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB,
      connextHandler: 0xe37f1f55eab648dA87047A03CB03DeE3d3fe7eC7
    });
    registry[OPTIMISM_GOERLI_DOMAIN] = optimismGoerli;
  }

  function deploy(uint32 domain) public {
    Registry memory reg = registry[domain];
    if (reg.connextHandler == address(0)) {
      revert("No registry for this chain");
    }

    originDomain = domain;
    destDomain = domain == GOERLI_DOMAIN ? OPTIMISM_GOERLI_DOMAIN : GOERLI_DOMAIN;

    vm.label(reg.connextHandler, "ConnextHandler");

    connextWETH = reg.weth;
    vm.label(reg.weth, "ConnextWETH");

    MockERC20 tCollateral = new MockERC20("Test COLL", "tCOLL");
    collateralAsset = address(tCollateral);
    vm.label(address(tCollateral), "tCOLL");

    MockERC20 tDAI = new MockERC20("Test DAI", "tDAI");
    debtAsset = address(tDAI);
    vm.label(debtAsset, "tDAI");

    connextHandler = IConnextHandler(reg.connextHandler);

    MockProvider mockProvider = new MockProvider();
    MockOracle mockOracle = new MockOracle();

    // WETH and DAI prices by Aug 12h 2022
    /*mockOracle.setPriceOf(address(weth), address(debtAsset), 528881643782407);*/
    /*mockOracle.setPriceOf(address(debtAsset), address(weth), 1889069940262927605990);*/

    connextRouter = new ConnextRouter(
      IWETH9(connextWETH),
      IConnextHandler(reg.connextHandler)
    );
    vault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(mockOracle),
      address(0)
    );

    // Configs
    vault.setActiveProvider(mockProvider);
    connextRouter.setRouter(
      domain == GOERLI_DOMAIN ? OPTIMISM_GOERLI_DOMAIN : GOERLI_DOMAIN, address(0xAbc1)
    );
  }
}
