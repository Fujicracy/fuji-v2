import fastify, { FastifyInstance, FastifyReply } from "fastify";
import pino from "pino";
import {
  AuctionStatus,
  createLoggingContext,
  jsonifyError,
  AuctionsApiPostBidReq,
  AuctionsApiBidResponse,
  AuctionsApiPostBidReqSchema,
  AuctionsApiBidResponseSchema,
  AuctionsApiErrorResponseSchema,
  AuctionsApiErrorResponse,
  AuctionsApiGetAuctionStatusResponse,
  AuctionsApiGetAuctionsStatusResponseSchema,
  AuctionsApiGetQueuedResponseSchema,
  AuctionsApiGetQueuedResponse,
  ClearCacheRequest,
  ClearCacheRequestSchema,
  AdminRequest,
  NxtpError,
} from "@connext/nxtp-utils";

import { getContext } from "../../../sequencer";
import { getOperations } from "../../../lib/operations";
import { AuctionExpired } from "../../../lib/errors";

export const bindServer = () =>
  new Promise<FastifyInstance>((res) => {
    const {
      config,
      logger,
      adapters: { cache },
    } = getContext();
    const server = fastify({ logger: pino({ level: config.logLevel === "debug" ? "debug" : "warn" }) });

    server.get("/ping", async (_req, res) => {
      return res.code(200).send("pong\n");
    });

    server.get<{
      Params: { transferId: string };
      Reply: AuctionsApiGetAuctionStatusResponse | AuctionsApiErrorResponse;
    }>(
      "/auctions/:transferId",
      {
        schema: {
          response: {
            200: AuctionsApiGetAuctionsStatusResponseSchema,
            500: AuctionsApiErrorResponseSchema,
          },
        },
      },
      async (request, response) => {
        const { requestContext, methodContext } = createLoggingContext("GET /auctions/:transferId endpoint");
        try {
          const { transferId } = request.params;
          const status = await cache.auctions.getStatus(transferId);
          if (status === AuctionStatus.None) {
            throw new Error("No auction found for transferId");
          }
          const auction = await cache.auctions.getAuction(transferId);
          if (!auction) {
            throw new Error("Critical error: auction status was present but data not found");
          }

          const task = await cache.auctions.getTask(transferId);

          return response.status(200).send({
            bids: auction.bids,
            status,
            taskId: task?.taskId,
            attempts: task?.attempts,
            timestamps: {
              start: auction.timestamp,
              sent: task?.timestamp,
            },
          });
        } catch (error: unknown) {
          logger.debug(`Auction by TransferId Get Error`, requestContext, methodContext, jsonifyError(error as Error));
          return response
            .code(500)
            .send({ message: `Auction by TransferId Get Error`, error: jsonifyError(error as Error) });
        }
      },
    );

    server.post<{ Body: AuctionsApiPostBidReq; Reply: AuctionsApiBidResponse | AuctionsApiErrorResponse }>(
      "/auctions",
      {
        schema: {
          body: AuctionsApiPostBidReqSchema,
          response: {
            200: AuctionsApiBidResponseSchema,
            500: AuctionsApiErrorResponseSchema,
          },
        },
      },
      async (request, response) => {
        const {
          auctions: { storeBid },
        } = getOperations();
        const { requestContext, methodContext } = createLoggingContext(
          "POST /auctions/:transferId endpoint",
          undefined,
          "",
        );
        try {
          const bid = request.body;
          requestContext.transferId = bid.transferId;
          await storeBid(bid, requestContext);
          return response.status(200).send({ message: "Bid received", transferId: bid.transferId, router: bid.router });
        } catch (error: unknown) {
          const type = (error as NxtpError).type;
          if (type !== AuctionExpired.name) {
            // If this is a routine AuctionExpired error, let's avoid logging it.
            logger.error(`Bid Post Error`, requestContext, methodContext, jsonifyError(error as Error));
          }
          return response.code(500).send({ message: type, error: jsonifyError(error as Error) });
        }
      },
    );

    server.get<{ Reply: AuctionsApiGetQueuedResponse | AuctionsApiErrorResponse }>(
      "/queued",
      {
        schema: {
          response: {
            200: AuctionsApiGetQueuedResponseSchema,
            500: AuctionsApiErrorResponseSchema,
          },
        },
      },
      async (_, response) => {
        const { requestContext, methodContext } = createLoggingContext("GET /queued endpoint");
        try {
          const queued = await cache.auctions.getQueuedTransfers();
          return response.status(200).send({ queued });
        } catch (error: unknown) {
          logger.error(`Pending Bid Get Error`, requestContext, methodContext);
          return response.code(500).send({ message: `Pending Bid Get Error`, error: jsonifyError(error as Error) });
        }
      },
    );

    server.post<{ Body: ClearCacheRequest }>(
      "/clear-cache",
      { schema: { body: ClearCacheRequestSchema } },
      async (req, res) => api.auth.admin(req.body, res, api.post.clearCache),
    );

    server.listen(config.server.pub.port, config.server.pub.host, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      logger.info(`Server listening at ${address}`);
      res(server);
    });
  });

export const api = {
  auth: {
    admin: (body: AdminRequest, res: FastifyReply, nested: (res: FastifyReply) => Promise<void>) => {
      const { config } = getContext();
      const { adminToken } = body;
      if (adminToken !== config.server.adminToken) {
        return res.status(401).send("Unauthorized to perform this operation");
      }
      return nested(res);
    },
  },
  post: {
    clearCache: async (res: FastifyReply) => {
      const {
        adapters: { cache },
      } = getContext();
      await cache.auctions.clear();
      await cache.transfers.clear();
      return res.status(200).send();
    },
  },
};
