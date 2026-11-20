import type { AnchorHTMLAttributes, Ref } from "react";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
  scroll?: boolean;
  replace?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

export default function Link({
  href,
  prefetch: _prefetch,
  scroll: _scroll,
  replace: _replace,
  children,
  ...rest
}: LinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

