// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

/**
 * @notice EIP712 abstract contract for VaultPermissions.
 *
 * @dev https://eips.ethereum.org/EIPS/eip-712[EIP 712] is a standard for hashing and signing of typed structured data.
 *
 * This contract implements the EIP 712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
 * scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
 * ({_hashTypedDataV4}).
 *
 * A big part of this implementation is inspired from
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/EIP712.sol
 *
 * The main difference with OZ is that the "chainid" is not included in the domain separator but in the structHash.
 * The rationale behind is to adapt EIP712 to our cross-chain message signing: allowing a user on chain A to sign
 * a message that will be verified on chain B. If we were to include the "chainid" in the domain separator, that
 * would require the user to switch networks back and forth, because of the limitation:
 * "The user-agent should refuse signing if it does not match the currently active chain.". That would serously
 * deteriorate the UX.
 *
 * Indeed, EIP712 doesn't forbid it as it states that
 * "Protocol designers only need to include the fields that make sense for their signing domain."
 * into the the struct "EIP712Domain". However, we decided to add a ref to "chainid" in the param salt. Together
 * with "chainid" in the typeHash, we assume those provide sufficient security guarantees.
 *
 */
abstract contract EIP712 {
  /* solhint-disable var-name-mixedcase */
  // Cache the domain separator as an immutable value, but also store the chain id that it corresponds to, in order to
  // invalidate the cached domain separator if the chain id changes.
  bytes32 private immutable _CACHED_DOMAIN_SEPARATOR;
  uint256 private immutable _CACHED_CHAIN_ID;
  address private immutable _CACHED_THIS;

  bytes32 private immutable _HASHED_NAME;
  bytes32 private immutable _HASHED_VERSION;
  bytes32 private immutable _TYPE_HASH;

  /**
   * @dev Initializes the domain separator and parameter caches.
   *
   * The meaning of `name` and `version` is specified in
   * https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:
   *
   * - `name`: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
   * - `version`: the current major version of the signing domain.
   *
   * NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
   * contract upgrade].
   */
  constructor(string memory name, string memory version) {
    bytes32 hashedName = keccak256(bytes(name));
    bytes32 hashedVersion = keccak256(bytes(version));
    bytes32 typeHash =
      keccak256("EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)");
    _HASHED_NAME = hashedName;
    _HASHED_VERSION = hashedVersion;
    _CACHED_CHAIN_ID = block.chainid;
    _CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(typeHash, hashedName, hashedVersion);
    _CACHED_THIS = address(this);
    _TYPE_HASH = typeHash;
  }

  /**
   * @dev Returns the domain separator.
   */
  function _domainSeparatorV4() internal view returns (bytes32) {
    if (address(this) == _CACHED_THIS && block.chainid == _CACHED_CHAIN_ID) {
      return _CACHED_DOMAIN_SEPARATOR;
    } else {
      return _buildDomainSeparator(_TYPE_HASH, _HASHED_NAME, _HASHED_VERSION);
    }
  }

  function _buildDomainSeparator(
    bytes32 typeHash,
    bytes32 nameHash,
    bytes32 versionHash
  )
    private
    view
    returns (bytes32)
  {
    return keccak256(
      abi.encode(
        typeHash, nameHash, versionHash, address(this), keccak256(abi.encode(block.chainid))
      )
    );
  }

  /**
   * @dev Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
   * function returns the hash of the fully encoded EIP712 message for this domain.
   *
   * This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:
   *
   * ```solidity
   * bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
   *     keccak256("Mail(address to,string contents)"),
   *     mailTo,
   *     keccak256(bytes(mailContents))
   * )));
   * address signer = ECDSA.recover(digest, signature);
   * ```
   */
  function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32) {
    return ECDSA.toTypedDataHash(_domainSeparatorV4(), structHash);
  }
}
