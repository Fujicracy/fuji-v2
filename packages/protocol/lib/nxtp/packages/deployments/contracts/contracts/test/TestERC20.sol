// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IBridgeToken} from "../core/connext/interfaces/IBridgeToken.sol";
import {ConnextMessage} from "../core/connext/libraries/ConnextMessage.sol";

/**
 * @notice This token is ONLY useful for testing
 * @dev Anybody can mint as many tokens as they like
 * @dev Anybody can burn anyone else's tokens
 */
contract TestERC20 is IBridgeToken, ERC20 {
  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
    _mint(msg.sender, 1000000 ether);
  }

  // ============ IBridgeToken functions ===============
  function initialize() external override {}

  function detailsHash() external view override returns (bytes32) {
    return ConnextMessage.formatDetailsHash(name(), symbol(), decimals());
  }

  function setDetailsHash(bytes32 _detailsHash) external override {}

  function setDetails(
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals
  ) external override {}

  function transferOwnership(address _newOwner) external override {}

  // ============ Token functions ===============
  function balanceOf(address account) public view override(ERC20, IBridgeToken) returns (uint256) {
    return ERC20.balanceOf(account);
  }

  function mint(address account, uint256 amount) external {
    _mint(account, amount);
  }

  function burn(address account, uint256 amount) external {
    _burn(account, amount);
  }

  function symbol() public view override(ERC20, IBridgeToken) returns (string memory) {
    return ERC20.symbol();
  }

  function name() public view override(ERC20, IBridgeToken) returns (string memory) {
    return ERC20.name();
  }

  function decimals() public view override(ERC20, IBridgeToken) returns (uint8) {
    return ERC20.decimals();
  }
}
