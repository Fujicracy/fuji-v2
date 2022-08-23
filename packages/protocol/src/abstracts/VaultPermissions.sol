// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/draft-EIP712.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {Counters} from "openzeppelin-contracts/contracts/utils/Counters.sol";

contract VaultPermissions is EIP712 {
    using Counters for Counters.Counter;

    event AssetApproval(address indexed owner, address spender, uint256 amount);
    event DebtApproval(address indexed owner, address spender, uint256 amount);

    mapping(address => mapping(address => uint256)) internal _assetAllowance;
    mapping(address => mapping(address => uint256)) internal _debtAllowance;

    mapping(address => Counters.Counter) private _nonces;

    // solhint-disable-next-line var-name-mixedcase
    bytes32 private constant _PERMIT_ASSET_TYPEHASH =
        keccak256(
            "PermitAssets(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );
    // solhint-disable-next-line var-name-mixedcase
    bytes32 private constant _PERMIT_DEBT_TYPEHASH =
        keccak256(
            "PermitDebt(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

    /**
     * @dev Reserve a slot as recommended in OZ {draft-ERC20Permit}.
     */
    // solhint-disable-next-line var-name-mixedcase
    bytes32 private _PERMIT_TYPEHASH_DEPRECATED_SLOT;

    /**
     * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.
     * It's a good idea to use the same `name` that is defined as the BaseVault token name.
     */
    constructor(string memory name_, string memory version_)
        EIP712(name_, version_)
    {}

    /**
     * @dev Based on {IERC20-allowance} for assets.
     * Should be used to override {IERC4626-allowance}.
     */
    function assetAllowance(address owner, address spender)
        public
        view
        returns (uint256)
    {
        return _assetAllowance[owner][spender];
    }

    /**
     * @dev Based on {IERC20-allowance} for debt.
     */
    function debtAllowance(address owner, address spender)
        public
        view
        virtual
        returns (uint256)
    {
        return _debtAllowance[owner][spender];
    }

    /**
     * @dev Based on OZ {ERC20-increaseAllowance} for assets.
     */
    function increaseAssetAllowance(address spender, uint256 byAmount)
        public
        returns (bool)
    {
        address owner = msg.sender;
        _setAssetAllowance(
            owner,
            spender,
            _assetAllowance[owner][spender] + byAmount
        );
        return true;
    }

    /**
     * @dev Based on OZ {ERC20-decreaseAllowance} for assets.
     */
    function decreaseAssetAllowance(address spender, uint256 byAmount)
        public
        returns (bool)
    {
        address owner = msg.sender;
        uint256 currentAllowance = assetAllowance(owner, spender);
        require(
            currentAllowance >= byAmount,
            "ERC20: decreased allowance below zero"
        );
        unchecked {
            _setAssetAllowance(
                owner,
                spender,
                _assetAllowance[owner][spender] - byAmount
            );
        }
        return true;
    }

    /**
     * @dev Based on OZ {ERC20-increaseAllowance} for debt.
     */
    function increaseDebtAllowance(address spender, uint256 byAmount)
        public
        virtual
        returns (bool)
    {
        address owner = msg.sender;
        _setDebtAllowance(
            owner,
            spender,
            _debtAllowance[owner][spender] + byAmount
        );
        return true;
    }

    /**
     * @dev Based on OZ {ERC20-decreaseAllowance} for debt.
     */
    function decreaseDebtAllowance(address spender, uint256 byAmount)
        public
        virtual
        returns (bool)
    {
        address owner = msg.sender;
        uint256 currentAllowance = assetAllowance(owner, spender);
        require(
            currentAllowance >= byAmount,
            "ERC20: decreased allowance below zero"
        );
        unchecked {
            _setDebtAllowance(
                owner,
                spender,
                _debtAllowance[owner][spender] - byAmount
            );
        }
        return true;
    }

    /**
     * @dev See {IERC20Permit-nonces}.
     */
    function nonces(address owner) public view returns (uint256) {
        return _nonces[owner].current();
    }

    /**
     * @dev See {IERC20Permit-DOMAIN_SEPARATOR}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Inspired by {IERC20Permit-permit} for assets.
     */
    function permitAssets(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(block.timestamp <= deadline, "Expired deadline");
        bytes32 structHash = keccak256(
            abi.encode(
                _PERMIT_ASSET_TYPEHASH,
                owner,
                spender,
                value,
                _useNonce(owner),
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, v, r, s);
        require(signer == owner, "Invalid signature");

        _setAssetAllowance(owner, spender, value);
    }

    /**
     * @dev Inspired by {IERC20Permit-permit} for debt.
     */
    function permitDebt(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= deadline, "Expired deadline");

        bytes32 structHash = keccak256(
            abi.encode(
                _PERMIT_DEBT_TYPEHASH,
                owner,
                spender,
                value,
                _useNonce(owner),
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, v, r, s);
        require(signer == owner, "Invalid signature");

        _setDebtAllowance(owner, spender, value);
    }

    /// Internal Functions

    /**
     * @dev Sets `assets amount` as the allowance of `spender` over the `owner` assets.
     * This internal function is equivalent to `approve`, and can be used to
     * ONLY on 'withdrawal()'
     * Emits an {AssetApproval} event.
     * Requirements:
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _setAssetAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), "Zero address");
        require(spender != address(0), "Zero address");
        _assetAllowance[owner][spender] = amount;
        emit AssetApproval(owner, spender, amount);
    }

    /**
     * @dev Sets `debt amount` as the allowance of `spender` over the `owner`'s debt.
     * This internal function is equivalent to `approve`, and can be used to
     * ONLY on 'borrow()'
     * Emits an {DebtApproval} event.
     * Requirements:
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _setDebtAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), "Zero address");
        require(spender != address(0), "Zero address");
        _debtAllowance[owner][spender] = amount;
        emit DebtApproval(owner, spender, amount);
    }

    /**
     * @dev Based on OZ {ERC20-spendAllowance} for assets.
     */
    function _spendAssetAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        uint256 currentAllowance = assetAllowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "Insufficient assetAllowance");
            unchecked {
                _setAssetAllowance(owner, spender, currentAllowance - amount);
            }
        }
    }

    /**
     * @dev Based on OZ {ERC20-spendAllowance} for assets.
     */
    function _spendDebtAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = debtAllowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "Insufficient debtAllowance");
            unchecked {
                _setDebtAllowance(owner, spender, currentAllowance - amount);
            }
        }
    }

    /**
     * @dev "Consume a nonce": return the current value and increment.
     * _Available since v4.1._
     */
    function _useNonce(address owner) internal returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
