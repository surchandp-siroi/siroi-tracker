import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@/components/ui';
import { Loader2, CheckCircle2, FileText, AlertTriangle, Building2, User, Landmark, Fingerprint, ChevronRight } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { stateCityMap } from '@/lib/locations';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Form, 2: OTP, 3: Success
  const [formStep, setFormStep] = useState(1); // 1: Personal, 2: KYC, 3: Bank, 4: Address
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Default State to first available in map to ensure City can populate
  const defaultState = Object.keys(stateCityMap)[0];

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    panNumber: '',
    aadharNumber: '',
    bankName: '',
    accountNumber: '',
    accountType: 'Savings',
    ifscCode: '',
    address: '',
    pincode: '',
    state: defaultState,
    city: stateCityMap[defaultState][0] || '',
    currentWorkspace: '',
    associatedBranch: ''
  });

  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [otp, setOtp] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pan' | 'aadhar') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size exceeds 5MB limit for ${type.toUpperCase()}`);
      return;
    }
    if (type === 'pan') setPanFile(file);
    else setAadharFile(file);
  };

  const uploadFile = async (file: File, pathPrefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}_${Date.now()}.${fileExt}`;
    const filePath = `consultants/${fileName}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('consultant_docs')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    return data.path;
  };

  const handleNextFormStep = () => {
      if (formStep === 1) {
          if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email) {
              setError("Please fill out all mandatory personal details.");
              return;
          }
      } else if (formStep === 2) {
          if (!formData.panNumber || !panFile || !formData.aadharNumber || !aadharFile) {
              setError("Please provide all KYC documents.");
              return;
          }
      } else if (formStep === 3) {
          if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
              setError("Please fill out all bank details.");
              return;
          }
      }
      setError('');
      setFormStep(p => Math.min(p + 1, 4));
  };

  const handlePrevFormStep = () => {
      setError('');
      setFormStep(p => Math.max(p - 1, 1));
  };

  const handleInitialSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!panFile || !aadharFile) {
      setError('Please upload both PAN and Aadhar documents.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: { 
          shouldCreateUser: true,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (otpError) throw otpError;

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email'
      });

      if (verifyError) throw verifyError;
      if (!authData.user) throw new Error("Verification failed.");

      // Add a short delay to allow Supabase client to finish writing the session
      // to local storage and release the auth token lock.
      await new Promise(resolve => setTimeout(resolve, 1000));

      let panUrl = '';
      let aadharUrl = '';
      try {
        if (panFile) panUrl = await uploadFile(panFile, `pan_${formData.phone}`);
        if (aadharFile) aadharUrl = await uploadFile(aadharFile, `aadhar_${formData.phone}`);
      } catch (uploadErr: any) {
         throw new Error(`Document upload failed: ${uploadErr.message}. Make sure the 'consultant_docs' bucket exists.`);
      }

      const { error: dbError } = await supabase.from('consultants').insert([{
        name: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' '),
        phone: formData.phone,
        email: formData.email,
        pan_number: formData.panNumber,
        pan_file_url: panUrl,
        aadhar_number: formData.aadharNumber,
        aadhar_file_url: aadharUrl,
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        account_type: formData.accountType,
        ifsc_code: formData.ifscCode,
        address: formData.address,
        pincode: formData.pincode,
        state: formData.state,
        city: formData.city,
        current_workspace: formData.currentWorkspace,
        associated_branch: formData.associatedBranch,
        status: 'pending'
      }]);

      if (dbError) {
          if (dbError.code === '23505') {
              throw new Error("An application with this email already exists.");
          }
          throw dbError;
      }

      await supabase.auth.signOut();
      
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newState = e.target.value;
      const cities = stateCityMap[newState] || [];
      setFormData({
          ...formData,
          state: newState,
          city: cities.length > 0 ? cities[0] : ''
      });
  };

  const formStepsList = [
    { id: 1, name: 'Personal', icon: User },
    { id: 2, name: 'KYC', icon: Fingerprint },
    { id: 3, name: 'Bank', icon: Landmark },
    { id: 4, name: 'Address', icon: Building2 }
  ];

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-10 text-center relative z-10">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Application Submitted!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Your consultant application has been successfully submitted and verified. You will be notified once your profile is approved by the admin.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-semibold">
                Return to Login
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
        {/* Left Side - Image/Branding */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-slate-900 overflow-hidden items-center justify-center">
            <div className="absolute inset-0 z-0">
                <img src="/onboarding-bg.png" alt="Siroi Forex Abstract Data" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-slate-950/90 z-10" />
            
            <div className="relative z-20 p-12 text-center max-w-lg flex flex-col items-center">
                 <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-2xl border border-white/10">
                     <LogoIcon className="w-12 h-12 text-white" />
                 </div>
                 <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">Join Siroi Forex</h1>
                 <p className="text-lg xl:text-xl text-indigo-100/80 font-light leading-relaxed">
                     Partner with us as a consultant to enjoy complete transparency, timely payouts, and a seamless workflow for your business.
                 </p>
            </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto">
             <div className="min-h-full flex items-center justify-center p-6 sm:p-12 xl:p-16">
                 <div className="w-full max-w-4xl">
                      
                      {/* Mobile Header */}
                      <div className="mb-8 lg:hidden flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
                              <LogoIcon className="w-10 h-10" />
                          </div>
                          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Consultant Portal</h1>
                          <p className="text-sm text-slate-500 mt-1">Register to join Siroi Forex</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-12 relative overflow-hidden">
                          
                          {/* Title */}
                          <div className="mb-10 text-center">
                              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                  {step === 1 ? 'Registration Form' : 'Verify Email'}
                              </h2>
                              <p className="text-slate-500 mt-2">
                                  {step === 1 ? 'Complete your professional profile below.' : 'We sent a verification code to your email.'}
                              </p>
                          </div>

                          {error && (
                              <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3 text-sm font-medium">
                                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                                  <p>{error}</p>
                              </div>
                          )}

                          {step === 1 ? (
                              <div className="space-y-10">
                                  
                                  {/* Progress Bar */}
                                  <div className="relative max-w-2xl mx-auto mb-12">
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                          <div 
                                              className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-in-out" 
                                              style={{ width: `${((formStep - 1) / (formStepsList.length - 1)) * 100}%` }} 
                                          />
                                      </div>
                                      <div className="relative flex justify-between">
                                          {formStepsList.map((s) => {
                                              const isActive = formStep === s.id;
                                              const isCompleted = formStep > s.id;
                                              return (
                                                  <div key={s.id} className="flex flex-col items-center">
                                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                          isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110' : 
                                                          isCompleted ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400' :
                                                          'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400'
                                                      }`}>
                                                          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                                                      </div>
                                                      <span className={`absolute -bottom-7 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 
                                                          isCompleted ? 'text-slate-700 dark:text-slate-300' :
                                                          'text-slate-400'
                                                      }`}>
                                                          {s.name}
                                                      </span>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>

                                  <form onSubmit={(e) => { e.preventDefault(); if(formStep < 4) handleNextFormStep(); else handleInitialSubmit(e); }}>
                                      
                                      {/* Step 1: Personal Details */}
                                      {formStep === 1 && (
                                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                  <div className="sm:col-span-2">
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Name (As per Legal ID)</label>
                                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                          <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="First Name" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                          <Input value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} placeholder="Middle Name" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                          <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Surname" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                      </div>
                                                  </div>
                                                  <div className="sm:col-span-2">
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                          <div>
                                                              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Phone Number</label>
                                                              <Input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                          </div>
                                                          <div>
                                                              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                                                              <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                          </div>
                                                      </div>
                                                      <p className="text-xs text-slate-500 mt-4">* The phone number and email ID above will be the medium of communication from Siroi's team in the future.</p>
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      {/* Step 2: KYC Documents */}
                                      {formStep === 2 && (
                                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">PAN Number</label>
                                                      <Input required value={formData.panNumber} onChange={e => setFormData({...formData, panNumber: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Upload PAN (Max 5MB)</label>
                                                      <Input required={!panFile} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleFileChange(e, 'pan')} className="h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 cursor-pointer file:text-indigo-600 dark:file:text-indigo-400 file:bg-indigo-50 dark:file:bg-indigo-900/20 file:border-0 file:rounded-md file:mr-3 file:px-4 file:py-1.5 file:font-semibold file:text-xs pt-2.5" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Aadhar Number</label>
                                                      <Input required value={formData.aadharNumber} onChange={e => setFormData({...formData, aadharNumber: e.target.value})} placeholder="1234 5678 9012" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Upload Aadhar (Max 5MB)</label>
                                                      <Input required={!aadharFile} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleFileChange(e, 'aadhar')} className="h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 cursor-pointer file:text-indigo-600 dark:file:text-indigo-400 file:bg-indigo-50 dark:file:bg-indigo-900/20 file:border-0 file:rounded-md file:mr-3 file:px-4 file:py-1.5 file:font-semibold file:text-xs pt-2.5" />
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      {/* Step 3: Bank Details */}
                                      {formStep === 3 && (
                                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                  <div className="sm:col-span-2">
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Bank Name</label>
                                                      <Input required value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} placeholder="State Bank of India" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Account Number</label>
                                                      <Input required value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} placeholder="00000000000" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">IFSC Code</label>
                                                      <Input required value={formData.ifscCode} onChange={e => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})} placeholder="SBIN0000001" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Account Type</label>
                                                      <select 
                                                          required
                                                          className="flex h-12 text-lg w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                          value={formData.accountType}
                                                          onChange={e => setFormData({...formData, accountType: e.target.value})}
                                                      >
                                                          <option value="Savings">Savings</option>
                                                          <option value="Current">Current</option>
                                                      </select>
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      {/* Step 4: Address Details */}
                                      {formStep === 4 && (
                                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                  <div className="sm:col-span-2">
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Associated Branch</label>
                                                      <select 
                                                          required
                                                          className="flex h-12 text-lg w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                          value={formData.associatedBranch}
                                                          onChange={e => setFormData({...formData, associatedBranch: e.target.value})}
                                                      >
                                                          <option value="" disabled>Select Associated Branch...</option>
                                                          <option value="Guwahati">Guwahati</option>
                                                          <option value="Manipur">Manipur</option>
                                                          <option value="Itanagar">Itanagar</option>
                                                          <option value="Nagaland & Mizoram">Nagaland & Mizoram</option>
                                                      </select>
                                                  </div>
                                                  <div className="sm:col-span-2">
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Current Place of Work</label>
                                                      <Input required value={formData.currentWorkspace} onChange={e => setFormData({...formData, currentWorkspace: e.target.value})} placeholder="Company Name / Office Location" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div className="sm:col-span-2">
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Full Address</label>
                                                      <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="House No, Street, Landmark" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Pincode</label>
                                                      <Input required value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="781001" className="h-12 text-lg bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800" />
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">State</label>
                                                      <select 
                                                          required
                                                          className="flex h-12 text-lg w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                          value={formData.state}
                                                          onChange={handleStateChange}
                                                      >
                                                          <option value="" disabled>Select State</option>
                                                          {Object.keys(stateCityMap).map(state => (
                                                              <option key={state} value={state}>{state}</option>
                                                          ))}
                                                      </select>
                                                  </div>
                                                  <div>
                                                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">City</label>
                                                      <select 
                                                          required
                                                          className="flex h-12 text-lg w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                          value={formData.city}
                                                          onChange={e => setFormData({...formData, city: e.target.value})}
                                                      >
                                                          <option value="" disabled>Select City</option>
                                                          {(stateCityMap[formData.state] || []).map(city => (
                                                              <option key={city} value={city}>{city}</option>
                                                          ))}
                                                      </select>
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      <div className="pt-10 flex gap-4">
                                          {formStep > 1 && (
                                              <Button type="button" variant="secondary" onClick={handlePrevFormStep} className="flex-1 h-14 text-base rounded-xl">
                                                  Back
                                              </Button>
                                          )}
                                          {formStep < 4 ? (
                                              <Button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 h-14 text-base font-bold tracking-wide shadow-lg shadow-indigo-600/20 rounded-xl">
                                                  Next Step <ChevronRight className="w-5 h-5 ml-2" />
                                              </Button>
                                          ) : (
                                              <Button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 h-14 text-base font-bold tracking-wide shadow-lg shadow-indigo-600/20 rounded-xl" disabled={isLoading}>
                                                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                                  {isLoading ? 'Processing...' : 'Submit Application'}
                                              </Button>
                                          )}
                                      </div>

                                  </form>
                              </div>
                          ) : (
                              <form onSubmit={handleVerifySubmit} className="space-y-10 text-center py-6">
                                  <div className="mx-auto w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-8">
                                      <FileText className="w-10 h-10" />
                                  </div>
                                  <div>
                                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Verify Your Email</h2>
                                      <p className="text-slate-500 dark:text-slate-400 text-lg">
                                          We've sent a 6-digit verification code to <br/>
                                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formData.email}</strong>
                                      </p>
                                  </div>
                                  
                                  <div className="max-w-xs mx-auto pt-4">
                                      <Input 
                                          required 
                                          value={otp} 
                                          onChange={e => setOtp(e.target.value)} 
                                          placeholder="000000" 
                                          maxLength={6}
                                          className="text-center text-4xl tracking-[0.2em] h-20 font-mono bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl"
                                      />
                                  </div>

                                  <div className="flex gap-4 pt-8">
                                      <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={isLoading} className="flex-1 h-14 text-base rounded-xl">
                                          Back
                                      </Button>
                                      <Button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 h-14 text-base rounded-xl shadow-lg shadow-indigo-600/20 font-bold" disabled={isLoading || otp.length < 6}>
                                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                                      </Button>
                                  </div>
                              </form>
                          )}
                      </div>
                 </div>
             </div>
        </div>
    </div>
  );
}
