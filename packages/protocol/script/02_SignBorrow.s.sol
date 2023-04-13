// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {LibSigUtils} from "../src/libraries/LibSigUtils.sol";
import {IVaultPermissions} from "../src/interfaces/IVaultPermissions.sol";

contract SignOptimismGoerliBorrow is ScriptPlus {
  function setUp() public {
    chainName = "optimism-goerli";
  }

  // function run(address receiver) public {
  //   address vault = getAddress("BorrowingVault");
  //   uint256 borrowAmount = 10e18; // 10 DAI

  //   uint256 deadline = block.timestamp + 1 days;

  //   LibSigUtils.Permit memory permit = LibSigUtils.Permit({
  //     chainid: block.chainid,
  //     owner: msg.sender,
  //     operator: getAddress("ConnextRouter"),
  //     receiver: receiver,
  //     amount: borrowAmount,
  //     nonce: IVaultPermissions(vault).nonces(msg.sender),
  //     deadline: deadline
  //   });
  //   bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
  //     IVaultPermissions(vault).DOMAIN_SEPARATOR(), LibSigUtils.getStructHashBorrow(permit)
  //   );

  //   uint256 privKey = getPrivKey();
  //   (uint8 v, bytes32 r, bytes32 s) = vm.sign(privKey, digest);

  //   saveSig("Borrow", deadline, v, r, s);

  //   console.log("Signature (v, r, s):");
  //   console.log(v);
  //   console.logBytes32(r);
  //   console.logBytes32(s);
  // }
}
