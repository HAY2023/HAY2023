import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    const checkSupport = async () => {
      if (Capacitor.isNativePlatform()) {
        setIsSupported(true);
        // Check current permission status
        try {
          const status = await PushNotifications.checkPermissions();
          setPermissionStatus(status.receive as 'prompt' | 'granted' | 'denied');
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      }
    };
    checkSupport();
  }, []);

  // Register token with backend
  const registerTokenWithBackend = useCallback(async (pushToken: string, deviceType: string = 'unknown') => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          action: 'register',
          token: pushToken,
          device_type: deviceType
        }
      });
      
      if (error) {
        console.error('Error registering token with backend:', error);
        return false;
      }
      
      console.log('Token registered with backend successfully');
      return true;
    } catch (error) {
      console.error('Error registering token:', error);
      return false;
    }
  }, []);

  // Set admin status for token (requires admin password)
  const setAdminStatus = useCallback(async (adminPassword: string) => {
    if (!token) {
      console.log('No token available to set admin status');
      return false;
    }

    if (!adminPassword) {
      console.error('Admin password required to set admin status');
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          action: 'set-admin',
          token: token,
          admin_password: adminPassword
        }
      });
      
      if (error) {
        console.error('Error setting admin status:', error);
        return false;
      }
      
      console.log('Admin status set successfully');
      return true;
    } catch (error) {
      console.error('Error setting admin status:', error);
      return false;
    }
  }, [token]);

  // Send notification to admins (requires admin password)
  const sendNotificationToAdmins = useCallback(async (notification: NotificationPayload, adminPassword: string) => {
    if (!adminPassword) {
      console.error('Admin password required to send notifications');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          action: 'send',
          notification,
          admin_password: adminPassword
        }
      });
      
      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }
      
      console.log('Notification sent:', data);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, []);

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications not supported on web');
      return false;
    }

    try {
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          setPermissionStatus('denied');
          return false;
        }
        setPermissionStatus('granted');
      } else if (permStatus.receive !== 'granted') {
        setPermissionStatus('denied');
        return false;
      } else {
        setPermissionStatus('granted');
      }

      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (tokenData: Token) => {
        console.log('Push registration success, token:', tokenData.value);
        setToken(tokenData.value);
        setIsRegistered(true);
        
        // Determine device type
        const deviceType = Capacitor.getPlatform();
        
        // Register with backend
        await registerTokenWithBackend(tokenData.value, deviceType);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
        setIsRegistered(false);
      });

      // Listen for incoming notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        // Play sound or vibrate
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      });

      // Listen for notification action
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
        console.log('Push notification action performed:', notification);
        // Handle navigation based on notification data
        const data = notification.notification?.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      });

      return true;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  // Unregister from push notifications
  const unregister = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await PushNotifications.removeAllListeners();
      setToken(null);
      setIsRegistered(false);
    } catch (error) {
      console.error('Error unregistering:', error);
    }
  };

  return {
    token,
    isSupported,
    isRegistered,
    permissionStatus,
    requestPermission,
    unregister,
    setAdminStatus,
    sendNotificationToAdmins,
  };
}
