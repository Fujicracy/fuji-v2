import { createContext } from "react"
import Onboard from "@web3-onboard/core"
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

export const onboard = Onboard({
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
      position: "bottomLeft",
      enabled: true,
      minimal: true,
    },
    mobile: {
      position: "bottomLeft",
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

export const OnboardContext = createContext(onboard)
