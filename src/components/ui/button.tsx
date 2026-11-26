import * as React from "react";
import {
  Button as BaseBoardUIButton,
  type ButtonProps as BaseBoardUIButtonProps,
  ButtonLink,
  buttonStyles,
} from "@/components/base/buttons/button";

export interface ButtonProps extends Omit<BaseBoardUIButtonProps, "variant" | "size"> {
  variant?: "default" | "primary" | "secondary" | "amber" | "outline" | "ghost" | "destructive" | "danger" | "link";
  size?: "sm" | "md" | "lg" | "small" | "medium" | "xs" | "large" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "medium", className, ...props }, ref) => {
    const mappedVariant =
      variant === "default" ? "primary" :
      variant === "outline" ? "secondary" :
      variant === "destructive" ? "danger" :
      variant === "link" ? "ghost" :
      variant;

    const mappedSize =
      size === "sm" ? "small" :
      size === "md" ? "medium" :
      size === "lg" ? "large" :
      size === "icon" ? "medium" :
      size;

    const iconOnly = size === "icon";

    return (
      <BaseBoardUIButton
        ref={ref}
        variant={mappedVariant as any}
        size={mappedSize as any}
        iconOnly={iconOnly}
        className={className}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { ButtonLink, buttonStyles };
export const buttonVariants = (_options?: { variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) => "";
