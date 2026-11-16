import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/store/useDataStore';
import { Input, Button } from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Loader2 } from 'lucide-react';
import { formatCustomerName } from '@/utils/formatCustomerName';

type CustomerData = any;

interface EditCustomerDialogProps {
  customer: CustomerData;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCustomerDialog({ customer, onClose, onSuccess }: EditCustomerDialogProps) {
  const products = useDataStore(state => state.products);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerName, setCustomerName] = useState(formatCustomerName(customer.customer_name || '', true));
  const [customerType, setCustomerType] = useState(customer.customer_type || '');
  const [category, setCategory] = useState(customer.category || 'Loan');
  const [product, setProduct] = useState(customer.product || '');
  const [amount, setAmount] = useState(customer.amount != null ? String(customer.amount) : '');
  const [aadharNumber, setAadharNumber] = useState(customer.aadhar_number || '');
  const [associationDate, setAssociationDate] = useState(customer.association_date || '');
  const [address, setAddress] = useState(customer.address || '');
  const [pincode, setPincode] = useState(customer.pincode || '');
  const [city, setCity] = useState(customer.city || '');
  const [district, setDistrict] = useState(customer.district || '');
  const [phoneNumber, setPhoneNumber] = useState(customer.phone_number || '');
  const [emailId, setEmailId] = useState(customer.email_id || '');
  const [incomeType, setIncomeType] = useState(customer.income_type || '');
  const [companyName, setCompanyName] = useState(customer.company_name || '');
  const [yearlyIncomeRange, setYearlyIncomeRange] = useState(customer.yearly_income_range || '');
  const [birthday, setBirthday] = useState(customer.birthday || '');
  const [anniversary, setAnniversary] = useState(customer.anniversary || '');

  const availableProducts = useMemo(() => {
    if (!category) return [];
    return products.filter((p: any) => p.category === category);
  }, [products, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError('Please select a Category.');
      return;
    }
    if (!product) {
      setError('Please select a Product.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid positive Amount.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('customer_data')
        .update({
          customer_name: formatCustomerName(customerName, true),
          customer_type: customerType,
          category,
          product,
          amount: Number(amount) || 0,
          aadhar_number: aadharNumber,
          association_date: associationDate,
          address,
          pincode,
          city,
          district,
          phone_number: phoneNumber,
          email_id: emailId,
          income_type: incomeType || null,
          company_name: companyName.trim() || null,
          yearly_income_range: yearlyIncomeRange || null,
          birthday: birthday || null,
          anniversary: anniversary || null
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update customer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Customer ({customer.pan_number})</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <form id="edit-customer-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</label>
                <Input required value={customerName} onChange={e => setCustomerName(formatCustomerName(e.target.value))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Type</label>
                <select 
                  value={customerType} 
                  onChange={e => setCustomerType(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Select Type...</option>
                  <option value="Loans">Loans</option>
                  <option value="Forex">Forex</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Investments">Investments</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Aadhar (Optional)</label>
                <Input value={aadharNumber} onChange={e => setAadharNumber(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</label>
                <Input required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</label>
                <Input value={emailId} onChange={e => setEmailId(e.target.value)} className="h-10" />
              </div>
            </div>

            {/* Category, Product, Amount */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-1.5">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                  Product Requirement Details
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Auto-populates to Terminal
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Category</span>
                    <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      setProduct('');
                      if (newCat === 'Loan') setCustomerType('Loans');
                      else if (newCat === 'Forex') setCustomerType('Forex');
                      else if (newCat === 'Insurance') setCustomerType('Insurance');
                      else if (newCat === 'Consultancy') setCustomerType('Consulting');
                      else if (newCat === 'Investments') setCustomerType('Investments');
                    }}
                    required
                    className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="">Select Category...</option>
                    <option value="Loan">Loan</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Forex">Forex</option>
                    <option value="Consultancy">Consulting</option>
                    <option value="Investments">Investments</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Product</span>
                    <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                    disabled={!category}
                    className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                  >
                    <option value="">{category ? 'Select Product...' : 'Choose Category first'}</option>
                    {availableProducts.map((p: any) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Amount (₹)</span>
                    <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="h-10 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Address</label>
              <Input required value={address} onChange={e => setAddress(e.target.value)} className="h-10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">City</label>
                <Input required value={city} onChange={e => setCity(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">District</label>
                <Input required value={district} onChange={e => setDistrict(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Pincode</label>
                <Input required value={pincode} onChange={e => setPincode(e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Income Type</label>
                <select value={incomeType} onChange={(e) => setIncomeType(e.target.value)} className="w-full h-10 bg-white border-slate-200 text-slate-900 rounded-lg px-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm">
                    <option value="">Select Type...</option>
                    <option value="Salary - Government">Salary - Government</option>
                    <option value="Salary - Private">Salary - Private</option>
                    <option value="Business">Business</option>
                    <option value="SEP - Business">SEP - Business</option>
                    <option value="SEP - Government Salary">SEP - Government Salary</option>
                    <option value="SEP - Private Salary">SEP - Private Salary</option>
                    <option value="Others">Others</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Name of Company (Optional)</label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company / Department / Firm" className="h-10" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Yearly Income</label>
                <select value={yearlyIncomeRange} onChange={(e) => setYearlyIncomeRange(e.target.value)} className="w-full h-10 bg-white border-slate-200 text-slate-900 rounded-lg px-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm">
                    <option value="">Select Range...</option>
                    <option value="Below 2.5L">Below 2.5L</option>
                    <option value="2.5L - 5L">2.5L - 5L</option>
                    <option value="5L - 10L">5L - 10L</option>
                    <option value="10L - 20L">10L - 20L</option>
                    <option value="Above 20L">Above 20L</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <DatePicker 
                  label="Assoc. Date" 
                  value={associationDate} 
                  onChange={(_, d) => setAssociationDate(d)} 
                  captionLayout="dropdown"
                  buttonClassName="h-10 bg-white border-slate-200 text-slate-900 rounded-lg shadow-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <DatePicker 
                  label="Birthday" 
                  value={birthday} 
                  onChange={(_, d) => setBirthday(d)} 
                  captionLayout="dropdown"
                  buttonClassName="h-10 bg-white border-slate-200 text-slate-900 rounded-lg shadow-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <DatePicker 
                  label="Anniversary" 
                  value={anniversary} 
                  onChange={(_, d) => setAnniversary(d)} 
                  captionLayout="dropdown"
                  buttonClassName="h-10 bg-white border-slate-200 text-slate-900 rounded-lg shadow-sm" 
                />
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" form="edit-customer-form" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
