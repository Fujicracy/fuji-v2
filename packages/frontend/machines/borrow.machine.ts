import createMixins from "@mui/material/styles/createMixins"
import { createMachine } from "xstate"
import { assign } from "xstate/lib/actions"

interface Context {
  collateralAmount: number
  collateralBalance: number
  collateralUSDValue: number
  collateralTotalValue: number
}

const initialContext: Context = {
  collateralAmount: 0,
  collateralBalance: 5,
  collateralUSDValue: 1600,
  collateralTotalValue: 0,
}

type Events =
  | { type: "borrow" }
  | { type: "changeCollateralAmount"; value: string }
  | { type: "initialize" }
  | { type: "changeBorrowAmount" }
  | { type: "changeCollateralChain" }
  | { type: "changeBorrowChain" }

const borrowMachine = createMachine(
  {
    id: "borrowMachine",
    initial: "initial",
    schema: {
      context: {} as Context,
      events: {} as Events,
    },
    context: initialContext,
    states: {
      initial: {
        on: {
          initialize: {
            target: "editing",
          },
        },
      },
      editing: {
        invoke: {
          src: "isLogged",
        },
        on: {
          borrow: {
            cond: "isValid",
            target: "borrowing",
          },
          changeCollateralAmount: {
            actions: "updateCollateralAmount",
          },
          changeBorrowAmount: {},
          changeCollateralChain: {},
          changeBorrowChain: {},
        },
      },
      borrowing: {
        type: "final",
        description: "should call tx machine",
      },
    },
  },
  {
    actions: {
      updateCollateralAmount: assign({
        collateralAmount: (_, evt) => evt.value,
        collateralTotalValue: (ctx, evt) => ctx.collateralUSDValue * evt.value,
      }),
    },
  }
)

export default borrowMachine
