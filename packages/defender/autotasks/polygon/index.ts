import axios from "axios";
import { AutotaskEvent } from "defender-autotask-utils";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { ethers } from "ethers";

const POLGYGON_DOMAIN = "1886350457";
const ADDRESS = "0x403b1E6EFB00C440dDb60593255c1257f4156863";
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

export async function handler(event: AutotaskEvent) {
  const credentials = event.credentials as string;
  const relayerARN = event.relayerARN as string;
  const relayerParams = { credentials, relayerARN };

  const payload = event.request?.body as any;
  const { matchReasons } = payload.events[0];
  console.log(matchReasons[0].params);

  const params = matchReasons[0].params;
  const destinationDomain = params.destDomain;
  const transferId = params.transferId;

  const { data } = await axios.get(
    `https://connext-estimate-fees-function-gususkd65q-uc.a.run.app/estimateRelayerFee?originDomain=${POLGYGON_DOMAIN}&destinationDomain=${destinationDomain}`
  );

  // or just create Relayer
  const provider = new DefenderRelayProvider(relayerParams);
  const signer = new DefenderRelaySigner(relayerParams, provider, {
    speed: "fast",
  });
  const contract = new ethers.Contract(ADDRESS, ABI, signer);
  const tx = await contract.bumpTransfer(transferId, { value: data })

  //console.log(JSON.stringify(event));
  return tx;
}
