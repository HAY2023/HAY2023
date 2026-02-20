# ⚡ أوامر سريعة - Quick Reference

## 🚀 البدء والبناء

```powershell
# البدء المحلي (مع hot reload)
npm run dev
npm run tauri:dev

# بناء الويب فقط
npm run build

# بناء التطبيق الكامل
npm run tauri:build

# معاينة الويب المبني
npm run preview
```

## 🎨 الأيقونات

```powershell
# توليد جميع الأيقونات من الصورة الأصلية
npm run icons:generate

# التحقق من الأيقونات المولدة
npm run icons:verify

# الاثنين معاً
npm run icons:setup
```

## 🔍 الجودة والفحص

```powershell
# فحص الأخطاء و Lint
npm run lint

# إصلاح أخطاء Lint تلقائياً
npm run lint -- --fix
```

## 📱 نظام الإشعارات - Quick Start

```typescript
// في أي component:
import { useEnhancedPushNotifications } from '@/hooks/useEnhancedPushNotifications';

export function MyComponent() {
  const {
    token,
    isOnline,
    errors,
    requestPermissionAndRegister,
    getStats,
  } = useEnhancedPushNotifications();

  const handleEnableNotifications = async () => {
    const success = await requestPermissionAndRegister();
    if (success) {
      console.log('✅ تم تفعيل الإشعارات:', token);
    } else {
      console.error('❌ فشل تفعيل الإشعارات');
    }
  };

  return (
    <>
      <button onClick={handleEnableNotifications}>
        فعّل الإشعارات
      </button>
      {!isOnline && <p>⚠️ لا يتوفر اتصال بالإنترنت</p>}
      {errors.length > 0 && (
        <p>أخطاء: {errors[errors.length - 1].message}</p>
      )}
    </>
  );
}
```

## 🔧 Git Commands

```powershell
# تحديث من GitHub
git pull origin main

# إرسال التغييرات
git push origin main

# عرض الحالة
git status

# عرض السجل
git log --oneline -10

# إنشاء commit
git commit -m "✨ feat: وصف التغيير"

# إنشاء فرع جديد
git checkout -b feature/اسم-الميزة

# حذف فرع
git branch -d اسم-الفرع
```

## 🐛 استكشاف الأخطاء

```powershell
# عرض تفاصيل البناء
npm run tauri:build -- --verbose

# تنظيف وإعادة بناء
Remove-Item -Recurse -Force src-tauri/target
npm run tauri:build

# فحص Rust
cargo check

# تشغيل tests (إن وجدت)
cargo test
```

## 📁 بنية المشروع الأساسية

```
youcef-sandouq-fatwa/
├── src/                          # كود React الرئيسي
│   ├── components/               # مكونات React
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePushNotifications.ts
│   │   └── useEnhancedPushNotifications.ts
│   ├── lib/                      # Utility libraries
│   │   └── pushTokenManager.ts
│   └── pages/                    # صفحات التطبيق
├── src-tauri/                    # كود Tauri/Rust
│   ├── icons/                    # أيقونات التطبيق
│   ├── tauri.conf.json           # إعدادات Tauri
│   ├── app.manifest              # Windows manifest
│   └── src/main.rs               # نقطة الدخول
├── docs/                         # التوثيق الشامل
├── scripts/                      # السكريبتات
├── package.json                  # المتطلبات
├── vite.config.ts                # إعدادات Vite
├── tsconfig.json                 # إعدادات TypeScript
└── README.md                     # معلومات المشروع
```

## 🔑 متغيرات البيئة (.env)

```bash
# نسخ الملف النموذجي
cp .env.example .env

# المتغيرات المطلوبة:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 💾 النسخ الاحتياطية والإصدارات

```powershell
# عرض جميع الإصدارات
git tag -l

# إنشاء إصدار جديد
git tag -a v1.0.27 -m "Release v1.0.27 - تحسينات الأيقونات والإشعارات"

# رفع الإصدار
git push origin v1.0.27

# حذف إصدار محلي
git tag -d v1.0.27

# حذف إصدار بعيد
git push origin --delete v1.0.27
```

## 🧹 تنظيف المشروع

```powershell
# حذف node_modules (حذراً!)
Remove-Item -Recurse -Force node_modules

# حذف Rust build artifacts
Remove-Item -Recurse -Force src-tauri/target

# إعادة تثبيت
npm install && npm run tauri:build
```

## 📊 معلومات مفيدة

```powershell
# حجم المشروع
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum | `
  Select-Object @{Name="SizeGB";Expression={[Math]::Round(($_.Sum / 1GB), 2)}}

# عدد الملفات
(Get-ChildItem -Recurse -File | Measure-Object).Count

# عدد أسطر الكود
Get-ChildItem -Recurse -Include "*.ts","*.tsx","*.rs" | `
  Get-Content | Measure-Object -Line | Select-Object Lines
```

## 🎯 أمثلة واقعية

### مثال 1: إضافة ميزة جديدة

```powershell
# 1. إنشاء فرع
git checkout -b feature/new-feature

# 2. عمل التغييرات
# ... تعديل الملفات ...

# 3. الفحص
npm run lint
npm run build

# 4. الرفع المحلي
git add .
git commit -m "✨ feat: إضافة ميزة جديدة

Details:
- نقطة 1
- نقطة 2"

# 5. رفع للـ GitHub
git push origin feature/new-feature

# 6. دمج مع main (في GitHub)
# إنشاء Pull Request → مراجعة → Merge
```

### مثال 2: إصلاح خطأ

```powershell
git checkout -b bugfix/fix-notification-error

# ... إصلاح الخطأ ...

git commit -m "🐛 fix: إصلاح خطأ الإشعارات

الخطأ: الإشعارات لا تُرسل عند انقطاع الاتصال
الحل: تحسين منطق إعادة المحاولة"

git push origin bugfix/fix-notification-error
```

### مثال 3: بناء نسخة للإنتاج

```powershell
# 1. التأكد من أن كل شيء محدث
git pull origin main

# 2. بناء الإصدار
npm run tauri:build

# 3. الاختبار
# جرّب التطبيق من: ./src-tauri/target/release/

# 4. إنشاء إصدار
git tag -a v1.0.27 -m "Release v1.0.27"
git push origin v1.0.27

# 5. الإعلان عن النسخة
# ... إنشاء Release على GitHub ...
```

## 📞 استكشاف المشاكل الشائعة

| المشكلة | الحل |
|---------|------|
| `cargo not found` | `rustup update && rustup target add x86_64-pc-windows-msvc` |
| `node_modules تالفة` | `Remove-Item -Recurse node_modules && npm install` |
| أخطاء في الأيقونات | `npm run icons:setup` |
| خطأ في الرفع | `git pull origin main` ثم `git push` |
| Tauri لم يبني | `cargo clean && npm run tauri:build` |

---

**آخر تحديث:** 20 فبراير 2025
**الإصدار:** 1.0.26+
