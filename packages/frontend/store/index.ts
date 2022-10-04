import create from "zustand"
import Onboard, { AppState, InitOptions, WalletState } from "@web3-onboard/core"
import injectedModule from "@web3-onboard/injected-wallets"
import walletConnectModule from "@web3-onboard/walletconnect"

// TODO: get INFURA_KEY & ALCHEMY and put it in .env
const ETH_MAINNET_RPC =
  `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}` ||
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
// const ETH_RINKEBY_RPC =
//   `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}` ||
//   `https://eth-rinkeby.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
// const MATIC_MAINNET_RPC = "https://matic-mainnet.chainstacklabs.com"

// initialize the module with options
const walletConnect = walletConnectModule({
  // bridge: "YOUR_CUSTOM_BRIDGE_SERVER",
  qrcodeModalOptions: {
    mobileLinks: [
      "rainbow",
      "metamask",
      "argent",
      "trust",
      "imtoken",
      "pillar",
    ],
  },
})

export const chains: InitOptions["chains"] = [
  {
    id: 1,
    token: "ETH",
    label: "Ethereum",
    rpcUrl: ETH_MAINNET_RPC,
  },
  {
    id: 137,
    token: "MATIC",
    label: "Polygon",
    rpcUrl: "https://matic-mainnet.chainstacklabs.com",
  },
  {
    id: 250,
    token: "FTM",
    label: "Fantom",
    rpcUrl: "https://rpc.ftm.tools/",
  },
  {
    id: 10,
    token: "ETH",
    label: "Optimism",
    rpcUrl: "https://optimism-mainnet.public.blastapi.io/",
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
]

const injected = injectedModule()
const onboard = Onboard({
  wallets: [injected, walletConnect],
  chains,
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
      position: "bottomLeft", // topRight
      enabled: true,
      minimal: false,
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

type State = {
  status: "connected" | "disconnected"
  address: string
  balance: string
}

type Action = {
  login: () => void
}

export const useStore = create<State & Action>((set) => ({
  status: "disconnected",
  address: "",
  balance: "",

  login: async () => {
    const wallets = await onboard.connectWallet()
    if (!wallets[0]) {
      set({
        status: "disconnected",
      })
      throw "Cannot login"
    }
    console.log(wallets[0])
    set({
      status: "connected",
      address: wallets[0].accounts[0].address,
      // TODO: How to retrieve the default token of the chain ?
      balance: wallets[0].accounts[0].balance["ETH"],
    })
  },

  reconnect: async () => {
    const previouslyConnectedWallets = localStorage.getItem("connectedWallets")

    if (!previouslyConnectedWallets) {
      return Promise.reject("No previously connected wallets found.")
    }

    const wallets = JSON.parse(previouslyConnectedWallets)

    await onboard.connectWallet({
      autoSelect: {
        label: wallets[0],
        disableModals: true,
      },
    })
  },

  saveWalletInLocalStorage: () => {
    const { wallets } = onboard.state.get()
    const json = JSON.stringify(wallets.map(({ label }) => label))
    localStorage.setItem("connectedWallets", json)
  },

  reset: async () => {
    // disconnect the first wallet in the wallets array
    const [primaryWallet] = onboard.state.get().wallets
    await onboard.disconnectWallet({
      label: primaryWallet.label,
    })
  },
}))
