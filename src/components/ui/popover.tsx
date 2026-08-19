import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PopoverContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PopoverContext = React.createContext<PopoverContextType | null>(null);

export interface PopoverTriggerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function PopoverTrigger({
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
  className,
}: PopoverTriggerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      const nextVal = typeof val === "function" ? val(open) : val;
      if (!isControlled) {
        setUncontrolledOpen(nextVal);
      }
      setControlledOpen?.(nextVal);
    },
    [isControlled, open, setControlledOpen]
  );

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  const childrenArray = React.Children.toArray(children);
  const triggerButton = childrenArray[0];
  const popoverContent = childrenArray.slice(1);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        {React.isValidElement(triggerButton)
          ? React.cloneElement(triggerButton as React.ReactElement<any>, {
              onClick: (e: React.MouseEvent) => {
                (triggerButton as any).props?.onClick?.(e);
                setOpen(!open);
              },
            })
          : triggerButton}
        {open && popoverContent}
      </div>
    </PopoverContext.Provider>
  );
}

export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  placement?: "bottom start" | "bottom end" | "bottom" | "top start" | "top end" | "top";
}

export function Popover({
  className,
  placement = "bottom start",
  children,
  ...props
}: PopoverProps) {
  const placementClasses = {
    "bottom start": "top-full left-0 mt-2 origin-top-left",
    "bottom end": "top-full right-0 mt-2 origin-top-right",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2 origin-top",
    "top start": "bottom-full left-0 mb-2 origin-bottom-left",
    "top end": "bottom-full right-0 mb-2 origin-bottom-right",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom",
  };

  return (
    <div
      className={cn(
        "absolute z-[9999] rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200",
        placementClasses[placement] || placementClasses["bottom start"],
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}
