import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !location) {
      setError('Please provide email and select location.');
      return;
    }
    setError('');

    try {
      // Force HO location for admin and executive accounts
      const isSpecialAccount = email.toLowerCase() === 'executive@siroiforex.com' || email.toLowerCase() === 'surchanddsingh@siroiforex.com' || email.toLowerCase() === 'tomas@siroiforex.com';
      const loginLocation = isSpecialAccount ? 'HO' : location;

      if (loginMode === 'password') {
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
      
      if (updatedUser?.role === 'statehead' || updatedUser?.email === 'executive@siroiforex.com' || updatedUser?.email?.toLowerCase().startsWith('mis.')) {
          navigate('/entry');
      } else {
          navigate('/dashboard');
      }
    } catch (err: any) {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center border-b-0 pb-0">
            <div className="mx-auto w-40 flex flex-col items-center justify-center mb-2">
                <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                    <LogoIcon className="w-12 h-12" />
                </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white text-slate-900 mb-1">SIROI FOREX</h1>
            <p className="text-sm dark:text-slate-400 text-slate-500 uppercase tracking-widest">Internal Portal</p>
        </CardHeader>
        <CardContent className="pt-6 text-center">
            {error === 'UNAUTHORIZED_LOCATION' ? (
                <div className="p-5 bg-red-500/10 border-2 border-red-500 text-red-500 dark:text-red-400 rounded-lg mb-6 flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-sm">
                    <div className="bg-red-500 text-white rounded-full p-2.5 mb-3 shadow-md">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-1 tracking-wide">ACCESS DENIED</h3>
                    <p className="text-sm font-medium leading-relaxed">
                        You are either not an authorized user or the selected location does not match your assigned branch.
                    </p>
                </div>
            ) : error ? (
                <div className="p-3 bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-sm rounded-md mb-6 font-medium animate-in fade-in slide-in-from-top-1">
                   {error}
                </div>
            ) : null}
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Log in and verify your designated branch location to continue.
            </p>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
                <button
                    type="button"
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${loginMode === 'otp' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => { setLoginMode('otp'); setOtpSent(false); setError(''); }}
                >
                    Branch Login (OTP)
                </button>
                <button
                    type="button"
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${loginMode === 'password' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => { setLoginMode('password'); setError(''); }}
                >
                    Admin Login
                </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left mb-6">
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
                  <Input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={otpSent && loginMode === 'otp'}
                  />
               </div>

               {loginMode === 'password' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Password</label>
                    <Input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required={loginMode === 'password'}
                    />
                 </div>
               )}

               {loginMode === 'otp' && otpSent && (
                 <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">6-Digit OTP</label>
                    <Input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter the OTP from your email"
                        maxLength={6}
                        required={loginMode === 'otp' && otpSent}
                    />
                 </div>
               )}

               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Active Location</label>
                  <select 
                      className="flex h-9 w-full rounded-md glass-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      required
                      disabled={otpSent && loginMode === 'otp'}
                  >
                      {branches.map(branch => (
                          <option key={branch.id} value={branch.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {branch.name}
                          </option>
                      ))}
                  </select>
               </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-4 flex items-center justify-center transition-all" disabled={isLoading}>
                  {isLoading ? (
                      <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {locationStatus || 'Authenticating...'}
                      </>
                  ) : loginMode === 'otp' ? (
                      otpSent ? 'Verify OTP & Login' : 'Send OTP'
                  ) : 'Authenticate & Login'}
                </Button>
            </form>
            
            <div className="flex justify-center items-center text-[10px] text-slate-400 uppercase tracking-widest">
                <MapPin size={12} className="mr-1" />
                <span>Context Authenticator Active</span>
            </div>
        </CardContent>
      </Card>
      <div className="mt-8 text-center opacity-40">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase">Assure Your Financial Freedom</p>
      </div>
    </div>
  );
}
