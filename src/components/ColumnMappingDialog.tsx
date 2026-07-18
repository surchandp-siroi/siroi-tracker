import React, { useState, useEffect } from 'react';
import { Columns, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Button } from './ui';

export interface ColumnMapping {
    [systemKey: string]: string; // Maps system key to excel header string
}

interface SystemField {
    key: string;
    label: string;
    required: boolean;
    aliases: string[];
}

const SYSTEM_FIELDS: SystemField[] = [
    { key: 'date', label: 'Login Date', required: true, aliases: ['login date', 'date', 'entry date', 'login_date'] },
    { key: 'staffName', label: 'Staff Name', required: true, aliases: ['staff name', 'staff', 'employee', 'name'] },
    { key: 'projectionAmt', label: 'Projection Amount', required: true, aliases: ['projection', 'proj', 'projection (₹)', 'projection amt'] },
    { key: 'amount', label: 'Login Amount', required: true, aliases: ['login amount', 'login amt', 'amount', 'login_amount', 'login'] },
    { key: 'category', label: 'Category', required: true, aliases: ['category', 'cat'] },
    { key: 'product', label: 'Product', required: true, aliases: ['product', 'prod'] },
    { key: 'relationshipManagerName', label: 'Relationship Manager', required: false, aliases: ['relationship manager', 'relationship manager name', 'rm', 'relationship'] },
    { key: 'fileLogin', label: 'File Login (WBO/ILENS)', required: false, aliases: ['file login', 'file_login'] },
    { key: 'trackingNumber', label: 'Tracking Number', required: false, aliases: ['tracking number', 'tracking', 'track'] },
    { key: 'channel', label: 'Channel Partner', required: false, aliases: ['channel partner', 'channel', 'partner'] },
    { key: 'branchLocation', label: 'Branch Location', required: false, aliases: ['branch location', 'branch', 'location'] },
    { key: 'customerName', label: 'Customer Name', required: false, aliases: ['customer name', 'customer', 'client'] },
    { key: 'customerDOB', label: 'Customer DOB', required: false, aliases: ['customer dob', 'dob', 'date of birth'] },
    { key: 'phoneNumber', label: 'Phone Number', required: false, aliases: ['phone number', 'phone no', 'phone', 'mobile'] },
    { key: 'emailId', label: 'Email ID', required: false, aliases: ['email id', 'email', 'email.id', 'e-mail'] },
    { key: 'customerAddress', label: 'Customer Address', required: false, aliases: ['customer address', 'address', 'cutomer address'] },
    { key: 'firmName', label: 'Firm Name', required: false, aliases: ['firm name', 'firm', 'company'] },
    { key: 'fileStatus', label: 'File Status', required: false, aliases: ['file status', 'status', 'current status'] },
    { key: 'sanctionedAmount', label: 'Sanctioned Amount', required: false, aliases: ['sanctioned amount', 'sanctioned', 'sanctioned (₹)'] },
    { key: 'disbursedAmount', label: 'Disbursed Amount', required: false, aliases: ['disbursed amount', 'disbursed', 'disbursed amt', 'achievement'] },
    { key: 'disbursedDate', label: 'Disbursed Date', required: false, aliases: ['disbursed date', 'disbursement date'] },
    { key: 'emiDate', label: 'EMI Date', required: false, aliases: ['emi date', 'emi'] },
    { key: 'repaymentBank', label: 'Repayment Bank', required: false, aliases: ['repayment bank', 'bank'] },
    { key: 'managerName', label: 'Manager Name', required: false, aliases: ['manager name', 'manager'] },
    { key: 'consultantName', label: 'Consultant', required: false, aliases: ['consultant', 'consultant name'] },
    { key: 'consultantEmail', label: 'Consultant Email ID', required: false, aliases: ['consultant email', 'consultant email id', 'consultant e-mail'] }
];

function similarity(a: string, b: string): number {
    const s = a.toLowerCase().trim();
    const t = b.toLowerCase().trim();
    if (s === t) return 1;
    if (s.length === 0 || t.length === 0) return 0;
    if (t.includes(s) || s.includes(t)) return 0.85;
    return 0;
}

interface Props {
    open: boolean;
    headers: string[];
    onConfirm: (mapping: ColumnMapping) => void;
    onCancel: () => void;
}

export function ColumnMappingDialog({ open, headers, onConfirm, onCancel }: Props) {
    const [mapping, setMapping] = useState<ColumnMapping>({});

    useEffect(() => {
        if (!open) return;
        const initialMap: ColumnMapping = {};
        for (const field of SYSTEM_FIELDS) {
            let bestMatch = '';
            let bestScore = 0;
            for (const header of headers) {
                if (header.trim() === field.label) {
                    bestMatch = header;
                    bestScore = 1;
                    break;
                }
                for (const alias of field.aliases) {
                    const score = similarity(alias, header);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = header;
                    }
                }
            }
            if (bestScore > 0.6) {
                initialMap[field.key] = bestMatch;
            } else {
                initialMap[field.key] = '';
            }
        }
        setMapping(initialMap);
    }, [open, headers]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                            <Columns className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Map Excel Columns</h2>
                            <p className="text-xs text-slate-400">Match your spreadsheet headers to the system fields.</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 bg-slate-950/50">
                    <div className="space-y-4">
                        {SYSTEM_FIELDS.map(field => {
                            const isMapped = !!mapping[field.key];
                            return (
                                <div key={field.key} className={`flex items-center justify-between p-3 rounded-lg border ${isMapped ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-900 border-slate-800'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${field.required ? 'bg-rose-500' : 'bg-slate-600'}`} />
                                        <span className={`text-sm font-medium ${isMapped ? 'text-indigo-200' : 'text-slate-300'}`}>
                                            {field.label}
                                            {field.required && <span className="text-rose-400 ml-1">*</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                        <select
                                            value={mapping[field.key] || ''}
                                            onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            className="h-9 w-64 text-sm rounded-md px-3 bg-slate-800 border-slate-700 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">-- Ignore / Not in sheet --</option>
                                            {headers.map((h, i) => (
                                                <option key={i} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel} className="text-slate-300">
                        Cancel
                    </Button>
                    <Button onClick={() => onConfirm(mapping)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Mapping
                    </Button>
                </div>
            </div>
        </div>
    );
}