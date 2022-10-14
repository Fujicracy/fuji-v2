// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;
// ============= Structs =============

/**
 * @notice These are the call parameters that will remain constant between the
 * two chains. They are supplied on `xcall` and should be asserted on `execute`
 * @property to - The account that receives funds, in the event of a crosschain call,
 * will receive funds if the call fails.
 * @param to - The address you are sending funds (and potentially data) to
 * @param callData - The data to execute on the receiving chain. If no crosschain call is needed, then leave empty.
 * @param originDomain - The originating domain (i.e. where `xcall` is called). Must match nomad domain schema
 * @param destinationDomain - The final domain (i.e. where `execute` / `reconcile` are called). Must match nomad domain schema
 * @param agent - An address who can execute txs on behalf of `to`, in addition to allowing relayers
 * @param recovery - The address to send funds to if your `Executor.execute call` fails
 * @param callback - The address on the origin domain of the callback contract
 * @param callbackFee - The relayer fee to execute the callback
 * @param forceSlow - If true, will take slow liquidity path even if it is not a permissioned call
 * @param receiveLocal - If true, will use the local nomad asset on the destination instead of adopted.
 * @param relayerFee - The amount of relayer fee the tx called xcall with
 * @param slippageTol - Max bps of original due to slippage (i.e. would be 9995 to tolerate .05% slippage)
 */
struct CallParams {
  address to;
  bytes callData;
  uint32 originDomain;
  uint32 destinationDomain;
  address agent;
  address recovery;
  bool forceSlow;
  bool receiveLocal;
  address callback;
  uint256 callbackFee;
  uint256 relayerFee;
  uint256 destinationMinOut;
}

/**
 * @notice The arguments you supply to the `xcall` function called by user on origin domain
 * @param params - The CallParams. These are consistent across sending and receiving chains
 * @param transactingAsset - The asset the caller sent with the transfer. Can be the adopted, canonical,
 * or the representational asset.
 * @param transactingAmount - The amount of transferring asset supplied by the user in the `xcall`.
 * @param originMinOut - Minimum amount received on swaps for adopted <> local on origin chain
 */
struct XCallArgs {
  CallParams params;
  address transactingAsset; // Could be adopted, local, or canonical.
  uint256 transactingAmount;
  uint256 originMinOut;
}

/**
 * @param _transferId Unique identifier of transaction id that necessitated
 * calldata execution
 * @param _amount The amount to approve or send with the call
 * @param _to The address to execute the calldata on
 * @param _assetId The assetId of the funds to approve to the contract or
 * send along with the call
 * @param _properties The origin properties
 * @param _callData The data to execute
 */
struct ExecutorArgs {
  bytes32 transferId;
  uint256 amount;
  address to;
  address recovery;
  address assetId;
  address originSender;
  uint32 originDomain;
  bytes callData;
}

interface IConnextHandler {
  function domain() external view returns (uint256);
  function executor() external view returns (address);
  function xcall(XCallArgs calldata _args) external payable returns (bytes32);
}

interface IExecutor {
  function execute(ExecutorArgs calldata _args)
    external
    returns (bool success, bytes memory returnData);
}
