import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check, Layers } from 'lucide-react';

interface AppSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  buttonClassName,
}: AppSelectProps) {
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

  const selectedOption = options.find((o) => o.id === value);

  return (
    <div className={clsx('relative inline-block w-full', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          buttonClassName ||
          'w-full flex items-center justify-between gap-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 px-3 py-2 text-xs font-semibold rounded-xl text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-500/30 shadow-sm transition-all duration-200 cursor-pointer select-none'
        }
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronDown
          className={clsx(
            'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-indigo-500'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 min-w-[200px] w-full p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
          {options.map((o) => {
            const isSelected = value === o.id;

            return (
              <button
                key={o.id}
                type="button"
                className={clsx(
                  'group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none outline-none hover:translate-x-0.5',
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                )}
                onClick={() => {
                  onChange(o.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center p-1 group-hover:scale-110 transition-transform shadow-sm">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{o.name}</span>
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
