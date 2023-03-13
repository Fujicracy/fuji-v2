import Image, { ImageProps } from "next/image"
import { Box, Palette, useTheme } from "@mui/material"

export interface Icon extends Omit<ImageProps, "src" | "alt"> {
  sx?: object
}

export function renderIconError(props: Icon, palette: Palette) {
  const { ...rest } = props

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

export function renderIcon(
  props: Icon,
  path: string,
  name: string,
  onError: (e: any) => void,
  defaultImage: string | undefined = undefined
) {
  const { ...rest } = props

  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <Image
            {...rest}
            src={defaultImage || path}
            alt={`${name} icon`}
            onError={onError}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={defaultImage || path}
          alt={`${name} icon`}
          onError={onError}
        />
      )}
    </>
  )
}
