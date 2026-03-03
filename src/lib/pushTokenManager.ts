/**
 * Push Token Manager - إدارة Push Tokens
 * يقوم بتخزين وإدارة Push Tokens وكذلك إعادة محاولة الإرسال عند انقطاع الاتصال
 */

import { supabase } from '@/integrations/supabase/client';

const TOKEN_STORAGE_KEY = 'push_token';
const TOKEN_TIMESTAMP_KEY = 'push_token_timestamp';
const TOKEN_RETRY_KEY = 'push_token_retry';

interface StoredToken {
    value: string;
    timestamp: number;
    deviceType: string;
    registered: boolean;
}

/**
 * حفظ Push Token محلياً
 */
export async function savePushTokenLocally(token: string, deviceType: string = 'unknown'): Promise<void> {
    const storedToken: StoredToken = {
        value: token,
        timestamp: Date.now(),
        deviceType,
        registered: false,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(storedToken));
    console.log(`✅ تم حفظ Push Token محلياً (${deviceType})`);
}

/**
 * استرجاع Push Token المحفوظ
 */
export function getPushTokenLocally(): StoredToken | null {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;
    return JSON.parse(token) as StoredToken;
}

/**
 * حذف Push Token من التخزين
 */
export function removePushTokenLocally(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(TOKEN_RETRY_KEY);
    console.log('✅ تم حذف Push Token من التخزين المحلي');
}

/**
 * تسجيل Push Token مع السيرفر
 * مع إعادة محاولة في حالة فشل الاتصال
 */
export async function registerPushTokenWithServer(
    token: string,
    deviceType: string = 'unknown'
): Promise<boolean> {
    try {
        console.log('🔄 جاري تسجيل Push Token مع السيرفر...');

        const { data, error } = await supabase.functions.invoke(
            'send-notification',
            {
                body: {
                    action: 'register',
                    token: token,
                    device_type: deviceType,
                    timestamp: new Date().toISOString(),
                },
            }
        );

        if (error) {
            console.error('❌ خطأ في تسجيل Push Token:', error);
            // حفظ محاولة إعادة المحاولة
            saveRetryAttempt(token, deviceType);
            return false;
        }

        console.log('✅ تم تسجيل Push Token مع السيرفر بنجاح');

        // حفظ التوكن محلياً كمسجل
        const storedToken = getPushTokenLocally();
        if (storedToken) {
            storedToken.registered = true;
            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(storedToken));
        }

        return true;
    } catch (error) {
        console.error('💥 خطأ غير متوقع:', error);
        saveRetryAttempt(token, deviceType);
        return false;
    }
}

/**
 * حفظ محاولة إعادة تسجيل الـ Token
 */
function saveRetryAttempt(token: string, deviceType: string): void {
    const retryData = {
        token,
        deviceType,
        attempts: 0,
        lastAttempt: Date.now(),
    };

    const existing = localStorage.getItem(TOKEN_RETRY_KEY);
    if (existing) {
        const data = JSON.parse(existing);
        data.attempts++;
        data.lastAttempt = Date.now();
        localStorage.setItem(TOKEN_RETRY_KEY, JSON.stringify(data));
    } else {
        localStorage.setItem(TOKEN_RETRY_KEY, JSON.stringify(retryData));
    }

    console.log('💾 تم حفظ محاولة إعادة التسجيل');
}

/**
 * إعادة محاولة تسجيل الـ Token الفاشل
 * يتم استدعاؤها عند استعادة الاتصال بالإنترنت
 */
export async function retryFailedTokenRegistration(): Promise<boolean> {
    const retryData = localStorage.getItem(TOKEN_RETRY_KEY);
    if (!retryData) {
        return true; // لا توجد محاولات فاشلة
    }

    try {
        const { token, deviceType, attempts } = JSON.parse(retryData);

        if (attempts > 5) {
            console.warn('⚠️ تم الوصول للعدد الأقصى من محاولات إعادة التسجيل');
            localStorage.removeItem(TOKEN_RETRY_KEY);
            return false;
        }

        console.log(`🔄 محاولة إعادة التسجيل (#${attempts + 1})...`);
        const success = await registerPushTokenWithServer(token, deviceType);

        if (success) {
            localStorage.removeItem(TOKEN_RETRY_KEY);
            console.log('✅ تم تسجيل الـ Token بنجاح بعد فشل سابق');
        }

        return success;
    } catch (error) {
        console.error('❌ خطأ في إعادة المحاولة:', error);
        return false;
    }
}

/**
 * التحقق من حالة الاتصال وإعادة محاولة التسجيل عند الاتصال
 */
export function setupNetworkRetry(): () => void {
    const handleOnline = async () => {
        console.log('📡 تم استعادة الاتصال بالإنترنت');
        await retryFailedTokenRegistration();
    };

    const handleOffline = () => {
        console.log('📴 انقطع الاتصال بالإنترنت');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // تنظيف المستمعين
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}

/**
 * الحصول على إحصائيات الـ Token
 */
export function getTokenStats(): {
    isStored: boolean;
    isRegistered: boolean;
    age: number;
    retriesAttempted: number;
} {
    const token = getPushTokenLocally();
    const retry = localStorage.getItem(TOKEN_RETRY_KEY);

    return {
        isStored: token !== null,
        isRegistered: token?.registered ?? false,
        age: token ? Date.now() - token.timestamp : 0,
        retriesAttempted: retry ? JSON.parse(retry).attempts : 0,
    };
}
