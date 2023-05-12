import { ChainId, ConnextTxStatus, RoutingStepDetails } from '@x-fuji/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import {
  formatCrosschainNotificationMessage,
  NOTIFICATION_MESSAGES,
  TX_WATCHING_POLLING_INTERVAL,
} from '../constants';
import { chainName } from '../helpers/chains';
import {
  HistoryEntry,
  HistoryEntryStatus,
  HistoryTransaction,
  stepForFinishing,
  toHistoryRoutingStep,
  triggerUpdatesFromSteps,
  wait,
} from '../helpers/history';
import {
  getTransactionLink,
  NotificationDuration,
  notify,
} from '../helpers/notifications';
import { storeOptions } from '../helpers/stores';
import { watchTransaction } from '../helpers/transactions';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import { usePositions } from './positions.store';

export type HistoryStore = HistoryState & HistoryActions;

type HistoryState = {
  transactions: HistoryTransaction[];
  ongoingTransactions: HistoryTransaction[];
  entries: Record<string, HistoryEntry>;

  currentTxHash?: string | undefined; // The tx hash displayed in modal
  isHistoricalTransaction?: boolean;

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
  clearAll: (address: string) => void;
  watchAll: (address: string) => void;
  watch: (transaction: HistoryTransaction) => void;
  clearStore: () => void;

  openModal: (hash: string, isHistorical?: boolean) => void;
  closeModal: () => void;
};

const initialState: HistoryState = {
  transactions: [],
  ongoingTransactions: [],
  entries: {},
  watching: [],
  isHistoricalTransaction: false,
};

export const useHistory = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        async add(hash, address, vaultAddress, steps) {
          const distinctChains = steps
            .map((s) => s.chainId)
            .reduce((acc: ChainId[], current: ChainId, i: number) => {
              if (i === 0) {
                acc.push(current);
              } else {
                const last = acc.length - 1;
                if (acc[last] !== current) acc.push(current);
              }
              return acc;
            }, []);
          const [srcChainId, secondChainId, thirdChainId] = distinctChains;
          const chainCount = distinctChains.length;

          const sourceChain = {
            chainId: srcChainId,
            status: HistoryEntryStatus.ONGOING,
            hash,
          };
          const secondChain = secondChainId
            ? {
                chainId: secondChainId,
                status: HistoryEntryStatus.ONGOING,
              }
            : undefined;
          const thirdChain = thirdChainId
            ? {
                chainId: thirdChainId,
                status: HistoryEntryStatus.ONGOING,
              }
            : undefined;

          const entry: HistoryEntry = {
            vaultAddress,
            hash,
            address,
            sourceChain,
            secondChain,
            thirdChain,
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
            const filtered = get().watching.filter((h) => h !== hash);
            set({ ongoingTransactions, watching: filtered });
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
            const status = success
              ? HistoryEntryStatus.SUCCESS
              : HistoryEntryStatus.FAILURE;

            const currentStep = stepForFinishing(entry);

            set(
              produce((s: HistoryState) => {
                const entry = s.entries[hash];
                entry.status = status;
                if (!success) {
                  if (currentStep === 0) {
                    entry.sourceChain.status = HistoryEntryStatus.FAILURE;
                  } else if (entry.secondChain && currentStep === 1) {
                    entry.secondChain.status = HistoryEntryStatus.FAILURE;
                  } else if (entry.thirdChain && currentStep === 2) {
                    entry.thirdChain.status = HistoryEntryStatus.FAILURE;
                  }
                }
              })
            );

            const chain =
              currentStep === 2
                ? entry.thirdChain
                : currentStep === 1
                ? entry.secondChain
                : entry.sourceChain;

            const linkHash = chain?.hash;

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
                      chainId: chain?.chainId || entry.sourceChain.chainId,
                    })
                  : undefined,
              });

              if (success) {
                usePositions.getState().fetchUserPositions();
              }
            }
          };

          try {
            const updateIfNeeded = (
              address: string | undefined,
              shown: boolean | undefined,
              firstChainId: ChainId,
              secondChainId: ChainId,
              txHash: string,
              first: boolean
            ) => {
              if (address !== entry.address) return;

              triggerUpdatesFromSteps(entry.steps);
              usePositions.getState().fetchUserPositions();

              if (shown) return;

              notify({
                type: 'success',
                message: formatCrosschainNotificationMessage(
                  chainName(firstChainId),
                  chainName(secondChainId)
                ),
                link: getTransactionLink({
                  hash: txHash,
                  chainId: firstChainId,
                }),
              });
              set(
                produce((s: HistoryState) => {
                  const e = s.entries[hash];
                  if (first) {
                    e.sourceChain.shown = true;
                  } else if (e.secondChain) {
                    e.secondChain.shown = true;
                  }
                })
              );
            };

            const crossChainWatch = async (
              chainId: ChainId,
              txHash: string,
              first: boolean
            ) => {
              let crosschainCallFinished = false;
              while (!crosschainCallFinished) {
                await wait(TX_WATCHING_POLLING_INTERVAL);
                const crosschainResult = await sdk.getConnextTxDetails(
                  chainId,
                  txHash
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
                      crosschainResult.data.status !== ConnextTxStatus.UNKNOWN
                    ) {
                      if (!e.connext && first) {
                        e.connext = {
                          transferId: crosschainResult.data.connextTransferId,
                          timestamp: Date.now(),
                        };
                      }
                      if (!first && e.connext) {
                        e.connext.secondTransferId =
                          crosschainResult.data.connextTransferId;
                        e.connext.timestamp = Date.now();
                      }
                    }
                    if (!e.secondChain) return;
                    if (!first && !e.thirdChain) return;
                    if (crosschainResult.data.destTxHash) {
                      if (first && !e.secondChain.hash) {
                        e.secondChain.hash = crosschainResult.data.destTxHash;
                      } else if (
                        !first &&
                        e.thirdChain &&
                        !e.thirdChain?.hash
                      ) {
                        e.thirdChain.hash = crosschainResult.data.destTxHash;
                      }
                    }
                    if (
                      crosschainResult.data.status === ConnextTxStatus.EXECUTED
                    ) {
                      if (
                        first &&
                        e.secondChain.status !== HistoryEntryStatus.SUCCESS
                      ) {
                        e.secondChain.status = HistoryEntryStatus.SUCCESS;
                      } else if (
                        !first &&
                        e.thirdChain &&
                        e.thirdChain.status !== HistoryEntryStatus.SUCCESS
                      ) {
                        e.thirdChain.status = HistoryEntryStatus.SUCCESS;
                      }
                    }
                  })
                );
              }
            };

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
            if (entry.chainCount === 1 || !entry.secondChain) {
              finish(true);
              return;
            }

            updateIfNeeded(
              useAuth.getState().address,
              entry.sourceChain.shown,
              entry.sourceChain.chainId,
              entry.secondChain.chainId,
              entry.hash,
              true
            );
            if (entry.secondChain.status !== HistoryEntryStatus.SUCCESS) {
              await crossChainWatch(
                entry.sourceChain.chainId,
                entry.hash,
                true
              );
            }
            if (!entry.thirdChain) {
              finish(true);
              return;
            }

            const secondChain = get().entries[hash].secondChain;
            if (!secondChain || !secondChain.hash) return;

            updateIfNeeded(
              useAuth.getState().address,
              secondChain.shown,
              secondChain.chainId,
              entry.thirdChain.chainId,
              secondChain.hash,
              false
            );

            await crossChainWatch(secondChain.chainId, secondChain.hash, false);
            finish(true);
          } catch (e) {
            console.error(e);
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

        clearAll(address) {
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

        clearStore() {
          set({
            transactions: [],
            ongoingTransactions: [],
            entries: {},
            currentTxHash: undefined,
          });
        },

        openModal(hash, isHistorical = false) {
          set({ currentTxHash: hash, isHistoricalTransaction: isHistorical });
        },

        closeModal() {
          set({ currentTxHash: '', isHistoricalTransaction: false });
        },
      }),
      storeOptions('history')
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
            state.clearStore();
          }
        };
      },
    }
  )
);
