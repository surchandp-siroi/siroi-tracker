import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input, Button } from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Loader2 } from 'lucide-react';

type CustomerData = any;

interface EditCustomerDialogProps {
  customer: CustomerData;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCustomerDialog({ customer, onClose, onSuccess }: EditCustomerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerName, setCustomerName] = useState(customer.customer_name || '');
  const [aadharNumber, setAadharNumber] = useState(customer.aadhar_number || '');
  const [associationDate, setAssociationDate] = useState(customer.association_date || '');
  const [address, setAddress] = useState(customer.address || '');
  const [pincode, setPincode] = useState(customer.pincode || '');
  const [city, setCity] = useState(customer.city || '');
  const [district, setDistrict] = useState(customer.district || '');
  const [phoneNumber, setPhoneNumber] = useState(customer.phone_number || '');
  const [emailId, setEmailId] = useState(customer.email_id || '');
  const [incomeType, setIncomeType] = useState(customer.income_type || '');
  const [yearlyIncomeRange, setYearlyIncomeRange] = useState(customer.yearly_income_range || '');
  const [birthday, setBirthday] = useState(customer.birthday || '');
  const [anniversary, setAnniversary] = useState(customer.anniversary || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('customer_data')
        .update({
          customer_name: customerName,
          aadhar_number: aadharNumber,
          association_date: associationDate,
          address,
          pincode,
          city,
          district,
          phone_number: phoneNumber,
          email_id: emailId,
          income_type: incomeType,
          yearly_income_range: yearlyIncomeRange,
          birthday,
          anniversary
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
                <Input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Aadhar</label>
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
                    <option value="Salary">Salary</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="SEP - Business">SEP - Business</option>
                    <option value="SEP - Private Salary">SEP - Private Salary</option>
                    <option value="SEP - Govt Salary">SEP - Govt Salary</option>
                </select>
              </div>
              <div className="space-y-1.5">
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
