"use client";

import { RiSearchLine } from "@remixicon/react";
import { CloseButton } from "@/components/base/buttons/close-button";
import { InputBase } from "@/components/base/input/input";

const RESULTS = [
  { name: "Amir Haddad", role: "Design" },
  { name: "Priya Nair", role: "Design" },
];

/**
 * The gallery tile: the pill field with a query typed and its results
 * beneath, drawn statically from InputBase and the clear button.
 */
export function SearchFieldPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5">
      <div className="flex w-full max-w-[236px] flex-col gap-2">
        <InputBase
          aria-label="Search teammates"
          defaultValue="Design"
          readOnly
          leadingIcon={RiSearchLine}
          fieldClassName="rounded-full ring-border-button-active"
          trailingAddon={<CloseButton size="2xs" aria-label="Clear search" aria-hidden tabIndex={-1} className="me-0.5 bg-background-tertiary-hover" />}
        />
        <div className="flex flex-col rounded-2xl border border-border-button-default bg-background-full p-1.5 shadow-xs">
          {RESULTS.map((person) => (
            <div key={person.name} className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2">
              <span className="text-body-medium text-text-primary">{person.name}</span>
              <span className="text-body-regular text-text-tertiary">{person.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
