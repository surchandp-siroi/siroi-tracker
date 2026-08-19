import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, MapPin, Building2, Check } from 'lucide-react';

const BRANCH_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Guwahati': { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', dot: '#6366f1' },
  'Manipur': { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', dot: '#10b981' },
  'Itanagar': { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', dot: '#0ea5e9' },
  'Nagaland & Mizoram': { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', dot: '#f59e0b' },
};

interface BranchSelectProps {
  value: string;
  onChange: (value: string) => void;
  branches: { id: string; name: string }[];
  placeholder?: string;
  includeAllOption?: boolean;
  allOptionText?: string;
  className?: string;
  valueField?: 'id' | 'name';
}

export function BranchSelect({
  value,
  onChange,
  branches,
  placeholder = 'Select branch...',
  includeAllOption = false,
  allOptionText = 'Consolidated',
  className,
  valueField = 'id',
}: BranchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedBranch =
    value === 'all'
      ? { id: 'all', name: allOptionText }
      : branches.find((b) => b[valueField] === value);

  const branchColorConfig = selectedBranch?.name ? BRANCH_COLORS[selectedBranch.name] : undefined;

  return (
    <div className={clsx('relative inline-block', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[165px] flex items-center justify-between gap-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold rounded-xl text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-500/30 shadow-sm transition-all duration-200 cursor-pointer select-none whitespace-nowrap"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {branchColorConfig ? (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: branchColorConfig.dot }}
            />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          )}
          <span className="whitespace-nowrap">{selectedBranch ? selectedBranch.name : placeholder}</span>
        </div>
        <ChevronDown
          className={clsx(
            'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1',
            isOpen && 'rotate-180 text-indigo-500'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-[9999] min-w-[210px] w-full p-1.5 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
          {includeAllOption && (
            <button
              type="button"
              className={clsx(
                'group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none outline-none hover:translate-x-0.5',
                value === 'all'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              )}
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center p-1 group-hover:scale-110 transition-transform shadow-sm">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <span>{allOptionText}</span>
              </div>
              {value === 'all' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
            </button>
          )}

          {branches.map((b) => {
            const isSelected = value === b[valueField];
            const color = BRANCH_COLORS[b.name] || {
              bg: 'bg-slate-100 dark:bg-white/5',
              text: 'text-slate-600 dark:text-slate-300',
              dot: '#6366f1',
            };

            return (
              <button
                key={b.id}
                type="button"
                className={clsx(
                  'group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none outline-none hover:translate-x-0.5',
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                )}
                onClick={() => {
                  onChange(b[valueField]);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-lg flex items-center justify-center p-1 group-hover:scale-110 transition-transform shadow-sm',
                      color.bg,
                      color.text
                    )}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <span>{b.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
