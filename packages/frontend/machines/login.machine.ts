import { createMachine, assign } from "xstate"

import Onboard, { WalletState } from "@web3-onboard/core"
import injectedModule from "@web3-onboard/injected-wallets"

// TODO: get INFURA_KEY & ALCHEMY and put it in .env
const ETH_MAINNET_RPC =
  `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}` ||
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
// const ETH_RINKEBY_RPC =
//   `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}` ||
//   `https://eth-rinkeby.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
// const MATIC_MAINNET_RPC = "https://matic-mainnet.chainstacklabs.com"

const injected = injectedModule()
const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: ETH_MAINNET_RPC,
    },
    // TODO: if testnet {
    //   id: "0x3",
    //   token: "tROP",
    //   label: "Ethereum Ropsten Testnet",
    //   rpcUrl: ETH_ROPSTEN_RPC,
    // },
    // {
    //   id: "0x4",
    //   token: "rETH",
    //   label: "Ethereum Rinkeby Testnet",
    //   rpcUrl: ETH_RINKEBY_RPC,
    // },
    {
      id: "0x89",
      token: "MATIC",
      label: "Matic",
      rpcUrl: "https://matic-mainnet.chainstacklabs.com",
    },
    {
      id: "0xfa",
      token: "FTM",
      label: "Fantom",
      rpcUrl: "https://rpc.ftm.tools/",
    },
    {
      id: "0x10",
      token: "ETH",
      label: "Optimism",
      rpcUrl: "https://optimism-mainnet.public.blastapi.io/",
    },
  ],
  // apiKey: yourApiKey, // get this for free at https://explorer.blocknative.com/?signup=true
  // TODO appMetadata: {
  // name: 'Token Swap',
  // icon: myIcon, // svg string icon
  // description: 'Swap tokens for other tokens',
  // recommendedInjectedWallets: [
  // { name: 'MetaMask', url: 'https://metamask.io' },
  // { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
  // ]
  // },
  accountCenter: {
    desktop: {
      position: "topRight",
      enabled: true,
      minimal: true,
    },
    mobile: {
      position: "topRight",
      enabled: true,
      minimal: true,
    },
  },
  // TODO i18n: {
  // en: {
  //   connect: {
  //     selectingWallet: {
  //       header: "custom text header",
  //     },
  //   },
  // },
  // },
})

const login = async () => {
  console.log("login")
  const wallets = await onboard.connectWallet()
  if (wallets[0]) {
    return wallets[0]
  }
  throw "Cannot login"
}

const reconnect = async () => {
  const previouslyConnectedWallets = localStorage.getItem("connectedWallets")

  if (!previouslyConnectedWallets) {
    return Promise.reject("No previously connected wallets found.")
  }

  const wallets = JSON.parse(previouslyConnectedWallets)

  onboard.connectWallet({ autoSelect: wallets[0] })

  // onboard.connectWallet({
  //   autoSelect: { label: previouslyConnectedWallets[0], disableModals: true }
  // })
}

interface MachineContext {
  unsubscribe?: Function
}
const initialContext: MachineContext = {
  unsubscribe: undefined,
}

type MachineEvent = { type: "INITIALIZE" } | { type: "LOGOUT" }

const authMachine = createMachine(
  {
    id: "auth",
    initial: "initial",
    schema: {
      context: {} as MachineContext,
      events: {} as MachineEvent,
    },
    context: initialContext,
    states: {
      initial: {
        on: {
          INITIALIZE: "reconnecting",
        },
      },
      reconnecting: {
        invoke: {
          id: "reconnect",
          src: "reconnect",
          onDone: {
            target: "loggedIn",
          },
          onError: {
            target: "connecting",
          },
        },
      },
      connecting: {
        invoke: {
          id: "login",
          src: "login",
          onDone: {
            target: "loggedIn",
          },
          onError: {
            target: "error",
            actions: "setError",
          },
        },
      },
      loggedIn: {
        entry: "subscribeToWalletChange",
        exit: "unubscribeToWalletChange",
        on: {
          LOGOUT: {
            target: "initial",
            actions: "reset",
          },
        },
      },
      error: {
        on: {
          INITIALIZE: {
            target: "connecting",
            actions: "resetError",
          },
        },
      },
    },
  },
  {
    actions: {
      subscribeToWalletChange: assign((ctx, evt) => {
        const walletsSub = onboard.state.select("wallets")
        const { unsubscribe } = walletsSub.subscribe(
          (wallets: WalletState[]) => {
            const connectedWallets = wallets.map(({ label }) => label)
            localStorage.setItem(
              "connectedWallets",
              JSON.stringify(connectedWallets)
            )
          }
        )

        return { unsubscribe }
      }),
      unubscribeToWalletChange: assign((ctx, evt) => {
        if (ctx.unsubscribe) ctx.unsubscribe()
        return {
          unsubscribe: undefined,
        }
      }),
    },
    services: { login, reconnect },
  }
)

export { authMachine }
