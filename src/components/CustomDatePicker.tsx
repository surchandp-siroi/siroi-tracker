import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay,
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './ui';

interface CustomDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
}

export function CustomDatePicker({ selectedDate, onChange, onClose }: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  const parsedSelectedDate = parseISO(selectedDate);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDateClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0b1120] w-[clamp(280px,90vw,380px)] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[clamp(12px,4vw,16px)] border-b border-slate-100 dark:border-white/5">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-[clamp(16px,5vw,20px)] h-[clamp(16px,5vw,20px)]" />
          </button>
          
          <h2 className="text-[clamp(14px,4vw,16px)] font-bold text-slate-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-[clamp(16px,5vw,20px)] h-[clamp(16px,5vw,20px)]" />
          </button>
        </div>
        
        <div className="p-[clamp(12px,4vw,16px)] overflow-y-auto">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-[clamp(9px,2.5vw,11px)] font-bold text-slate-400 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const isSelected = isSameDay(day, parsedSelectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-[clamp(32px,10vw,40px)] w-full flex items-center justify-center rounded-xl text-[clamp(12px,3.5vw,14px)] transition-all
                    ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600 opacity-50' : 'text-slate-700 dark:text-slate-200'}
                    ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'hover:bg-slate-100 dark:hover:bg-white/5'}
                    ${isToday && !isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-600/30' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-[clamp(12px,4vw,16px)] border-t border-slate-100 dark:border-white/5 flex justify-between gap-3 mt-auto">
           <Button 
             variant="ghost" 
             className="flex-1 text-[clamp(12px,3.5vw,14px)] py-[clamp(6px,2vw,8px)] h-auto"
             onClick={onClose}
           >
             Cancel
           </Button>
           <Button 
             variant="secondary" 
             className="flex-1 font-semibold text-indigo-600 dark:text-indigo-400 text-[clamp(12px,3.5vw,14px)] py-[clamp(6px,2vw,8px)] h-auto"
             onClick={() => handleDateClick(new Date())}
           >
             Today
           </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
