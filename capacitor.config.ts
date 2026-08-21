import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.siroi.tracker',
  appName: 'Siroi Tracker',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    CapacitorUpdater: {
      autoUpdate: true,
      appId: 'com.siroi.tracker'
    }
  }
};

export default config;
