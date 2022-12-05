import LoadingButton from "@mui/lab/LoadingButton"
import { useState } from "react"
import { SeriazableToken } from "../store/history.store"
import { getTokenImage } from "./TokenIcon"

declare const ethereum: any // eslint-disable-line

type ButtonAddTokenProps = {
  token: SeriazableToken
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
      variant="rounded"
      onClick={handleClick}
      loading={status === "loading"}
      disabled={status === "success"}
    >
      {status === "success" ? <>Done sir ✅</> : `Add ${token.symbol}`}
    </LoadingButton>
  )
}

async function addTokenToMetamask(token: SeriazableToken) {
  if (!ethereum) {
    console.error("var ethereum is undefined, user may not have mmask")
    return
  }
  const { symbol, decimals, address } = token
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
