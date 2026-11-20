import type { CSSProperties, ImgHTMLAttributes } from "react";

export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | StaticImageData;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  unoptimized?: boolean;
}

export default function Image({
  src,
  alt,
  fill,
  priority,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  loading,
  ...rest
}: ImageProps) {
  const resolvedSrc = typeof src === "string" ? src : src.src;
  const fillStyle: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        inset: 0,
        ...style,
      }
    : style;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={priority ? "eager" : loading ?? "lazy"}
      style={fillStyle}
      {...rest}
    />
  );
}

