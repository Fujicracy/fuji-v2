import { Token } from "@x-fuji/sdk"
import { formatEther } from "ethers/lib/utils"

export const getTokenBySymbol = (symbol: string, tokens: Token[]): Token => {
  let token = tokens[0]
  tokens.forEach((t: Token) => {
    if (t.symbol === symbol) {
      token = t
    }
  })

  return token
}

export const hexToDecimal = (hex: string) => {
  return parseFloat(formatEther(hex.toString()))
}
