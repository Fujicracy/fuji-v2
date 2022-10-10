import createMixins from "@mui/material/styles/createMixins"
import { createMachine } from "xstate"
import { assign } from "xstate/lib/actions"

interface Context {
  collateral: {
    amount: number
    balance: number
    USDValue: number
    totalValue: number
  }
}

const initialContext: Context = {
  collateral: {
    amount: 0,
    balance: 5,
    USDValue: 1600,
    totalValue: 0,
  },
}

type Events =
  | {
      type: "borrow"
    }
  | {
      type: "changeCollateralAmount"
      value: string
    }
  | {
      type: "initialize"
    }
  | {
      type: "changeBorrowAmount"
    }
  | {
      type: "changeCollateralChain"
    }
  | {
      type: "changeBorrowChain"
    }

const borrowMachine = createMachine(
  {
    id: "borrowMachine",
    initial: "editing",
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
        collateral: (ctx, evt) => ({
          ...ctx.collateral,
          value: evt.value,
          totalValue: ctx.collateral.USDValue * evt.value,
        }),
      }),
    },
  }
)

export default borrowMachine
