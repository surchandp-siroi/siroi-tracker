import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  ArrowRight, ShieldCheck, Shield, AlertTriangle, Wallet, Plus, 
  TrendingUp, Activity, Users, BarChart3, PieChart, ArrowUpRight,
  Clock, CheckCircle2, Building2, Star, Key, Phone
} from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { MOBILE_SMS_USERS } from '@/utils/authConstants';

const maskPhoneNumber = (phone: string) => {
  if (phone.endsWith('4547')) return 'Developer';
  if (phone.length < 10) return phone;
  const countryCode = phone.slice(0, phone.length - 10);
  const last4 = phone.slice(-4);
  return `${countryCode} ****** ${last4}`;
};

const AUTHORIZED_EMAILS = [
  // Admins
  'executive@siroiforex.com',
  'surchanddsingh@siroiforex.com',
  'tomas@siroiforex.com',
  'sharjuthoudam@siroiforex.com',
  // Branch Managers
  'mis.ghy@siroiforex.com',
  'mis.manipur@siroiforex.com',
  'mis.itanagar@siroiforex.com',
  'mis.mizonaga@siroiforex.com'
];

const contentSlides = [
  {
    title: "A Unified Hub for Smarter\nFinancial Decision-Making",
    description: "Siroi Forex empowers you with a unified financial command center—delivering deep insights and a 360° view of your entire economic world."
  },
  {
    title: "Real-Time Tracking &\nLive Analytics",
    description: "Monitor loan disbursals, track branch performance, and get up-to-the-minute updates on capital allocations."
  },
  {
    title: "Secure & Authorized\nAccess Only",
    description: "Enterprise-grade security ensures that only authorized personnel can access sensitive branch and financial data."
  },
  {
    title: "Seamless Onboarding for\nVendors & Consultants",
    description: "Our dedicated onboarding portals make it easier than ever to integrate new partners into the Siroi ecosystem."
  }
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Mobile SMS Flow States
  const [showPhoneSelector, setShowPhoneSelector] = useState(false);
  const [availablePhones, setAvailablePhones] = useState<string[]>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const isEmailAuthorized = useMemo(() => {
    const typedEmail = email.toLowerCase().trim();
    if (!typedEmail) return false;
    return AUTHORIZED_EMAILS.includes(typedEmail) || (MOBILE_SMS_USERS[typedEmail] && MOBILE_SMS_USERS[typedEmail].length > 0);
  }, [email]);
  
  const { login, requestOtpLogin, verifyOtpLogin } = useAuthStore();
  const navigate = useNavigate();

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative && 'OTPCredential' in window && otpSent) {
      const ac = new AbortController();
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      } as any).then((otpResponse: any) => {
        setOtp(otpResponse.code);
      }).catch(err => {
        console.log("Web OTP API Error:", err);
      });
      return () => ac.abort();
    }
  }, [otpSent, isNative]);

  // Biometric Auto-Login
  useEffect(() => {
    const tryBiometricLogin = async () => {
      if (!isNative) return;
      try {
        const { value } = await Preferences.get({ key: 'native_credentials' });
        if (value) {
          const creds = JSON.parse(value);
          const info = await BiometricAuth.checkBiometry();
          if (info.isAvailable) {
            await BiometricAuth.authenticate({
              reason: 'Log in to your account',
              cancelTitle: 'Cancel',
            });
            // If authenticate doesn't throw, it was successful
            setIsLoading(true);
            await login(creds.email, creds.password, 'HO'); // default to HO for native biometric
            const updatedUser = useAuthStore.getState().user;
            if (updatedUser?.role === 'statehead' || updatedUser?.email === 'executive@siroiforex.com' || updatedUser?.email?.toLowerCase().startsWith('mis.')) {
              navigate('/entry');
            } else {
              navigate('/dashboard');
            }
          }
        }
      } catch (err: any) {
        console.error('Biometric auto-login failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    tryBiometricLogin();
  }, [isNative, login, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % contentSlides.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeSlide]);

  useEffect(() => {
    if (!isNative) return;
    const typedEmail = email.toLowerCase().trim();
    const phones = MOBILE_SMS_USERS[typedEmail] || [];
    if (phones.length > 0) {
      setAvailablePhones(phones);
      setSelectedPhone(phones[0]);
      setShowPhoneSelector(true);
      setError('');
    } else {
      setShowPhoneSelector(false);
      setOtpSent(false);
      setOtp('');
    }
  }, [email, isNative]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const typedEmail = email.toLowerCase().trim();
    setIsLoading(true);

    try {
      if (isNative) {
        if (!showPhoneSelector && !otpSent) {
           setError('You are not an Authorised User');
           setIsLoading(false);
           return;
        } else if (showPhoneSelector && !otpSent) {
           // Step 2: Request OTP
           await requestOtpLogin(typedEmail, 'HO', selectedPhone);
           setOtpSent(true);
           setIsLoading(false);
           return;
        } else if (otpSent) {
           // Step 3: Verify OTP
           if (!otp) {
              setError('Please enter the OTP.');
              setIsLoading(false);
              return;
           }
           await verifyOtpLogin(typedEmail, otp, 'HO', selectedPhone);
           const updatedUser = useAuthStore.getState().user;
           if (updatedUser?.role === 'statehead' || updatedUser?.email === 'executive@siroiforex.com' || updatedUser?.email?.toLowerCase().startsWith('mis.')) {
             navigate('/entry');
           } else {
             navigate('/dashboard');
           }
        }
      } else {
        // Web Flow - Redirect to /login
        setTimeout(() => {
          const isAuthorized = AUTHORIZED_EMAILS.includes(typedEmail);
          if (isAuthorized) {
            navigate('/login', { state: { email: typedEmail } });
          } else {
            setError('You are not an Authorised User');
            setIsLoading(false);
          }
        }, 600);
      }
    } catch (err: any) {
       console.error("Login Error:", err);
       setError(err.message || 'Authentication failed. Please try again.');
       setIsLoading(false);
    }
  };

  // Determine button text
  let buttonText = 'Continue';
  if (isLoading) buttonText = 'Verifying...';
  else if (isNative && showPhoneSelector && !otpSent) buttonText = 'Request OTP';
  else if (isNative && otpSent) buttonText = 'Verify OTP';

  return (
    <div 
      className="h-screen flex w-full bg-slate-50 dark:bg-slate-900 selection:bg-indigo-500/30 overflow-hidden gap-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      
      {/* Left Section - Dark Grid & Glassmorphism Cards */}
      <div 
        className="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden bg-slate-950 border border-slate-800 shadow-xl"
        style={{
          borderRadius: 'max(24px, env(safe-area-inset-bottom))'
        }}
      >
        
        {/* Top Left Logo (White) */}
        <Link to="/" className="absolute top-10 left-10 z-20 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <LogoIcon className="w-8 h-8 text-white" />
            <span className="font-bold text-xl tracking-tight text-white uppercase">Siroi Forex</span>
        </Link>

        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
        {/* Soft glowing orb in the background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Floating UI Elements / Cards Area */}
        <div className="flex-1 relative flex items-center justify-center p-10 z-10 w-full h-full mt-20">
            
            {/* Mockup Composition Wrapper */}
            <div className="relative w-full max-w-4xl flex justify-center items-center gap-2 py-4">
                
                {/* Column 1 (Left) */}
                <div className="flex flex-col items-end gap-4 translate-y-2">
                    {/* 1. Main Dashboard Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 w-56 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 mb-1">Financial Plan</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full border-[3px] border-indigo-500 border-r-slate-700 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-lg font-bold text-white">₹8.7Cr</p>
                                        <p className="text-[8px] text-indigo-400 font-medium">Total Disbursed</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 px-1 py-0.5 rounded text-[8px] text-white">This Month ▾</div>
                        </div>
                        <div className="space-y-2.5 mt-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                                <p className="text-[10px] text-slate-300 flex-1">Personal</p>
                                <p className="text-[10px] text-white font-medium">₹5.2Cr</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                <p className="text-[10px] text-slate-300 flex-1">Business</p>
                                <p className="text-[10px] text-white font-medium">₹3.5Cr</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Revenue Analytics Bar Chart */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-3xl border border-white/10 w-64 shadow-2xl animate-in fade-in slide-in-from-bottom-16 duration-300 delay-300 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-indigo-500/20 rounded-lg">
                                    <BarChart3 className="w-3 h-3 text-indigo-400" />
                                </div>
                                <p className="text-[10px] font-semibold text-white">Revenue Growth</p>
                            </div>
                            <span className="text-[9px] text-green-400 font-medium">+24.5%</span>
                        </div>
                        
                        <div className="flex items-end justify-between gap-1 h-16 mt-2">
                            {[40, 65, 45, 80, 55, 95, 75].map((height, i) => (
                                <div key={i} className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-slate-700 transition-colors h-full flex items-end">
                                    <div 
                                        className={`w-full rounded-t-sm transition-all duration-300 ${i === 5 ? 'bg-indigo-500' : 'bg-blue-500/50 group-hover:bg-blue-500/70'}`}
                                        style={{ height: `${height}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-1.5 text-[7px] text-slate-500">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>

                    {/* 6. Quick Action Button */}
                    <div className="bg-indigo-600/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 w-64 flex items-center gap-2.5 shadow-2xl shadow-indigo-600/20 animate-in fade-in slide-in-from-bottom-16 duration-300 delay-1000 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-indigo-500 cursor-pointer group">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-3 h-3" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-white mb-0.5">Quick Action</p>
                            <p className="text-[8px] text-indigo-200">Record a new application</p>
                        </div>
                    </div>
                </div>

                {/* Column 2 (Center) */}
                <div className="flex flex-col items-center gap-4 -translate-y-4">
                    {/* 8. Approval Rate */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-3 rounded-[20px] border border-white/10 w-28 aspect-square shadow-2xl animate-in fade-in slide-in-from-top-8 duration-300 delay-200 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group self-start flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <p className="text-[9px] font-semibold text-slate-300">Approval Rate</p>
                        </div>
                        <p className="text-xl font-bold text-white">92.8%</p>
                    </div>

                    {/* 10. Daily Volume */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 w-60 h-[180px] shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-300 delay-600 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group flex flex-col">
                        <p className="text-[10px] font-semibold text-slate-400 mb-1">Daily Volume</p>
                        <p className="text-2xl font-bold text-white mb-3">₹1.2Cr</p>
                        
                        <div className="flex items-end gap-1 flex-1 mt-2">
                            {[30, 45, 25, 60, 40, 75, 55, 85, 65, 95].map((h, i) => (
                                <div key={i} className="flex-1 bg-slate-800 rounded-t group-hover:bg-slate-700 transition-colors h-full flex items-end">
                                    <div className="w-full rounded-t bg-cyan-400/80 transition-all duration-300" style={{ height: `${h}%` }}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 9. Support Satisfaction */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 w-60 h-32 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-300 delay-400 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-orange-500/20 rounded-lg">
                                    <Star className="w-4 h-4 text-orange-400" />
                                </div>
                                <p className="text-[11px] font-semibold text-white">Satisfaction</p>
                            </div>
                            <span className="text-[9px] text-slate-400">Based on 1.2k reviews</span>
                        </div>
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-orange-400" strokeDasharray="85, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <span className="absolute text-sm font-bold text-white">4.8</span>
                        </div>
                    </div>

                    {/* Row for Active Users & System Health */}
                    <div className="flex items-center gap-4 self-center">
                        {/* 7. Active Users */}
                        <div className="bg-slate-900/60 backdrop-blur-xl p-3 rounded-[20px] border border-white/10 w-28 aspect-square shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 delay-600 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group flex flex-col justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-purple-500/20 rounded-md">
                                    <Users className="w-3 h-3 text-purple-400" />
                                </div>
                                <p className="text-[9px] font-semibold text-slate-300">Active Users</p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-2xl font-bold text-white">8.4k</p>
                                <span className="text-[8px] text-green-400 font-medium flex items-center"><ArrowUpRight className="w-2 h-2 mr-0.5" /> +124 today</span>
                            </div>
                        </div>

                        {/* 11. System Health */}
                        <div className="bg-slate-900/60 backdrop-blur-xl p-3 rounded-[20px] border border-white/10 w-28 aspect-square shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 delay-700 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group flex flex-col justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-teal-500/20 rounded-md">
                                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                                </div>
                                <p className="text-[9px] font-semibold text-slate-300">System Health</p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-2xl font-bold text-white">99.9%</p>
                                <span className="text-[8px] text-teal-400 font-medium flex items-center">Optimal state</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3 (Right) */}
                <div className="flex flex-col items-start gap-4 translate-y-4">
                    {/* 2. Capital Allocations */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-3xl border border-white/10 w-52 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-300 delay-150 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-semibold text-slate-400">Capital Allocations</p>
                            <span className="text-[7px] text-slate-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div> Live</span>
                        </div>
                        <p className="text-base font-bold text-white mb-1">94%</p>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                            <div className="w-[94%] h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center bg-white/5 rounded-lg p-1.5">
                                 <div className="flex items-center gap-1.5">
                                    <Wallet className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-[8px] text-slate-300">Target Achieved</span>
                                 </div>
                                 <span className="text-[8px] text-green-400 flex items-center"><ArrowUpRight className="w-2 h-2 mr-0.5" /> 12%</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Activity Stream */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 w-56 h-[220px] shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-300 delay-500 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <p className="text-[11px] font-semibold text-white">Recent Activity</p>
                        </div>
                        <div className="space-y-3 flex-1 overflow-hidden">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-white">New Client Lead</p>
                                    <p className="text-[8px] text-slate-400">2 mins ago</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-white">Target Exceeded</p>
                                    <p className="text-[8px] text-slate-400">1 hour ago</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <PieChart className="w-3 h-3 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-white">Monthly Report</p>
                                    <p className="text-[8px] text-slate-400">Generated</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Star className="w-3 h-3 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-white">5-Star Review</p>
                                    <p className="text-[8px] text-slate-400">3 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Mini Stat / Conversion Rate */}
                    <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 w-44 shadow-2xl animate-in fade-in slide-in-from-bottom-16 duration-300 delay-700 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-800/80 cursor-pointer group">
                        <p className="text-[8px] text-slate-400 mb-1">Conversion Rate</p>
                        <div className="flex items-end gap-1.5">
                            <p className="text-lg font-bold text-white">68.4%</p>
                            <span className="text-[9px] text-green-400 flex items-center mb-0.5"><ArrowUpRight className="w-2 h-2" /> 4.2%</span>
                        </div>
                        <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-green-400 h-full w-[68%]"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Bottom Text & Pagination aligned to the left */}
        <div className="p-12 z-10 flex flex-col items-start pb-16 pl-16 w-full">
            <style>{`
              @keyframes slideProgress {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
            
            {/* Fixed height container to prevent layout shifts */}
            <div className="h-[160px] relative w-full max-w-md">
                <div key={activeSlide} className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h2 className="text-3xl font-bold text-white mb-3 tracking-tight whitespace-pre-line">
                        {contentSlides[activeSlide].title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {contentSlides[activeSlide].description}
                    </p>
                </div>
            </div>
            
            {/* Pagination Dots (Interactive) */}
            <div className="flex items-center justify-start gap-2 mt-4">
                {contentSlides.map((_, index) => (
                    <div 
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer relative overflow-hidden ${
                            activeSlide === index ? 'w-12 bg-white/20' : 'w-6 bg-white/20 hover:bg-white/40'
                        }`}
                    >
                        {activeSlide === index && (
                            <div 
                                className="absolute top-0 left-0 h-full bg-white"
                                style={{ animation: 'slideProgress 2.5s linear forwards' }}
                            ></div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Disclaimer */}
        <div className="absolute bottom-6 right-8 z-10 text-[9px] text-white/70 text-right pointer-events-none">
            Figures and data shown are for illustrative design purposes only.
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div 
        className="flex-1 flex flex-col bg-white dark:bg-slate-950 p-6 sm:p-12 relative shadow-xl border border-slate-200 dark:border-slate-800 overflow-y-auto"
        style={{
          borderRadius: 'max(24px, env(safe-area-inset-bottom))'
        }}
      >
        
        {/* Top Left Logo (For Mobile/Smaller Screens where left pane is hidden) */}
        <div className="flex lg:hidden items-center gap-2 shrink-0 mb-4">
            <LogoIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white uppercase">Siroi Forex</span>
        </div>

        <div className="w-full max-w-[380px] mx-auto my-auto flex flex-col justify-center min-h-[70vh] animate-in fade-in slide-in-from-right-8 duration-700">
          
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Secure Gateway
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Please enter your assigned corporate email address to proceed.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-500 ${isEmailAuthorized ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>
                  {isEmailAuthorized ? (
                    <ShieldCheck className="w-5 h-5 animate-in zoom-in spin-in-12 duration-500" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@siroiforex.com"
                  className="pl-12 pr-4 py-6 text-base bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20 transition-all rounded-xl w-full"
                  required
                  disabled={isLoading || otpSent}
                />
              </div>

                {/* Mobile Only: Phone Selector Custom UI */}
                {isNative && (
                  <div 
                      className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          showPhoneSelector && !otpSent ? 'max-h-[300px] opacity-100 mt-4 translate-y-0' : 'max-h-0 opacity-0 mt-0 -translate-y-4 pointer-events-none'
                      }`}
                  >
                      <div className="flex flex-col gap-2">
                        {availablePhones.map((phone) => (
                           <button
                             type="button"
                             key={phone}
                             onClick={() => setSelectedPhone(phone)}
                             disabled={isLoading}
                             className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                               selectedPhone === phone 
                               ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/50' 
                               : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                             }`}
                           >
                              {/* radio dot */}
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                selectedPhone === phone 
                                ? 'border-indigo-500' 
                                : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                 {selectedPhone === phone && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                              </div>
                              <Phone className={`w-4 h-4 ${
                                selectedPhone === phone ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                              }`} />
                              <span className={`text-base font-medium tracking-wide ${
                                selectedPhone === phone 
                                ? 'text-indigo-700 dark:text-indigo-300' 
                                : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {maskPhoneNumber(phone)}
                              </span>
                           </button>
                        ))}
                      </div>
                  </div>
                )}

              {/* Mobile Only: OTP Field */}
              {isNative && (
                <div 
                    className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        otpSent ? 'max-h-24 opacity-100 mt-4 translate-y-0' : 'max-h-0 opacity-0 mt-0 -translate-y-4 pointer-events-none'
                    }`}
                >
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                          <Key className="w-5 h-5" />
                      </div>
                      <Input
                        id="otp"
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-Digit OTP"
                        className="pl-12 pr-4 py-6 text-base bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20 transition-all rounded-xl w-full text-center tracking-widest font-mono"
                        required={otpSent}
                        disabled={isLoading}
                      />
                    </div>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {buttonText}
            </Button>
          </form>

          <div className="mt-12 pt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Copyright © {new Date().getFullYear()} Siroi Forex. All rights reserved.
            </p>
          </div>

        </div>
        
        {/* Vendor Button placed inside the right card */}
        <a 
          href="https://mis.siroiforex.com/onboarding/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-6 right-6 lg:right-8 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors border border-slate-200 dark:border-slate-800 hover:border-indigo-600/30 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-900 shadow-sm hover:shadow"
        >
          Are you a vendor?
        </a>

      </div>
      
    </div>
  );
}
