import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import { NOTIFICATION_MESSAGES } from '../constants';
import { updateNativeBalance } from '../helpers/balances';
import { hexToChainId } from '../helpers/chains';
import {
  entryOutput,
  HistoryEntry,
  HistoryEntryStatus,
  toHistoryRoutingStep,
  toRoutingStepDetails,
} from '../helpers/history';
import { getTransactionUrl, notify } from '../helpers/notifications';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import { useBorrow } from './borrow.store';
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

        async add(hash, vaultAddr, steps) {
          const entry = {
            vaultAddr,
            hash,
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

          try {
            if (!entry) {
              throw `No entry in history for hash ${hash}`;
            }
            const srcChainId = entry.steps[0].chainId;

            const connextTransferResult = await sdk.getTransferId(
              srcChainId,
              hash
            );
            if (!connextTransferResult.success) {
              throw connextTransferResult.error.message;
            }
            const connextTransferId = connextTransferResult.data;
            const stepsWithHashResult = await sdk.watchTxStatus(
              hash,
              toRoutingStepDetails(entry.steps)
            );
            if (!stepsWithHashResult.success) {
              throw stepsWithHashResult.error.message;
            }
            const stepsWithHash = stepsWithHashResult.data;
            for (let i = 0; i < stepsWithHash.length; i++) {
              const s = stepsWithHash[i];
              console.debug('waiting', s.step, '...');
              const txHash = await s.txHash;
              if (!txHash) {
                throw `Transaction step ${i} failed`;
              }

              const { rpcProvider } = sdk.getConnectionFor(s.chainId);
              const receipt = await rpcProvider.waitForTransaction(txHash);

              // If the operation happened on the same chain as the wallet, update the balance
              const walletChain = useAuth.getState().chain;
              if (walletChain && hexToChainId(walletChain.id) === s.chainId) {
                updateNativeBalance();
              }

              if (receipt.status === 0) {
                throw `Transaction step ${i} failed`;
              }
              console.debug('success', s.step, txHash);
              set(
                produce((s: HistoryState) => {
                  s.entries[hash].steps[i].txHash = txHash;
                  s.entries[hash].connextTransferId = connextTransferId;
                })
              );

              if (
                s.step === RoutingStep.DEPOSIT ||
                s.step === RoutingStep.WITHDRAW
              ) {
                useBorrow.getState().updateBalances('collateral');
              } else if (
                s.step === RoutingStep.BORROW ||
                s.step === RoutingStep.PAYBACK
              ) {
                useBorrow.getState().updateBalances('debt');
              }

              if (s.step === RoutingStep.DEPOSIT) {
                useBorrow.getState().updateAllowance('collateral');
              } else if (s.step === RoutingStep.PAYBACK) {
                useBorrow.getState().updateAllowance('debt');
              }

              const { title, transactionUrl } = entryOutput(s, txHash);

              notify({
                type: 'success',
                message: title,
                link: getTransactionUrl(transactionUrl),
                isTransaction: true,
              });
            }
            get().update(hash, { status: HistoryEntryStatus.DONE });

            usePositions.getState().fetchUserPositions();
          } catch (e) {
            notify({
              type: 'error',
              message: NOTIFICATION_MESSAGES.TX_FAILURE,
            });

            get().update(hash, { status: HistoryEntryStatus.ERROR });
          } finally {
            const ongoingTransactions = get().ongoingTransactions.filter(
              (h) => h !== hash
            );
            set({ ongoingTransactions });
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
