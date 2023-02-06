import { Box, useTheme } from "@mui/material"
import { ChainId } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"
import { chainName } from "../services/chains"

interface Props extends Omit<ImageProps, "src"> {
  network: string | ChainId
  sx?: object
}

export default function NetworkIcon(props: Props) {
  const { palette } = useTheme()
  const { network, ...rest } = props

  const name = typeof network === "string" ? network : chainName(network)
  const path = `/assets/images/protocol-icons/networks/${name}.svg`

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for network ${name}. Searched in ${path}`
      )
  }, [error, network, path, name])

  if (error) {
    return (
      <Box
        {...rest}
        sx={{
          ...props.sx,
          background: palette.secondary.main,
          borderRadius: "100%",
        }}
      ></Box>
    )
  }

  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <Image
            {...rest}
            src={path}
            alt={`${name} icon`}
            onError={(e) => setError(e)}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={path}
          alt={`${name} icon`}
          onError={(e) => setError(e)}
        />
      )}
    </>
  )
}
