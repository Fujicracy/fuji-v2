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

const store: Record<ChainId, { domain: string, routerAddr: string | null }> = {
  [ChainId.POLYGON]: {
    domain: "1886350457",
    routerAddr: "0x403b1E6EFB00C440dDb60593255c1257f4156863",
  },
  [ChainId.OPTIMISM]: {
    domain: "1869640809",
    routerAddr: "0x17744B586A6E47a45Fa98d080141139f87314e82",
  },
  [ChainId.ETHEREUM]: {
    domain: "6648936",
    routerAddr: null,
  },
  [ChainId.ARBITRUM]: {
    domain: "1634886255",
    routerAddr: "0x190B9e10c3A02896386BE180767cf6E89Df5E798",
  },
  [ChainId.GNOSIS]: {
    domain: "6778479",
    routerAddr: "0x9DE0CE8Aaa2772f9DB00D223ce9CA17fc430943B",
  },
};

export async function bumpTransferOn(chainId: ChainId, event: AutotaskEvent): Promise<TransactionRequest> {
  const domain = store[chainId].domain;
  const routerAddr = store[chainId].routerAddr;

  if (routerAddr === null) {
    throw `Missing router address for chain with domain ${domain}`;
  }

  // extracting `transferId` and `destinationDomain` from the xCall event
  const payload = event.request?.body as any;
  const { matchReasons } = payload.events[0];
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
