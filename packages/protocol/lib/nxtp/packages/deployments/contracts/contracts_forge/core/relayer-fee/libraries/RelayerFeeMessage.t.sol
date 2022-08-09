// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "../../../utils/ForgeHelper.sol";

import {TypedMemView, RelayerFeeMessage, RelayerFeeRouter} from "../../../../contracts/core/relayer-fee/RelayerFeeRouter.sol";

contract RelayerFeeMessageTest is ForgeHelper {
  // ============ Libraries ============
  using TypedMemView for bytes;
  using TypedMemView for bytes29;
  using RelayerFeeMessage for bytes29;

  // ============ Utils ============
  function formatMessage(address _recipient, bytes32[] calldata _transferIds)
    internal
    pure
    returns (bytes memory message)
  {
    message = RelayerFeeMessage.formatClaimFees(_recipient, _transferIds);
  }

  function parseMessage(bytes memory _message) internal pure returns (address recipient, bytes32[] memory transferIds) {
    // parse recipient and transferIds from message
    bytes29 _msg = _message.ref(0).mustBeClaimFees();

    recipient = _msg.recipient();
    transferIds = _msg.transferIds();
  }

  // ============ Test set up ============

  function setUp() public {}

  // ============ format/parse ============
  // Should work
  function test_RelayerFeeMessage__formatMessage_parseMessage_works(address _recipient, bytes32[] calldata _transferIds)
    public
  {
    vm.assume(_recipient != address(0) && _transferIds.length != 0);
    bytes memory message = formatMessage(_recipient, _transferIds);

    (address recipient, bytes32[] memory transferIds) = parseMessage(message);
    assertEq(recipient, _recipient);
    assertEq(transferIds.length, _transferIds.length);

    for (uint256 i = 0; i < transferIds.length; i++) {
      assertEq(transferIds[i], _transferIds[i]);
    }
  }
}
