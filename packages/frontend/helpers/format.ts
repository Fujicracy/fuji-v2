import { Token } from "@x-fuji/sdk"

export const formatUsd = (n?: number): string => {
  if (!n) {
    n = 0
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "usd",
  })
}

export const formatBalance = (n?: number): string => {
  if (!n) {
    n = 0
  }
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    // notation: "compact",
  })
}
