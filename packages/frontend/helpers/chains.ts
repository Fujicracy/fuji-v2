import { Chain as OnboardChain } from "@web3-onboard/common"
import { CHAIN, ChainId, CHAIN_LABEL } from "@x-fuji/sdk"

export const chains = [
  CHAIN[ChainId.ETHEREUM],
  CHAIN[ChainId.MATIC],
  CHAIN[ChainId.FANTOM],
  CHAIN[ChainId.ARBITRUM],
  CHAIN[ChainId.OPTIMISM],
].filter((c) => c.isDeployed)

export const testChains = [
  CHAIN[ChainId.GOERLI],
  CHAIN[ChainId.MATIC_MUMBAI],
  CHAIN[ChainId.OPTIMISM_GOERLI],
]

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
  if (!id) {
    return ""
  }
  return CHAIN_LABEL[id]
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

export function transactionUrl(id: string | number, hash: string) {
  return explorerUrl(id, hash, "tx")
}

export function addressUrl(id: string | number | undefined, address: string) {
  return explorerUrl(id, address, "address")
}

function explorerUrl(
  id: string | number | undefined,
  value: string,
  type: "tx" | "address"
) {
  const link = "" // TODO: explorersMap.get(id)
  if (!link) {
    console.error(`No blockExplorerUrl found for chainId ${id}.
    - Make sure id is valid (hex string or base 10 number) and the chain is setup in web3-onboard config
    - Make sure blockExplorerUrl is set for chain ${id} in web3-onboard config`)
    return
  }
  return link + type + "/" + value
}
