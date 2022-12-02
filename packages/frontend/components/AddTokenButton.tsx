import LoadingButton from "@mui/lab/LoadingButton"
import { Token } from "@x-fuji/sdk"
import { useState } from "react"
import { getTokenImage } from "./TokenIcon"

declare const ethereum: any

type ButtonAddTokenProps = {
  token: Token
}

export function AddTokenButton({ token }: ButtonAddTokenProps) {
  type Status = "initial" | "loading" | "success" | "error"
  const [status, setStatus] = useState<Status>("initial")

  const handleClick = async () => {
    setStatus("loading")
    // TODO: what if asset chain is !== current chain ??
    try {
      await addTokenToMetamask(token)
      setStatus("success")
    } catch (e) {
      // user probably rejected
      console.error(">>>", e)
      setStatus("error")
    }
  }

  return (
    <LoadingButton
      fullWidth
      variant="secondary"
      onClick={handleClick}
      loading={status === "loading"}
      disabled={status === "success"}
    >
      {(status === "initial" || status === "error") && `Add ${token.symbol}`}
      {status === "success" && <>Done sir ✅</>}
    </LoadingButton>
  )
}

async function addTokenToMetamask(token: Token) {
  if (!ethereum) {
    console.error("var ethereum is undefined, user may not have mmask")
    return
  }
  const { symbol, decimals } = token
  const address = token.address.value // TODO: sdk problem, value is a getter so it cannot be stringified
  console.log({ symbol, decimals, address })
  const { protocol, host } = window.location
  const image = `${protocol}${host}${getTokenImage(token.symbol)}`

  const success = await ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20", // Initially only supports ERC20, but eventually more!
      options: {
        address: address,
        symbol,
        decimals,
        image,
      },
    },
  })

  if (!success) {
    throw "await ethereum.request is false or undefined"
  }
}
