"use client";

import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";
import { useDirection } from "@/components/foundations/direction/direction";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiAddFill,
  RiEqualizer3Line,
  RiBuilding2Line,
  RiShieldCheckLine,
  RiBriefcaseLine,
  RiUserAddLine,
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCheckboxCircleFill,
  RiGlobalLine,
} from "@remixicon/react";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/base/modal/modal";
import { ChevronUpDownSmall } from "@/components/foundations/icons/chevrons";
import { cx } from "@/utils/cx";
import {
  useAuthStore,
  type AuthorizedUser,
  type PerspectiveRole,
  BRANCH_ACCOUNTS,
} from "@/store/useAuthStore";

type AvatarColor = "neutral" | "lime" | "pink" | "blue";

const SIROI_BRANCHES = [
  { initials: "GH", color: "lime" as const, name: "Guwahati (HO)", location: "Assam", branchId: "b1" },
  { initials: "IM", color: "neutral" as const, name: "Imphal Branch", location: "Manipur", branchId: "b2" },
  { initials: "IT", color: "pink" as const, name: "Itanagar Branch", location: "Arunachal Pradesh", branchId: "b3" },
  { initials: "NM", color: "neutral" as const, name: "Nagaland & Mizoram", location: "Dimapur & Aizawl", branchId: "b4" },
];

/** Label slot on the trigger: blurs + fades away as the rail collapses. */
function Collapsible({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  const localize = useTemplateCopy();
  return localize((
    <span
      className={cx(
        "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100",
      )}
    >
      {children}
    </span>
  ));
}

/**
 * Siroi Metallic Logo Badge
 * - Columns in crisp white
 * - Upward moving arrow in rich gold gradient
 * - Metallic teal background with diagonal gradient and light reflection
 */
export function SiroiMetallicLogoBadge({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cx(
        "relative flex shrink-0 items-center justify-center rounded-xl overflow-hidden",
        "shadow-[0_2px_8px_rgba(16,50,55,0.35),0_1px_2px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      {/* Metallic Teal Base Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #3d8892 0%, #20535a 38%, #143d43 72%, #0d282c 100%)",
        }}
      />

      {/* Siroi Logo SVG with White Columns & Gold Gradient Upward Arrow */}
      <svg
        className="relative z-10 w-[72%] h-[72%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
        id="siroi-badge-logo"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 487.86 330.51"
      >
        <defs>
          <linearGradient id="siroi-gold-gradient" x1="10%" y1="90%" x2="90%" y2="10%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="35%" stopColor="#fcd34d" />
            <stop offset="65%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Upward Moving Arrow in Gold Gradient */}
        <g fill="url(#siroi-gold-gradient)">
          <path d="M174.55,322.53c2.04.64,4.07-1.47,6.22-1.47,9.73.03,32.94-1.99,41.8-4.31l14.97-3.92c36.53-9.56,56.71-34.48,66.47-40.79l6.48-4.18c1.5-.97,3.49-1.4,3.1-3.6,24.74-17.28,42.42-37.18,58.58-63l-15.25-28.92,130.95-57.63-56.87,152.94-20.91-18.11c-38.37,42.77-89.99,70.94-147.08,79.11-27.56,3.94-63.1,1.48-88.45-6.12ZM469.14,129.4c0-.54-.44-.97-.97-.97s-.97.44-.97.97.44.97.97.97.97-.44.97-.97ZM466.42,130.71c0-.24-.2-.44-.44-.44s-.44.2-.44.44.2.44.44.44.44-.2.44-.44ZM383.83,208.74c11.34-14.57,22.98-26.15,35.16-38.53,14.27-14.52,29-26.86,46.15-38.88-12.13,3.33-21.6,9.29-32.65,13.99l-66.06,30.27,17.41,33.14Z"/>
          <path d="M313.58,264.27c.39,2.19-1.6,2.63-3.1,3.6l-6.48,4.18c-9.76,6.31-29.93,31.22-66.47,40.79l-14.97,3.92c-8.86,2.32-32.07,4.33-41.8,4.31-2.15,0-4.19,2.11-6.22,1.47-1.06-.33-2.3.03-3.38-.21.32-.63-.6-.49-.95-.58-47.26-11.89-92.75-32.29-133.24-59.96-13.15-8.99-25.79-17.93-36.98-29.94,32.36,17.54,62.86,33.43,96.93,44.49,61.81,20.05,127.76,27.24,189.1,2.25,9.97-4.06,19.15-8.44,27.55-14.31Z"/>
          <path d="M171.16,322.32c-.39-.09-.86-.08-.95-.58.35.09,1.27-.06.95.58Z"/>
          <path d="M383.83,208.74l-17.41-33.14,66.06-30.27c11.05-4.7,20.53-10.66,32.65-13.99-17.15,12.02-31.88,24.35-46.15,38.88-12.17,12.39-23.81,23.97-35.16,38.53Z"/>
        </g>

        {/* Columns in Crisp White */}
        <g fill="#FFFFFF">
          <path d="M154.65,273.52l-.26-1.84.12-230.68,70.37-.27c1.51,0,2.64-.79,3.56.13.74.74,1.18,1.33,1.18,3.07v226.86c0,2.24-1.02,3.9-2.93,4.3-6.35,1.32-12.43,2.95-18.89,3.77-17.98,2.28-36.86.5-53.17-5.34Z"/>
          <path d="M144.13,271.5c-5.65-1.84-11.13-1.03-16.51-1.89l-12.69-2.03c-14.18-2.27-27.18-7.39-40.08-13.12-4.1-1.82-5.01-3.33-5.01-8.12l.1-145.62h73.08c2.57,0,2.96,3.21,1.89,5.26l.04,156.99c0,3.07.94,4.88-.81,8.53Z"/>
          <path d="M294.28,257.79c-17.11,8.91-35.44,14.72-55.12,15.01l-.03-270.8C240.79.17,242.97,0,245.41,0l69.06.13-.02,242.17c-6.8,5.64-13.17,10.13-20.15,14.41.13.63-.01.94,0,1.08Z"/>
        </g>
      </svg>
    </div>
  );
}

/** Manage Users with Access Modal - 1:1 match with Comms Centre screenshot */
export function ManageUsersModal({
  isOpen,
  onClose,
  onOpenAddUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddUser: () => void;
}) {
  const { authorizedUsers, updateUserRole, removeAuthorizedUser } = useAuthStore();

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalHeader
        icon={RiEqualizer3Line}
        title="Manage users with access"
        description="Review authorized Admins and Relationship Managers in Siroi Finance CMD."
      />
      <ModalBody className="space-y-2.5 max-h-[380px] py-2">
        {authorizedUsers.map((user) => {
          const isSharju = user.email.toLowerCase().trim() === 'sharjuthoudam@siroiforex.com';
          const isManager = user.role === 'manager';
          const isAdmin = user.role === 'admin';

          return (
            <div
              key={user.email}
              className="flex items-center justify-between gap-3 rounded-xl border border-separator-border bg-background-secondary-default p-3 transition-colors hover:bg-background-secondary-hover"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar size="sm" color={(user.color as any) || 'neutral'} initials={user.initials} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-body-medium font-semibold text-text-primary">
                      {user.name}
                    </span>
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-semibold text-accent-700 dark:text-accent-300 border border-accent-500/30">
                        <RiShieldCheckLine className="size-3" /> Admin
                      </span>
                    ) : isManager ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-text-secondary border border-separator-border">
                        <RiBriefcaseLine className="size-3" /> RM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-text-tertiary border border-separator-border">
                        <RiBuilding2Line className="size-3" /> Branch
                      </span>
                    )}
                  </div>
                  <span className="truncate text-caption-1-regular text-text-tertiary">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {!isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateUserRole(user.email, 'admin')}
                    className="text-caption-1-semibold h-8 px-3 rounded-lg"
                  >
                    Make Admin
                  </Button>
                )}
                {isAdmin && !isSharju && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateUserRole(user.email, 'manager')}
                    className="text-caption-1-semibold h-8 px-3 rounded-lg"
                  >
                    Make RM
                  </Button>
                )}
                {!isSharju && (
                  <button
                    type="button"
                    title="Remove user"
                    onClick={() => removeAuthorizedUser(user.email)}
                    className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-notification-error-background hover:text-text-error-primary transition-colors"
                  >
                    <RiDeleteBinLine className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </ModalBody>
      <ModalFooter className="flex items-center justify-between sm:justify-between w-full pt-2 border-t border-separator-border">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
        <Button
          variant="primary"
          size="sm"
          leadingIcon={RiUserAddLine}
          onClick={() => {
            onClose();
            onOpenAddUser();
          }}
          className="bg-accent-500 hover:bg-accent-600 text-white"
        >
          Add user
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/** Add User Modal - 1:1 match with Comms Centre screenshot */
export function AddUserModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addAuthorizedUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'branch'>('admin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [selectedBranch, setSelectedBranch] = useState('Guwahati');
  const [fullAdminAccess, setFullAdminAccess] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const branchMap: Record<string, string> = {
      'Guwahati': 'b1',
      'Manipur': 'b2',
      'Itanagar': 'b3',
      'Nagaland & Mizoram': 'b4',
    };

    const generatedInitials = fullName
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';

    addAuthorizedUser({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: selectedRole,
      initials: generatedInitials,
      branchName: selectedRole !== 'admin' ? selectedBranch : undefined,
      branchId: selectedRole !== 'admin' ? branchMap[selectedBranch] : undefined,
      color: selectedRole === 'admin' ? 'lime' : selectedRole === 'manager' ? 'neutral' : 'pink',
    });

    onClose();
    setFullName('');
    setEmail('');
    setPhone('+91');
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalHeader
        icon={RiUserAddLine}
        title="Add user to Siroi Finance CMD"
        description="Grant dashboard access as an Admin, Relationship Manager, or Branch."
      />
      <form onSubmit={handleSubmit} className="flex flex-col">
        <ModalBody className="space-y-4 max-h-[460px] py-1">
          {/* Role Selection Cards */}
          <div className="flex flex-col gap-1.5">
            <span className="text-caption-1-semibold text-text-secondary">
              Select access role
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Admin Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setFullAdminAccess(true);
                }}
                className={cx(
                  "relative flex flex-col items-start p-3 rounded-xl border text-start transition-all cursor-pointer",
                  selectedRole === 'admin'
                    ? "border-accent-500 bg-accent-50/50 dark:bg-accent-950/30 ring-1 ring-accent-500"
                    : "border-separator-border bg-background-secondary-default hover:bg-background-secondary-hover",
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-accent-500/15 text-accent-600 dark:text-accent-400">
                    <RiShieldCheckLine className="size-4" />
                  </span>
                  {selectedRole === 'admin' && (
                    <RiCheckLine className="size-4 text-accent-600 dark:text-accent-400" />
                  )}
                </div>
                <span className="text-body-medium font-semibold text-text-primary">Admin</span>
                <span className="text-[11px] text-text-tertiary leading-tight mt-0.5">
                  Full access & complete overview
                </span>
              </button>

              {/* Relationship Mgr Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('manager');
                  setFullAdminAccess(false);
                }}
                className={cx(
                  "relative flex flex-col items-start p-3 rounded-xl border text-start transition-all cursor-pointer",
                  selectedRole === 'manager'
                    ? "border-accent-500 bg-accent-50/50 dark:bg-accent-950/30 ring-1 ring-accent-500"
                    : "border-separator-border bg-background-secondary-default hover:bg-background-secondary-hover",
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-background-tertiary-default text-text-secondary">
                    <RiBriefcaseLine className="size-4" />
                  </span>
                  {selectedRole === 'manager' && (
                    <RiCheckLine className="size-4 text-accent-600 dark:text-accent-400" />
                  )}
                </div>
                <span className="text-body-medium font-semibold text-text-primary">Relationship Mgr</span>
                <span className="text-[11px] text-text-tertiary leading-tight mt-0.5">
                  Outreach & scoped branch view
                </span>
              </button>

              {/* Branch Terminal Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('branch');
                  setFullAdminAccess(false);
                }}
                className={cx(
                  "relative flex flex-col items-start p-3 rounded-xl border text-start transition-all cursor-pointer col-span-2 sm:col-span-1",
                  selectedRole === 'branch'
                    ? "border-accent-500 bg-accent-50/50 dark:bg-accent-950/30 ring-1 ring-accent-500"
                    : "border-separator-border bg-background-secondary-default hover:bg-background-secondary-hover",
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-background-tertiary-default text-text-secondary">
                    <RiBuilding2Line className="size-4" />
                  </span>
                  {selectedRole === 'branch' && (
                    <RiCheckLine className="size-4 text-accent-600 dark:text-accent-400" />
                  )}
                </div>
                <span className="text-body-medium font-semibold text-text-primary">Branch</span>
                <span className="text-[11px] text-text-tertiary leading-tight mt-0.5">
                  Direct data entry terminal
                </span>
              </button>
            </div>
          </div>

          {/* Full Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption-1-semibold text-text-secondary">
              Full name <span className="text-accent-600">*</span>
            </label>
            <div className="relative flex items-center">
              <RiUserLine className="absolute left-3 size-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Priya Devi"
                className="w-full rounded-2lg border border-separator-border bg-background-primary-default py-2 pl-9 pr-3 text-body-medium text-text-primary placeholder:text-text-placeholder focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Official Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption-1-semibold text-text-secondary">
              Official email <span className="text-accent-600">*</span>
            </label>
            <div className="relative flex items-center">
              <RiMailLine className="absolute left-3 size-4 text-text-tertiary pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@siroiforex.com"
                className="w-full rounded-2lg border border-separator-border bg-background-primary-default py-2 pl-9 pr-3 text-body-medium text-text-primary placeholder:text-text-placeholder focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Phone / WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption-1-semibold text-text-secondary">
              Phone / WhatsApp (optional)
            </label>
            <div className="relative flex items-center">
              <RiPhoneLine className="absolute left-3 size-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full rounded-2lg border border-separator-border bg-background-primary-default py-2 pl-9 pr-3 text-body-medium text-text-primary placeholder:text-text-placeholder focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Branch Selector for Managers / Branch Terminals */}
          {selectedRole !== 'admin' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-caption-1-semibold text-text-secondary">
                Assigned Branch <span className="text-accent-600">*</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full rounded-2lg border border-separator-border bg-background-primary-default py-2 px-3 text-body-medium text-text-primary focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                {SIROI_BRANCHES.map((b) => (
                  <option key={b.name} value={b.name.replace(' (HO)', '').replace(' Branch', '')}>
                    {b.name} ({b.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Full Admin Access Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={fullAdminAccess}
              onChange={(e) => {
                setFullAdminAccess(e.target.checked);
                if (e.target.checked) setSelectedRole('admin');
              }}
              className="size-4 rounded border-separator-border text-accent-600 focus:ring-accent-500"
            />
            <span className="text-caption-1-medium text-text-primary select-none">
              Full Admin access
            </span>
          </label>
        </ModalBody>

        <ModalFooter className="pt-2 border-t border-separator-border">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            leadingIcon={RiUserAddLine}
            className="bg-accent-500 hover:bg-accent-600 text-white"
          >
            {selectedRole === 'admin' ? 'Add Admin' : 'Add User'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

const DEFAULT_BRANCH_USERS: AuthorizedUser[] = [
  { id: 'u8', name: 'Guwahati Terminal', email: 'mis.ghy@siroiforex.com', role: 'branch', branchName: 'Guwahati', branchId: 'b1', initials: 'GH', color: 'lime' },
  { id: 'u9', name: 'Imphal Terminal', email: 'mis.manipur@siroiforex.com', role: 'branch', branchName: 'Manipur', branchId: 'b2', initials: 'IM', color: 'neutral' },
  { id: 'u10', name: 'Itanagar Terminal', email: 'mis.itanagar@siroiforex.com', role: 'branch', branchName: 'Itanagar', branchId: 'b3', initials: 'IT', color: 'pink' },
  { id: 'u11', name: 'Nagaland & Mizoram Terminal', email: 'mis.mizonaga@siroiforex.com', role: 'branch', branchName: 'Nagaland & Mizoram', branchId: 'b4', initials: 'NM', color: 'neutral' },
];

/** The dropdown's contents — users-with-access list + 3 toggles + Add user/Manage */
export function AccountMenuContent({ onSelect }: { onSelect: () => void }) {
  const localize = useTemplateCopy();
  const navigate = useNavigate();
  const {
    authorizedUsers,
    activePerspective,
    activeManagerBranch,
    activeManagerBranchId,
    activeUserEmail,
  } = useAuthStore();

  const [selectedTab, setSelectedTab] = useState<'admin' | 'manager' | 'branch'>(
    activePerspective || 'admin'
  );
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Combine store authorized users with fallback branch users if branch role missing
  const branchUsersFromStore = authorizedUsers.filter((u) => u.role === 'branch');
  const branchUsers = branchUsersFromStore.length > 0 ? branchUsersFromStore : DEFAULT_BRANCH_USERS;

  const currentTabUsers =
    selectedTab === 'admin'
      ? authorizedUsers.filter((u) => u.role === 'admin')
      : selectedTab === 'manager'
        ? authorizedUsers.filter((u) => u.role === 'manager')
        : branchUsers;

  // User switching disabled: Users list is read-only information for managing access.

  return localize((
    <div className="flex flex-col w-full text-start">
      {/* Card Header: "Users with access" without logo (matching dashboard reference) */}
      <div className="flex items-center justify-between px-1.5 pb-2.5 pt-0.5">
        <span className="text-body-medium font-semibold text-text-secondary tracking-tight">
          Users with access
        </span>
      </div>

      {/* 3 Toggles Bar: Admins | Managers | Branch (1:1 styling and functionality from desktop header) */}
      <div className="p-1 rounded-2lg bg-background-tertiary-default border border-separator-border grid grid-cols-3 gap-1 mb-2.5">
        <button
          type="button"
          onClick={() => setSelectedTab('admin')}
          className={cx(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-caption-1-semibold transition-all cursor-pointer",
            selectedTab === 'admin'
              ? "bg-accent-500 text-white font-bold shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover/50",
          )}
        >
          <RiShieldCheckLine
            className={cx(
              "size-3.5 shrink-0",
              selectedTab === 'admin' ? "text-white" : "text-foreground-icon-secondary"
            )}
          />
          <span>Admins</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('manager')}
          className={cx(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-caption-1-semibold transition-all cursor-pointer",
            selectedTab === 'manager'
              ? "bg-accent-500 text-white font-bold shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover/50",
          )}
        >
          <RiBriefcaseLine
            className={cx(
              "size-3.5 shrink-0",
              selectedTab === 'manager' ? "text-white" : "text-foreground-icon-secondary"
            )}
          />
          <span>Managers</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('branch')}
          className={cx(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-caption-1-semibold transition-all cursor-pointer",
            selectedTab === 'branch'
              ? "bg-accent-500 text-white font-bold shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover/50",
          )}
        >
          <RiBuilding2Line
            className={cx(
              "size-3.5 shrink-0",
              selectedTab === 'branch' ? "text-white" : "text-foreground-icon-secondary"
            )}
          />
          <span>Branch</span>
        </button>
      </div>

      {/* Users / Branch Emails List */}
      <div className="flex flex-col gap-1 max-h-[290px] overflow-y-auto px-0.5 py-0.5 custom-scrollbar">
        {currentTabUsers.map((u) => {
          const currentEmail = (activeUserEmail || '').toLowerCase().trim();
          const isSelected = u.email.toLowerCase().trim() === currentEmail;
          const isBranchTab = selectedTab === 'branch';

          return (
            <div
              key={u.email}
              className={cx(
                "group flex w-full items-center justify-between rounded-2lg px-2.5 py-2 text-start transition-all",
                isSelected
                  ? "bg-accent-50/80 dark:bg-accent-950/40 ring-1 ring-accent-500/40 shadow-2xs"
                  : "hover:bg-background-secondary-hover",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar size="sm" color={(u.color as any) || 'neutral'} initials={u.initials} />
                <div className="flex flex-col min-w-0">
                  {/* When in Branches tab, show branch login email as primary bold line */}
                  <span className="truncate text-body-medium font-semibold text-text-primary tracking-tight">
                    {isBranchTab ? u.email : u.name}
                  </span>
                  <span className="text-caption-1-regular text-text-tertiary truncate">
                    {isBranchTab
                      ? `${u.branchName || 'Branch'} Terminal • Data Entry`
                      : u.role === 'manager'
                        ? `${u.branchName || 'Branch'} Manager • ${u.email}`
                        : u.email}
                  </span>
                </div>
              </div>

              {/* Badges & Check indicator */}
              <div className="shrink-0 pl-2 flex items-center gap-1.5">
                {isSelected && (
                  <RiCheckboxCircleFill className="size-4 text-accent-500 shrink-0" />
                )}
                {u.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-[#15803d] dark:text-emerald-300 border border-emerald-500/20">
                    <RiShieldCheckLine className="size-3" /> Admin
                  </span>
                ) : u.role === 'manager' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-separator-border">
                    <RiBriefcaseLine className="size-3" /> RM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <RiBuilding2Line className="size-3" /> Branch
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons: [+ Add user] [⚙️ Manage] - BoardUI Button sizes and radii */}
      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-separator-border mt-1.5">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={RiAddFill}
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex-1 justify-center shadow-2xs"
        >
          Add user
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={RiEqualizer3Line}
          onClick={() => setIsManageModalOpen(true)}
          className="flex-1 justify-center shadow-2xs"
        >
          Manage
        </Button>
      </div>

      {/* Modals */}
      <ManageUsersModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onOpenAddUser={() => setIsAddUserModalOpen(true)}
      />
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
      />
    </div>
  ));
}

export function DashboardUserMenu({
  collapsed = false,
  suppressHover = false,
  onHoverSuppressionEnd,
  avatarClassName,
}: {
  collapsed?: boolean;
  suppressHover?: boolean;
  onHoverSuppressionEnd?: () => void;
  avatarClassName?: string;
}) {
  const localize = useTemplateCopy();
  const direction = useDirection();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return localize((
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <AriaButton
        aria-label="Siroi Finance CMD"
        onPointerLeave={() => {
          if (suppressHover) onHoverSuppressionEnd?.();
        }}
        className={cx(
          "group/user-menu relative flex min-w-0 cursor-pointer items-center gap-2 rounded-xl p-1 outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-border-focus-ring",
          !suppressHover && "hover:bg-background-tertiary-hover/60",
          collapsed && "w-9 justify-center gap-0 p-0 hover:bg-transparent",
        )}
      >
        <SiroiMetallicLogoBadge className={avatarClassName} size={32} />
        <Collapsible collapsed={collapsed}>
          <span className="flex items-center gap-1.5 text-body-medium font-semibold text-text-primary leading-tight whitespace-nowrap">
            <span>Siroi Finance CMD</span>
            <ChevronUpDownSmall className="size-4 shrink-0 text-foreground-icon-tertiary group-hover/user-menu:text-foreground-icon-secondary transition-colors" />
          </span>
        </Collapsible>
      </AriaButton>

      <AriaPopover
        placement={isMobile ? "bottom start" : direction === "rtl" ? "left top" : "right top"}
        offset={8}
        className={cx(
          "w-[380px] sm:w-[400px] max-w-[calc(100vw-32px)] origin-top-left overflow-y-auto",
          "rounded-2xl border border-border-button-default bg-background-primary-default p-2.5 shadow-dropdown",
          "transition duration-150 ease-out",
          "data-[entering]:opacity-0 data-[entering]:scale-95 data-[entering]:blur-[2px]",
          "data-[exiting]:opacity-0 data-[exiting]:scale-95 data-[exiting]:blur-[2px]",
        )}
      >
        <AriaDialog aria-label="Siroi Finance CMD Account Menu" className="flex flex-col outline-none">
          <AccountMenuContent onSelect={() => setIsOpen(false)} />
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  ));
}
