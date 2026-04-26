import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

const BRANCH_COLORS: Record<string, string> = {
  'Guwahati': '#818cf8',
  'Manipur': '#34d399',
  'Itanagar': '#38bdf8',
  'Nagaland & Mizoram': '#fbbf24'
};

interface BranchSelectProps {
    value: string;
    onChange: (value: string) => void;
    branches: { id: string, name: string }[];
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
    placeholder = "Select branch...", 
    includeAllOption = false,
    allOptionText = "All Locations",
    className,
    valueField = 'id'
}: BranchSelectProps) {
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
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    const selectedBranch = value === 'all' 
        ? { id: 'all', name: allOptionText }
        : branches.find(b => b[valueField] === value);

    const displayColor = selectedBranch?.name ? BRANCH_COLORS[selectedBranch.name] : undefined;

    const dropdownList = isOpen ? createPortal(
        <div 
            ref={dropdownRef}
            style={dropdownStyle}
            className="z-[9999] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-md shadow-xl max-h-60 overflow-y-auto py-1"
        >
            {includeAllOption && (
                <button
                    type="button"
                    className={clsx(
                        "w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2",
                        value === 'all' && "bg-slate-50 dark:bg-white/5 font-semibold text-indigo-600 dark:text-indigo-400"
                    )}
                    onClick={() => {
                        onChange('all');
                        setIsOpen(false);
                    }}
                >
                    {allOptionText}
                </button>
            )}
            {branches.map(b => {
                const color = BRANCH_COLORS[b.name];
                return (
                    <button
                        key={b.id}
                        type="button"
                        className={clsx(
                            "w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2",
                            value === b[valueField] && "bg-slate-50 dark:bg-white/5 font-semibold text-indigo-600 dark:text-indigo-400"
                        )}
                        onClick={() => {
                            onChange(b[valueField]);
                            setIsOpen(false);
                        }}
                    >
                        {color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                        <span className={clsx(!color && includeAllOption && "ml-4")}>{b.name}</span>
                    </button>
                );
            })}
        </div>,
        document.body
    ) : null;

    return (
        <div className={clsx("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className="w-full flex items-center justify-between bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-1.5 px-3 text-xs rounded text-slate-900 dark:text-white hover:bg-slate-900/10 dark:hover:bg-black/60 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {displayColor && (
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: displayColor }} />
                    )}
                    <span className="truncate">{selectedBranch ? selectedBranch.name : placeholder}</span>
                </div>
                <ChevronDown size={14} className="opacity-50" />
            </button>
            {dropdownList}
        </div>
    );
}
