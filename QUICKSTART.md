# Quick Start Guide - صندوق الفتوى Desktop

## تثبيت التبعيات

```bash
cd "H:\sandouq-fatwa-main\sandouq-fatwa-main"
npm install
```

## تطوير تطبيق الويب

```bash
npm run dev
```

يفتح على: `http://localhost:5173`

## تطوير تطبيق سطح المكتب (Electron)

```bash
npm run dev:electron
```

**ماذا يحدث:**
1. تشغيل خادم Vite على المنفذ 5173
2. فتح نافذة Electron تحميل التطبيق من الخادم
3. Hot reload تلقائي عند التغييرات
4. إمكانية الوصول لـ DevTools من التطبيق

## بناء التطبيق النهائي

### بناء الويب فقط:
```bash
npm run build
```

### بناء تطبيق سطح المكتب (يعمل على Windows/macOS/Linux):
```bash
npm run build:electron
```

**المخرجات:**
- **dist/** - ملفات الويب المبنية
- **release/** - ملفات التثبيت (Windows: .exe & .msi)
  - صيغ Windows: NSIS Installer + Portable
  - صيغ macOS: DMG + ZIP
  - صيغ Linux: AppImage + DEB

## المشاكل المشهورة والحل

| المشكلة | الحل |
|-------|------|
| `Electron is not defined` | استخدم `npm run dev:electron` بدلاً من `npm run dev` |
| `Cannot find module` | قم بـ `npm install` للتثبيت |
| `Port 5173 is in use` | غير المنفذ في `vite.config.ts` أو أغلق العملية |
| `Build failed` | حذف `dist/` وأعد المحاولة |

## الملفات المهمة

- **electron/main.js** - عملية الخادم الرئيسية للـ Electron
- **electron/preload.js** - سكريبت الـ preload (الأمان)
- **vite.config.ts** - إعدادات البناء
- **package.json** - التبعيات والإعدادات

## نصائح التطوير

✅ استخدم DevTools أثناء التطوير (`Ctrl+Shift+I`)
✅ إعادة تشغيل التطبيق بـ `Ctrl+R` 
✅ تحقق من الـ console عند الأخطاء
✅ استخدم `.env` لمتغيرات البيئة

## دعم متقدم

للمزيد من المعلومات، اطلع على:
- [ELECTRON_SETUP.md](ELECTRON_SETUP.md) - دليل كامل
- [Electron API](https://www.electronjs.org/docs/api)
- [Vite Documentation](https://vitejs.dev/)
