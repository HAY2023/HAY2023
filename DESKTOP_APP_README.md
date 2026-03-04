# تحويل صندوق فتوى إلى تطبيق Windows

## المتطلبات
- Node.js (الإصدار 18 أو أحدث)
- Git

## خطوات البناء

### 1. استنساخ المشروع
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. تثبيت Electron و electron-builder
```bash
npm install electron electron-builder --save-dev
```

### 4. إضافة السكريبتات إلى package.json
أضف هذه السكريبتات في قسم "scripts":
```json
{
  "scripts": {
    "electron:dev": "npm run build && electron .",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win"
  }
}
```

وأضف في الجذر:
```json
{
  "main": "electron/main.js"
}
```

### 5. بناء التطبيق
```bash
npm run electron:build:win
```

### 6. العثور على التطبيق
ستجد ملفات التثبيت في مجلد `release/`:
- `صندوق فتوى-X.X.X-x64.exe` - ملف التثبيت
- `صندوق فتوى-Portable-X.X.X.exe` - نسخة محمولة (لا تحتاج تثبيت)

## تشغيل في وضع التطوير
```bash
npm run dev  # في نافذة طرفية
npm run electron:dev  # في نافذة أخرى
```

## ملاحظات
- تأكد من أن لديك أيقونة بصيغة PNG أو ICO في مجلد `public/`
- يمكنك تخصيص إعدادات البناء في ملف `electron-builder.json`
