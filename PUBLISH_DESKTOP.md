خطوات رفع تطبيق سطح المكتب (Windows) إلى Microsoft Store (الملخّص)

مخطط العمل السريع:
1. اختر مسار التعبئة: **Tauri** (خفيف وآمن) أو **Electron** (شائع).
2. جهّز البيئة: Rust + Cargo (لتاوري) أو Node + electron-builder (لإلكترون).
3. أنشئ حزمة MSIX/APPX موقّعة، ثم افتح حساب على Microsoft Partner Center وحدّد التطبيق.
4. ارفع الحزمة إلى Partner Center وملأ معلومات النشر.

تفاصيل وملاحظات مهمة:

A. التحضيرات (Tauri - موصى به):
- ثبت Rust: https://www.rust-lang.org/tools/install
- ثبت `tauri-cli`: `cargo install tauri-cli` أو `npm i -D @tauri-apps/cli`
- تأكد من وجود `src-tauri/tauri.conf.json` (تم إعداده في المشروع)
- شغّل التطوير: `npm run tauri:dev` (يحتاج الإنترنت وRust)
- بناء للنشر: `npm run tauri:build` → ينتج MSIX/EXE/DMG حسب المنصة

B. التحضيرات (Electron):
- ثبت dependencies: `npm install --save-dev electron electron-builder`
- أضف إعداد `build` في `package.json` (electron-builder)
- `npm run build` ثم `electron-builder --win nsis` لإنتاج مثبت Windows
- لتحويل لملف مخصّص للـ Microsoft Store تحتاج MSIX والتوقيع

C. توقيع الحزمة وصلاحيات المتجر:
- تحتاج شهادة توقيع (Code Signing Certificate) أو استخدام Microsoft Store signing
- افتح حساب على Partner Center: https://partner.microsoft.com
- أنشئ تطبيق جديد، اختر حزمة MSIX ورفعها

D. ما يمكنني فعله الآن (بدون تنزيل أدوات على جهازك):
- جهّز ملفات التكوين (`src-tauri/tauri.conf.json`) — أنجزتها الآن.
- أضيف سكريبتات `tauri:dev` و `tauri:build` في `package.json` — أنجزتها.
- أقدّم لك سجل أوامر مفصّل لتشغيل البناء على جهازك أو على CI (GitHub Actions)

E. خطوات مقترحة للمتابعة (أقترح تنفيذها على جهازك أو على CI):
1. ثبت Rust و tauri-cli (مستخدمًا الإنترنت).
2. تشغيل: `npm install` ثم `npm run tauri:build`.
3. سجل الدخول إلى Partner Center ورفع الحزمة المتولدة.

إذا تريد، أعدّ ملف GitHub Actions لبناء الحزمة تلقائياً ورفعها إلى GH Releases أو إلى مكان آمن، ثم ترفعها يدوياً إلى المتجر.

هل تريد أن أجهّز ملف CI (GitHub Actions) لبناء إصدار Windows تلقائياً عند إنشاء `tag`؟
