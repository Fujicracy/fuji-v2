import { createLoggingContext, jsonifyError, NxtpError } from "@connext/nxtp-utils";

import { getContext } from "../../shared";
import { updateRouters } from "../../lib/operations/routers";

// Ought to be configured properly for each network; we consult the chain config below.
export const DEFAULT_SAFE_CONFIRMATIONS = 5;

export const bindRouters = async () => {
  const { logger } = getContext();
  const { requestContext, methodContext } = createLoggingContext(bindRouters.name);
  try {
    logger.debug("Bind routers polling loop start", requestContext, methodContext);
    await updateRouters();
    logger.debug("Bind routers polling loop complete", requestContext, methodContext);
  } catch (err: unknown) {
    logger.error(
      "Error getting txs, waiting for next loop",
      requestContext,
      methodContext,
      jsonifyError(err as NxtpError),
    );
  }
};
