import { supabase } from './supabase';

export const triggerNotification = async (
  action: 'onboarding_approved' | 'payout_settled',
  payload: any
) => {
  try {
    const { data, error } = await supabase.functions.invoke('notify', {
      body: { action, payload },
    });

    if (error) {
      console.error('Error invoking notify function:', error);
      return false;
    }

    return data?.success || false;
  } catch (err) {
    console.error('Failed to trigger notification:', err);
    return false;
  }
};
