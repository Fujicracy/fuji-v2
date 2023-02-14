import { Chain as IChain } from "@web3-onboard/common"
import { ChainId } from "@x-fuji/sdk"

export type Chain = IChain

export const chains: Chain[] = [
  {
    id: "0x1",
    token: "ETH",
    label: "Ethereum",
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
    blockExplorerUrl: "https://etherscan.io/",
    icon: "Ethereum",
  },
  {
    id: "0x89",
    token: "MATIC",
    label: "Polygon",
    rpcUrl: "https://matic-mainnet.chainstacklabs.com",
    blockExplorerUrl: "https://polygonscan.com/",
    icon: "Polygon",
  },
  {
    id: "0x64",
    token: "xDai",
    label: "Gnosis",
    rpcUrl: "https://rpc.gnosischain.com/",
    blockExplorerUrl: "https://gnosisscan.io/",
    icon: "Gnosis",
  },
  {
    id: "0xa4b1",
    token: "AETH",
    label: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorerUrl: "https://arbiscan.io/",
    icon: "Arbitrum",
  },
  {
    id: "0xa",
    token: "ETH",
    label: "Optimism",
    rpcUrl: "https://optimism-mainnet.public.blastapi.io/",
    blockExplorerUrl: "https://optimistic.etherscan.io/",
    icon: "Optimism",
  },
]
export const testChains: Chain[] = [
  {
    id: "0x13881",
    token: "MATIC",
    label: "Mumbai",
    rpcUrl: "https://matic-mainnet.chainstacklabs.com",
    blockExplorerUrl: "https://mumbai.polygonscan.com/",
    icon: "Polygon",
  },
  {
    id: "0x5",
    token: "GTH",
    label: "Goerli",
    rpcUrl: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
    blockExplorerUrl: "https://goerli.etherscan.io/",
    icon: "Ethereum",
  },
  {
    id: "0x1a4",
    token: "ETH",
    label: "Optimism Goerli",
    rpcUrl: "https://goerli.optimism.io/",
    blockExplorerUrl: "https://goerli-optimism.etherscan.io/",
    icon: "Optimism",
  },
]

if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
  chains.push(...testChains)
}

const chainsMap = new Map<string | number, string>()
chains.map((c) => {
  chainsMap.set(c.id, c.label) // string hex id
  chainsMap.set(parseInt(c.id), c.label) // num id
})

export function chainName(id?: string | number): string {
  if (!id) {
    return ""
  }

  const name = chainsMap.get(id)
  if (!name) {
    console.error(`No chain found with id ${id}. "id" must either:
    - be a string with hex value,
    - a number with decimal value`)
    return ""
  }

  return name
}

export function chainIcon(name: string): string {
  const icon = chains.filter((c) => c.label === name)[0].icon
  return icon || ""
}

export function chainIdToHex(id: ChainId): string {
  return `0x${id.toString(16)}`
}
