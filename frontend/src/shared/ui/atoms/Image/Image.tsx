import { useState, type ComponentPropsWithRef, type ReactNode, type SyntheticEvent } from 'react';

import styles from './Image.module.scss';

export type ImageAspectRatio = 'auto' | '1/1' | '4/3' | '3/2' | '16/9' | '3/4' | '2/3' | '9/16';
export type ImageFit = 'cover' | 'contain' | 'fill';

const aspectRatioClasses: Record<ImageAspectRatio, string | undefined> = {
  auto: undefined,
  '1/1': styles.ratio1x1,
  '4/3': styles.ratio4x3,
  '3/2': styles.ratio3x2,
  '16/9': styles.ratio16x9,
  '3/4': styles.ratio3x4,
  '2/3': styles.ratio2x3,
  '9/16': styles.ratio9x16,
};

export interface ImageProps extends Omit<ComponentPropsWithRef<'img'>, 'src' | 'alt'> {
  src: string;
  alt: string;
  aspectRatio?: ImageAspectRatio;
  fit?: ImageFit;
  fallback?: ReactNode;
}

export function Image({
  src,
  alt,
  aspectRatio = 'auto',
  fit = 'cover',
  fallback,
  loading = 'lazy',
  decoding = 'async',
  className,
  onError,
  ...rest
}: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setFailedSrc(src);
    onError?.(event);
  };

  if (failedSrc === src && fallback !== undefined) {
    return <>{fallback}</>;
  }

  const classes = [styles.image, aspectRatioClasses[aspectRatio], styles[fit], className]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={classes}
      onError={handleError}
      {...rest}
    />
  );
}
