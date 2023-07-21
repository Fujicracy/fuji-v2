import Image, { ImageProps } from 'next/image';
import { SyntheticEvent } from 'react';

export interface Icon extends Omit<ImageProps, 'src' | 'alt'> {
  sx?: object;
}

export function renderIconError(props: Icon) {
  const { ...rest } = props;

  return (
    <Image {...rest} src={'/assets/images/shared/noIcon.svg'} alt={`no icon`} />
  );
}

export function renderIcon(
  props: Icon,
  path: string,
  name: string,
  onError: (e: SyntheticEvent<HTMLImageElement, Event>) => void,
  defaultImage?: string
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
