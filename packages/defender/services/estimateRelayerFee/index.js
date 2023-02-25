import functions from "@google-cloud/functions-framework";
import { create } from "@connext/sdk";

const INFURA_ID = process.env.INFURA_ID;

const sdkConfig = {
  network: "mainnet",
  chains: {
    // Ethereum
    6648936: {
      providers: [`https://mainnet.infura.io/v3/${INFURA_ID}`],
    },
    // Polygon
    1886350457: {
      providers: [`https://polygon-mainnet.infura.io/v3/${INFURA_ID}`],
    },
    // Optimism
    1869640809: {
      providers: [`https://optimism-mainnet.infura.io/v3/${INFURA_ID}`],
    },
    // Arbitrum
    1634886255: {
      providers: [`https://arbitrum-mainnet.infura.io/v3/${INFURA_ID}`],
    },
    // Gnosis
    6778479: {
      providers: ["https://rpc.gnosischain.com/"],
    },
    // BNB
    6450786: {
      providers: ["https://bsc-dataseed.binance.org/"],
    },
  },
};

async function estimateRelayerFee(req, res) {
  const originDomain = req.query.originDomain;
  const destinationDomain = req.query.destinationDomain;
  const { sdkBase } = await create(sdkConfig);
  const relayerFee = (
    await sdkBase.estimateRelayerFee({
      originDomain, 
      destinationDomain
    })
  ).toString();

  res.send(relayerFee);
}

functions.http("estimateRelayerFee", estimateRelayerFee);
