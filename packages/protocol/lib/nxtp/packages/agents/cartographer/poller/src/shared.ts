import { ChainData, Logger } from "@connext/nxtp-utils";
import { SubgraphReader as _SubgraphReader } from "@connext/nxtp-adapters-subgraph";

import { CartographerConfig } from "./config";
import { Database } from "./adapters/database";

export const SubgraphReader = _SubgraphReader;

export type AppContext = {
  logger: Logger;
  adapters: {
    subgraph: _SubgraphReader; // Aggregates subgraphs in a FallbackSubgraph for each chain.
    database: Database; // Database adapter.
  };
  config: CartographerConfig;
  chainData: Map<string, ChainData>;
  domains: string[]; // List of all supported domains.
};

export const context: AppContext = {} as any;
export const getContext = () => context;
