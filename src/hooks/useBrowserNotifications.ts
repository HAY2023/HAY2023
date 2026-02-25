import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper to send a cross-platform notification (Tauri / Capacitor / Browser)
 */
async function sendCrossPlatformNotification(title: string, body: string) {
  // 1. Try Tauri native notification (desktop)
  try {
    const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
    let permission = await isPermissionGranted();
    if (!permission) {
      const res = await requestPermission();
      permission = res === 'granted';
    }
    if (permission) {
      sendNotification({ title, body, icon: 'icon-mosque' });
      return;
    }
  } catch {
    // Tauri not available
  }

  // 2. Try Capacitor local notification
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          smallIcon: 'ic_stat_icon',
        }]
      });
      return;
    }
  } catch {
    // Capacitor not available
  }

  // 3. Fallback to Browser Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-mosque.png', tag: 'box-status' });
  }
}

/**
 * Initialize notification permissions across platforms
 */
async function initNotificationPermissions() {
  // Try Tauri
  try {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
    let permission = await isPermissionGranted();
    if (!permission) {
      await requestPermission();
    }
    return;
  } catch {
    // Not Tauri
  }

  // Try Capacitor
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();
      return;
    }
  } catch {
    // Not Capacitor
  }

  // Browser
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

/**
 * Hook for handling box open/close notifications.
 * Works across Tauri (desktop), Capacitor (mobile), and Browser (web).
 */
export const useBrowserNotifications = () => {
  const previousBoxState = useRef<boolean | null>(null);

  useEffect(() => {
    // Initialize permissions
    initNotificationPermissions();

    // Listen to settings changes for box status
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'settings',
        },
        (payload) => {
          const newState = payload.new as { is_box_open: boolean };

          if (previousBoxState.current !== null && previousBoxState.current !== newState.is_box_open) {
            const title = newState.is_box_open ? '📬 تم فتح صندوق الأسئلة!' : '📪 تم إغلاق صندوق الأسئلة';
            const body = newState.is_box_open
              ? 'يمكنك الآن إرسال سؤالك الشرعي'
              : 'سيتم الإعلان عن موعد الفتح القادم';

            sendCrossPlatformNotification(title, body);
          }

          previousBoxState.current = newState.is_box_open;
        }
      )
      .subscribe();

    // Fetch initial state
    const fetchInitialState = async () => {
      const { data } = await supabase
        .from('settings')
        .select('is_box_open')
        .single();

      if (data) {
        previousBoxState.current = data.is_box_open;
      }
    };

    fetchInitialState();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { initNotificationPermissions };
};
