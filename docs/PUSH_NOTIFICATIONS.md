# نظام الإشعارات - Push Notifications System

## 📋 نظرة عامة

هذا المشروع يتضمن نظام إشعارات شامل يدعم:

- ✅ تسجيل Push Tokens تلقائياً
- ✅ مزامنة Tokens مع السيرفر
- ✅ معالجة الأخطاء المتقدمة
- ✅ إعادة محاولة التسجيل عند عودة الاتصال
- ✅ تخزين الـ Tokens محلياً
- ✅ دعم أجهزة Android و iOS

## 🔧 المكونات الرئيسية

### 1. `usePushNotifications` - الخدمة الأساسية
الملف: `src/hooks/usePushNotifications.ts`

**المسؤوليات:**
- طلب صلاحيات الإشعارات
- تسجيل جهاز مع Capacitor
- الاستماع للإشعارات الواردة
- إرسال الإشعارات (للمسؤولين فقط)

**الاستخدام:**
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

const {
  token,
  isSupported,
  requestPermission,
  sendNotificationToAdmins
} = usePushNotifications();
```

### 2. `pushTokenManager` - مدير التوكنز
الملف: `src/lib/pushTokenManager.ts`

**المسؤوليات:**
- حفظ التوكنز محلياً
- تسجيل التوكنز مع السيرفر
- إعادة محاولة التسجيل عند فشل الاتصال
- إدارة محاولات إعادة التسجيل

**الدوال:**
```typescript
// حفظ التوكن محلياً
savePushTokenLocally(token, deviceType);

// تسجيل مع السيرفر
registerPushTokenWithServer(token, deviceType);

// إعادة محاولة التسجيل الفاشل
retryFailedTokenRegistration();

// ضبط مراقبة الاتصال
setupNetworkRetry();

// الحصول على الإحصائيات
getTokenStats();
```

### 3. `useEnhancedPushNotifications` - الخدمة المحسّنة
الملف: `src/hooks/useEnhancedPushNotifications.ts`

**المميزات:**
- معالجة أخطاء متقدمة
- مراقبة الاتصال بالإنترنت
- تخزين مؤقت للأخطاء
- أحداث مخصصة

**الاستخدام:**
```typescript
import { useEnhancedPushNotifications } from '@/hooks/useEnhancedPushNotifications';

const {
  token,
  isOnline,
  errors,
  requestPermissionAndRegister,
  getStats,
  clearErrors
} = useEnhancedPushNotifications();
```

## 📱 تدفق العمل (Flow)

### 1. التشغيل الأول (First Launch)

```
التطبيق يبدأ
    ↓
طلب صلاحيات الإشعارات
    ↓
توليد Push Token من النظام
    ↓
حفظ Token محلياً
    ↓
تسجيل Token مع السيرفر
    ↓
نجاح ✅ أو فشل مع إعادة محاولة
```

### 2. عند انقطاع الاتصال

```
فشل التسجيق
    ↓
حفظ محاولة إعادة المحاولة
    ↓
الانتظار لعودة الاتصال
    ↓
عند عودة الاتصال → إعادة المحاولة
```

## 🔌 دوال Supabase

### `send-notification` Function

**الإجراءات المدعومة:**

#### 1. تسجيل جهاز
```json
{
  "action": "register",
  "token": "push-token-value",
  "device_type": "android|ios|web",
  "timestamp": "2024-02-20T10:30:00Z"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "registered": true,
  "message": "Device registered successfully"
}
```

#### 2. تحديد صلاحيات مسؤول
```json
{
  "action": "set-admin",
  "token": "push-token-value",
  "admin_password": "secure-password"
}
```

#### 3. إرسال إشعار (للمسؤولين فقط)
```json
{
  "action": "send",
  "notification": {
    "title": "عنوان الإشعار",
    "body": "محتوى الإشعار",
    "data": {
      "route": "/path/to/navigate",
      "id": "123"
    }
  },
  "admin_password": "secure-password"
}
```

## 📊 مراقبة النظام

### الحصول على حالة الإشعارات
```typescript
const stats = getStats();
// {
//   isStored: true,
//   isRegistered: true,
//   age: 86400000,
//   retriesAttempted: 0,
//   isOnline: true,
//   errorCount: 0,
//   lastError: null
// }
```

### التعامل مع الأخطاء
```typescript
const { errors, clearErrors } = useEnhancedPushNotifications();

if (errors.length > 0) {
  console.error('Recent errors:', errors);
  // عرض رسالة للمستخدم
  clearErrors();
}
```

## 🔐 الأمان

### نقاط أمان مهمة:

1. **كلمة مرور المسؤول:**
   - مطلوبة لتحديد صلاحيات مسؤول
   - مطلوبة لإرسال الإشعارات
   - لا تُخزن في الـ Token

2. **تخزين التوكن:**
   - يُخزن في `localStorage` (محمي بـ HTTPS)
   - يشمل timestamp للتحقق من الصلاحية

3. **اتصال السيرفر:**
   - جميع الطلبات عبر HTTPS
   - يتم التحقق من الهوية على السيرفر

## 🧪 الاختبار

### 1. اختبار التسجيل الأول
```typescript
// في console التطبيق
const hook = useEnhancedPushNotifications();
await hook.requestPermissionAndRegister();
console.log(hook.token); // يجب أن تظهر قيمة التوكن
```

### 2. اختبار إعادة المحاولة
```typescript
// قطع الاتصال
// console: 📴 انقطع الاتصال بالإنترنت

// استعادة الاتصال
// console: 📡 تم استعادة الاتصال بالإنترنت
//         🔄 محاولة إعادة التسجيل (#1)...
```

### 3. اختبار الأخطاء
```typescript
const stats = getStats();
console.log(stats.errorCount); // عدد الأخطاء
console.log(stats.lastError); // آخر خطأ
```

## 📝 الترجمة والرسائل

تم ترجمة جميع الرسائل إلى اللغة العربية، والملفات تدعم i18n:

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const errorMessage = t('notifications.registrationFailed');
```

## 🚀 التطوير المستقبلي

- [ ] دعم Web Push Notifications
- [ ] مزايا التصفية (تصفية الإشعارات حسب الفئة)
- [ ] إمكانية الجدولة (جدولة الإشعارات)
- [ ] تقارير التسليم (معرفة من استقبل الإشعار)
- [ ] دعم الوسائط الغنية (صور، فيديوهات)

## 📞 الدعم والمساعدة

للأسئلة والمشاكل:
1. راجع سجل الأخطاء: `getStats().lastError`
2. تفعيل debug mode: `localStorage.setItem('debug', 'true')`
3. تحقق من الاتصال: `navigator.onLine`
