import { Box, Palette } from '@mui/material';
import Image, { ImageProps } from 'next/image';
import { SyntheticEvent } from 'react';

export interface Icon extends Omit<ImageProps, 'src' | 'alt'> {
  sx?: object;
}

export function renderIconError(props: Icon, palette: Palette) {
  const { ...rest } = props;

  return (
    <Box
      {...rest}
      sx={{
        ...props.sx,
        background: palette.secondary.main,
        borderRadius: '100%',
      }}
    ></Box>
  );
}

export function renderIcon(
  props: Icon,
  path: string,
  name: string,
  onError: (e: SyntheticEvent<HTMLImageElement, Event>) => void,
  defaultImage: string | undefined = undefined
) {
  const { ...rest } = props;

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
  );
}
