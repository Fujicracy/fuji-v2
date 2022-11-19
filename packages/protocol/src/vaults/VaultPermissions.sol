// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";
import {EIP712} from "../abstracts/EIP712.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {Counters} from "openzeppelin-contracts/contracts/utils/Counters.sol";

contract VaultPermissions is IVaultPermissions, EIP712 {
  using Counters for Counters.Counter;

  /// custom errors
  error VaultPermissions__zeroAddress();
  error VaultPermissions__expiredDeadline();
  error VaultPermissions__invalidSignature();
  error VaultPermissions__insufficientWithdrawAllowance();
  error VaultPermissions__insufficientBorrowAllowance();
  error VaultPermissions__allowanceBelowZero();

  /// Allowance structure:
  /// owner => operator => receiver => amount
  mapping(address => mapping(address => mapping(address => uint256))) internal _withdrawAllowance;
  mapping(address => mapping(address => mapping(address => uint256))) internal _borrowAllowance;

  mapping(address => Counters.Counter) private _nonces;

  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant PERMIT_WITHDRAW_TYPEHASH = keccak256(
    "PermitWithdraw(uint256 chainid,address owner,address operator,address receiver,uint256 amount,uint256 nonce,uint256 deadline)"
  );
  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant PERMIT_BORROW_TYPEHASH = keccak256(
    "PermitBorrow(uint256 chainid,address owner,address operator,address receiver,uint256 amount,uint256 nonce,uint256 deadline)"
  );

  /**
   * @dev Reserve a slot as recommended in OZ {draft-ERC20Permit}.
   */
  // solhint-disable-next-line var-name-mixedcase
  bytes32 private _PERMIT_TYPEHASH_DEPRECATED_SLOT;

  /**
   * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to "1".
   * It's a good idea to use the same `name` that is defined as the BaseVault token name.
   */
  constructor(string memory name_) EIP712(name_, "1") {}

  /// @inheritdoc IVaultPermissions
  function withdrawAllowance(
    address owner,
    address operator,
    address receiver
  )
    public
    view
    override
    returns (uint256)
  {
    return _withdrawAllowance[owner][operator][receiver];
  }

  /// @inheritdoc IVaultPermissions
  function borrowAllowance(
    address owner,
    address operator,
    address receiver
  )
    public
    view
    virtual
    override
    returns (uint256)
  {
    return _borrowAllowance[owner][operator][receiver];
  }

  /// @inheritdoc IVaultPermissions
  function increaseWithdrawAllowance(
    address operator,
    address receiver,
    uint256 byAmount
  )
    public
    override
    returns (bool)
  {
    address owner = msg.sender;
    _setWithdrawAllowance(
      owner, operator, receiver, _withdrawAllowance[owner][operator][receiver] + byAmount
    );
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function decreaseWithdrawAllowance(
    address operator,
    address receiver,
    uint256 byAmount
  )
    public
    override
    returns (bool)
  {
    address owner = msg.sender;
    uint256 currentAllowance = _withdrawAllowance[owner][operator][receiver];
    if (byAmount > currentAllowance) {
      revert VaultPermissions__allowanceBelowZero();
    }
    unchecked {
      _setWithdrawAllowance(owner, operator, receiver, currentAllowance - byAmount);
    }
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function increaseBorrowAllowance(
    address operator,
    address receiver,
    uint256 byAmount
  )
    public
    virtual
    override
    returns (bool)
  {
    address owner = msg.sender;
    _setBorrowAllowance(
      owner, operator, receiver, _borrowAllowance[owner][operator][receiver] + byAmount
    );
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function decreaseBorrowAllowance(
    address operator,
    address receiver,
    uint256 byAmount
  )
    public
    virtual
    override
    returns (bool)
  {
    address owner = msg.sender;
    uint256 currentAllowance = _borrowAllowance[owner][operator][receiver];
    if (byAmount > currentAllowance) {
      revert VaultPermissions__allowanceBelowZero();
    }
    unchecked {
      _setBorrowAllowance(owner, operator, receiver, currentAllowance - byAmount);
    }
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function nonces(address owner) public view override returns (uint256) {
    return _nonces[owner].current();
  }

  /// @inheritdoc IVaultPermissions
  // solhint-disable-next-line func-name-mixedcase
  function DOMAIN_SEPARATOR() external view returns (bytes32) {
    return _domainSeparatorV4();
  }

  /// @inheritdoc IVaultPermissions
  function permitWithdraw(
    address owner,
    address receiver,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    override
  {
    _checkDeadline(deadline);
    address operator = msg.sender;
    bytes32 structHash = keccak256(
      abi.encode(
        PERMIT_WITHDRAW_TYPEHASH,
        block.chainid,
        owner,
        operator,
        receiver,
        amount,
        _useNonce(owner),
        deadline
      )
    );
    _checkSigner(structHash, owner, v, r, s);

    _setWithdrawAllowance(owner, operator, receiver, amount);
  }

  /// @inheritdoc IVaultPermissions
  function permitBorrow(
    address owner,
    address receiver,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    virtual
    override
  {
    _checkDeadline(deadline);
    address operator = msg.sender;
    bytes32 structHash = keccak256(
      abi.encode(
        PERMIT_BORROW_TYPEHASH,
        block.chainid,
        owner,
        operator,
        receiver,
        amount,
        _useNonce(owner),
        deadline
      )
    );
    _checkSigner(structHash, owner, v, r, s);

    _setBorrowAllowance(owner, operator, receiver, amount);
  }

  /// Internal Functions

  /**
   * @dev Sets `assets amount` as the allowance of `operator` over the `owner` assets.
   * This internal function is equivalent to `approve`, and can be used to
   * ONLY on 'withdrawal()'
   * Emits an {WithdrawApproval} event.
   * Requirements:
   * - `owner` cannot be the zero address.
   * - `operator` cannot be the zero address.
   */
  function _setWithdrawAllowance(
    address owner,
    address operator,
    address receiver,
    uint256 amount
  )
    internal
  {
    if (owner == address(0) || operator == address(0) || receiver == address(0)) {
      revert VaultPermissions__zeroAddress();
    }
    _withdrawAllowance[owner][operator][receiver] = amount;
    emit WithdrawApproval(owner, operator, receiver, amount);
  }

  /**
   * @dev Sets `amount` as the borrow allowance of `operator` over the `owner`'s debt.
   * This internal function is equivalent to `approve`, and can be used to
   * ONLY on 'borrow()'
   * Emits an {BorrowApproval} event.
   * Requirements:
   * - `owner` cannot be the zero address.
   * - `operator` cannot be the zero address.
   */
  function _setBorrowAllowance(
    address owner,
    address operator,
    address receiver,
    uint256 amount
  )
    internal
  {
    if (owner == address(0) || operator == address(0) || receiver == address(0)) {
      revert VaultPermissions__zeroAddress();
    }
    _borrowAllowance[owner][operator][receiver] = amount;
    emit BorrowApproval(owner, operator, receiver, amount);
  }

  /**
   * @dev Based on OZ {ERC20-spendAllowance} for assets.
   */
  function _spendWithdrawAllowance(
    address owner,
    address operator,
    address receiver,
    uint256 amount
  )
    internal
  {
    uint256 currentAllowance = withdrawAllowance(owner, operator, receiver);
    if (currentAllowance != type(uint256).max) {
      if (amount > currentAllowance) {
        revert VaultPermissions__insufficientWithdrawAllowance();
      }
      unchecked {
        _setWithdrawAllowance(owner, operator, receiver, currentAllowance - amount);
      }
    }
  }

  /**
   * @dev Based on OZ {ERC20-spendAllowance} for assets.
   */
  function _spendBorrowAllowance(
    address owner,
    address operator,
    address receiver,
    uint256 amount
  )
    internal
    virtual
  {
    uint256 currentAllowance = _borrowAllowance[owner][operator][receiver];
    if (currentAllowance != type(uint256).max) {
      if (amount > currentAllowance) {
        revert VaultPermissions__insufficientBorrowAllowance();
      }
      unchecked {
        _setBorrowAllowance(owner, operator, receiver, currentAllowance - amount);
      }
    }
  }

  /**
   * @dev "Consume a nonce": return the current amount and increment.
   * _Available since v4.1._
   */
  function _useNonce(address owner) internal returns (uint256 current) {
    Counters.Counter storage nonce = _nonces[owner];
    current = nonce.current();
    nonce.increment();
  }

  /**
   * @dev Reverts if block.timestamp is expired according to `deadline`.
   */
  function _checkDeadline(uint256 deadline) private view {
    // require(block.timestamp <= deadline, "Expired deadline");
    if (block.timestamp > deadline) {
      revert VaultPermissions__expiredDeadline();
    }
  }

  /**
   * @dev Reverts if `presumedOwner` is not signer of `structHash`.
   */
  function _checkSigner(
    bytes32 structHash,
    address presumedOwner,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    internal
    view
  {
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(digest, v, r, s);
    if (signer != presumedOwner) {
      revert VaultPermissions__invalidSignature();
    }
  }
}
