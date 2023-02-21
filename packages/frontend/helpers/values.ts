export function formatNumber(
  num: number | undefined,
  decimals: number
): number | "-" {
  if (!num) return "-"

  return parseFloat(num.toFixed(decimals))
}

/*
  Format the balance depending of the token.
  If no token is specified, 5 digits are used.
  Else, eth based tokens use 4 digits
*/
export const formatBalance = (
  balance: number | string | undefined,
  rounding: boolean | undefined = undefined
): string => {
  return (
    balance?.toLocaleString("en-US", {
      notation: rounding ? "compact" : "standard",
    }) ?? "0"
  )
}

export const toNotSoFixed = (v: number | string): string => {
  const value: number = typeof v === "number" ? v : Number(v)
  const leadingZeroes = -Math.floor(Math.log(value) / Math.log(10) + 1) // Account leading zeroes
  const to = leadingZeroes > 0 ? 1 + leadingZeroes : 2
  return Number(value.toFixed(to)).toString() // Remove trailing zeroes
}

export function camelize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
