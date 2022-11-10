import { StateCreator, StoreApi } from "zustand"
import Onboard, { ConnectOptions } from "@web3-onboard/core"
import { Chain as IChain } from "@web3-onboard/common"
import injectedModule from "@web3-onboard/injected-wallets"
import walletConnectModule from "@web3-onboard/walletconnect"
import {
  Balances,
  ConnectedChain,
  WalletState,
} from "@web3-onboard/core/dist/types"
import { Sdk } from "@x-fuji/sdk"
import { utils } from "ethers"

const fujiLogo = `<svg width="57" height="57" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.2012 56.4025C43.7763 56.4025 56.4025 43.7763 56.4025 28.2012C56.4025 12.6261 43.7763 0 28.2012 0C12.6261 0 0 12.6261 0 28.2012C0 43.7763 12.6261 56.4025 28.2012 56.4025Z" fill="url(#paint0_linear)"/>
<path d="M28.2007 43.7037C36.7624 43.7037 43.7031 36.763 43.7031 28.2012C43.7031 19.6395 36.7624 12.6988 28.2007 12.6988C19.6389 12.6988 12.6982 19.6395 12.6982 28.2012C12.6982 36.763 19.6389 43.7037 28.2007 43.7037Z" fill="#101010"/>
<path d="M28.2004 56.4026C32.3325 56.4066 36.4147 55.5002 40.1569 53.7479C43.899 51.9956 47.2092 49.4404 49.852 46.264L34.2946 30.738C33.4921 29.9331 32.5386 29.2944 31.4888 28.8586C30.439 28.4228 29.3135 28.1985 28.1768 28.1985C27.0402 28.1985 25.9147 28.4228 24.8649 28.8586C23.8151 29.2944 22.8616 29.9331 22.0591 30.738L6.54883 46.264C9.19166 49.4404 12.5018 51.9956 16.244 53.7479C19.9861 55.5002 24.0683 56.4066 28.2004 56.4026Z" fill="#F5F5FD"/>
<path d="M40.805 37.2177C39.3723 39.2246 37.4811 40.8604 35.2888 41.989C33.0964 43.1176 30.6662 43.7064 28.2004 43.7064C25.7346 43.7064 23.3044 43.1176 21.1121 41.989C18.9197 40.8604 17.0285 39.2246 15.5958 37.2177L6.54883 46.2647C9.19401 49.4385 12.5046 51.992 16.2462 53.7443C19.9878 55.4966 24.0688 56.4049 28.2004 56.4049C32.332 56.4049 36.4131 55.4966 40.1546 53.7443C43.8962 51.992 47.2068 49.4385 49.852 46.2647L40.805 37.2177Z" fill="black" fill-opacity="0.1"/>
<defs>
<linearGradient id="paint0_linear" x1="28.1546" y1="56.4043" x2="28.1546" y2="0" gradientUnits="userSpaceOnUse">
<stop stop-color="#101010"/>
<stop offset="0.653724" stop-color="#F0014F"/>
<stop offset="0.854082" stop-color="#FE0B5C"/>
</linearGradient>
</defs>
</svg>`

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

export const sdk = new Sdk({
  infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  alchemy: {},
})

export type Chain = IChain
export const chains: Chain[] = [
  {
    id: "0x1",
    token: "ETH",
    label: "Ethereum",
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  },
  {
    id: "0x89",
    token: "MATIC",
    label: "Polygon",
    rpcUrl: "https://matic-mainnet.chainstacklabs.com",
  },
  {
    id: "0xfa",
    token: "FTM",
    label: "Fantom",
    rpcUrl: "https://rpc.ftm.tools/",
  },
  {
    id: "0xa4b1",
    token: "AETH",
    label: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
  },
  {
    id: "0xa",
    token: "ETH",
    label: "Optimism",
    rpcUrl: "https://optimism-mainnet.public.blastapi.io/",
  },
]

if (process.env.NODE_ENV !== "production") {
  chains.push(
    {
      id: "0x13881",
      token: "MATIC",
      label: "Mumbai",
      rpcUrl: "https://matic-mainnet.chainstacklabs.com",
    },
    {
      id: "0x5",
      token: "GTH",
      label: "Goerli",
      rpcUrl: `https://goerli.infura.io/v3/`,
    },
    {
      id: "0x1a4",
      token: "ETH",
      label: "Optimism Goerli",
      rpcUrl: "https://goerli.optimism.io/",
    }
  )
}

const onboard = Onboard({
  chains,
  wallets: [injectedModule(), walletConnect],
  appMetadata: {
    name: "Fuji II - Himalaya",
    icon: fujiLogo, // svg string icon
    description: "Borrow in any chain, and always have the best rate",
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
    ],
  },
  accountCenter: {
    desktop: { enabled: false },
    mobile: { enabled: false },
  },
})

type StateConnected = {
  status: "connected"
  address: string
  ens: string | undefined
  balance: Balances
  chain: ConnectedChain
}
type StateInitial = {
  status: "initial"
  address: undefined
  ens: undefined
  balance: undefined
  chain: undefined
}
type StateDisconnected = {
  status: "disconnected"
  address: undefined
  ens: undefined
  balance: undefined
  chain: undefined
}
type State = StateInitial | StateConnected | StateDisconnected

type Action = {
  login: (options?: ConnectOptions) => void
  init: () => void
  logout: () => void
  changeChain: (chainId: string | number) => void
}

export type AuthStore = State & Action

const initialState: StateInitial = {
  status: "initial",
  address: undefined,
  ens: undefined,
  balance: undefined,
  chain: undefined,
}

type AuthSlice = StateCreator<AuthStore, [], [], AuthStore>

export const createAuthSlice: AuthSlice = (set, get) => ({
  ...initialState,

  init: async () => {
    reconnect(set, get)
    onOnboardChange(set, get)
  },

  login: async (options?) => {
    const wallets = await onboard.connectWallet(options)

    if (!wallets[0]) {
      set({ status: "disconnected" })
      throw "Cannot login"
    }

    const json = JSON.stringify(wallets.map(({ label }) => label))
    localStorage.setItem("connectedWallets", json)

    const balance = wallets[0].accounts[0].balance
    const address = utils.getAddress(wallets[0].accounts[0].address)
    const chain = wallets[0].chains[0]

    set({ status: "connected", address, balance, chain })
  },

  logout: async () => {
    const wallets = onboard.state.get().wallets
    for (const { label } of wallets) {
      await onboard.disconnectWallet({ label })
    }

    localStorage.removeItem("connectedWallets")

    set({ ...initialState, status: "disconnected" })
  },

  changeChain: async (chainId) => {
    await onboard.setChain({ chainId })
  },
})

async function reconnect(
  set: StoreApi<State & Action>["setState"],
  get: StoreApi<State & Action>["getState"]
) {
  const previouslyConnectedWallets = localStorage.getItem("connectedWallets")

  if (!previouslyConnectedWallets) {
    return set({ status: "disconnected" })
  }
  const wallets = JSON.parse(previouslyConnectedWallets)
  await get().login({
    autoSelect: { label: wallets[0], disableModals: true },
  })
}

function onOnboardChange(
  set: StoreApi<State & Action>["setState"],
  get: StoreApi<State & Action>["getState"]
) {
  onboard.state.select("wallets").subscribe((w: WalletState[]) => {
    if (!w[0] && get().status === "disconnected") {
      return
    } else if (!w[0]) {
      // Triggered when user disconnect from its wallet
      return get().logout()
    }

    const chain = w[0].chains[0]
    if (chain.id !== get().chain?.id) {
      set({ chain })
    }

    const balance = w[0].accounts[0].balance
    if (balance && balance !== get().balance) {
      set({ balance })
    }

    const address = w[0].accounts[0].address
    if (address && address !== get().address) {
      set({ address: utils.getAddress(address) })
    }

    const ens = w[0].accounts[0].ens?.name
    if (ens !== get().ens) {
      set({ ens })
    }
  })
}
