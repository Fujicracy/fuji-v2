import {
  Address,
  ChainId,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from "@x-fuji/sdk"
import produce from "immer"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { sdk } from "../services/sdk"
import ethers from "ethers"
import { useSnack } from "./snackbar.store"
import { formatUnits } from "ethers/lib/utils"
import { useBorrow } from "./borrow.store"

export type HistoryStore = HistoryState & HistoryActions

type HistoryState = {
  allHash: string[]
  activeHash: string[] // ongoing tx
  byHash: Record<string, HistoryEntry>

  inModal?: string // The tx hash displayed in modal
}

export type HistoryEntryType = "borrow" | "withdraw" | "repay" | "deposit"

export type HistoryEntry = {
  address?: string
  hash: string
  type: HistoryEntryType
  steps: HistoryRoutingStep[]
  status: "ongoing" | "error" | "done"
}

export type HistoryRoutingStep = Omit<
  RoutingStepDetails,
  "txHash" | "token"
> & {
  txHash?: string
  token: SerializableToken
}

export function toRoutingStepDetails(
  s: HistoryRoutingStep[]
): RoutingStepDetails[] {
  return s.map((s) => ({
    ...s,
    txHash: undefined,
    token: new Token(
      s.token.chainId,
      Address.from(s.token.address),
      s.token.decimals,
      s.token.symbol,
      s.token.name
    ),
  }))
}

export function toHistoryRoutingStep(
  s: RoutingStepDetails[]
): HistoryRoutingStep[] {
  return s.map((s: RoutingStepDetails) => {
    return {
      ...s,
      txHash: undefined,
      token: {
        chainId: s.token?.chainId as ChainId,
        address: s.token?.address.value as string,
        decimals: s.token?.decimals as number,
        symbol: s.token?.symbol as string,
        name: s.token?.name as string,
      },
    }
  })
}

/**
 * Contains all we need to instanciate a token with new Token()
 */
export type SerializableToken = {
  chainId: ChainId
  address: string
  decimals: number
  symbol: string
  name?: string
}

type HistoryActions = {
  add: (e: HistoryEntry) => void
  update: (hash: string, patch: Partial<HistoryEntry>) => void
  clearAll: () => void
  watch: (hash: string) => void

  openModal: (hash: string) => void
  closeModal: () => void
}

const initialState: HistoryState = {
  allHash: [],
  activeHash: [],
  byHash: {},
}

export const useHistory = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        // Add active transaction
        async add(e) {
          set(
            produce((s: HistoryState) => {
              s.inModal = e.hash
              s.byHash[e.hash] = e
              s.allHash = [e.hash, ...s.allHash]
              s.activeHash = [e.hash, ...s.activeHash]
            })
          )

          get().watch(e.hash)
        },

        async watch(hash) {
          const entry = get().byHash[hash]
          if (!entry) {
            throw `No entry in history for hash ${hash}`
          }

          let receipt: ethers.providers.TransactionReceipt
          // TODO: refacto: as long as we cannot store class methods in storage we should not use it (i.e vault.provider.getSmth)
          const { rpcProvider } = sdk.getConnectionFor(entry.steps[0].chainId)
          if (rpcProvider) {
            console.debug("waitForTransaction", hash)
            receipt = await rpcProvider.waitForTransaction(hash)
          } else {
            return console.error("No provider found in position.vault")
          }

          const startChainId = entry.steps.find(
            (s) => s.step === RoutingStep.START
          )?.chainId
          const endChainId = entry.steps.find(
            (s) => s.step === RoutingStep.END
          )?.chainId
          console.debug({ startChainId, endChainId })
          if (startChainId === endChainId) {
            set(
              produce((s: HistoryState) => {
                const steps = s.byHash[hash].steps
                const b = steps.find((s) => s.step === RoutingStep.BORROW)
                const d = steps.find((s) => s.step === RoutingStep.DEPOSIT)
                if (b) b.txHash = receipt.transactionHash
                if (d) d.txHash = receipt.transactionHash
              })
            )
          } else {
            const stepsWithHash = await sdk.watchTxStatus(
              hash,
              toRoutingStepDetails(entry.steps)
            )

            for (let i = 0; i < stepsWithHash.length; i++) {
              const step = stepsWithHash[i]
              console.debug("waiting", step.step, "...")
              // TODO: can txHash fail ?
              const txHash = await step.txHash
              console.debug("success", step.step, txHash)
              set(
                produce((s: HistoryState) => {
                  s.byHash[hash].steps[i].txHash = txHash
                })
              )
              console.debug(step.step, txHash)
              if (step.step === RoutingStep.DEPOSIT) {
                useBorrow.getState().updateBalances("collateral")
                useBorrow.getState().updateAllowance()
              }
              if (step.step === RoutingStep.BORROW) {
                useBorrow.getState().updateBalances("collateral")
              }
              // TODO: can we have error ? if yes mark the tx as failed. Design ? Retry ?
            }
          }

          const { steps } = get().byHash[hash]
          const d = steps.find((s) => s.step === RoutingStep.DEPOSIT)
          const dAmount = d?.amount && formatUnits(d.amount, d.token.decimals)
          const b = steps.find((s) => s.step === RoutingStep.BORROW)
          const bAmount = b?.amount && formatUnits(b.amount, b.token.decimals)
          useSnack.getState().display({
            type: "success",
            title: `Deposit ${dAmount} ${d?.token.symbol} and borrow ${bAmount} ${b?.token.symbol}`,
            transactionLink: {
              hash: b?.txHash,
              chainId: b?.chainId,
            },
          })

          get().update(hash, { status: "done" })
          const activeHash = get().activeHash.filter((h) => h !== hash)
          set({ activeHash })
        },

        update(hash, patch) {
          const entry = get().byHash[hash]
          if (!entry) {
            throw `No entry in history for hash ${hash}`
          }
          set(
            produce((s: HistoryState) => {
              s.byHash[hash] = { ...s.byHash[hash], ...patch }
            })
          )
        },

        clearAll() {
          useHistory.persist.clearStorage()
          set({ allHash: [...get().activeHash] })
        },

        openModal(hash) {
          const entry = get().byHash[hash]
          if (!entry) {
            console.error("No entry in history for hash", hash)
          }
          set({ inModal: hash })
        },

        closeModal() {
          set({ inModal: "" })
        },
      }),
      {
        enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
        name: "xFuji/history",
      }
    ),
    {
      name: "xFuji/history",
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            return console.error("an error happened during hydration", error)
          }
          if (!state) {
            return console.error("no state")
          }
          for (const hash of state.activeHash) {
            state.watch(hash)
          }
        }
      },
    }
  )
)
