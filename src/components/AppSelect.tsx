import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface AppSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { id: string, name: string }[];
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
}

export function AppSelect({ 
    value, 
    onChange, 
    options, 
    placeholder = "Select...", 
    className,
    buttonClassName
}: AppSelectProps) {
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

    const selectedOption = options.find(o => o.id === value);

    const dropdownList = isOpen ? createPortal(
        <div 
            ref={dropdownRef}
            style={dropdownStyle}
            className="z-[9999] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-md shadow-xl max-h-60 overflow-y-auto py-1"
        >
            {options.map(o => (
                <button
                    key={o.id}
                    type="button"
                    className={clsx(
                        "w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-white/5",
                        value === o.id && "bg-slate-50 dark:bg-white/5 font-semibold text-indigo-600 dark:text-indigo-400"
                    )}
                    onClick={() => {
                        onChange(o.id);
                        setIsOpen(false);
                    }}
                >
                    {o.name}
                </button>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div className={clsx("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className={buttonClassName || "w-full flex items-center justify-between bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-1.5 px-3 text-xs rounded text-slate-900 dark:text-white hover:bg-slate-900/10 dark:hover:bg-black/60 transition-colors"}
            >
                <span className="truncate">{selectedOption ? selectedOption.name : placeholder}</span>
                <ChevronDown size={14} className="opacity-50 shrink-0" />
            </button>
            {dropdownList}
        </div>
    );
}
