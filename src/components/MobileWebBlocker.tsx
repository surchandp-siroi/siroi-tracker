import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { MonitorSmartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui';

export function MobileWebBlocker() {
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    const checkMobileWeb = () => {
      const isNative = Capacitor.isNativePlatform();
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

      // If it's a mobile device but NOT running as a native app
      if (isMobileDevice && !isNative) {
        setIsMobileWeb(true);
      } else {
        setIsMobileWeb(false);
      }
    };

    checkMobileWeb();
    window.addEventListener('resize', checkMobileWeb);
    return () => window.removeEventListener('resize', checkMobileWeb);
  }, []);

  if (!isMobileWeb) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030816] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background styling to match the brand */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm">
        <div className="w-20 h-20 bg-indigo-950/80 rounded-2xl border border-indigo-500/30 flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/20">
          <MonitorSmartphone className="w-10 h-10 text-indigo-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Desktop Required</h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          The Siroi Forex web portal is designed and optimized exclusively for desktop screens. 
          Please access this website on your computer.
        </p>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 w-full mb-6">
          <p className="text-sm text-slate-300 font-medium mb-1">Using a mobile device?</p>
          <p className="text-xs text-slate-500">Download our dedicated native app for the best mobile experience.</p>
        </div>
      </div>
    </div>
  );
}
