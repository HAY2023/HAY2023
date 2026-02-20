/**
 * Enhanced Push Notifications Hook
 * نسخة محسّنة من usePushNotifications مع معالجة أفضل للأخطاء والاتصال
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import {
  savePushTokenLocally,
  registerPushTokenWithServer,
  getPushTokenLocally,
  setupNetworkRetry,
  getTokenStats,
} from '@/lib/pushTokenManager';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationError {
  code: string;
  message: string;
  timestamp: Date;
}

export function useEnhancedPushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>(
    'prompt'
  );
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [errors, setErrors] = useState<NotificationError[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const networkRetryCleanup = useRef<(() => void) | null>(null);

  // التحقق من دعم الإشعارات
  useEffect(() => {
    const checkSupport = async () => {
      if (Capacitor.isNativePlatform()) {
        setIsSupported(true);
        try {
          const status = await PushNotifications.checkPermissions();
          setPermissionStatus(status.receive as 'prompt' | 'granted' | 'denied');

          // التحقق من وجود توكن محفوظ
          const savedToken = getPushTokenLocally();
          if (savedToken?.value) {
            setToken(savedToken.value);
            setIsRegistered(savedToken.registered);
          }
        } catch (error) {
          addError('INIT_ERROR', 'فشل في التحقق من صلاحيات الإشعارات');
          console.error('Error checking permissions:', error);
        }
      }
      setIsInitializing(false);
    };

    checkSupport();
  }, []);

  // مراقبة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 تم استعادة الاتصال بالإنترنت');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 انقطع الاتصال بالإنترنت');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ضبط إعادة محاولة الاتصال
    if (networkRetryCleanup.current) {
      networkRetryCleanup.current();
    }
    networkRetryCleanup.current = setupNetworkRetry();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (networkRetryCleanup.current) {
        networkRetryCleanup.current();
      }
    };
  }, []);

  // إضافة خطأ إلى السجل
  const addError = useCallback((code: string, message: string) => {
    setErrors((prev) => [
      ...prev.slice(-9), // احتفظ بآخر 10 أخطاء فقط
      { code, message, timestamp: new Date() },
    ]);
  }, []);

  // طلب الإذن والتسجيل
  const requestPermissionAndRegister = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      addError('NOT_MOBILE', 'الإشعارات غير مدعومة على الويب');
      console.log('Push notifications not supported on web');
      return false;
    }

    try {
      const permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          setPermissionStatus('denied');
          addError('PERMISSION_DENIED', 'تم رفض صلاحيات الإشعارات');
          return false;
        }
        setPermissionStatus('granted');
      } else if (permStatus.receive !== 'granted') {
        setPermissionStatus('denied');
        addError('PERMISSION_DENIED', 'الإشعارات غير مفعلة');
        return false;
      } else {
        setPermissionStatus('granted');
      }

      await PushNotifications.register();

      // الاستماع لنجاح التسجيل
      PushNotifications.addListener('registration', async (tokenData: Token) => {
        console.log('✅ Push registration success, token:', tokenData.value);
        setToken(tokenData.value);

        // حفظ التوكن محلياً
        const deviceType = Capacitor.getPlatform();
        await savePushTokenLocally(tokenData.value, deviceType);

        // تسجيل مع السيرفر
        const success = await registerPushTokenWithServer(tokenData.value, deviceType);
        setIsRegistered(success);

        if (!success && !isOnline) {
          addError('OFFLINE', 'فشل التسجيل - لا يتوفر اتصال بالإنترنت. سيتم إعادة المحاولة');
        }
      });

      // الاستماع لأخطاء التسجيل
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('❌ Push registration error:', error);
        setIsRegistered(false);
        addError('REG_ERROR', `خطأ في التسجيل: ${error.message}`);
      });

      // الاستماع للإشعارات الواردة
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('🔔 Push notification received:', notification);

          // لعب صوت أو اهتزاز
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }

          // إراسل حدث مخصص
          window.dispatchEvent(
            new CustomEvent('pushNotificationReceived', { detail: notification })
          );
        }
      );

      // الاستماع لإجراءات الإشعارات
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
        console.log('✅ Push notification action performed:', notification);

        // معالجة الملاحة بناءً على بيانات الإشعار
        const data = notification.notification?.data;
        if (data?.route) {
          window.location.href = data.route;
        }

        // إرسال حدث مخصص
        window.dispatchEvent(
          new CustomEvent('pushNotificationActionPerformed', { detail: notification })
        );
      });

      return true;
    } catch (error) {
      console.error('💥 Error requesting push permission:', error);
      addError('REQUEST_ERROR', `خطأ غير متوقع: ${(error as Error).message}`);
      return false;
    }
  }, [isOnline, addError]);

  // إلغاء التسجيل
  const unregister = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await PushNotifications.removeAllListeners();
      setToken(null);
      setIsRegistered(false);
      console.log('✅ تم إلغاء تسجيل الإشعارات');
    } catch (error) {
      console.error('❌ Error unregistering:', error);
      addError('UNREGISTER_ERROR', `خطأ في إلغاء التسجيل: ${(error as Error).message}`);
    }
  }, [addError]);

  // الحصول على إحصائيات
  const getStats = useCallback(() => {
    return {
      ...getTokenStats(),
      isOnline,
      errorCount: errors.length,
      lastError: errors[errors.length - 1] || null,
    };
  }, [isOnline, errors]);

  // مسح الأخطاء
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    // الحالة
    token,
    isSupported,
    isRegistered,
    permissionStatus,
    isOnline,
    isInitializing,
    errors,

    // الدوال
    requestPermissionAndRegister,
    unregister,
    getStats,
    clearErrors,
  };
}
