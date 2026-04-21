import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import { TrendingUp, MapPin, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('HO');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const { login, isLoading, user } = useAuthStore();
  const { branches } = useDataStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !location) {
      setError('Please provide email, password, and select location.');
      return;
    }
    setError('');
    setLocationStatus('Authenticating...');

    try {
      await login(email, password, location);
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.role === 'statehead') {
          navigate('/entry');
      } else {
          navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
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
            <div className="mx-auto bg-indigo-500/20 text-indigo-400 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                <TrendingUp size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white text-slate-900 mb-1">SIROI FOREX</h1>
            <p className="text-sm dark:text-slate-400 text-slate-500 uppercase tracking-widest">Internal Portal</p>
        </CardHeader>
        <CardContent className="pt-6 text-center">
            {error && (
                <div className="p-3 bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-sm rounded-md mb-6 font-medium animate-in fade-in slide-in-from-top-1">
                   {error}
                </div>
            )}
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Log in and verify your designated branch location to continue.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 text-left mb-6">
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
                  <Input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Password</label>
                  <Input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Active Location</label>
                  <select 
                      className="flex h-9 w-full rounded-md glass-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      required
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
