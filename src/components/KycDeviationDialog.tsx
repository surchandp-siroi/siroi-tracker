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
    Fingerprint,
    Info,
    ShieldAlert,
    X 
} from 'lucide-react';
import { DeviationItem, formatDisplayDate } from '@/utils/ocrScanner';

export interface KycDeviationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    deviations: DeviationItem[];
    onApplyCorrection: (field: string, value: string) => void;
    onApplyAllAadhaar: () => void;
    onApplyAllPan: () => void;
    onConfirmAndProceed: () => void;
    hasAadhaarData?: boolean;
    hasPanData?: boolean;
}

// Utility to verify whether a scanned string value is valid and non-empty
function isValidValue(val: string | null | undefined): boolean {
    if (!val) return false;
    const clean = val.trim();
    return clean !== '' && clean !== 'N/A' && clean !== 'null' && clean !== 'undefined';
}

export const KycDeviationDialog: React.FC<KycDeviationDialogProps> = ({
    isOpen,
    onClose,
    deviations,
    onApplyCorrection,
    onApplyAllAadhaar,
    onApplyAllPan,
    onConfirmAndProceed,
    hasAadhaarData,
    hasPanData,
}) => {
    if (!isOpen) return null;

    const hasMismatches = deviations.some(d => d.status === 'MISMATCH');
    const hasWarnings = deviations.some(d => d.status === 'WARNING');

    // Auto-detect whether Aadhaar / PAN actually supplied usable data
    const canAutofillAadhaar = hasAadhaarData ?? deviations.some(d => isValidValue(d.aadhaarValue));
    const canAutofillPan = hasPanData ?? deviations.some(d => isValidValue(d.panValue));

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-dialog-title"
        >
            {/* Deep Frosted Glass Backdrop with Ambient Vignette */}
            <div 
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Ambient Lighting Orbs for Cinematic Depth */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Double-Bezel Modal Shell */}
            <div className="relative w-full max-w-3xl rounded-[28px] p-1.5 sm:p-2 bg-gradient-to-b from-white/30 via-white/10 to-white/5 dark:from-white/15 dark:via-white/5 dark:to-transparent ring-1 ring-white/40 dark:ring-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_50px_rgba(99,102,241,0.2)] animate-in zoom-in-95 duration-250 ease-out z-10 my-auto">
                <div className="bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden flex flex-col max-h-[88vh] border border-slate-200/90 dark:border-slate-800 shadow-inner">
                    
                    {/* Header Banner */}
                    <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 transition-colors ${
                        hasMismatches 
                            ? 'bg-gradient-to-r from-red-500/10 via-rose-500/5 to-amber-500/5 border-red-200/70 dark:border-red-900/40' 
                            : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/5 border-amber-200/70 dark:border-amber-900/40'
                    }`}>
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                                hasMismatches 
                                    ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-rose-500/30' 
                                    : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30'
                            }`}>
                                {hasMismatches ? (
                                    <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                                )}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 id="kyc-dialog-title" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                        KYC Document Cross-Verification Alert
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                                        hasMismatches 
                                            ? 'bg-red-100 text-red-700 ring-red-300 dark:bg-red-950/80 dark:text-red-300 dark:ring-red-800' 
                                            : 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:ring-amber-800'
                                    }`}>
                                        {hasMismatches ? 'Discrepancy Detected' : 'Minor Variation'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                    We scanned your uploaded Aadhaar and PAN cards. Review the cross-check results below and click any attribute to auto-align your form data.
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all shrink-0"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5 stroke-[2.2]" />
                        </button>
                    </div>

                    {/* Table Comparison Body */}
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shadow-xs">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 px-3 sm:px-4">Field Attribute</th>
                                        <th className="py-3 px-3 sm:px-4">Form Entered</th>
                                        <th className="py-3 px-3 sm:px-4">
                                            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                                                <FileText className="w-3.5 h-3.5" />
                                                <span>Aadhaar Card</span>
                                            </div>
                                        </th>
                                        <th className="py-3 px-3 sm:px-4">
                                            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
                                                <CreditCard className="w-3.5 h-3.5" />
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

                                        const hasValidAadhaar = isValidValue(item.aadhaarValue);
                                        const hasValidPan = isValidValue(item.panValue);

                                        const canUseAadhaar = hasValidAadhaar && item.aadhaarValue !== item.formValue;
                                        const canUsePan = hasValidPan && item.panValue !== item.formValue;

                                        return (
                                            <tr key={idx} className={`transition-colors ${
                                                isMismatch 
                                                    ? 'bg-red-50/40 dark:bg-red-950/20' 
                                                    : isWarning 
                                                        ? 'bg-amber-50/30 dark:bg-amber-950/10' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                            }`}>
                                                {/* Field Attribute Name */}
                                                <td className="py-3.5 px-3 sm:px-4 font-bold text-slate-800 dark:text-slate-200">
                                                    {item.field}
                                                </td>

                                                {/* Form Entered Value */}
                                                <td className="py-3.5 px-3 sm:px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                                                    {item.formValue ? (
                                                        item.field.includes('DOB') ? formatDisplayDate(item.formValue) : item.formValue
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500 italic">Empty</span>
                                                    )}
                                                </td>

                                                {/* Aadhaar Card Scanned Value */}
                                                <td className="py-3.5 px-3 sm:px-4">
                                                    {hasValidAadhaar ? (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                                                                {item.field.includes('DOB') ? formatDisplayDate(item.aadhaarValue) : item.aadhaarValue}
                                                            </span>
                                                            {canUseAadhaar && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onApplyCorrection(item.field, item.aadhaarValue)}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 px-2 py-0.5 rounded-lg border border-indigo-200/90 dark:border-indigo-800 shadow-2xs hover:shadow-xs active:scale-95 transition-all shrink-0"
                                                                    title={`Apply Aadhaar value (${item.aadhaarValue}) to form`}
                                                                >
                                                                    <span>Use Aadhaar</span>
                                                                    <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>
                                                    )}
                                                </td>

                                                {/* PAN Card Scanned Value */}
                                                <td className="py-3.5 px-3 sm:px-4">
                                                    {hasValidPan ? (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-mono font-semibold text-sky-700 dark:text-sky-300">
                                                                {item.field.includes('DOB') ? formatDisplayDate(item.panValue) : item.panValue}
                                                            </span>
                                                            {canUsePan && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onApplyCorrection(item.field, item.panValue)}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 px-2 py-0.5 rounded-lg border border-sky-200/90 dark:border-sky-800 shadow-2xs hover:shadow-xs active:scale-95 transition-all shrink-0"
                                                                    title={`Apply PAN value (${item.panValue}) to form`}
                                                                >
                                                                    <span>Use PAN</span>
                                                                    <Check className="w-3 h-3 text-sky-600 dark:text-sky-400 stroke-[2.5]" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>
                                                    )}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3.5 px-3 sm:px-4 text-center">
                                                    {isMatch && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
                                                            <Check className="w-3 h-3 stroke-[2.5]" /> Match
                                                        </span>
                                                    )}
                                                    {isWarning && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800 shadow-2xs">
                                                            <AlertTriangle className="w-3 h-3 stroke-[2.5]" /> Variation
                                                        </span>
                                                    )}
                                                    {isMismatch && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-200/80 dark:border-red-800 shadow-2xs">
                                                            <XCircle className="w-3 h-3 stroke-[2.5]" /> Mismatch
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Explanatory AI Insights Notes */}
                        <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                            {deviations.filter(d => d.message).map((d, i) => (
                                <p key={i} className="flex items-start gap-2 leading-relaxed">
                                    <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                    <span>
                                        <strong className="font-semibold text-slate-800 dark:text-slate-200">{d.field}:</strong>{' '}
                                        {d.message}
                                    </span>
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Footer Controls: Distinct Branded Auto-Fill & High-End CTAs */}
                    <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        
                        {/* Left Side: Auto-Fill Pills with Distinct Aadhaar & PAN Identifiers */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Auto-Fill from Aadhaar */}
                            <button
                                type="button"
                                disabled={!canAutofillAadhaar}
                                onClick={onApplyAllAadhaar}
                                className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left border transition-all duration-200 ${
                                    canAutofillAadhaar
                                        ? 'bg-gradient-to-r from-indigo-50 via-indigo-100/60 to-violet-50 hover:from-indigo-100 hover:via-indigo-200/70 hover:to-violet-100 dark:from-indigo-950/70 dark:via-indigo-900/50 dark:to-violet-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800/80 shadow-xs hover:shadow-md hover:shadow-indigo-500/10 active:scale-[0.98]'
                                        : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                                title={canAutofillAadhaar ? 'Auto-fill form fields using scanned Aadhaar values' : 'No Aadhaar data scanned'}
                            >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                                    canAutofillAadhaar 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                                }`}>
                                    <Sparkles className="w-3.5 h-3.5 fill-white/20 stroke-[2.2]" />
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">Auto-Fill from Aadhaar</span>
                                    <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-medium">Apply verified UIDAI data</span>
                                </div>
                            </button>

                            {/* Auto-Fill from PAN */}
                            <button
                                type="button"
                                disabled={!canAutofillPan}
                                onClick={onApplyAllPan}
                                className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left border transition-all duration-200 ${
                                    canAutofillPan
                                        ? 'bg-gradient-to-r from-sky-50 via-sky-100/60 to-blue-50 hover:from-sky-100 hover:via-sky-200/70 hover:to-blue-100 dark:from-sky-950/70 dark:via-sky-900/50 dark:to-blue-950/60 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800/80 shadow-xs hover:shadow-md hover:shadow-sky-500/10 active:scale-[0.98]'
                                        : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                                title={canAutofillPan ? 'Auto-fill form fields using scanned PAN values' : 'No PAN data scanned'}
                            >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                                    canAutofillPan 
                                        ? 'bg-sky-600 text-white' 
                                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                                }`}>
                                    <CreditCard className="w-3.5 h-3.5 stroke-[2.2]" />
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">Auto-Fill from PAN</span>
                                    <span className="text-[10px] text-sky-600/80 dark:text-sky-400 font-medium">Apply verified Income Tax data</span>
                                </div>
                            </button>
                        </div>

                        {/* Right Side: Re-upload Secondary & High-End Proceed CTA */}
                        <div className="flex items-center gap-2.5 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-10 px-3.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500 stroke-[2.2]" />
                                <span>Re-upload Card</span>
                            </button>

                            <button
                                type="button"
                                onClick={onConfirmAndProceed}
                                className={`group h-10 px-5 rounded-xl font-bold text-xs text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2.5 ${
                                    hasMismatches 
                                        ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/25' 
                                        : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25'
                                }`}
                            >
                                <span>Accept & Proceed</span>
                                <span className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                            </button>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
