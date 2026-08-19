import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextType | null>(null);

export interface DropdownMenuTriggerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuTrigger({
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
  className,
}: DropdownMenuTriggerProps) {
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
  const menuContent = childrenArray.slice(1);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        {React.isValidElement(triggerButton)
          ? React.cloneElement(triggerButton as React.ReactElement<any>, {
              onClick: (e: React.MouseEvent) => {
                (triggerButton as any).props?.onClick?.(e);
                setOpen(!open);
              },
              "aria-expanded": open,
            })
          : triggerButton}
        {open && menuContent}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center";
}

export function DropdownMenu({
  className,
  align = "start",
  children,
  ...props
}: DropdownMenuProps) {
  const alignClasses = {
    start: "left-0 origin-top-left",
    end: "right-0 origin-top-right",
    center: "left-1/2 -translate-x-1/2 origin-top",
  };

  return (
    <div
      className={cn(
        "absolute top-full mt-2 z-[9999] min-w-[200px] p-1.5 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/10 shadow-2xl text-slate-800 dark:text-slate-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col gap-0.5",
        alignClasses[align],
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive";
  iconColor?: "indigo" | "sky" | "emerald" | "amber" | "rose" | "purple" | "default";
}

export function DropdownMenuItem({
  className,
  variant = "default",
  iconColor = "default",
  children,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const context = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    context?.setOpen(false);
  };

  const isDestructive = variant === "destructive";

  const colorVariants: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20",
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  };

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold tracking-tight transition-all duration-150 cursor-pointer select-none outline-none hover:translate-x-0.5",
        isDestructive
          ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {React.Children.map(children, (child, idx) => {
        if (idx === 0 && React.isValidElement(child)) {
          const activeColor = isDestructive ? colorVariants.rose : colorVariants[iconColor] || colorVariants.default;
          return (
            <span
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center p-1 group-hover:scale-110 transition-transform shadow-sm shrink-0",
                activeColor
              )}
            >
              {child}
            </span>
          );
        }
        return child;
      })}
    </button>
  );
}

export function DropdownMenuSeparator({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("my-1 h-px bg-slate-100 dark:bg-white/5", className)}
      role="separator"
    />
  );
}

export function DropdownMenuLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
