"use client";

import { useTemplateCopy, useTemplateLanguageSelector } from "@/components/foundations/template-copy/template-copy";

import { useDirection } from "@/components/foundations/direction/direction";
import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import {
  RiBankCardLine,
  RiBankLine,
  RiBox3Line,
  RiFolder6Line,
  RiGroupLine,
  RiLogoutBoxRLine,
  RiMessage2Line,
  RiNotification3Line,
  RiPaletteLine,
  RiSchoolLine,
  RiShieldUserLine,
  RiUserSettingsLine,
  RiRefreshLine,
} from "@remixicon/react";
import { Capacitor } from "@capacitor/core";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from "react-aria-components";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { Avatar } from "@/components/base/avatar/avatar";
import { Counter } from "@/components/base/badges/counter";
import { ChevronDownSmall } from "@/components/foundations/icons/chevrons";
import { cx } from "@/utils/cx";
import { useAuthStore, resolveUserDisplay } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

type MenuRow = {
  icon: IconComponent;
  label: string;
  badge?: string;
  isSelected?: boolean;
  onClick?: () => void;
};

type MenuGroup = {
  id: string;
  label?: string;
  items: MenuRow[];
};

const GROUPS: MenuGroup[] = [
  {
    id: "workspace",
    items: [
      { icon: RiBankLine, label: "View team profile" },
      { icon: RiFolder6Line, label: "Folders" },
      { icon: RiMessage2Line, label: "Messages", badge: "94" },
      { icon: RiGroupLine, label: "People" },
    ],
  },
  {
    id: "company",
    label: "Company",
    items: [
      { icon: RiBankCardLine, label: "Billing" },
      { icon: RiSchoolLine, label: "Company Details" },
      { icon: RiBox3Line, label: "Integrations" },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    items: [
      { icon: RiNotification3Line, label: "Notifications" },
      { icon: RiShieldUserLine, label: "Account Details" },
      { icon: RiLogoutBoxRLine, label: "Sign out" },
    ],
  },
];

/** Label/chevron slot on the trigger: blurs + fades away as the rail collapses. */
function Collapsible({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  const localize = useTemplateCopy();
  return localize((
    <span
      className={cx(
        "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
      )}
    >
      {children}
    </span>
  ));
}

function TeamMenuItem({ icon: Icon, label, badge, isSelected, onClick, onSelect }: MenuRow & { onSelect: () => void }) {
  const localize = useTemplateCopy();
  return localize((
    <AriaButton
      type="button"
      aria-current={isSelected ? "page" : undefined}
      onPress={() => {
        onSelect();
        onClick?.();
      }}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-2lg p-2 text-start outline-none transition-colors",
        isSelected
          ? "bg-background-primary-hover"
          : "hover:bg-background-primary-hover focus-visible:bg-background-primary-hover",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Icon className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
        <span className="truncate text-body-medium text-text-primary">{label}</span>
      </span>
      {badge && (
        <Counter
          color="neutral"
          className="bg-team-menu-count-background text-team-menu-count-foreground"
        >
          {badge}
        </Counter>
      )}
    </AriaButton>
  ));
}

const mobileSnapshot = () => window.matchMedia("(max-width: 639px)").matches;
const subscribeMobile = (listener: () => void) => {
  const query = window.matchMedia("(max-width: 639px)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};

export function DashboardTeamMenu({
  collapsed = false,
  className,
  showThemeToggle = false,
}: {
  collapsed?: boolean;
  className?: string;
  /** Show appearance controls inside the menu instead of the sidebar. */
  showThemeToggle?: boolean;
}) {
  const localize = useTemplateCopy();
  const languageSelector = useTemplateLanguageSelector();
  const direction = useDirection();
  const [isOpen, setIsOpen] = useState(false);
  const { user, activeUserEmail, authorizedUsers, logout } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, () => false);

  const currentEmail = (activeUserEmail || user?.email || 'sharjuthoudam@siroiforex.com').toLowerCase().trim();
  const activeAuthUser = authorizedUsers.find(
    (u) => u.email.toLowerCase().trim() === currentEmail
  );

  const { firstName, initials, color, avatarUrl } = resolveUserDisplay(activeAuthUser, user);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      navigate('/');
    }
  };

  const isNative = Capacitor.isNativePlatform();

  const groups: MenuGroup[] = [
    {
      id: "personal",
      label: "Settings",
      items: [
        {
          icon: RiUserSettingsLine,
          label: "Profile Settings",
          onClick: () => {
            window.dispatchEvent(new CustomEvent('siroi:open-profile'));
          },
        },
        ...(isNative ? [{
          icon: RiRefreshLine,
          label: "Update App",
          onClick: () => {
            window.dispatchEvent(new CustomEvent('siroi:update-app'));
          },
        }] : []),
        {
          icon: RiLogoutBoxRLine,
          label: "Sign out",
          onClick: handleLogout,
        },
      ],
    },
  ];

  return localize((
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <AriaButton
        aria-label={firstName}
        className={cx(
          "flex cursor-pointer items-center overflow-hidden outline-none",
          "border-2 border-transparent hover:border-border-button-hover",
          "transition-[width,background-color,border-color,padding] duration-300 ease-in-out",
          "focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2",
          collapsed
            ? "size-9 justify-center rounded-full bg-transparent p-0"
            : "w-full justify-between rounded-xl bg-background-tertiary-default py-2.5 pe-4 ps-2.5",
          className,
        )}
      >
        <span className={cx("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-2.5")}>
          <Avatar size="md" color={color} initials={initials} alt={firstName} src={avatarUrl} />
          <Collapsible collapsed={collapsed}>
            <span className="flex min-w-0 flex-col items-start justify-center text-start">
              <span className="text-body-medium whitespace-nowrap text-text-primary font-semibold leading-tight">{firstName}</span>
            </span>
          </Collapsible>
        </span>
        <Collapsible collapsed={collapsed}>
          <span className="flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-background-tertiary-hover">
            <ChevronDownSmall
              className={cx("size-4 text-text-secondary transition-transform duration-200 ease", isOpen && "rotate-180")}
            />
          </span>
        </Collapsible>
      </AriaButton>

      <AriaPopover
        placement={isMobile ? "bottom start" : direction === "rtl" ? "left bottom" : "right bottom"}
        offset={8}
        className={cx(
          "w-[265px] max-w-[calc(100vw-32px)] origin-bottom-left overflow-y-auto",
          "rounded-2xl border border-border-button-default bg-background-primary-default p-2.5 shadow-dropdown",
          "transition duration-150 ease-out",
          "data-[entering]:opacity-0 data-[entering]:scale-95 data-[entering]:blur-[2px]",
          "data-[exiting]:opacity-0 data-[exiting]:scale-95 data-[exiting]:blur-[2px]",
        )}
      >
        <AriaDialog aria-label="User account menu" className="flex flex-col gap-[7px] outline-none">
          {/* Header */}
          <div className="flex w-full items-center gap-2.5 px-2 pt-1 pb-2.5 border-b border-separator-border">
            <Avatar size="md" color={color} initials={initials} alt={firstName} src={avatarUrl} />
            <div className="flex min-w-0 flex-col items-start justify-center">
              <span className="text-body-medium whitespace-nowrap text-text-primary font-semibold leading-tight">{firstName}</span>
              <span className="text-caption-1-regular text-text-tertiary truncate mt-0.5">
                {activeAuthUser?.role === 'admin'
                  ? 'Administrator'
                  : activeAuthUser?.role === 'manager'
                    ? `${activeAuthUser.branchName || 'Branch'} Manager`
                    : activeAuthUser?.email || user?.email || 'Authorized User'}
              </span>
            </div>
          </div>

          {/* Grouped sidebar-style rows */}
          <div className="flex w-full flex-col">
            {groups.map((group, index) => (
              <Group key={group.id} group={group} showDivider={index > 0} onSelect={() => setIsOpen(false)}>
                {showThemeToggle && group.id === "personal" && (
                  <div className="flex w-full items-center justify-between gap-2.5 rounded-2lg px-2 py-1">
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <RiPaletteLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
                      <span className="truncate text-body-medium text-text-primary">Appearance</span>
                    </span>
                    <ThemeToggle appearance="segmented" size="small" className="shrink-0" />
                  </div>
                )}
                {group.id === "personal" && languageSelector}
              </Group>
            ))}
          </div>

          {/* Footer */}
          <div className="flex w-full items-center justify-between px-2 pt-1 pb-1 border-t border-separator-border mt-1">
            <span className="text-[10px] uppercase font-bold text-text-tertiary">Siroi Tracker</span>
            <span className="inline-flex items-center justify-center rounded-sm bg-background-tertiary-default px-1.5 py-0.5 text-[10px] font-mono font-bold text-text-tertiary">
              v1.2.47
            </span>
          </div>
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  ));
}

function Group({ group, showDivider, onSelect, children }: { group: MenuGroup; showDivider: boolean; onSelect: () => void; children?: ReactNode }) {
  const localize = useTemplateCopy();
  return localize((
    <>
      {showDivider && <div className="-mx-2.5 my-2.5 h-px bg-border-button-default" />}
      <div className={cx("flex w-full flex-col gap-1", group.label && "gap-1.5 pt-1")}>
        {group.label && (
          <span className="px-2 text-body-medium text-text-secondary">{group.label}</span>
        )}
        <div className="flex w-full flex-col gap-1">
          {group.items.map((item) => (
            <TeamMenuItem key={item.label} {...item} onSelect={onSelect} />
          ))}
          {children}
        </div>
      </div>
    </>
  ));
}
