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
  HistoryTransaction,
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
import { useAuth } from './auth.store';
import { usePositions } from './positions.store';

export type HistoryStore = HistoryState & HistoryActions;

type HistoryState = {
  transactions: HistoryTransaction[];
  ongoingTransactions: HistoryTransaction[];
  entries: Record<string, HistoryEntry>;

  currentTxHash?: string; // The tx hash displayed in modal

  watching: string[];
};

type HistoryActions = {
  add: (
    hash: string,
    address: string,
    vaultAddress: string,
    steps: RoutingStepDetails[]
  ) => void;
  update: (hash: string, patch: Partial<HistoryEntry>) => void;
  clearAll: () => void;
  watchAll: (address: string) => void;
  watch: (transaction: HistoryTransaction) => void;

  openModal: (hash: string) => void;
  closeModal: () => void;
};

const initialState: HistoryState = {
  transactions: [],
  ongoingTransactions: [],
  entries: {},
  watching: [],
};

export const useHistory = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        async add(hash, address, vaultAddress, steps) {
          const srcChainId = steps[0].chainId;
          const secondChainId = steps[steps.length - 1].chainId;
          const chainCount = srcChainId === secondChainId ? 1 : 2;
          const isCrossChain = chainCount > 1;

          const sourceChain = {
            chainId: srcChainId,
            status: HistoryEntryStatus.ONGOING,
            hash,
          };
          const secondChain = isCrossChain
            ? {
                chainId: secondChainId,
                status: HistoryEntryStatus.ONGOING,
              }
            : undefined;

          const entry: HistoryEntry = {
            vaultAddress,
            hash,
            address,
            sourceChain,
            secondChain,
            chainCount,
            steps: toHistoryRoutingStep(steps),
            status: HistoryEntryStatus.ONGOING,
          };

          const transaction = { hash, address };

          set(
            produce((s: HistoryState) => {
              s.currentTxHash = hash;
              s.entries[hash] = entry;
              s.transactions = [transaction, ...s.transactions];
              s.ongoingTransactions = [transaction, ...s.ongoingTransactions];
            })
          );

          get().watch(transaction);
        },

        watchAll(address) {
          const ongoingTransactions = get().ongoingTransactions.filter(
            (t) => t.address === address
          );
          for (const hash of ongoingTransactions) {
            get().watch(hash);
          }
        },

        async watch(transaction) {
          const { hash } = transaction;

          if (get().watching.includes(hash)) return;
          set((state) => ({ watching: [...state.watching, hash] }));

          const entry = get().entries[hash];

          const remove = () => {
            const ongoingTransactions = get().ongoingTransactions.filter(
              (h) => h.hash !== hash
            );
            set({ ongoingTransactions });
          };

          if (!entry) {
            remove();
            return;
          }

          const finish = (success: boolean) => {
            const address = useAuth.getState().address;
            if (address === entry.address) {
              triggerUpdatesFromSteps(entry.steps);
            }

            const isFinal =
              entry.chainCount > 1 &&
              entry.secondChain &&
              entry.secondChain.status === HistoryEntryStatus.SUCCESS;

            set(
              produce((s: HistoryState) => {
                const entry = s.entries[hash];
                entry.status = success
                  ? HistoryEntryStatus.SUCCESS
                  : HistoryEntryStatus.FAILURE;

                if (isFinal && entry.secondChain) {
                  entry.secondChain.status = success
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
              isFinal && entry.secondChain
                ? entry.secondChain.hash
                : entry.hash;

            if (address === entry.address) {
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
                        isFinal && entry.secondChain
                          ? entry.secondChain.chainId
                          : entry.sourceChain.chainId,
                    })
                  : undefined,
              });

              if (success) {
                usePositions.getState().fetchUserPositions();
              }
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
            if (entry.chainCount === 1 && !entry.secondChain) {
              finish(true);
              return;
            }
            const address = useAuth.getState().address;
            if (address === entry.address && !entry.sourceChain.shown) {
              notify({
                type: 'success',
                message: formatCrosschainNotificationMessage(
                  chainName(entry.sourceChain.chainId),
                  chainName(entry.secondChain?.chainId)
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
                  if (!e.secondChain) return;
                  if (crosschainResult.data.destTxHash && !e.secondChain.hash) {
                    e.secondChain.hash = crosschainResult.data.destTxHash;
                  }
                  if (
                    crosschainResult.data.status === ConnextTxStatus.EXECUTED &&
                    e.secondChain.status !== HistoryEntryStatus.SUCCESS
                  ) {
                    e.secondChain.status = HistoryEntryStatus.SUCCESS;
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
          const address = useAuth.getState().address;
          const transactions = get().transactions.filter(
            (t) => t.address !== address
          );
          const ongoingTransactions = get().transactions.filter(
            (t) => t.address !== address
          );
          const entries: Record<string, HistoryEntry> = {};
          for (const [key, entry] of Object.entries(get().entries)) {
            if (entry.address !== address) {
              entries[key] = entry;
            }
          }
          set({ transactions, ongoingTransactions, entries });
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
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['watching'].includes(key))
        ),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            return console.error('an error happened during hydration', error);
          }
          if (!state) {
            return console.error('no state');
          }
          // transactions used to be a hash array, now it's an object
          const hasString = state.transactions.some(
            (value) => typeof value === 'string'
          );
          if (hasString) {
            state.transactions = [];
            state.ongoingTransactions = [];
          }
        };
      },
    }
  )
);
