import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    indicatorColor?: string;
}

interface ThemeSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    variant?: 'pill' | 'inline';
    className?: string;
    dropdownAlign?: 'left' | 'right';
}

export function ThemeSelect({
    value,
    onChange,
    options,
    variant = 'pill',
    className,
    dropdownAlign = 'left'
}: ThemeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'absolute',
                top: rect.bottom + window.scrollY + 4,
                ...(dropdownAlign === 'left' ? { left: rect.left + window.scrollX } : { right: document.documentElement.clientWidth - rect.right }),
                minWidth: Math.max(rect.width, 140),
            });
        }
        setIsOpen(!isOpen);
    };

    const selectedOption = options.find(o => o.value === value) || options[0];

    const dropdownList = isOpen ? createPortal(
        <div 
            ref={dropdownRef}
            style={dropdownStyle}
            className="z-[9999] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
        >
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    className={clsx(
                        "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center gap-2.5",
                        value === option.value 
                            ? "bg-indigo-50/50 dark:bg-indigo-500/10 font-bold text-indigo-700 dark:text-indigo-400" 
                            : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium"
                    )}
                    onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                    }}
                >
                    {option.indicatorColor && (
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: option.indicatorColor }} />
                    )}
                    <span className="truncate">{option.label}</span>
                </button>
            ))}
        </div>,
        document.body
    ) : null;

    if (variant === 'inline') {
        return (
            <div className={clsx("relative inline-block", className)} ref={containerRef}>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase transition-colors hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                    {selectedOption?.label}
                    <ChevronDown size={12} className={clsx("transition-transform", isOpen && "rotate-180")} />
                </button>
                {dropdownList}
            </div>
        );
    }

    // Pill variant
    return (
        <div className={clsx("relative w-full h-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className={clsx(
                    "w-full h-full flex items-center justify-between bg-white dark:bg-slate-900 border transition-all rounded-full px-4 shadow-sm",
                    isOpen 
                        ? "border-indigo-500 ring-1 ring-indigo-500/20 dark:ring-indigo-500/40" 
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                )}
            >
                <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    {selectedOption?.indicatorColor && (
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedOption.indicatorColor }} />
                    )}
                    <span className="truncate text-xs text-slate-800 dark:text-slate-100 font-semibold">
                        {selectedOption?.label}
                    </span>
                </div>
                <ChevronDown size={14} className={clsx("text-slate-500 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>
            {dropdownList}
        </div>
    );
}
