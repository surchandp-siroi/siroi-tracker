import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LogoIcon } from '@/components/LogoIcon';

export function AnimatedSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide the native splash screen as soon as this component mounts
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.warn('Capacitor plugins not available or failed:', e);
      }
    };
    hideNativeSplash();

    // Start the fade out animation after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Fallback in case onExitComplete is delayed or doesn't fire
      setTimeout(onComplete, 600);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-900"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.16, 1, 0.3, 1], // Custom easing for smooth pop up
              delay: 0.2
            }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-4">
               <LogoIcon className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
               <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">SIROI FOREX</h1>
            </div>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1, duration: 0.8 }}
               className="mt-12"
            >
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
