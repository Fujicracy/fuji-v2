import axios from "axios";
import { AutotaskEvent } from "defender-autotask-utils";
import { TransactionRequest } from "ethers/types/providers";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { ethers } from "ethers";

const ABI = [{
  "inputs": [
    {
      "internalType": "bytes32",
      "name": "transferId",
      "type": "bytes32"
    }
  ],
  "name": "bumpTransfer",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
}];

export enum ChainId {
  ETHEREUM = 1,
  OPTIMISM = 10,
  GNOSIS = 100,
  POLYGON = 137,
  ARBITRUM = 42161,
};

const domains: Record<ChainId, string> = {
  [ChainId.POLYGON]: "1886350457",
  [ChainId.OPTIMISM]: "1869640809",
  [ChainId.ETHEREUM]: "6648936",
  [ChainId.ARBITRUM]: "1634886255",
  [ChainId.GNOSIS]: "6778479",
};

export async function bumpTransferOn(chainId: ChainId, event: AutotaskEvent): Promise<TransactionRequest> {
  const domain = domains[chainId];

  // extracting `transferId` and `destinationDomain` from the xCall event
  const payload = event.request?.body as any;
  const { matchReasons, matchedAddresses } = payload.events[0];

  const routerAddr = matchedAddresses[0];

  console.log(matchReasons[0].params);
  const params = matchReasons[0].params;
  const destinationDomain = params.destDomain;
  const transferId = params.transferId;

  // calling the cloud function to estimate the relayer fee
  const { data: relayerFee } = await axios.get(
    `https://connext-estimate-fees-function-gususkd65q-uc.a.run.app/estimateRelayerFee?originDomain=${domain}&destinationDomain=${destinationDomain}`
  );

  // getting the relayer as a signer
  const credentials = event.credentials as string;
  const relayerARN = event.relayerARN as string;
  const relayerParams = { credentials, relayerARN };

  const provider = new DefenderRelayProvider(relayerParams);
  const signer = new DefenderRelaySigner(relayerParams, provider, {
    speed: "fast",
  });

  // call contract
  const contract = new ethers.Contract(routerAddr, ABI, signer as any);

  return contract.bumpTransfer(transferId, { value: relayerFee })
}
