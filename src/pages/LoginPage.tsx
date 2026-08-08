import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import { MapPin, Loader2, AlertTriangle, Activity, Server, ShieldCheck } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

export default function LoginPage() {
  const routerLocation = useLocation();
  const [error, setError] = useState('');
  const [email, setEmail] = useState(routerLocation.state?.email || '');
  const [password, setPassword] = useState('');
  
  const initialBranches = useDataStore.getState().branches;
  const [location, setLocation] = useState(initialBranches[0]?.name || 'HO');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { login, requestOtpLogin, verifyOtpLogin, isLoading } = useAuthStore();
  const { branches } = useDataStore();
  const navigate = useNavigate();

  const [wittyMessage, setWittyMessage] = useState<string | null>(null);

  const handleWittyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setWittyMessage('You exactly know whom to call!');
    setTimeout(() => setWittyMessage(null), 3000);
  };

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  const effectiveLoginMode = (loginMode === 'password' && email.toLowerCase() === 'sharjuthoudam@siroiforex.com') ? 'otp' : loginMode;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !location) {
      setError('Please provide email and select location.');
      return;
    }
    setError('');

    try {
      // Force HO location for admin and executive accounts
      const isSpecialAccount = ['executive@siroiforex.com', 'surchanddsingh@siroiforex.com', 'tomas@siroiforex.com', 'sharjuthoudam@siroiforex.com'].includes(email.toLowerCase());
      const loginLocation = isSpecialAccount ? 'HO' : location;

      if (effectiveLoginMode === 'password') {
         if (!password) { setError('Password is required'); return; }
         setLocationStatus('Authenticating...');
         await login(email, password, loginLocation);
      } else {
         if (!otpSent) {
            setLocationStatus('Sending OTP...');
            await requestOtpLogin(email, loginLocation);
            setOtpSent(true);
            setLocationStatus('');
            return; // Wait for user to input OTP
         } else {
            if (!otp) { setError('OTP is required'); return; }
            setLocationStatus('Verifying OTP...');
            await verifyOtpLogin(email, otp, loginLocation);
         }
      }

      const updatedUser = useAuthStore.getState().user;
      console.log("[LoginPage] verifyOtpLogin finished. updatedUser:", updatedUser?.email, updatedUser?.role);
      
      if (updatedUser?.role === 'statehead' || updatedUser?.email === 'executive@siroiforex.com' || updatedUser?.email?.toLowerCase().startsWith('mis.')) {
          console.log("[LoginPage] Navigating to /entry");
          navigate('/entry');
      } else {
          console.log("[LoginPage] Navigating to /dashboard");
          navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("[LoginPage] Caught error in handleLogin:", err);
      if (err.message?.includes('UNAUTHORIZED_LOCATION')) {
        setError('UNAUTHORIZED_LOCATION');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
      setLocationStatus('');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 bg-[#030816] overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute min-w-full min-h-full object-cover opacity-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[46%] scale-[1.15] pointer-events-none"
        >
          <source src="/Earth_Siroi.mp4" type="video/mp4" />
        </video>
      </div>
      {/* Dark overlay to ensure contrast */}
      <div className="absolute inset-0 z-0 bg-slate-900/40" /> 
      
      {/* Glassy Background Container wrapping the floating rectangles */}
      <div className="relative z-10 w-full max-w-6xl min-h-[720px] p-6 sm:p-10 rounded-[2.5rem] bg-indigo-900/20 backdrop-blur-xl border border-indigo-300/10 shadow-2xl flex flex-col lg:flex-row items-stretch justify-center gap-8">
        
        {/* Left Rectangle (Floating Content) */}
        <div className="hidden lg:flex flex-col justify-between w-full lg:w-[55%] bg-indigo-950/50 backdrop-blur-md border border-white/5 rounded-3xl p-12 shadow-xl relative overflow-hidden min-h-[600px]">
            {/* Subtle glows inside the left card */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top section: Logo */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                 <div className="text-white w-10 h-10 flex items-center justify-center drop-shadow-md">
                    <LogoIcon className="w-8 h-8" />
                 </div>
                 <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md whitespace-nowrap">Siroi Financial Consultancy</h1>
              </div>
            </div>

            {/* Bottom section: Text */}
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-indigo-300 mb-4 tracking-tight">Data Monitoring & Tracking</h2>
              <p className="text-indigo-100/70 font-medium text-base leading-relaxed max-w-md">
                 Access real-time branch metrics, operational analytics, and unified data streams in one secure dashboard.
              </p>
            </div>
        </div>

        {/* Right Rectangle (Floating Login Form) */}
        <div className="w-full lg:w-[45%] flex flex-col items-center justify-center">
           <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
              {/* Logo only shows on mobile */}
              <div className="lg:hidden mx-auto flex items-center justify-center gap-3 mb-8">
                  <div className="text-indigo-600 dark:text-white w-10 h-10 flex items-center justify-center">
                      <LogoIcon className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight dark:text-white text-slate-900 m-0">Siroi Financial Consultancy</h1>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Portal Access</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Log in and verify your branch location to continue.
                </p>
              </div>

              {error === 'UNAUTHORIZED_LOCATION' ? (
                  <div className="p-5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl mb-6 flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-sm">
                      <div className="bg-red-500 text-white rounded-full p-2.5 mb-3 shadow-md">
                          <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm mb-1 tracking-wide uppercase">ACCESS DENIED</h3>
                      <p className="text-xs font-medium text-center leading-relaxed opacity-90">
                          You are either not an authorized user or the selected location does not match your assigned branch.
                      </p>
                  </div>
              ) : error ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-sm rounded-lg mb-6 font-medium animate-in fade-in slide-in-from-top-1">
                     {error}
                  </div>
              ) : null}

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-8">
                  <button
                      type="button"
                      className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-all ${loginMode === 'otp' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      onClick={() => { setLoginMode('otp'); setOtpSent(false); setError(''); }}
                  >
                      Branch Login
                  </button>
                  <button
                      type="button"
                      className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-all ${loginMode === 'password' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      onClick={() => { setLoginMode('password'); setError(''); }}
                  >
                      Admin Login
                  </button>
              </div>

              <form onSubmit={handleLogin} className="text-left mb-8">
                 <div className="mb-5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Institutional Email</label>
                    <Input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@siroiforex.com"
                        required
                        disabled={otpSent && effectiveLoginMode === 'otp'}
                        className="h-11"
                    />
                 </div>

                 <div 
                    className="transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden"
                    style={{
                       maxHeight: (effectiveLoginMode === 'password' || (effectiveLoginMode === 'otp' && otpSent)) ? '100px' : '0px',
                       opacity: (effectiveLoginMode === 'password' || (effectiveLoginMode === 'otp' && otpSent)) ? 1 : 0,
                       marginBottom: (effectiveLoginMode === 'password' || (effectiveLoginMode === 'otp' && otpSent)) ? '20px' : '0px',
                    }}
                 >
                     {effectiveLoginMode === 'password' ? (
                       <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Password</label>
                          <Input 
                              type="password" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              required={effectiveLoginMode === 'password'}
                              className="h-11"
                          />
                       </div>
                     ) : (
                       <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">6-Digit OTP</label>
                          <Input 
                              type="text" 
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Enter the OTP from your email"
                              maxLength={6}
                              required={effectiveLoginMode === 'otp' && otpSent}
                              className="h-11 font-mono tracking-widest text-center"
                          />
                       </div>
                     )}
                 </div>

                 <div className="mb-5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Active Location</label>
                    <select 
                        className="flex h-11 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        required
                        disabled={otpSent && effectiveLoginMode === 'otp'}
                    >
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                {branch.name}
                            </option>
                        ))}
                    </select>
                 </div>

                  <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center transition-all shadow-md hover:shadow-lg shadow-indigo-600/20" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {locationStatus || 'Authenticating...'}
                        </>
                    ) : effectiveLoginMode === 'otp' ? (
                        otpSent ? 'Verify OTP & Login' : 'Secure Sign In'
                    ) : 'Secure Sign In'}
                  </Button>
              </form>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="flex justify-center items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    <MapPin size={12} className="mr-1.5" />
                    <span>Context Authenticator Active</span>
                </div>
                
                <div className="flex items-center justify-center space-x-4 text-xs text-indigo-600 dark:text-indigo-400 font-medium relative">
                    <a href="#" onClick={handleWittyClick} className="hover:underline opacity-80 hover:opacity-100 transition-opacity">Forgot Credentials?</a>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <a href="#" onClick={handleWittyClick} className="hover:underline opacity-80 hover:opacity-100 transition-opacity">IT Support</a>
                    
                    {wittyMessage && (
                      <div className="absolute -top-12 whitespace-nowrap bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 zoom-in duration-300 font-semibold tracking-wide">
                        {wittyMessage}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45"></div>
                      </div>
                    )}
                </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
