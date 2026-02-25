import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Helper to send a native notification across platforms (Tauri / Capacitor / Browser)
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
            sendNotification({ title, body });
            return;
        }
    } catch {
        // Tauri not available, try next
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
        // Capacitor not available, try browser
    }

    // 3. Fallback to Browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-mosque.png' });
    } else if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
            new Notification(title, { body, icon: '/icon-mosque.png' });
        }
    }
}

export const useRealtimeNotifications = () => {
    const { toast } = useToast();

    useEffect(() => {
        const channel = supabase
            .channel('public-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification_history',
                },
                async (payload) => {
                    const newNotif = payload.new as { title: string; body: string };

                    // 1. Show toast in app
                    toast({
                        title: newNotif.title,
                        description: newNotif.body,
                    });

                    // 2. Send native/browser notification
                    await sendCrossPlatformNotification(newNotif.title, newNotif.body);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [toast]);
};
