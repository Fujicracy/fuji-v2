// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";
import {IConnext} from "../../src/interfaces/connext/IConnext.sol";
import {IVaultPermissions} from "../../src/interfaces/IVaultPermissions.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {ConnextRouter} from "../../src/routers/ConnextRouter.sol";
import {MockProvider} from "../../src/mocks/MockProvider.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {IWETH9} from "../../src/helpers/PeripheryPayments.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";
import {Chief} from "../../src/Chief.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {DSTestPlus} from "./DSTestPlus.sol";

contract Setup is DSTestPlus, CoreRoles {
  struct Registry {
    address weth;
    address connext;
  }

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);
  uint256 bobPkey = 0xB;
  address bob = vm.addr(bobPkey);

  uint256 goerliFork;
  uint256 optimismGoerliFork;
  uint256 mumbaiFork;

  uint32 originDomain;

  mapping(uint256 => Registry) private registry;

  IVault public vault;
  Chief public chief;
  TimelockController public timelock;
  ConnextRouter public connextRouter;

  IConnext public connext;

  address public collateralAsset;
  address public debtAsset;

  constructor() {
    goerliFork = vm.createFork("goerli");
    optimismGoerliFork = vm.createFork("optimism_goerli");
    mumbaiFork = vm.createFork("mumbai");

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");

    Registry memory goerli = Registry({
      weth: 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6,
      connext: 0x99A784d082476E551E5fc918ce3d849f2b8e89B6
    });
    registry[GOERLI_DOMAIN] = goerli;

    Registry memory optimismGoerli = Registry({
      weth: 0x74c6FD7D2Bc6a8F0Ebd7D78321A95471b8C2B806,
      connext: 0x705791AD27229dd4CCf41b6720528AfE1bcC2910
    });
    registry[OPTIMISM_GOERLI_DOMAIN] = optimismGoerli;

    Registry memory mumbai = Registry({
      weth: 0xFD2AB41e083c75085807c4A65C0A14FDD93d55A9,
      connext: 0xfeBBcfe9a88aadefA6e305945F2d2011493B15b4
    });
    registry[MUMBAI_DOMAIN] = mumbai;
  }

  function deploy(uint32 domain) public {
    Registry memory reg = registry[domain];
    if (reg.connext == address(0)) {
      revert("No registry for this chain");
    }

    originDomain = domain;

    vm.label(reg.connext, "Connext");

    collateralAsset = reg.weth;
    vm.label(reg.weth, "ConnextWETH");

    MockERC20 tDAI = new MockERC20("Test DAI", "tDAI");
    debtAsset = address(tDAI);
    vm.label(debtAsset, "tDAI");

    connext = IConnext(reg.connext);

    MockProvider mockProvider = new MockProvider();
    // TODO: replace with real oracle
    MockOracle mockOracle = new MockOracle();

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    // WETH and DAI prices by Aug 12h 2022
    mockOracle.setPriceOf(collateralAsset, address(debtAsset), 528881643782407);
    mockOracle.setPriceOf(address(debtAsset), address(collateralAsset), 1889069940262927605990);

    connextRouter = new ConnextRouter(
      IWETH9(collateralAsset),
      IConnext(reg.connext)
    );
    vault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );

    // Configs
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    _utils_setupVaultProvider(vault, providers);

    // addresses are supposed to be the same across different chains
    connextRouter.setRouter(GOERLI_DOMAIN, address(connextRouter));
    connextRouter.setRouter(OPTIMISM_GOERLI_DOMAIN, address(connextRouter));
    connextRouter.setRouter(MUMBAI_DOMAIN, address(connextRouter));
  }

  function _utils_callWithTimelock(bytes memory sendData, IVault vault_) internal {
    timelock.schedule(address(vault_), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(vault_), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProvider(IVault vault_, ILendingProvider[] memory providers_) internal {
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers_);
    _utils_callWithTimelock(sendData, vault_);

    chief.grantRole(REBALANCER_ROLE, address(this));
    vault.setActiveProvider(providers_[0]);
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function _utils_getPermitBorrowArgs(
    address owner,
    address operator,
    uint256 borrowAmount,
    uint256 plusNonce,
    address vault_
  ) internal returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s) {
    deadline = block.timestamp + 1 days;
    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      owner: owner,
      spender: operator,
      amount: borrowAmount,
      nonce: IVaultPermissions(vault_).nonces(owner) + plusNonce,
      deadline: deadline
    });
    bytes32 structHash = LibSigUtils.getStructHashBorrow(permit);
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      structHash
    );
    (v, r, s) = vm.sign(alicePkey, digest);
  }
}
