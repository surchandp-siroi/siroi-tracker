"use client";

import { useTemplateCopy, useTemplateLanguageSelector } from "@/components/foundations/template-copy/template-copy";

import { useDirection } from "@/components/foundations/direction/direction";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { RiAddFill, RiEqualizer3Line, RiBuilding2Line, RiShieldCheckLine } from "@remixicon/react";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ChevronUpDownSmall } from "@/components/foundations/icons/chevrons";
import { cx } from "@/utils/cx";
import { useAuthStore, BRANCH_ACCOUNTS } from "@/store/useAuthStore";

type AvatarColor = "neutral" | "lime" | "pink";

type UserRow = {
  initials: string;
  color: AvatarColor;
  name: string;
  isSelected?: boolean;
};

const SIROI_BRANCHES = [
  { initials: "GH", color: "lime" as const, name: "Guwahati (HO)", location: "Assam" },
  { initials: "IM", color: "neutral" as const, name: "Imphal Branch", location: "Manipur" },
  { initials: "IT", color: "pink" as const, name: "Itanagar Branch", location: "Arunachal Pradesh" },
  { initials: "NM", color: "neutral" as const, name: "Nagaland & Mizoram", location: "Dimapur & Aizawl" },
];

/** Label slot on the trigger: blurs + fades away as the rail collapses. */
function Collapsible({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  const localize = useTemplateCopy();
  return localize((
    <span
      className={cx(
        "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity,filter] duration-300 ease-in-out",
        collapsed ? "max-w-0 opacity-0 blur-[3px]" : "max-w-40 opacity-100 blur-0",
      )}
    >
      {children}
    </span>
  ));
}

function UserMenuItem({ initials, color, name, isSelected, onSelect }: UserRow & { onSelect: () => void }) {
  const localize = useTemplateCopy();
  return localize((
    <AriaButton
      type="button"
      aria-current={isSelected ? "page" : undefined}
      onPress={onSelect}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2 rounded-2lg px-2 py-1.5 text-start outline-none transition-colors",
        isSelected
          ? "bg-background-primary-hover"
          : "hover:bg-background-primary-hover focus-visible:bg-background-primary-hover",
      )}
    >
      <Avatar size="xs" color={color} initials={initials} />
      <span className="truncate text-body-medium text-text-primary">{name}</span>
    </AriaButton>
  ));
}

/** The dropdown's contents — users-with-access list + Add user/Manage
 *  actions — split out so other triggers (e.g. the calendar template's
 *  inbox icon) can open the same panel without duplicating it. */
export function AccountMenuContent({ onSelect }: { onSelect: () => void }) {
  const localize = useTemplateCopy();
  const { user } = useAuthStore();
  return localize((
    <>
      {/* Branches with access */}
      <div className="flex w-full flex-col gap-1 pt-1">
        <span className="px-2 text-caption-1-semibold uppercase tracking-wider text-text-tertiary">Branches & Offices</span>
        <div className="flex w-full flex-col gap-1">
          {SIROI_BRANCHES.map((branch) => (
            <div
              key={branch.name}
              onClick={onSelect}
              className="flex w-full cursor-pointer items-center justify-between rounded-2lg px-2 py-1.5 text-start transition-colors hover:bg-background-secondary-hover"
            >
              <div className="flex items-center gap-2">
                <Avatar size="xs" color={branch.color} initials={branch.initials} />
                <span className="truncate text-body-medium text-text-primary">{branch.name}</span>
              </div>
              <span className="text-[10px] text-text-tertiary">{branch.location}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full-bleed divider */}
      <div className="-mx-1 my-1.5 h-px bg-separator-border" />

      {/* Session details */}
      <div className="flex flex-col gap-0.5 px-2 py-1">
        <span className="text-[10px] uppercase font-bold text-text-tertiary">Current Session</span>
        <span className="truncate text-body-2-regular font-medium text-text-secondary">{user?.email}</span>
        <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wider">
          {user?.role === 'admin' ? 'Super Admin' : user?.role === 'manager' ? 'Branch Manager' : 'State Terminal'}
        </span>
      </div>
    </>
  ));
}

export function DashboardUserMenu({
  collapsed = false,
  suppressHover = false,
  onHoverSuppressionEnd,
  avatarClassName,
}: {
  collapsed?: boolean;
  /** Prevents expansion from creating a hover state under a stationary pointer. */
  suppressHover?: boolean;
  /** Re-arms hover after the pointer fully leaves the trigger. */
  onHoverSuppressionEnd?: () => void;
  avatarClassName?: string;
}) {
  const localize = useTemplateCopy();
  const direction = useDirection();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const portalName = user?.role === 'manager' 
    ? `${user?.latestLocation || (user?.email && BRANCH_ACCOUNTS[user.email.toLowerCase()]?.branchName) || 'Branch'} Portal` 
    : user?.role === 'admin' 
    ? 'Admin Terminal' 
    : 'State Terminal';

  return localize((
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <AriaButton
        aria-label="Siroi Forex"
        onPointerLeave={() => {
          if (suppressHover) onHoverSuppressionEnd?.();
        }}
        className={cx(
          "relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2",
          "before:pointer-events-none before:absolute before:-inset-x-1.5 before:-inset-y-[5px] before:rounded-full before:border-2 before:border-transparent before:transition-colors before:duration-150",
          !suppressHover && "hover:before:border-border-sidebar-profile-hover",
          collapsed && "w-9 justify-center gap-0 before:-inset-x-[3px]",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-button-primary text-text-white font-black text-sm shadow-xs inset-shadow-2xs border border-white/10">
          S
        </span>
        <Collapsible collapsed={collapsed}>
          <span className="flex flex-col text-start">
            <span className="flex items-center gap-1 text-caption-1-semibold uppercase tracking-wider text-text-primary leading-tight">
              Siroi Forex
              <ChevronUpDownSmall className="size-4 shrink-0 text-foreground-icon-tertiary" />
            </span>
            <span className="text-[10px] text-text-tertiary font-medium leading-tight truncate max-w-[150px]">
              {portalName}
            </span>
          </span>
        </Collapsible>
      </AriaButton>

      <AriaPopover
        placement={isMobile ? "bottom start" : direction === "rtl" ? "left top" : "right top"}
        offset={8}
        className={cx(
          "w-[265px] max-w-[calc(100vw-32px)] origin-top-left overflow-y-auto",
          "rounded-[14px] border border-border-button-default bg-background-primary-default p-1.5 shadow-dropdown",
          "transition duration-150 ease-out",
          "data-[entering]:opacity-0 data-[entering]:scale-95 data-[entering]:blur-[2px]",
          "data-[exiting]:opacity-0 data-[exiting]:scale-95 data-[exiting]:blur-[2px]",
        )}
      >
        <AriaDialog aria-label="Account menu" className="flex flex-col outline-none">
          <AccountMenuContent onSelect={() => setIsOpen(false)} />
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  ));
}
