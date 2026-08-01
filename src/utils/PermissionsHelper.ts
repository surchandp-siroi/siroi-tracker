import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem } from '@capacitor/filesystem';

export const requestAppPermissions = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Request Location Permissions
    const locStatus = await Geolocation.checkPermissions();
    if (locStatus.location !== 'granted') {
      await Geolocation.requestPermissions();
    }

    // Request Storage (Filesystem) Permissions
    const fsStatus = await Filesystem.checkPermissions();
    if (fsStatus.publicStorage !== 'granted') {
      await Filesystem.requestPermissions();
    }
  } catch (error) {
    console.error('Error requesting app permissions:', error);
  }
};
