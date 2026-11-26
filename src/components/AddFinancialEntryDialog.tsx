import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input, Button } from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Loader2, ArrowDownLeft, ArrowUpRight, DollarSign, Building2, Tag, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { useAuthStore } from '@/store/useAuthStore';

export const BRANCH_NAMES = ['Guwahati', 'Imphal', 'Itanagar', 'Nagaland & Mizoram', 'HO'];

export const INCOME_CATEGORIES = [
  { id: 'Forex', name: 'Forex', examples: 'Forex exchange, remittance, Forex card' },
  { id: 'Loans', name: 'Loans', examples: 'Personal loan, business loan, home loan, LAP' },
  { id: 'Insurance', name: 'Insurance', examples: 'Life, general, health insurance' },
  { id: 'Wealth', name: 'Wealth', examples: 'Mutual fund / investment distribution income' },
  { id: 'Professional Services', name: 'Professional Services', examples: 'CA, CS, GST, ITR, DPR' },
  { id: 'Advisory', name: 'Advisory', examples: 'Financial advisory, restructuring, OTS advisory' },
  { id: 'Other', name: 'Other', examples: 'Miscellaneous income' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'Operating Expenses', name: 'Operating Expenses', examples: 'Rent, Salary, Travel, Marketing, Utilities, etc.' },
  { id: 'Miscellaneous Expenses', name: 'Miscellaneous Expenses', examples: 'Sundry expenses, refreshments, office repairs' },
  { id: 'Consultant Commission', name: 'Consultant Commission / Payout Expense', examples: 'Direct consultant payout, referral commission' },
];

export const SUB_CATEGORY_TAGS: Record<string, string[]> = {
  'Operating Expenses': ['Rent', 'Salaries', 'Travel & Conveyance', 'Marketing & Ads', 'Electricity & Utilities', 'Office Supplies', 'Tea & Snacks'],
  'Forex': ['Remittance Fee', 'Forex Card Margin', 'Currency Exchange Gain', 'Transfer Commission'],
  'Loans': ['Lender Payout', 'Origination Fee', 'Subvention Income', 'Consultancy Fee'],
  'Insurance': ['First Year Commission', 'Renewal Commission', 'Health Insurance Incentive'],
  'Wealth': ['Mutual Fund Commission', 'SIP Distribution Fee', 'Bond Placement'],
  'Professional Services': ['CA Retainer', 'GST Filing Fee', 'ITR Return Filing', 'DPR Preparation', 'Audit & Compliance'],
  'Advisory': ['Debt Restructuring', 'OTS Advisory', 'Corporate Advisory'],
  'Miscellaneous Expenses': ['Office Repairs', 'Software Subscription', 'Printing & Stationery', 'Courier & Logistics'],
  'Consultant Commission': ['Direct Referral Commission', 'Connector Disbursal Payout', 'Incentive Bonus']
};

interface AddFinancialEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'income' | 'expense';
  defaultBranch?: string;
  defaultMonth?: string;
  existingRecord?: any;
}

export function AddFinancialEntryDialog({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'income',
  defaultBranch,
  defaultMonth,
  existingRecord,
}: AddFinancialEntryDialogProps) {
  const { user } = useAuthStore();
  const [entryType, setEntryType] = useState<'income' | 'expense'>(existingRecord?.entry_type || defaultType);
  const [branchName, setBranchName] = useState(existingRecord?.branch_name || defaultBranch || BRANCH_NAMES[0]);
  const [category, setCategory] = useState(
    existingRecord?.category || (defaultType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id)
  );
  const [subCategory, setSubCategory] = useState(existingRecord?.sub_category || '');
  const [amount, setAmount] = useState<string>(existingRecord?.amount != null ? String(existingRecord.amount) : '');
  const [entryDate, setEntryDate] = useState<string>(
    existingRecord?.entry_date ||
      (defaultMonth ? `${defaultMonth}-01` : new Date().toISOString().split('T')[0])
  );
  const [description, setDescription] = useState(existingRecord?.description || '');
  const [voucherRef, setVoucherRef] = useState(existingRecord?.voucher_ref || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTypeChange = (type: 'income' | 'expense') => {
    setEntryType(type);
    if (type === 'income') {
      setCategory(INCOME_CATEGORIES[0].id);
      setSubCategory('');
    } else {
      setCategory(EXPENSE_CATEGORIES[0].id);
      setSubCategory('');
    }
  };

  const currentAvailableTags = SUB_CATEGORY_TAGS[category] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount.replace(/[^0-9.]/g, ''));
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!branchName) {
      setError('Please select a branch.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    if (!entryDate) {
      setError('Please pick an entry date.');
      return;
    }

    const monthYear = entryDate.slice(0, 7); // YYYY-MM
    setIsLoading(true);

    try {
      const payload = {
        branch_name: branchName,
        month_year: monthYear,
        entry_date: entryDate,
        entry_type: entryType,
        category: category,
        sub_category: subCategory.trim() || null,
        amount: numAmount,
        description: description.trim() || null,
        voucher_ref: voucherRef.trim() || null,
        created_by: user?.email || 'Admin',
        updated_at: new Date().toISOString()
      };

      if (existingRecord?.id) {
        const { error: updateErr } = await supabase
          .from('branch_financial_records')
          .update(payload)
          .eq('id', existingRecord.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('branch_financial_records')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save financial record:', err);
      setError(err.message || 'Failed to save financial entry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-background-full rounded-3xl p-6 shadow-2xl border border-separator-border space-y-5 max-h-[92vh] overflow-y-auto transform-gpu transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-separator-border pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              entryType === 'income' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
            }`}>
              {entryType === 'income' ? <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary tracking-tight">
                {existingRecord ? 'Edit Financial Entry' : `Record ${entryType === 'income' ? 'Branch Income' : 'Branch Expense'}`}
              </h3>
              <p className="text-xs text-text-secondary">
                {entryType === 'income' ? 'Track revenue & earnings generated by branch' : 'Record operating or consultant expense for branch'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-secondary-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs font-semibold text-text-error-primary">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segmented Entry Type Selector */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-background-secondary-default rounded-2xl border border-border-button-default">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'income'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Income / Revenue</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'expense'
                    ? 'bg-rose-600 text-white shadow-md '
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Operating Expense</span>
              </button>
            </div>
          </div>

          {/* Branch & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-accent-500" />
                <span>Branch Location</span>
              </label>
              <select
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-background-tertiary-default border border-border-button-default text-xs font-semibold text-text-primary outline-none transition-all duration-150 hover:border-border-button-hover focus:border-border-focus-ring focus:ring-2 focus:ring-border-focus-ring/25"
              >
                {BRANCH_NAMES.map((b) => (
                  <option key={b} value={b}>
                    {b === 'Imphal' ? 'Imphal / Manipur' : b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent-500" />
                <span>Entry Date</span>
              </label>
              <DatePicker
                value={entryDate}
                onChange={(_d, dateStr) => setEntryDate(dateStr || '')}
                placeholder="Select date"
                className="h-10 text-xs bg-background-tertiary-default border-border-button-default text-text-primary rounded-xl hover:border-border-button-hover focus:border-border-focus-ring focus:ring-2 focus:ring-border-focus-ring/25"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-accent-500" />
                <span>{entryType === 'income' ? 'Income Category' : 'Expense Category'}</span>
              </span>
              <span className="text-[10px] text-accent-600 dark:text-accent-400 font-semibold">
                {entryType === 'income' ? '7 Income Streams' : '3 Expense Groups'}
              </span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubCategory('');
              }}
              required
              className="w-full h-10 px-3 rounded-xl bg-background-tertiary-default border border-border-button-default text-xs font-semibold text-text-primary outline-none transition-all duration-150 hover:border-border-button-hover focus:border-border-focus-ring focus:ring-2 focus:ring-border-focus-ring/25"
            >
              {entryType === 'income'
                ? INCOME_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ({c.examples})
                    </option>
                  ))
                : EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ({c.examples})
                    </option>
                  ))}
            </select>
          </div>

          {/* Sub-Category / Quick Tag Selector */}
          {currentAvailableTags.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Quick Category Tag (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentAvailableTags.map((tag) => {
                  const isSelected = subCategory === tag;
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setSubCategory(isSelected ? '' : tag)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                          : 'bg-background-tertiary-default text-text-secondary border-border-button-default hover:border-accent-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount & Voucher Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                <span>Amount (₹)</span>
                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
              </label>
              <NumericFormat
                customInput={Input}
                thousandSeparator=","
                thousandsGroupStyle="lakh"
                prefix="₹ "
                placeholder="₹ 0"
                value={amount}
                onValueChange={(values) => setAmount(values.value)}
                required
                className="h-10 text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Voucher / Reference #
              </label>
              <Input
                type="text"
                value={voucherRef}
                onChange={(e) => setVoucherRef(e.target.value)}
                placeholder="e.g. VCH-2026-11"
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Description / Memo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Description & Specifics
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Office rent for Nov, CA retainer fee, Client Forex commission..."
              className="h-10 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-separator-border">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 px-4 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`h-10 px-6 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                entryType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-500 '
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{existingRecord ? 'Update Entry' : `Save ${entryType === 'income' ? 'Income' : 'Expense'}`}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
