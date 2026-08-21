import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';

export const initPushNotifications = async (userId?: string, userEmail?: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Push notifications are only supported on native mobile devices.');
    return;
  }

  try {
    // 1. Check existing permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[Push] Push notification permission not granted:', permStatus.receive);
      return;
    }

    // 2. Register listeners
    await PushNotifications.removeAllListeners();

    // On registration success: Save token
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[Push] Device registered with FCM token:', token.value);
      localStorage.setItem('fcm_token', token.value);

      if (userId || userEmail) {
        try {
          const { error } = await supabase.from('user_push_tokens').upsert(
            {
              user_id: userId || null,
              email: userEmail || null,
              token: token.value,
              platform: Capacitor.getPlatform(),
              updated_at: new Date().toISOString()
            },
            { onConflict: 'token' }
          );

          if (error) {
            console.warn('[Push] Could not sync push token to Supabase:', error.message);
          } else {
            console.log('[Push] Push token synced to Supabase successfully.');
          }
        } catch (e) {
          console.warn('[Push] Supabase token save exception:', e);
        }
      }
    });

    // On registration failure
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[Push] Registration error:', JSON.stringify(error));
    });

    // On notification received while app is in foreground
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[Push] Notification received in foreground:', notification);
    });

    // On notification clicked by user
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('[Push] Notification clicked/action performed:', notification.actionId, notification.notification);
    });

    // 3. Trigger native registration
    await PushNotifications.register();
  } catch (error) {
    console.error('[Push] Failed to initialize push notifications:', error);
  }
};
