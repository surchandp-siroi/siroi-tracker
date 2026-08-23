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
      
      {/* Left Section - Graphic / Info */}
      <div className="hidden lg:flex flex-1 m-4 rounded-[2rem] bg-indigo-950 overflow-hidden relative shadow-2xl">
        
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px]"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-12 flex flex-col h-full w-full">
            
            {/* Logo area */}
            <div className="flex items-center gap-3 shrink-0">
                <LogoIcon className="w-10 h-10 text-indigo-400" />
                <span className="font-bold tracking-widest text-white uppercase text-xl">Siroi Forex</span>
            </div>

            {/* Main Value Prop */}
            <div className="mt-auto mb-16 max-w-lg transition-all duration-500 min-h-[160px]">
                <div key={activeSlide} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-[1.1] whitespace-pre-line">
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

              {/* Mobile Only: Phone Selector Dropdown */}
              {isNative && (
                <div 
                    className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        showPhoneSelector && !otpSent ? 'max-h-24 opacity-100 mt-4 translate-y-0' : 'max-h-0 opacity-0 mt-0 -translate-y-4 pointer-events-none'
                    }`}
                >
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                          <Phone className="w-5 h-5" />
                      </div>
                      <select 
                          value={selectedPhone}
                          onChange={(e) => setSelectedPhone(e.target.value)}
                          className="pl-12 pr-4 py-3 h-[52px] text-base bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20 transition-all rounded-xl w-full appearance-none text-slate-900 dark:text-white"
                          disabled={isLoading}
                      >
                          {availablePhones.map((phone, idx) => (
                              <option key={idx} value={phone}>{phone}</option>
                          ))}
                      </select>
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
              Copyright Ac {new Date().getFullYear()} Siroi Forex. All rights reserved.
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
