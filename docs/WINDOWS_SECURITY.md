# Windows Security Configuration Guide
# دليل إعداد الأمان في Windows

## 📋 المراحل الموصى بها

### المرحلة 1: إعداد Manifest File (الاختياري ولكن مفيد)

يساعد الـ Manifest في إخبار Windows عن احتياجات التطبيق من الصلاحيات:

```xml
<!-- create a file: src-tauri/app.manifest -->
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity
    version="1.0.0.0"
    processorArchitecture="*"
    name="صندوق الفتوى مسجد الإيمان"
    type="win32"
  />
  <description>صندوق الفتوى مسجد الإيمان - 150 مسكن</description>

  <!-- متطلبات التطبيق -->
  <dependency>
    <dependentAssembly>
      <assemblyIdentity
        type="win32"
        name="Microsoft.Windows.Common-Controls"
        version="6.0.0.0"
        processorArchitecture="*"
        publicKeyToken="6595b64144ccf1df"
        language="*"
      />
    </dependentAssembly>
  </dependency>

  <!-- طلب صلاحيات المسؤول (فقط عند الضرورة) -->
  <trustInfo xmlns="urn:schemas-microsoft-com:security">
    <security>
      <requestedPrivileges>
        <!-- asInvoker: بدون صلاحيات إضافية -->
        <!-- highestAvailable: طلب أعلى صلاحيات متاحة -->
        <!-- requireAdministrator: إجباري الحصول على صلاحيات المسؤول -->
        <requestedExecutionLevel level="asInvoker" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>

  <!-- معلومات الإصدار -->
  <asmv3:application xmlns:asmv3="urn:schemas-microsoft-com:asm.v3">
    <asmv3:windowsSettings xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">
      <dpiAware>true</dpiAware>
    </asmv3:windowsSettings>
  </asmv3:application>
</assembly>
```

### المرحلة 2: تحديث Tauri Configuration

دعني أساعدك بتحديث `tauri.conf.json`:

#### الخطوة 1: تفعيل NSIS Installer (أفضل للتوزيع)

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist",
    "beforeBuildCommand": "npm run build"
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "nsis": {
      "wix": null,
      "installerIcon": "icons/icon.ico",
      "headerImage": "icons/icon.ico",
      "artifactTemplate": "${productName}_${version}_${platform}.${ext}",
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutLanguages": ["en-United States", "ar"]
    },
    "msi": {
      "certificatePath": null,
      "certificatePassword": null,
      "signingEngineVersion": "latest",
      "dialogImagePath": "icons/icon.ico",
      "headerBitmapPath": "icons/icon-512.png",
      "bannerWxiBitmapPath": "icons/icon.ico"
    }
  }
}
```

### المرحلة 3: توقيع التطبيق (لتقليل تحذيرات SmartScreen)

#### الخيار أ: توقيع ذاتي (للتطوير المحلي)
```powershell
# إنشاء شهادة ذاتية التوقيع
New-SelfSignedCertificate `
  -CertStoreLocation Cert:\CurrentUser\My `
  -Subject "CN=صندوق الفتوى مسجد الإيمان" `
  -Type CodeSigningCert `
  -KeyUsage DigitalSignature `
  -KeyLength 2048 `
  -NotAfter (Get-Date).AddYears(5) `
  -TextExtension "2.5.29.37={text}1.3.6.1.5.5.7.3.3"
```

#### الخيار ب: توقيع باستخدام شهادة رسمية (للإنتاج)
1. اشتري شهادة Code Signing من جهة موثوقة مثل:
   - DigiCert
   - GlobalSign
   - Sectigo
   
2. وقّع الـ EXE:
```powershell
$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object {$_.Subject -eq "CN=صندوق الفتوى مسجد الإيمان"}
Set-AuthenticodeSignature -FilePath "path\to\app.exe" -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -IncludeChain All
```

### المرحلة 4: NSIS Script Configuration

أضفت ملف `tauri.conf.json` بالإعدادات الموصى بها. الآن قم بـ:

```powershell
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc
```

### المرحلة 5: تقليل تحذيرات SmartScreen

#### أفضل الممارسات:
1. **حدّث معلومات التطبيق:**
   - اسم الشركة المشهور
   - وصف واضح
   - أيقونة احترافية (✅ لقد فعلناها)

2. **وثّق التطبيق:**
   - اشرح الغرض من التطبيق
   - قدّم موقع ويب موثوق
   - وفّر سياسة الخصوصية

3. **اجمع feedbacks إيجابية:**
   - كلما زادت التنزيلات الشرعية، قلّ التحذير
   - اطلب من المستخدمين الإبلاغ عن عدم كون الملف ضار

4. **اجتنب الإجراءات المريبة:**
   - تجنب تعديل ملفات Microsoft Defender
   - تجنب إخفاء الملفات بطقوس غريبة
   - كن صريحاً حول احتياجاتك

## 🔐 طلب صلاحيات المسؤول

### متى تطلب صلاحيات المسؤول؟

```typescript
// في tauri.conf.json - fالخيار الموصى به للتطبيقات الدينية:
"requestedExecutionLevel": "asInvoker"
// لا تطلب صلاحيات مسؤول إلا إذا كان ضرورياً جداً
```

#### الحالات التي تتطلب صلاحيات مسؤول:
- ❌ **لا تطلبها** لقراءة الملفات أو الإشعارات (عام)
- ❌ **لا تطلبها** لاتصالات الشبكة
- ✅ **قد تطلبها** إذا أردت تثبيت drivers
- ✅ **قد تطلبها** إذا أردت الوصول لملفات النظام الحساسة

### كيفية طلب صلاحيات عند الضرورة:

```rust
// في src-tauri/src/main.rs
#[cfg(target_os = "windows")]
fn require_admin() {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    
    let args: Vec<String> = std::env::args().collect();
    let is_elevated = runas::Command::new("cmd")
        .args(&["/c", "net session"])
        .status()
        .map(|status| status.success())
        .unwrap_or(false);
    
    if !is_elevated {
        println!("يتطلب صلاحيات المسؤول");
        // إعادة تشغيل الأمر مع صلاحيات
    }
}
```

## 📦 بناء التطبيق

```powershell
# بناء كامل مع كل المميزات
npm run tauri:build

# بناء التطوير
npm run tauri:dev

# بعد البناء ستجد الملفات في:
# .\src-tauri\target\release\
#   - app.exe (النسخة المحمولة)
#   - app_1.0.0_x64_en-US.msi (Windows Installer)
```

## ✅ قائمة الفحص قبل النشر

- [ ] تم إنشاء جميع الأيقونات (32x32, 128x128, 256x256, 512x512)
- [ ] تم تحديث معلومات الشركة في tauri.conf.json
- [ ] تم إضافة وصف تفصيلي للتطبيق
- [ ] تم اختبار التطبيق على نظيف (بدون Visual Studio)
- [ ] لا توجد أخطاء في Console
- [ ] تم اختبار جميع المميزات الأساسية
- [ ] تم التحقق من الصلاحيات المطلوبة
- [ ] تم إعداد ملف Manifest (اختياري)

## 📞 حل المشاكل الشائعة

### مشكلة 1: SmartScreen يحذر من تطبيقي
**الحل:**
1. وقّع التطبيق بشهادة صحيحة
2. اجمع تقييمات إيجابية (أكثر من 200 تنزيل)
3. انتظر عدة أيام

### مشكلة 2: Tauri نسخة قديمة
**الحل:**
```powershell
npm install --save-dev @tauri-apps/cli@latest
npm install --save-dev @tauri-apps/api@latest
cargo install tauri-cli --force
```

### مشكلة 3: Rust toolchain غير موجود
**الحل:**
```powershell
rustup update
rustup target add x86_64-pc-windows-msvc
```

## 🔗 مراجع إضافية

- [Tauri Documentation](https://docs.rs/tauri)
- [Windows Application Manifest Reference](https://docs.microsoft.com/en-us/windows/win32/SbsCs/application-manifests)
- [Code Signing Best Practices](https://learn.microsoft.com/en-us/previous-versions/ff476081(v=msdn.10))
