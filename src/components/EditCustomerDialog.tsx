import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/store/useDataStore';
import { Input, Button } from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Loader2, ChevronDown, Landmark, Users, Briefcase, Home } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { formatCustomerName, mapCustomerTypeToCategory, mapCategoryToCustomerType } from '@/utils/formatCustomerName';
import { CHANNEL_PARTNER_OPTIONS } from '@/pages/CustomerDataEntryPage';

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

  // Core Form State
  const [customerName, setCustomerName] = useState(formatCustomerName(customer.customer_name || '', true));
  const [customerType, setCustomerType] = useState(customer.customer_type || mapCategoryToCustomerType(customer.category) || '');
  const [product, setProduct] = useState(customer.product || '');
  const [amount, setAmount] = useState(customer.amount != null ? String(customer.amount) : '');
  const [aadharNumber, setAadharNumber] = useState(customer.aadhar_number || '');
  const [associationDate, setAssociationDate] = useState(customer.association_date || '');
  const [address, setAddress] = useState(customer.address || '');
  const [pincode, setPincode] = useState(customer.pincode || '');
  const [city, setCity] = useState(customer.city || '');
  const [district, setDistrict] = useState(customer.district || '');
  const [state, setState] = useState(customer.state || '');
  const [phoneNumber, setPhoneNumber] = useState(customer.phone_number || '');
  const [emailId, setEmailId] = useState(customer.email_id || '');
  const [incomeType, setIncomeType] = useState(customer.income_type || '');
  const [companyName, setCompanyName] = useState(customer.company_name || '');
  const [yearlyIncomeRange, setYearlyIncomeRange] = useState(customer.yearly_income_range || '');
  const [birthday, setBirthday] = useState(customer.birthday || '');
  const [anniversary, setAnniversary] = useState(customer.anniversary || '');
  const [channelPartner, setChannelPartner] = useState(customer.channel_partner || '');
  const [trackingNumber, setTrackingNumber] = useState(customer.tracking_number || '');

  // Extended Loan KYC State
  const [fatherName, setFatherName] = useState(customer.father_name || '');
  const [motherName, setMotherName] = useState(customer.mother_name || '');
  const [maritalStatus, setMaritalStatus] = useState(customer.marital_status || '');
  const [spouseName, setSpouseName] = useState(customer.spouse_name || '');
  const [educationQualification, setEducationQualification] = useState(customer.education_qualification || '');
  const [designation, setDesignation] = useState(customer.designation || '');
  const [officialEmail, setOfficialEmail] = useState(customer.official_email || '');
  const [officePhone, setOfficePhone] = useState(customer.office_phone || '');
  const [officeAddress, setOfficeAddress] = useState(customer.office_address || '');
  const [officeLandmark, setOfficeLandmark] = useState(customer.office_landmark || '');
  const [residenceType, setResidenceType] = useState(customer.residence_type || '');
  const [currentAddressLandmark, setCurrentAddressLandmark] = useState(customer.current_address_landmark || '');
  const [yearsInCurrentResidence, setYearsInCurrentResidence] = useState(customer.years_in_current_residence || '');
  const [yearsInCurrentCity, setYearsInCurrentCity] = useState(customer.years_in_current_city || '');
  const [permanentAddress, setPermanentAddress] = useState(customer.permanent_address || '');
  const [permanentAddressLandmark, setPermanentAddressLandmark] = useState(customer.permanent_address_landmark || '');
  const [permanentPhone, setPermanentPhone] = useState(customer.permanent_phone || '');
  const [salaryBankName, setSalaryBankName] = useState(customer.salary_bank_name || '');
  const [salaryAccountNumber, setSalaryAccountNumber] = useState(customer.salary_account_number || '');
  const [tenure, setTenure] = useState(customer.tenure || '');
  const [ref1Name, setRef1Name] = useState(customer.ref1_name || '');
  const [ref1Phone, setRef1Phone] = useState(customer.ref1_phone || '');
  const [ref1Address, setRef1Address] = useState(customer.ref1_address || '');
  const [ref1Relation, setRef1Relation] = useState(customer.ref1_relation || '');
  const [ref2Name, setRef2Name] = useState(customer.ref2_name || '');
  const [ref2Phone, setRef2Phone] = useState(customer.ref2_phone || '');
  const [ref2Address, setRef2Address] = useState(customer.ref2_address || '');
  const [ref2Relation, setRef2Relation] = useState(customer.ref2_relation || '');

  const [isLoanSectionOpen, setIsLoanSectionOpen] = useState(true);

  const isLoan = customerType === 'Loans' || customerType === 'Loan';

  const availableProducts = useMemo(() => {
    const cat = mapCustomerTypeToCategory(customerType);
    if (!cat) return [];
    return products.filter((p: any) => p.category === cat);
  }, [products, customerType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerType) {
      setError('Please select a Customer Type.');
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
          category: mapCustomerTypeToCategory(customerType),
          product,
          amount: Number(amount) || 0,
          aadhar_number: isLoan ? (aadharNumber.trim() || null) : null,
          association_date: associationDate || null,
          address,
          pincode,
          city,
          district,
          state: state.trim() || null,
          phone_number: phoneNumber,
          email_id: emailId || null,
          income_type: incomeType || null,
          company_name: companyName.trim() || null,
          yearly_income_range: yearlyIncomeRange || null,
          birthday: birthday || null,
          anniversary: anniversary || null,
          channel_partner: channelPartner.trim() || null,
          tracking_number: trackingNumber.trim() || null,

          // Loan-specific KYC
          father_name: isLoan ? (fatherName.trim() || null) : null,
          mother_name: isLoan ? (motherName.trim() || null) : null,
          marital_status: isLoan ? (maritalStatus || null) : null,
          spouse_name: isLoan ? (spouseName.trim() || null) : null,
          education_qualification: isLoan ? (educationQualification || null) : null,
          designation: isLoan ? (designation.trim() || null) : null,
          official_email: isLoan ? (officialEmail.trim() || null) : null,
          office_phone: isLoan ? (officePhone.trim() || null) : null,
          office_address: isLoan ? (officeAddress.trim() || null) : null,
          office_landmark: isLoan ? (officeLandmark.trim() || null) : null,
          residence_type: isLoan ? (residenceType || null) : null,
          current_address_landmark: isLoan ? (currentAddressLandmark.trim() || null) : null,
          years_in_current_residence: isLoan ? (yearsInCurrentResidence.trim() || null) : null,
          years_in_current_city: isLoan ? (yearsInCurrentCity.trim() || null) : null,
          permanent_address: isLoan ? (permanentAddress.trim() || null) : null,
          permanent_address_landmark: isLoan ? (permanentAddressLandmark.trim() || null) : null,
          permanent_phone: isLoan ? (permanentPhone.trim() || null) : null,
          salary_bank_name: isLoan ? (salaryBankName.trim() || null) : null,
          salary_account_number: isLoan ? (salaryAccountNumber.trim() || null) : null,
          tenure: isLoan ? (tenure.trim() || null) : null,
          ref1_name: isLoan ? (ref1Name.trim() || null) : null,
          ref1_phone: isLoan ? (ref1Phone.trim() || null) : null,
          ref1_address: isLoan ? (ref1Address.trim() || null) : null,
          ref1_relation: isLoan ? (ref1Relation.trim() || null) : null,
          ref2_name: isLoan ? (ref2Name.trim() || null) : null,
          ref2_phone: isLoan ? (ref2Phone.trim() || null) : null,
          ref2_address: isLoan ? (ref2Address.trim() || null) : null,
          ref2_relation: isLoan ? (ref2Relation.trim() || null) : null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Edit Customer Profile</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {customer.pan_number}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Update applicant credentials and requirements.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          
          <form id="edit-customer-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Core Identification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Full Name</label>
                <Input required value={customerName} onChange={e => setCustomerName(formatCustomerName(e.target.value))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Customer Type</label>
                <select 
                  value={customerType} 
                  onChange={e => {
                    setCustomerType(e.target.value);
                    setProduct('');
                  }}
                  className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Loans">Loans</option>
                  <option value="Forex">Forex</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Investments">Investments</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Primary Phone</label>
                <Input required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email ID</label>
                <Input value={emailId} onChange={e => setEmailId(e.target.value)} className="h-10" />
              </div>
            </div>

            {/* Product & Requirement Details */}
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
                    <span>Product</span>
                    <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                    disabled={!customerType}
                    className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                  >
                    <option value="">{customerType ? 'Select Product...' : 'Select Customer Type first'}</option>
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
                  <NumericFormat
                    customInput={Input}
                    value={amount}
                    onValueChange={(values) => setAmount(values.value || '')}
                    thousandSeparator=","
                    thousandsGroupStyle="lakh"
                    placeholder="e.g. 5,00,000"
                    required
                    className="h-10 font-mono"
                  />
                </div>
                {isLoan && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tenure</label>
                    <Input value={tenure} onChange={e => setTenure(e.target.value)} placeholder="e.g. 60 Months" className="h-10" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Channel Partner</label>
                  <select
                    value={channelPartner}
                    onChange={(e) => setChannelPartner(e.target.value)}
                    className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="">Select Channel Partner Bank...</option>
                    {CHANNEL_PARTNER_OPTIONS.map(cp => (
                      <option key={cp} value={cp}>{cp}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tracking Number</label>
                  <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. LAN12345678" className="h-10 font-mono" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Residential Address</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1.5 md:col-span-4">
                  <Input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Street Address / House No." className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Input required value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Input required value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Input required value={district} onChange={e => setDistrict(e.target.value)} placeholder="District" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Input value={state} onChange={e => setState(e.target.value)} placeholder="State" className="h-10" />
                </div>
              </div>
            </div>

            {/* Employment & Income */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Employment & Income</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Income Type</label>
                  <select value={incomeType} onChange={e => setIncomeType(e.target.value)} className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm">
                    <option value="">Select Income Type...</option>
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
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Company / Department Name</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Yearly Income Range</label>
                  <select value={yearlyIncomeRange} onChange={e => setYearlyIncomeRange(e.target.value)} className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm">
                    <option value="">Select Range...</option>
                    <option value="Below 2.5L">Below 2.5L</option>
                    <option value="2.5L - 5L">2.5L - 5L</option>
                    <option value="5L - 10L">5L - 10L</option>
                    <option value="10L - 20L">10L - 20L</option>
                    <option value="Above 20L">Above 20L</option>
                  </select>
                </div>
                {isLoan && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Aadhar (Optional)</label>
                    <Input value={aadharNumber} onChange={e => setAadharNumber(e.target.value)} className="h-10" />
                  </div>
                )}
              </div>
            </div>

            {/* EXTENDED LOAN SECTIONS (Only when Loan product) */}
            {isLoan && (
              <div className="border border-indigo-200 dark:border-indigo-900/60 rounded-xl overflow-hidden mt-3">
                <button
                  type="button"
                  onClick={() => setIsLoanSectionOpen(!isLoanSectionOpen)}
                  className="w-full flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold text-xs uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Loan KYC, Family, Office & References
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLoanSectionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLoanSectionOpen && (
                  <div className="p-4 bg-white dark:bg-slate-900 space-y-4 text-xs">
                    
                    {/* Family */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Family Details</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value={fatherName} onChange={e => setFatherName(formatCustomerName(e.target.value))} placeholder="Father's Name" className="h-9" />
                        <Input value={motherName} onChange={e => setMotherName(formatCustomerName(e.target.value))} placeholder="Mother's Name" className="h-9" />
                        <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                          <option value="">Marital Status...</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                        {maritalStatus === 'Married' && (
                          <Input value={spouseName} onChange={e => setSpouseName(formatCustomerName(e.target.value))} placeholder="Spouse Name" className="h-9" />
                        )}
                        <select value={educationQualification} onChange={e => setEducationQualification(e.target.value)} className="h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 md:col-span-2">
                          <option value="">Education Qualification...</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Graduate">Graduate</option>
                          <option value="Post Graduate">Post Graduate</option>
                          <option value="Professional">Professional</option>
                        </select>
                      </div>
                    </div>

                    {/* Workplace */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Designation & Office</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Designation / Role" className="h-9" />
                        <Input value={officialEmail} onChange={e => setOfficialEmail(e.target.value)} placeholder="Official Email ID" className="h-9" />
                        <Input value={officePhone} onChange={e => setOfficePhone(e.target.value)} placeholder="Office Landline / Phone" className="h-9" />
                        <Input value={officeLandmark} onChange={e => setOfficeLandmark(e.target.value)} placeholder="Office Landmark" className="h-9" />
                        <Input value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="Office Address with PIN" className="h-9 md:col-span-2" />
                      </div>
                    </div>

                    {/* Residential Details */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Residence Stability</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select value={residenceType} onChange={e => setResidenceType(e.target.value)} className="h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                          <option value="">Residence Ownership...</option>
                          <option value="Owned">Owned</option>
                          <option value="Rented">Rented</option>
                          <option value="CO-PROVIDED">Company Provided</option>
                          <option value="Parental">Parental</option>
                        </select>
                        <Input value={currentAddressLandmark} onChange={e => setCurrentAddressLandmark(e.target.value)} placeholder="Current Landmark" className="h-9" />
                        <Input value={yearsInCurrentResidence} onChange={e => setYearsInCurrentResidence(e.target.value)} placeholder="Years in Residence" className="h-9" />
                        <Input value={yearsInCurrentCity} onChange={e => setYearsInCurrentCity(e.target.value)} placeholder="Years in City" className="h-9" />
                        <Input value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} placeholder="Permanent Address with PIN" className="h-9 md:col-span-2" />
                        <Input value={permanentAddressLandmark} onChange={e => setPermanentAddressLandmark(e.target.value)} placeholder="Permanent Landmark" className="h-9" />
                        <Input value={permanentPhone} onChange={e => setPermanentPhone(e.target.value)} placeholder="Permanent / Alt Phone" className="h-9" />
                      </div>
                    </div>

                    {/* Banking & References */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Salary Account & References</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value={salaryBankName} onChange={e => setSalaryBankName(e.target.value)} placeholder="Salary Bank Name" className="h-9" />
                        <Input value={salaryAccountNumber} onChange={e => setSalaryAccountNumber(e.target.value)} placeholder="Salary Account No." className="h-9 font-mono" />
                        
                        {/* Ref 1 */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Reference 1</span>
                          <Input value={ref1Name} onChange={e => setRef1Name(formatCustomerName(e.target.value))} placeholder="Name" className="h-8" />
                          <Input value={ref1Phone} onChange={e => setRef1Phone(e.target.value)} placeholder="Contact" className="h-8" />
                          <Input value={ref1Relation} onChange={e => setRef1Relation(e.target.value)} placeholder="Relation" className="h-8" />
                          <Input value={ref1Address} onChange={e => setRef1Address(e.target.value)} placeholder="Address" className="h-8" />
                        </div>

                        {/* Ref 2 */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Reference 2</span>
                          <Input value={ref2Name} onChange={e => setRef2Name(formatCustomerName(e.target.value))} placeholder="Name" className="h-8" />
                          <Input value={ref2Phone} onChange={e => setRef2Phone(e.target.value)} placeholder="Contact" className="h-8" />
                          <Input value={ref2Relation} onChange={e => setRef2Relation(e.target.value)} placeholder="Relation" className="h-8" />
                          <Input value={ref2Address} onChange={e => setRef2Address(e.target.value)} placeholder="Address" className="h-8" />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={onClose} className="h-10 px-4 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
