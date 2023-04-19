import { ConnextTxStatus, RoutingStepDetails } from '@x-fuji/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import {
  formatCrosschainNotificationMessage,
  NOTIFICATION_MESSAGES,
} from '../constants';
import { chainName } from '../helpers/chains';
import {
  HistoryEntry,
  HistoryEntryStatus,
  toHistoryRoutingStep,
  triggerUpdatesFromSteps,
  wait,
} from '../helpers/history';
import {
  getTransactionLink,
  NotificationDuration,
  notify,
} from '../helpers/notifications';
import { watchTransaction } from '../helpers/transactions';
import { sdk } from '../services/sdk';
import { usePositions } from './positions.store';

export type HistoryStore = HistoryState & HistoryActions;

type HistoryState = {
  transactions: string[];
  ongoingTransactions: string[];
  entries: Record<string, HistoryEntry>;

  currentTxHash?: string; // The tx hash displayed in modal
};

type HistoryActions = {
  add: (hash: string, vaultAddr: string, steps: RoutingStepDetails[]) => void;
  update: (hash: string, patch: Partial<HistoryEntry>) => void;
  clearAll: () => void;
  watch: (hash: string) => void;

  openModal: (hash: string) => void;
  closeModal: () => void;
};

const initialState: HistoryState = {
  transactions: [],
  ongoingTransactions: [],
  entries: {},
};

export const useHistory = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        async add(hash, vaultAddress, steps) {
          const srcChainId = steps[0].chainId;
          const destChainId = steps[steps.length - 1].chainId;
          const isCrossChain = srcChainId !== destChainId;
          const sourceChain = {
            chainId: srcChainId,
            status: HistoryEntryStatus.ONGOING,
            hash,
          };
          const destinationChain = isCrossChain
            ? {
                chainId: destChainId,
                status: HistoryEntryStatus.ONGOING,
              }
            : undefined;

          const entry = {
            vaultAddress,
            hash,
            sourceChain,
            destinationChain,
            isCrossChain,
            steps: toHistoryRoutingStep(steps),
            status: HistoryEntryStatus.ONGOING,
          };

          set(
            produce((s: HistoryState) => {
              s.currentTxHash = hash;
              s.entries[hash] = entry;
              s.transactions = [hash, ...s.transactions];
              s.ongoingTransactions = [hash, ...s.ongoingTransactions];
            })
          );

          get().watch(hash);
        },

        async watch(hash) {
          const entry = get().entries[hash];

          const remove = () => {
            const ongoingTransactions = get().ongoingTransactions.filter(
              (h) => h !== hash
            );
            set({ ongoingTransactions });
          };

          if (!entry) {
            remove();
            return;
          }

          const finish = (success: boolean) => {
            triggerUpdatesFromSteps(entry.steps);

            const isDestination =
              entry.isCrossChain &&
              entry.destinationChain &&
              entry.sourceChain.status === HistoryEntryStatus.SUCCESS;

            set(
              produce((s: HistoryState) => {
                const entry = s.entries[hash];
                entry.status = success
                  ? HistoryEntryStatus.SUCCESS
                  : HistoryEntryStatus.FAILURE;

                if (isDestination && entry.destinationChain) {
                  entry.destinationChain.status = success
                    ? HistoryEntryStatus.SUCCESS
                    : HistoryEntryStatus.FAILURE;
                } else {
                  entry.sourceChain.status = success
                    ? HistoryEntryStatus.SUCCESS
                    : HistoryEntryStatus.FAILURE;
                }
              })
            );

            const linkHash =
              isDestination && entry.destinationChain
                ? entry.destinationChain.hash
                : entry.hash;

            notify({
              type: success ? 'success' : 'error',
              message: success
                ? NOTIFICATION_MESSAGES.TX_SUCCESS
                : NOTIFICATION_MESSAGES.TX_FAILURE,
              duration: success
                ? NotificationDuration.LONG
                : NotificationDuration.MEDIUM,
              link: linkHash
                ? getTransactionLink({
                    hash: linkHash,
                    chainId:
                      isDestination && entry.destinationChain
                        ? entry.destinationChain.chainId
                        : entry.sourceChain.chainId,
                  })
                : undefined,
            });

            if (success) {
              usePositions.getState().fetchUserPositions();
            }
          };

          try {
            const result = await watchTransaction(
              entry.sourceChain.chainId,
              hash
            );
            if (!result.success) {
              throw result.error;
            }
            set(
              produce((s: HistoryState) => {
                s.entries[hash].sourceChain.status = HistoryEntryStatus.SUCCESS;
              })
            );
            if (!entry.isCrossChain && !entry.destinationChain) {
              finish(true);
              return;
            }
            if (!entry.sourceChain.shown) {
              notify({
                type: 'success',
                message: formatCrosschainNotificationMessage(
                  chainName(entry.sourceChain.chainId),
                  chainName(entry.destinationChain?.chainId)
                ),
                link: getTransactionLink({
                  hash: entry.hash,
                  chainId: entry.sourceChain.chainId,
                }),
              });
              set(
                produce((s: HistoryState) => {
                  s.entries[hash].sourceChain.shown = true;
                })
              );
            }

            let crosschainCallFinished = false;
            while (!crosschainCallFinished) {
              await wait(3000); // Wait for three seconds between each call
              const crosschainResult = await sdk.getConnextTxDetails(
                entry.sourceChain.chainId,
                entry.hash
              );
              if (!crosschainResult.success) {
                throw crosschainResult.error;
              }
              if (crosschainResult.data.status === ConnextTxStatus.EXECUTED) {
                crosschainCallFinished = true;
              }
              set(
                produce((s: HistoryState) => {
                  const e = s.entries[hash];
                  if (
                    crosschainResult.data.connextTransferId &&
                    crosschainResult.data.status !== ConnextTxStatus.UNKNOWN &&
                    !e.connext
                  ) {
                    e.connext = {
                      transferId: crosschainResult.data.connextTransferId,
                      timestamp: Date.now(),
                    };
                  }
                  if (!e.destinationChain) return;
                  if (
                    crosschainResult.data.destTxHash &&
                    !e.destinationChain?.hash
                  ) {
                    e.destinationChain.hash = crosschainResult.data.destTxHash;
                  }
                  if (
                    crosschainResult.data.status === ConnextTxStatus.EXECUTED &&
                    e.destinationChain.status !== HistoryEntryStatus.SUCCESS
                  ) {
                    e.destinationChain.status = HistoryEntryStatus.SUCCESS;
                  }
                })
              );
            }
            finish(true);
          } catch (e) {
            finish(false);
          } finally {
            remove();
          }
        },

        update(hash, patch) {
          const entry = get().entries[hash];
          if (!entry) {
            throw `No entry in history for hash ${hash}`;
          }

          set(
            produce((s: HistoryState) => {
              s.entries[hash] = { ...s.entries[hash], ...patch };
            })
          );
        },

        clearAll() {
          useHistory.persist.clearStorage();
          set(initialState);
        },

        openModal(hash) {
          set({ currentTxHash: hash });
        },

        closeModal() {
          set({ currentTxHash: '' });
        },
      }),
      {
        enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
        name: 'xFuji/history',
      }
    ),
    {
      name: 'xFuji/history',
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            return console.error('an error happened during hydration', error);
          }
          if (!state) {
            return console.error('no state');
          }
          for (const hash of state.ongoingTransactions) {
            state.watch(hash);
          }
        };
      },
    }
  )
);
