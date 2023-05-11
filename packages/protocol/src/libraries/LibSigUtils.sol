// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title LibSigUtils
 *
 * @author Fujidao Labs
 *
 * @notice Helper library for permit signing of the vault 'permitWithdraw' and
 * 'permitBorrow'.
 */

import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";
import {IRouter} from "../interfaces/IRouter.sol";

library LibSigUtils {
  // solhint-disable-next-line var-name-mixedcase
  bytes32 internal constant PERMIT_WITHDRAW_TYPEHASH = keccak256(
    "PermitWithdraw(uint256 destChainId,address owner,address operator,address receiver,uint256 amount,uint256 nonce,uint256 deadline,bytes32 actionArgsHash)"
  );
  // solhint-disable-next-line var-name-mixedcase
  bytes32 internal constant PERMIT_BORROW_TYPEHASH = keccak256(
    "PermitBorrow(uint256 destChainId,address owner,address operator,address receiver,uint256 amount,uint256 nonce,uint256 deadline,bytes32 actionArgsHash)"
  );

  struct Permit {
    uint256 chainid;
    address owner;
    address operator;
    address receiver;
    uint256 amount;
    uint256 nonce;
    uint256 deadline;
    bytes32 actionArgsHash;
  }

  function getZeroPermitEncodedArgs(
    address vault,
    address owner,
    address receiver,
    uint256 amount
  )
    public
    pure
    returns (bytes memory)
  {
    bytes32 ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    return abi.encode(vault, owner, receiver, amount, 0, 0, ZERO_BYTES32, ZERO_BYTES32);
  }

  ///@notice Returns the hash of the arguments required in {BaseRouter._internalBundle}
  function getActionArgsHash(
    IRouter.Action[] memory actions,
    bytes[] memory args
  )
    public
    pure
    returns (bytes32)
  {
    return keccak256(abi.encode(actions, args));
  }

  /// @notice Returns the struct type of a permit used for `borrow()` or `withdraw()`.
  function buildPermitStruct(
    address owner,
    address operator,
    address receiver,
    uint256 amount,
    uint256 plusNonce,
    address vault_,
    bytes32 actionArgsHash
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
    permit.actionArgsHash = actionArgsHash;
  }

  /// @notice Returns the hash of a permit-withdraw.
  function getStructHashWithdraw(Permit memory permit) public pure returns (bytes32) {
    return keccak256(
      abi.encode(
        PERMIT_WITHDRAW_TYPEHASH,
        permit.chainid,
        permit.owner,
        permit.operator,
        permit.receiver,
        permit.amount,
        permit.nonce,
        permit.deadline,
        permit.actionArgsHash
      )
    );
  }

  /// @notice Returns the hash of a permit-borrow.
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
        permit.deadline,
        permit.actionArgsHash
      )
    );
  }

  /// @notice Returns the digest.
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
