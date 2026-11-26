"use client";

import { useState, useMemo, useEffect } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiUser3Line,
  RiBriefcase4Line,
  RiHome4Line,
  RiCoinsLine,
  RiBankLine,
  RiHeartPulseLine,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiLineChartLine,
  RiExchangeDollarLine,
  RiCurrencyLine,
  RiBankCardLine,
  RiBankCard2Line,
  RiSendPlaneLine,
  RiFileTextLine,
  RiFileCheckLine,
} from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

/**
 * Figma source: Board UI → dashboard 1 → Frame 125 (node 3731:3042).
 * Adapted for Siroi Finance Products Showcase:
 * Metric header, category dropdown filter, 2×2 grid of product cards with primary teal gradient icons, pagination.
 */

export interface ProductItem {
  name: string;
  category: "Loans" | "Insurance" | "Forex" | "Investment" | "Taxation";
  Icon: React.ComponentType<{ className?: string }>;
}

const ALL_PRODUCTS: ProductItem[] = [
  { name: "Personal Loan", category: "Loans", Icon: RiUser3Line },
  { name: "Business Loan", category: "Loans", Icon: RiBriefcase4Line },
  { name: "Housing Loan/LAP", category: "Loans", Icon: RiHome4Line },
  { name: "MSME Working Capital", category: "Loans", Icon: RiCoinsLine },
  { name: "MSME Term Loan", category: "Loans", Icon: RiBankLine },
  { name: "Life Insurance", category: "Insurance", Icon: RiHeartPulseLine },
  { name: "General Insurance", category: "Insurance", Icon: RiShieldCheckLine },
  { name: "Livlong Loan Protector", category: "Insurance", Icon: RiShieldUserLine },
  { name: "Mutual Fund/SIP", category: "Investment", Icon: RiLineChartLine },
  { name: "Retail forex sales", category: "Forex", Icon: RiExchangeDollarLine },
  { name: "Retail forex purchase", category: "Forex", Icon: RiCurrencyLine },
  { name: "Student Forex Card", category: "Forex", Icon: RiBankCardLine },
  { name: "Private Forex Card", category: "Forex", Icon: RiBankCard2Line },
  { name: "Remittance", category: "Forex", Icon: RiSendPlaneLine },
  { name: "GST filing", category: "Taxation", Icon: RiFileTextLine },
  { name: "ITR filing", category: "Taxation", Icon: RiFileCheckLine },
];

export const CATEGORIES = ["All Categories", "Loans", "Insurance", "Forex", "Investment", "Taxation"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

export interface ProductsCardProps {
  className?: string;
  selectedProduct?: string;
  categoryFilter?: string;
  onSelectProduct?: (productName: string) => void;
  metrics?: Record<string, { ftd: number; mtd: number; ytd: number }>;
}

export function ProductsCard({
  className,
  selectedProduct,
  categoryFilter = "All Categories",
  onSelectProduct,
  metrics,
}: ProductsCardProps) {
  const [page, setPage] = useState(0);

  // Reset page when categoryFilter changes
  useEffect(() => {
    setPage(0);
  }, [categoryFilter]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (categoryFilter === "All Categories") return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((p) => p.category === categoryFilter);
  }, [categoryFilter]);

  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleProducts = filteredProducts.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  const handlePrev = () => {
    if (currentPage > 0) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <section
      className={cx(
        "relative flex h-[400px] min-w-0 flex-col justify-between rounded-2xl bg-background-secondary-default p-3 sm:p-4 border border-border-button-default shadow-xs",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-2 pt-1 pb-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-body-medium text-text-secondary">Products</p>
          <div className="flex items-baseline gap-2">
            <p className="text-title-1-medium whitespace-nowrap text-text-primary">
              {filteredProducts.length}
            </p>
            {categoryFilter !== "All Categories" && (
              <span className="text-caption-1-semibold text-text-tertiary">
                of {ALL_PRODUCTS.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2x2 Product Grid */}
      <div className="mt-[11px] grid flex-1 grid-cols-2 grid-rows-2 gap-2">
        {visibleProducts.map((product) => {
          const isSelected = selectedProduct === product.name;
          const Icon = product.Icon;

          return (
            <div
              key={product.name}
              onClick={() => onSelectProduct?.(product.name)}
              className={cx(
                "flex min-w-0 flex-col items-start justify-between rounded-2lg bg-background-inner-default p-2.5 shadow-card cursor-pointer border border-border-button-default",
                "transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-md",
                isSelected && "ring-2 ring-border-focus-ring border-accent-500"
              )}
            >
              <div className="flex w-full min-w-0 items-center gap-2.5">
                {/* Theme Primary Teal Gradient Icon */}
                <div className="size-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shrink-0 text-white shadow-xs ring-1 ring-white/10">
                  <Icon className="size-4.5 text-white" />
                </div>
                <div className="flex min-w-0 flex-1 items-center">
                  <p
                    className="w-full truncate text-body-medium font-medium text-text-primary"
                    title={product.name}
                  >
                    {product.name}
                  </p>
                </div>
              </div>

              <div className="w-full mt-2">
                <Chip
                  variant="caption"
                  color="soft"
                  className="w-full text-center justify-center bg-background-recent-hire-role"
                >
                  {product.category}
                </Chip>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer - exactly 2 buttons with invariant styling */}
      <div className="mt-2 flex w-full items-center gap-2">
        <Button
          variant="secondary"
          size="small"
          leadingIcon={RiArrowLeftLine}
          className="flex-1 cursor-pointer"
          onClick={handlePrev}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="small"
          trailingIcon={RiArrowRightLine}
          className="flex-1 cursor-pointer"
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
