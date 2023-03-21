import { Chain as OnboardChain } from "@web3-onboard/common"
import {
  CHAIN,
  ChainId,
  ChainType,
  CHAIN_BLOCK_EXPLORER_URL,
  CHAIN_NAME,
} from "@x-fuji/sdk"

const chainsWithType = (type: ChainType) =>
  Object.values(CHAIN).filter((c) => c.isDeployed && c.chainType === type)

export const chains = chainsWithType(ChainType.MAINNET)
export const testChains = chainsWithType(ChainType.TESTNET)

// if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
//   chains.push(...testChains)
// }

const rpcs = {
  [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  [ChainId.MATIC]: "https://matic-mainnet.chainstacklabs.com",
  [ChainId.FANTOM]: "https://rpcapi.fantom.network",
  [ChainId.ARBITRUM]: "https://arb1.arbitrum.io/rpc",
  [ChainId.OPTIMISM]: "https://optimism-mainnet.public.blastapi.io/",
  [ChainId.GNOSIS]: "https://rpc.gnosischain.com/",
  [ChainId.GOERLI]: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  [ChainId.MATIC_MUMBAI]: "https://matic-mainnet.chainstacklabs.com",
  [ChainId.OPTIMISM_GOERLI]: "https://goerli.optimism.io/",
}

export const onboardChains: OnboardChain[] = chains.map((c) => {
  return {
    id: chainIdToHex(c.chainId),
    token: c.nativeTokenName,
    label: c.label,
    blockExplorerUrl: c.blockExplorerUrl,
    rpcUrl: rpcs[c.chainId],
  }
})

export function chainName(id?: ChainId): string {
  if (!id) return ""
  return CHAIN_NAME[id]
}

export function isChain(id: number): boolean {
  return ChainId[Number(id)] !== undefined
}

export function chainIdToHex(id: ChainId): string {
  return `0x${id.toString(16)}`
}

export function hexToChainId(hex: string | undefined): ChainId | undefined {
  if (!hex) return undefined
  return parseInt(hex, 16)
}

export function transactionUrl(id: ChainId, hash: string) {
  return explorerUrl(id, hash, "tx")
}

export function addressUrl(id: ChainId | undefined, address: string) {
  return explorerUrl(id, address, "address")
}

function explorerUrl(
  id: ChainId | undefined,
  value: string,
  type: "tx" | "address"
) {
  if (!id) return
  return CHAIN_BLOCK_EXPLORER_URL[id] + type + "/" + value
}
