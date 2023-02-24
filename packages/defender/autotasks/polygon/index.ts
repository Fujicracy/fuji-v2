import { AutotaskEvent } from "defender-autotask-utils";
//import {
  //DefenderRelayProvider,
  //DefenderRelaySigner,
//} from "defender-relay-client/lib/ethers";

export async function handler(event: AutotaskEvent) {
  const credentials = event.credentials as string;
  const relayerARN = event.relayerARN as string;
  const relayerParams = { credentials, relayerARN };
  console.log(relayerParams);

  const payload = event.request?.body;
  console.log(payload);
  //const { matchReasons } = payload.events[0];
  //console.log(matchReasons[0].params);

  // or just create Relayer
  //const provider = new DefenderRelayProvider(relayerParams);
  //const signer = new DefenderRelaySigner(relayerParams, provider, {
    //speed: "fast",
  //});
  //console.log(signer);

  console.log(JSON.stringify(event));
  return `Hello world from serverless`;
}
