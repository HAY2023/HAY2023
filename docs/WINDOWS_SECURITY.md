# Windows Security Configuration Guide
# دليل إعداد الأمان في Windows

## 📋 المراحل

### 1. Manifest File
ملف `src-tauri/app.manifest` يحدد:
- عدم طلب صلاحيات مسؤول (asInvoker)
- دعم Windows 10 و 11
- DPI awareness للشاشات الحديثة

### 2. Tauri Configuration
ملف `src-tauri/tauri.conf.json` يدعم:
- NSIS Installer
- لغات عربية وإنجليزية
- أيقونات متعددة الأحجام

### 3. توقيع التطبيق (لتقليل تحذيرات SmartScreen)

```powershell
# توقيع ذاتي (للتطوير)
New-SelfSignedCertificate -CertStoreLocation Cert:\CurrentUser\My -Subject "CN=صندوق الفتوى مسجد الإيمان" -Type CodeSigningCert
```

### 4. بناء التطبيق

```powershell
npm run tauri:build
```

## ✅ قائمة الفحص
- [x] أيقونات لجميع الأحجام
- [x] manifest file
- [x] عدم طلب صلاحيات مسؤول
- [ ] توقيع بشهادة رسمية (اختياري)
