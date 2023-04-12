import { RoutingStepDetails } from '@x-fuji/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import { NOTIFICATION_MESSAGES } from '../constants';
import {
  HistoryEntry,
  HistoryEntryChain,
  HistoryEntryStatus,
  toHistoryRoutingStep,
  triggerUpdatesFromSteps,
} from '../helpers/history';
import { notify } from '../helpers/notifications';
import { watchTransaction } from '../helpers/transactions';
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
          const sourceChain: HistoryEntryChain = {
            chainId: srcChainId,
            status: HistoryEntryStatus.ONGOING,
            hash,
          };

          const entry = {
            vaultAddress,
            hash,
            sourceChain,
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

          const finish = (success: boolean) => {
            const status = success
              ? HistoryEntryStatus.SUCCESS
              : HistoryEntryStatus.FAILURE;

            get().update(hash, { status });
            set(
              produce((s: HistoryState) => {
                const entry = s.entries[hash];
                entry.status = success
                  ? HistoryEntryStatus.SUCCESS
                  : HistoryEntryStatus.FAILURE;
                if (
                  entry.isCrossChain &&
                  entry.destinationChain &&
                  entry.sourceChain.status === HistoryEntryStatus.SUCCESS
                ) {
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

            notify({
              type: success ? 'success' : 'error',
              message: success
                ? NOTIFICATION_MESSAGES.TX_SUCCESS
                : NOTIFICATION_MESSAGES.TX_FAILURE,
            });

            if (success) {
              usePositions.getState().fetchUserPositions();
            }
          };

          if (!entry) {
            remove();
            return;
          }
          try {
            const result = await watchTransaction(
              entry.sourceChain.chainId,
              hash
            );
            if (!result.success) {
              throw result.error;
            }
            triggerUpdatesFromSteps(entry.steps, entry.sourceChain.chainId);
            set(
              produce((s: HistoryState) => {
                s.entries[hash].sourceChain.status = HistoryEntryStatus.SUCCESS;
              })
            );
            if (!entry.isCrossChain) {
              finish(true);
              return;
            }
            // TODO: Poll -> sdk.getConnextTxDetails()
            // Success

            // const connextTransferResult = await sdk.getTransferId(
            //   srcChainId,
            //   hash
            // );
            // if (!connextTransferResult.success) {
            //   throw connextTransferResult.error.message;
            // }
            // const connextTransferId = connextTransferResult.data;
            // const stepsWithHashResult = await sdk.watchTxStatus(
            //   hash,
            //   toRoutingStepDetails(entry.steps)
            // );
            // if (!stepsWithHashResult.success) {
            //   throw stepsWithHashResult.error.message;
            // }
            // const stepsWithHash = stepsWithHashResult.data;
            // for (let i = 0; i < stepsWithHash.length; i++) {
            //   const s = stepsWithHash[i];
            //   console.debug('waiting', s.step, '...');
            //   const txHash = await s.txHash;
            //   if (!txHash) {
            //     throw `Transaction step ${i} failed`;
            //   }

            //   const { rpcProvider } = sdk.getConnectionFor(s.chainId);
            //   const receipt = await rpcProvider.waitForTransaction(txHash);

            // // If the operation happened on the same chain as the wallet, update the balance
            // const walletChain = useAuth.getState().chain;
            // if (walletChain && hexToChainId(walletChain.id) === s.chainId) {
            //   updateNativeBalance();
            // }

            //   if (receipt.status === 0) {
            //     throw `Transaction step ${i} failed`;
            //   }
            //   console.debug('success', s.step, txHash);
            // set(
            //   produce((s: HistoryState) => {
            //     s.entries[hash].steps[i].txHash = txHash;
            //     s.entries[hash].connextTransferId = connextTransferId;
            //   })
            // );

            // if (
            //   s.step === RoutingStep.DEPOSIT ||
            //   s.step === RoutingStep.WITHDRAW
            // ) {
            //   useBorrow.getState().updateBalances('collateral');
            // } else if (
            //   s.step === RoutingStep.BORROW ||
            //   s.step === RoutingStep.PAYBACK
            // ) {
            //   useBorrow.getState().updateBalances('debt');
            // }

            // if (s.step === RoutingStep.DEPOSIT) {
            //   useBorrow.getState().updateAllowance('collateral');
            // } else if (s.step === RoutingStep.PAYBACK) {
            //   useBorrow.getState().updateAllowance('debt');
            // }

            //   const { title, transactionUrl } = entryOutput(s, txHash);

            //   notify({
            //     type: 'success',
            //     message: title,
            //     link: getTransactionUrl(transactionUrl),
            //     isTransaction: true,
            //   });
            // }
            // get().update(hash, { status: HistoryEntryStatus.DONE });

            // usePositions.getState().fetchUserPositions();
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
