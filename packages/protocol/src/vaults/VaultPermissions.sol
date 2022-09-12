// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";
import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/draft-EIP712.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {Counters} from "openzeppelin-contracts/contracts/utils/Counters.sol";

contract VaultPermissions is IVaultPermissions, EIP712 {
  using Counters for Counters.Counter;

  mapping(address => mapping(address => uint256)) internal _withdrawAllowance;
  mapping(address => mapping(address => uint256)) internal _borrowAllowance;

  mapping(address => Counters.Counter) private _nonces;

  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant PERMIT_WITHDRAW_TYPEHASH = keccak256(
    "PermitWithdraw(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
  );
  // solhint-disable-next-line var-name-mixedcase
  bytes32 private constant _PERMIT_BORROW_TYPEHASH = keccak256(
    "PermitBorrow(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
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
  function withdrawAllowance(address owner, address spender) public view override returns (uint256) {
    return _withdrawAllowance[owner][spender];
  }

  /// @inheritdoc IVaultPermissions
  function borrowAllowance(address owner, address spender)
    public
    view
    virtual
    override
    returns (uint256)
  {
    return _borrowAllowance[owner][spender];
  }

  /// @inheritdoc IVaultPermissions
  function increaseWithdrawAllowance(address spender, uint256 byAmount)
    public
    override
    returns (bool)
  {
    address owner = msg.sender;
    _setWithdrawAllowance(owner, spender, _withdrawAllowance[owner][spender] + byAmount);
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function decreaseWithdrawAllowance(address spender, uint256 byAmount)
    public
    override
    returns (bool)
  {
    address owner = msg.sender;
    uint256 currentAllowance = withdrawAllowance(owner, spender);
    require(currentAllowance >= byAmount, "ERC20: decreased allowance below zero");
    unchecked {
      _setWithdrawAllowance(owner, spender, _withdrawAllowance[owner][spender] - byAmount);
    }
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function increaseBorrowAllowance(address spender, uint256 byAmount)
    public
    virtual
    override
    returns (bool)
  {
    address owner = msg.sender;
    _setBorrowAllowance(owner, spender, _borrowAllowance[owner][spender] + byAmount);
    return true;
  }

  /// @inheritdoc IVaultPermissions
  function decreaseBorrowAllowance(address spender, uint256 byAmount)
    public
    virtual
    override
    returns (bool)
  {
    address owner = msg.sender;
    uint256 currentAllowance = withdrawAllowance(owner, spender);
    require(currentAllowance >= byAmount, "ERC20: decreased allowance below zero");
    unchecked {
      _setBorrowAllowance(owner, spender, _borrowAllowance[owner][spender] - byAmount);
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
    address spender,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    override
  {
    require(block.timestamp <= deadline, "Expired deadline");
    bytes32 structHash = keccak256(
      abi.encode(PERMIT_WITHDRAW_TYPEHASH, owner, spender, amount, _useNonce(owner), deadline)
    );
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(digest, v, r, s);
    require(signer == owner, "Invalid signature");

    _setWithdrawAllowance(owner, spender, amount);
  }

  /// @inheritdoc IVaultPermissions
  function permitBorrow(
    address owner,
    address spender,
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
    require(block.timestamp <= deadline, "Expired deadline");
    bytes32 structHash = keccak256(
      abi.encode(_PERMIT_BORROW_TYPEHASH, owner, spender, amount, _useNonce(owner), deadline)
    );
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(digest, v, r, s);
    require(signer == owner, "Invalid signature");

    _setBorrowAllowance(owner, spender, amount);
  }

  /// Internal Functions

  /**
   * @dev Sets `assets amount` as the allowance of `spender` over the `owner` assets.
   * This internal function is equivalent to `approve`, and can be used to
   * ONLY on 'withdrawal()'
   * Emits an {WithdrawApproval} event.
   * Requirements:
   * - `owner` cannot be the zero address.
   * - `spender` cannot be the zero address.
   */
  function _setWithdrawAllowance(address owner, address spender, uint256 amount) internal {
    require(owner != address(0), "Zero address");
    require(spender != address(0), "Zero address");
    _withdrawAllowance[owner][spender] = amount;
    emit WithdrawApproval(owner, spender, amount);
  }

  /**
   * @dev Sets `amount` as the borrow allowance of `spender` over the `owner`'s debt.
   * This internal function is equivalent to `approve`, and can be used to
   * ONLY on 'borrow()'
   * Emits an {BorrowApproval} event.
   * Requirements:
   * - `owner` cannot be the zero address.
   * - `spender` cannot be the zero address.
   */
  function _setBorrowAllowance(address owner, address spender, uint256 amount) internal {
    require(owner != address(0), "Zero address");
    require(spender != address(0), "Zero address");
    _borrowAllowance[owner][spender] = amount;
    emit BorrowApproval(owner, spender, amount);
  }

  /**
   * @dev Based on OZ {ERC20-spendAllowance} for assets.
   */
  function _spendWithdrawAllowance(address owner, address spender, uint256 amount) internal {
    uint256 currentAllowance = withdrawAllowance(owner, spender);
    if (currentAllowance != type(uint256).max) {
      require(currentAllowance >= amount, "Insufficient withdrawAllowance");
      unchecked {
        _setWithdrawAllowance(owner, spender, currentAllowance - amount);
      }
    }
  }

  /**
   * @dev Based on OZ {ERC20-spendAllowance} for assets.
   */
  function _spendBorrowAllowance(address owner, address spender, uint256 amount) internal virtual {
    uint256 currentAllowance = _borrowAllowance[owner][spender];
    if (currentAllowance != type(uint256).max) {
      require(currentAllowance >= amount, "Insufficient borrowAllowance");
      unchecked {
        _setBorrowAllowance(owner, spender, currentAllowance - amount);
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
}
