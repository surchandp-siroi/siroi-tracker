import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui';

export default function ConsultantPayoutsPage() {
  const { user } = useAuthStore();
  const targetEmail = 'sharjuthoudam@siroiforex.com';
  const isAlreadyAdmin = user?.email?.toLowerCase() === targetEmail.toLowerCase();
  const [isVerified, setIsVerified] = useState(isAlreadyAdmin);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const sendOtp = async () => {
    setIsSending(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    // Send OTP on first mount to the target email only if not already verified
    if (!isVerified && !isAlreadyAdmin) {
      sendOtp().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: otp,
        type: 'email'
      });
      
      if (error) throw error;
      
      // If successful, they are verified for this component instance
      setIsVerified(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }



  if (!isVerified && !isAlreadyAdmin) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm max-w-md w-full animate-in zoom-in-95 duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h2 className="text-xl font-black text-center text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            Security Verification
          </h2>
          <p className="text-xs text-center font-medium text-slate-500 dark:text-slate-400 mb-8">
            An OTP has been sent to your email. Please enter it below to access Consultant Payouts.
          </p>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center tracking-widest font-mono text-lg h-12"
              />
            </div>
            
            {error && (
              <p className="text-xs text-red-500 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isVerifying || isSending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify Access'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={sendOtp}
              disabled={isSending}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Consultant Payouts
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
            Financial Management
          </p>
        </div>
      </div>
      
      {/* Blank page as requested */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 min-h-[400px] flex items-center justify-center shadow-sm">
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          No data to display
        </p>
      </div>
    </div>
  );
}
