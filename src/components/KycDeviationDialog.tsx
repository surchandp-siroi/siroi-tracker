import React from 'react';
import { 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    ArrowRight, 
    RotateCcw, 
    Sparkles, 
    Check, 
    CreditCard, 
    FileText, 
    X 
} from 'lucide-react';
import { Button } from '@/components/ui';
import { DeviationItem, formatDisplayDate } from '@/utils/ocrScanner';

interface KycDeviationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    deviations: DeviationItem[];
    onApplyCorrection: (field: string, value: string) => void;
    onApplyAllAadhaar: () => void;
    onApplyAllPan: () => void;
    onConfirmAndProceed: () => void;
}

export const KycDeviationDialog: React.FC<KycDeviationDialogProps> = ({
    isOpen,
    onClose,
    deviations,
    onApplyCorrection,
    onApplyAllAadhaar,
    onApplyAllPan,
    onConfirmAndProceed,
}) => {
    if (!isOpen) return null;

    const hasMismatches = deviations.some(d => d.status === 'MISMATCH');
    const hasWarnings = deviations.some(d => d.status === 'WARNING');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${
                    hasMismatches 
                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200/70 dark:border-red-900/40' 
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40'
                }`}>
                    <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                            hasMismatches 
                                ? 'bg-red-500 text-white shadow-red-500/30' 
                                : 'bg-amber-500 text-white shadow-amber-500/30'
                        }`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    KYC Document Cross-Verification Alert
                                </h3>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    hasMismatches 
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                }`}>
                                    {hasMismatches ? 'Discrepancy Detected' : 'Minor Variation'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                We scanned your uploaded Aadhaar and PAN cards. Below are the comparison results against the entered customer data fields.
                            </p>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Table Comparison Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-3 px-3 sm:px-4">Field Attribute</th>
                                    <th className="py-3 px-3 sm:px-4">Form Value</th>
                                    <th className="py-3 px-3 sm:px-4">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>Aadhaar Card</span>
                                        </div>
                                    </th>
                                    <th className="py-3 px-3 sm:px-4">
                                        <div className="flex items-center gap-1.5">
                                            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                                            <span>PAN Card</span>
                                        </div>
                                    </th>
                                    <th className="py-3 px-3 sm:px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {deviations.map((item, idx) => {
                                    const isMismatch = item.status === 'MISMATCH';
                                    const isWarning = item.status === 'WARNING';
                                    const isMatch = item.status === 'MATCH';

                                    return (
                                        <tr key={idx} className={`transition-colors ${
                                            isMismatch 
                                                ? 'bg-red-50/40 dark:bg-red-950/20' 
                                                : isWarning 
                                                    ? 'bg-amber-50/30 dark:bg-amber-950/10' 
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                        }`}>
                                            <td className="py-3.5 px-3 sm:px-4 font-bold text-slate-800 dark:text-slate-200">
                                                {item.field}
                                            </td>

                                            {/* Form Entered Value */}
                                            <td className="py-3.5 px-3 sm:px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                                                {item.formValue ? (
                                                    item.field.includes('DOB') ? formatDisplayDate(item.formValue) : item.formValue
                                                ) : (
                                                    <span className="text-slate-400 italic">Empty</span>
                                                )}
                                            </td>

                                            {/* Aadhaar Card Scanned Value */}
                                            <td className="py-3.5 px-3 sm:px-4">
                                                {item.aadhaarValue ? (
                                                    <div className="flex items-center justify-between gap-1.5">
                                                        <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                                                            {item.field.includes('DOB') ? formatDisplayDate(item.aadhaarValue) : item.aadhaarValue}
                                                        </span>
                                                        {item.aadhaarValue !== item.formValue && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onApplyCorrection(item.field, item.aadhaarValue)}
                                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 transition-all shrink-0"
                                                                title="Apply Aadhaar value to form"
                                                            >
                                                                Use Aadhaar
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>

                                            {/* PAN Card Scanned Value */}
                                            <td className="py-3.5 px-3 sm:px-4">
                                                {item.panValue ? (
                                                    <div className="flex items-center justify-between gap-1.5">
                                                        <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                                                            {item.field.includes('DOB') ? formatDisplayDate(item.panValue) : item.panValue}
                                                        </span>
                                                        {item.panValue !== item.formValue && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onApplyCorrection(item.field, item.panValue)}
                                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition-all shrink-0"
                                                                title="Apply PAN value to form"
                                                            >
                                                                Use PAN
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-3 sm:px-4 text-center">
                                                {isMatch && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                        <Check className="w-3 h-3" /> Match
                                                    </span>
                                                )}
                                                {isWarning && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                                        <AlertTriangle className="w-3 h-3" /> Minor Variance
                                                    </span>
                                                )}
                                                {isMismatch && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                                                        <XCircle className="w-3 h-3" /> Mismatch
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Explanatory Notes */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        {deviations.filter(d => d.message).map((d, i) => (
                            <p key={i} className="flex items-start gap-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">• {d.field}:</span>
                                <span>{d.message}</span>
                            </p>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onApplyAllAadhaar}
                            className="text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 font-semibold"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Auto-Fill from Aadhaar</span>
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onApplyAllPan}
                            className="text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 font-semibold"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span>Auto-Fill from PAN</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="text-xs h-10 px-4 rounded-xl font-semibold"
                        >
                            Re-upload Card
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirmAndProceed}
                            className={`text-xs h-10 px-6 rounded-xl font-semibold text-white shadow-md flex items-center gap-1.5 ${
                                hasMismatches 
                                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                            }`}
                        >
                            <span>Accept & Proceed</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};
