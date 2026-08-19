import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './ui/calendar';
import { X } from 'lucide-react';
import { CalendarDate, parseDate, today, getLocalTimeZone } from '@internationalized/date';

interface CustomDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
}

export function CustomDatePicker({ selectedDate, onChange, onClose }: CustomDatePickerProps) {
  useEffect(() => {
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCalendarChange = (calDate: CalendarDate) => {
    const dateStr = `${calDate.year}-${String(calDate.month).padStart(2, '0')}-${String(calDate.day).padStart(2, '0')}`;
    onChange(dateStr);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 z-10 w-9 h-9 rounded-full bg-slate-900/90 dark:bg-slate-800 text-white hover:bg-black border border-white/20 flex items-center justify-center shadow-xl transition-all duration-150 hover:scale-110 cursor-pointer"
          aria-label="Close date picker"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <Calendar
          value={selectedDate}
          captionLayout="dropdown"
          onChange={handleCalendarChange}
          className="w-[clamp(350px,92vw,430px)] shadow-2xl border border-slate-200 dark:border-white/15"
        />
      </div>
    </div>,
    document.body
  );
}
