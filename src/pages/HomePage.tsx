import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { 
  ArrowRight, ShieldCheck, AlertTriangle, Wallet, Plus, 
  TrendingUp, Activity, Users, BarChart3, PieChart, ArrowUpRight
} from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

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
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % contentSlides.length);
    }, 2500); // Set to 2.5s to give users enough time to read the text
    return () => clearInterval(interval);
  }, [activeSlide]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const isAuthorized = AUTHORIZED_EMAILS.includes(email.toLowerCase().trim());
      
      if (isAuthorized) {
        navigate('/login', { state: { email: email.toLowerCase().trim() } });
      } else {
        setError('Unauthorized access. This email is not assigned.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="h-screen flex w-full bg-slate-50 dark:bg-slate-900 selection:bg-indigo-500/30 overflow-hidden p-4 gap-4">
      
      {/* Left Section - Dark Grid & Glassmorphism Cards */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
        
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
            <div className="relative w-full max-w-2xl h-[550px]">
                
                {/* 1. Main Dashboard Card */}
                <div className="absolute top-0 left-0 bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-72 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 transform transition-all hover:-translate-y-4 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group z-20">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">Financial Plan</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-r-slate-700 flex-shrink-0"></div>
                                <div>
                                    <p className="text-2xl font-bold text-white">₹8.7Cr</p>
                                    <p className="text-[10px] text-indigo-400 font-medium">Total Disbursed</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">This Month ⌄</div>
                    </div>
                    <div className="space-y-3 mt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <p className="text-xs text-slate-300 flex-1">Personal Loans</p>
                            <p className="text-xs text-white font-medium">₹5.2Cr</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <p className="text-xs text-slate-300 flex-1">Business Loans</p>
                            <p className="text-xs text-white font-medium">₹3.5Cr</p>
                        </div>
                    </div>
                </div>

                {/* 2. Capital Allocations */}
                <div className="absolute top-8 right-12 bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 w-64 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 transform transition-all hover:-translate-y-3 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group z-10">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-semibold text-slate-400">Capital Allocations</p>
                        <span className="text-[9px] text-slate-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div> Live</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-1">94%</p>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                        <div className="w-[94%] h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-2">
                             <div className="flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] text-slate-300">Target Achieved</span>
                             </div>
                             <span className="text-[10px] text-green-400 flex items-center"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%</span>
                        </div>
                    </div>
                </div>

                {/* 3. Revenue Analytics Bar Chart */}
                <div className="absolute top-48 left-16 bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 w-80 shadow-2xl animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300 transform transition-all hover:-translate-y-3 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group z-30">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                                <BarChart3 className="w-4 h-4 text-indigo-400" />
                            </div>
                            <p className="text-xs font-semibold text-white">Revenue Growth</p>
                        </div>
                        <span className="text-xs text-green-400 font-medium">+24.5%</span>
                    </div>
                    
                    <div className="flex items-end justify-between gap-2 h-24 mt-4">
                        {[40, 65, 45, 80, 55, 95, 75].map((height, i) => (
                            <div key={i} className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-slate-700 transition-colors h-full flex items-end">
                                <div 
                                    className={`w-full rounded-t-sm transition-all duration-1000 ${i === 5 ? 'bg-indigo-500' : 'bg-blue-500/50 group-hover:bg-blue-500/70'}`}
                                    style={{ height: `${height}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-slate-500">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* 4. Activity Stream */}
                <div className="absolute top-44 right-0 bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 w-60 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 transform transition-all hover:-translate-y-3 hover:scale-105 hover:bg-slate-900/80 cursor-pointer group z-20">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <p className="text-xs font-semibold text-white">Recent Activity</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white">New Client Lead</p>
                                <p className="text-[10px] text-slate-400">2 mins ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white">Target Exceeded</p>
                                <p className="text-[10px] text-slate-400">1 hour ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <PieChart className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white">Monthly Report</p>
                                <p className="text-[10px] text-slate-400">Generated</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Mini Stat / Conversion Rate */}
                <div className="absolute bottom-6 right-32 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-48 shadow-2xl animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-slate-800/80 cursor-pointer group z-30">
                    <p className="text-[10px] text-slate-400 mb-1">Conversion Rate</p>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-white">68.4%</p>
                        <span className="text-xs text-green-400 flex items-center mb-1"><ArrowUpRight className="w-3 h-3" /> 4.2%</span>
                    </div>
                    <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-green-400 h-full w-[68%]"></div>
                    </div>
                </div>

                {/* 6. Quick Action Button */}
                <div className="absolute bottom-16 left-4 bg-indigo-600/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-56 flex items-center gap-4 shadow-2xl shadow-indigo-600/20 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-1000 transform transition-all hover:-translate-y-2 hover:scale-105 hover:bg-indigo-500 cursor-pointer group z-40">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white mb-0.5">Quick Action</p>
                        <p className="text-[10px] text-indigo-200">Record a new application</p>
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
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 p-6 sm:p-12 relative rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-y-auto">
        
        {/* Top Left Logo (For Mobile/Smaller Screens where left pane is hidden) */}
        <div className="absolute top-8 left-8 flex lg:hidden items-center gap-2">
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
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 animate-in shake">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@siroiforex.com"
                  className="pl-12 pr-4 py-6 text-base bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20 transition-all rounded-xl w-full"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Continue'}
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
