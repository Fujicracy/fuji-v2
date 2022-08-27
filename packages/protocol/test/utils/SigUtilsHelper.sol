// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

contract SigUtilsHelper {
  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant _PERMIT_ASSET_TYPEHASH = keccak256(
    "PermitAssets(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
  );
  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant _PERMIT_DEBT_TYPEHASH = keccak256(
    "PermitBorrow(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
  );

  struct Permit {
    address owner;
    address spender;
    uint256 amount;
    uint256 nonce;
    uint256 deadline;
  }

  // computes the hash of a permit-asset
  function getStructHashAsset(Permit memory _permit) public pure returns (bytes32) {
    return keccak256(
      abi.encode(
        _PERMIT_ASSET_TYPEHASH,
        _permit.owner,
        _permit.spender,
        _permit.amount,
        _permit.nonce,
        _permit.deadline
      )
    );
  }

  // computes the hash of a permit-borrow
  function getStructHashBorrow(Permit memory _permit) public pure returns (bytes32) {
    return keccak256(
      abi.encode(
        _PERMIT_DEBT_TYPEHASH,
        _permit.owner,
        _permit.spender,
        _permit.amount,
        _permit.nonce,
        _permit.deadline
      )
    );
  }

  // computes the digest
  function gethashTypedDataV4Digest(bytes32 domainSeperator_, bytes32 structHash_)
    external
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked("\x19\x01", domainSeperator_, structHash_));
  }
}
