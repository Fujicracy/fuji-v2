import { chains } from "../store/auth.store"

const chainsMap = new Map()
chains.map((c) => {
  chainsMap.set(c.id, c.blockExplorerUrl)
  chainsMap.set(parseInt(c.id), c.blockExplorerUrl)
})

export function transactionLink(id: string | number, hash: string) {
  const link = chainsMap.get(id)
  if (!link) {
    console.error(`No blockExplorerUrl found for chainId ${id}.
    - Make sure id is valid (hex string or base 10 number) and the chain is setup in web3-onboard config
    - Make sure blockExplorerUrl is set for chain ${id} in web3-onboard config`)
    return
  }
  return link + "tx/" + hash
}
