// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  mapping(address => uint256) private _balancesDebt;

  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

  function mint(address to, uint256 value) public {
    _mint(to, value);
  }

  function burn(address from, uint256 value) public {
    _burn(from, value);
  }

  function mintDebt(address to, uint256 value) public {
    _balancesDebt[to] += value;
    _mint(to, value);
  }

    function burnDebt(address from, uint256 value) public {
    _balancesDebt[from] -= value;
    _mint(from, value);
  }

  function balanceOfDebt(address who) public view returns (uint256) {
    return _balancesDebt[who];
  }
}
