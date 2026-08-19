import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Consultant } from '@/store/useDataStore';
import { Button, Input } from '@/components/ui';

interface EditConsultantDialogProps {
    consultant: Consultant | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Consultant>) => Promise<void>;
}

export function EditConsultantDialog({ consultant, isOpen, onClose, onSave }: EditConsultantDialogProps) {
    const [formData, setFormData] = useState<Partial<Consultant>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (consultant) {
            setFormData(consultant);
        } else {
            setFormData({});
        }
    }, [consultant]);

    if (!isOpen || !consultant) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(consultant.id, formData);
            onClose();
        } catch (error) {
            console.error('Failed to save consultant:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Consultant</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-md"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    <form id="edit-consultant-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Full Name</label>
                            <Input name="name" value={formData.name || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Email Address</label>
                            <Input name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Phone Number</label>
                            <Input name="phone" value={formData.phone || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Associated Branch</label>
                            <Input name="associated_branch" value={formData.associated_branch || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">State</label>
                            <Input name="state" value={formData.state || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Address</label>
                            <Input name="address" value={formData.address || ''} onChange={handleChange} required />
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Bank Details</h4>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Bank Name</label>
                            <Input name="bank_name" value={formData.bank_name || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Account Number</label>
                            <Input name="account_number" value={formData.account_number || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">IFSC Code</label>
                            <Input name="ifsc_code" value={formData.ifsc_code || ''} onChange={handleChange} required />
                        </div>
                    </form>
                </div>
                
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-consultant-form" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
