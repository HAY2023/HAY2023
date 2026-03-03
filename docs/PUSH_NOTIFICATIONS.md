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

### 2. `pushTokenManager` - مدير التوكنز
الملف: `src/lib/pushTokenManager.ts`

### 3. `useEnhancedPushNotifications` - الخدمة المحسّنة
الملف: `src/hooks/useEnhancedPushNotifications.ts`

## 📱 تدفق العمل

```
التطبيق يبدأ → طلب صلاحيات → توليد Token → حفظ محلي → تسجيل مع السيرفر
عند الفشل: حفظ محاولة → انتظار اتصال → إعادة محاولة تلقائية
```

## 🔌 دوال Supabase

- `action: "register"` - تسجيل جهاز
- `action: "set-admin"` - تحديد صلاحيات مسؤول
- `action: "send"` - إرسال إشعار (للمسؤولين فقط)
