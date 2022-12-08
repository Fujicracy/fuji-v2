import { Box, useTheme } from "@mui/material"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  providerName: string
  sx?: object
}
const defaultImage = "/assets/images/protocol-icons/providers/Aave V3.svg"

export default function ProviderIcon(props: Props) {
  const { palette } = useTheme()
  const { providerName, ...rest } = props
  const path = `/assets/images/protocol-icons/providers/${providerName}.svg`

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.warn(
        `404 Not found. No image found for network ${providerName}. Searched in ${path}`
      )
  }, [error, path, providerName])

  if (error) {
    return (
      <Box
        {...rest}
        {...props.sx}
        sx={{
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
            src={error ? defaultImage : path}
            alt={`${providerName} icon`}
            onError={(e) => setError(e)}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={error ? defaultImage : path}
          alt={`${providerName} icon`}
          onError={(e) => setError(e)}
        />
      )}
    </>
  )
}
