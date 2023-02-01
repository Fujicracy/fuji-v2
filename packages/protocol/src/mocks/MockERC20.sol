// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title MockERC20
 *
 * @author Fuijdao Labs
 *
 * @notice Mock implementation of a ERC20 token.
 *
 * @dev This contract also handles lending provider-like
 * logic to allow tracking of token balance in testing.
 */

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  event DepositRecorded(string provider, address from, uint256 value);
  event WithdrawRecorded(string provider, address from, uint256 value);

  mapping(string => mapping(address => uint256)) private _balancesDeposit;

  event BorrowRecorded(string provider, address from, uint256 value);
  event PaybackRecorded(string provider, address from, uint256 value);

  mapping(string => mapping(address => uint256)) private _balancesDebt;

  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

  // mocking WETH
  function deposit() public payable {
    _mint(msg.sender, msg.value);
  }

  // mocking WETH
  function withdraw(uint256 value) public {
    _burn(msg.sender, value);
    payable(msg.sender).transfer(value);
  }

  function mint(address to, uint256 value) public {
    _mint(to, value);
  }

  function burn(address from, uint256 value) public {
    _burn(from, value);
  }

  function makeDeposit(
    address from,
    uint256 value,
    string memory provider
  )
    public
    returns (bool success)
  {
    _balancesDeposit[provider][from] += value;
    _burn(from, value);
    emit DepositRecorded(provider, from, value);
    success = true;
  }

  function withdrawDeposit(
    address to,
    uint256 value,
    string memory provider
  )
    public
    returns (bool success)
  {
    _balancesDeposit[provider][to] -= value;
    _mint(to, value);
    emit WithdrawRecorded(provider, to, value);
    success = true;
  }

  function mintDebt(
    address to,
    uint256 value,
    string memory provider
  )
    public
    returns (bool success)
  {
    _balancesDebt[provider][to] += value;
    _mint(to, value);
    emit BorrowRecorded(provider, to, value);
    success = true;
  }

  function burnDebt(
    address from,
    uint256 value,
    string memory provider
  )
    public
    returns (bool success)
  {
    _balancesDebt[provider][from] -= value;
    _burn(from, value);
    emit PaybackRecorded(provider, from, value);
    success = true;
  }

  function balanceOfDebt(address who, string memory provider) public view returns (uint256) {
    return _balancesDebt[provider][who];
  }

  function balanceOfDeposit(address who, string memory provider) public view returns (uint256) {
    return _balancesDeposit[provider][who];
  }
}
