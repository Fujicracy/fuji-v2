import { create, SdkConfig } from "@connext/sdk";
import { AutotaskEvent } from "defender-autotask-utils";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";

export async function handler(event: AutotaskEvent) {
  const credentials = event.credentials as string;
  const relayerARN = event.relayerARN as string;
  const relayerParams = { credentials, relayerARN };

  const payload = event.request?.body;
  console.log(payload);
  //const { matchReasons } = payload.events[0];
  //console.log(matchReasons[0].params);

  // or just create Relayer
  const provider = new DefenderRelayProvider(relayerParams);
  const signer = new DefenderRelaySigner(relayerParams, provider, {
    speed: "fast",
  });
  const signerAddress = await signer.getAddress();
  const sdkConfig: SdkConfig = {
    signerAddress,
    network: "mainnet",
    chains: {
      1886350457: {
        providers: [provider.connection.url],
      },
    },
  };
  const { sdkBase } = await create(sdkConfig);
  console.log(sdkBase);

  console.log(JSON.stringify(event));
  return `Hello world from serverless`;
}
