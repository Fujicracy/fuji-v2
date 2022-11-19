// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title LibSigUtils
 * @author Fujidao Labs
 * @notice Helper library for permit signing of the vault 'permitWithdraw' and
 * 'permitBorrow'.
 */

import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";

library LibSigUtils {
  // solhint-disable-next-line var-name-mixedcase
  bytes32 internal constant PERMIT_WITHDRAW_TYPEHASH = keccak256(
    "PermitWithdraw(uint256 destChainId,address owner,address operator,address receiver,uint256 amount,uint256 nonce,uint256 deadline)"
  );
  // solhint-disable-next-line var-name-mixedcase
  bytes32 internal constant PERMIT_BORROW_TYPEHASH = keccak256(
    "PermitBorrow(uint256 destChainId,address owner,address operator,address receiver,uint256 amount,uint256 nonce,uint256 deadline)"
  );

  struct Permit {
    uint256 chainid;
    address owner;
    address operator;
    address receiver;
    uint256 amount;
    uint256 nonce;
    uint256 deadline;
  }

  function buildPermitStruct(
    address owner,
    address operator,
    address receiver,
    uint256 amount,
    uint256 plusNonce,
    address vault_
  )
    public
    view
    returns (Permit memory permit)
  {
    permit.chainid = block.chainid;
    permit.owner = owner;
    permit.operator = operator;
    permit.receiver = receiver;
    permit.amount = amount;
    permit.nonce = IVaultPermissions(vault_).nonces(owner) + plusNonce;
    permit.deadline = block.timestamp + 1 days;
  }

  // computes the hash of a permit-asset
  function getStructHashAsset(Permit memory permit) public pure returns (bytes32) {
    return keccak256(
      abi.encode(
        PERMIT_WITHDRAW_TYPEHASH,
        permit.chainid,
        permit.owner,
        permit.operator,
        permit.receiver,
        permit.amount,
        permit.nonce,
        permit.deadline
      )
    );
  }

  // computes the hash of a permit-borrow
  function getStructHashBorrow(Permit memory permit) public pure returns (bytes32) {
    return keccak256(
      abi.encode(
        PERMIT_BORROW_TYPEHASH,
        permit.chainid,
        permit.owner,
        permit.operator,
        permit.receiver,
        permit.amount,
        permit.nonce,
        permit.deadline
      )
    );
  }

  // computes the digest
  function getHashTypedDataV4Digest(
    bytes32 domainSeperator,
    bytes32 structHash
  )
    external
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked("\x19\x01", domainSeperator, structHash));
  }
}
