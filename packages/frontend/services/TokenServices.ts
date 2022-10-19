import { Token } from "@x-fuji/sdk"

export const getTokenBySymbol = (symbol: string, tokens: Token[]): Token => {
  let token = tokens[0]
  tokens.forEach((t: Token) => {
    if (t.symbol === symbol) {
      token = t
    }
  })

  return token
}
