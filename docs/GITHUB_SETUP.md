# GitHub Setup Guide
# دليل إعداد المستودع على GitHub

## 📝 الخطوات المطلوبة

### الخطوة 1: التحقق من حالة المشروع الحالي

```powershell
cd H:\sandouq-fatwa-main\youcef-sandouq-fatwa
git status
git log --oneline -5
```

### الخطوة 2: إضافة Remote GitHub

#### إذا كان المشروع جديد تماماً:

```powershell
# تهيئة المشروع كمستودع Git (إذا لم يكن بالفعل)
git init

# إضافة جميع الملفات
git add .

# إنشاء أول commit
git commit -m "🚀 Initial commit: Setup Sandouq Fatwa Application

- ✨ React + Tauri application
- 🎨 App icons generated (Android, Windows)
- 📱 Push notifications infrastructure
- 🔐 Windows security configuration
- 📚 Documentation added"

# ربط المستودع البعيد
git remote add origin https://github.com/HAY2023/youcef-sandouq-fatwa.git

# رفع إلى الفرع الرئيسي
git branch -M main
git push -u origin main
```

#### إذا كان المشروع موجود بالفعل:

```powershell
# التحقق من Remote الموجود
git remote -v

# إذا لم يكن موجود، أضفه:
git remote add origin https://github.com/HAY2023/youcef-sandouq-fatwa.git

# تحديث البيانات
git fetch origin
git merge origin/main --allow-unrelated-histories

# رفع التغييرات
git push -u origin main
```

### الخطوة 3: إعداد .gitignore الصحيح

تأكد من أن الملفات الحساسة لا تُرفع:

```
# Dependencies
node_modules/
.npm
.pnpm-debug.log

# Tauri
src-tauri/target/
*.pdb

# Build outputs
dist/

# Environment variables
.env
.env.local
.env.*.local

# IDEs
.vscode/
.idea/
.DS_Store

# Logs
*.log
npm-debug.log*

# OS
Thumbs.db
.DS_Store

# Sensitive data
config/keys/
secrets/
.token
```

## 🔄 سير العمل الموصى به

### 1. عند البدء بميزة جديدة:

```powershell
# تحديث البيانات من السيرفر
git pull origin main

# إنشاء فرع جديد
git checkout -b feature/اسم-الميزة

# العمل والتغيير
# ...

# إضافة التغييرات
git add .

# إنشاء commit
git commit -m "✨ Add: description of feature

Details:
- Bullet point 1
- Bullet point 2"

# رفع الفرع
git push origin feature/اسم-الميزة
```

### 2. عند الانتهاء من ميزة:

```powershell
# اختبار قبل الدمج
npm run lint
npm run build

# العودة إلى main
git checkout main

# تحديث أحدث التغييرات
git pull origin main

# دمج الفرع
git merge feature/اسم-الميزة

# رفع النتيجة
git push origin main

# حذف الفرع المحلي (اختياري)
git branch -d feature/اسم-الميزة
```

## 🏷️ معايير Commit Messages

استخدم هذا الصيغة:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### الأنواع المدعومة:

- ✨ **feat**: ميزة جديدة
- 🐛 **fix**: إصلاح خطأ
- 📚 **docs**: تحديث التوثيق
- 🎨 **style**: تنسيق الكود
- ♻️ **refactor**: إعادة هيكلة الكود
- ⚡ **perf**: تحسين الأداء
- 🧪 **test**: إضافة اختبارات
- 🔧 **chore**: تحديث التبعيات والأدوات
- 🚀 **ci/cd**: تحديث CI/CD

### أمثلة:

```shell
# ميزة جديدة
git commit -m "✨ feat(notifications): Add push token manager

- Implement automatic token registration
- Add retry logic for failed registrations
- Support online/offline status handling"

# إصلاح خطأ
git commit -m "🐛 fix(ui): Fix Arabic text overflow in notifications"

# تحديث التوثيق
git commit -m "📚 docs: Update push notifications guide"
```

## 🔐 الملفات الحساسة

### عدم رفع هذه الملفات أبداً:

- 🔑 مفاتيح API
- 🔐 كلمات المرور
- 📧 بيانات اعتماد البريد
- 💰 مفاتيح الدفع
- 🎫 رموز Supabase الخاصة

### الطريقة الصحيحة:

```powershell
# استخدم ملفات .env.example
cp .env .env.example
# ثم عدّل .env.example بإزالة القيم الحقيقية

# أضف إلى .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

git add .env.example .gitignore
git commit -m "🔐 chore: Add environment template"
```

## 📊 عرض سجل التغييرات

```powershell
# آخر 10 commits
git log --oneline -10

# مع تفاصيل أكثر
git log --pretty=format:"%h - %an, %ar : %s"

# إظهار الإحصائيات
git log --stat

# عرض على شكل رسم بياني
git log --graph --oneline --all
```

## 🔀 دمج الفروع (Merge)

### دمج آمن:

```powershell
# 1. التأكد من أن الفرع محدث
git pull origin feature/branch-name

# 2. الذهاب إلى main
git checkout main

# 3. تحديث main
git pull origin main

# 4. الدمج
git merge feature/branch-name

# إذا كان هناك تضارب الملفات:
# - عدّل الملفات المتضاربة
git add .
git commit -m "🔀 Merge: Resolve conflicts from feature/branch-name"

# 5. الرفع
git push origin main
```

## 📈 إدارة الإصدارات (Versioning)

استخدم Semantic Versioning:
- **MAJOR.MINOR.PATCH** (مثل: 1.0.26)
- **MAJOR**: تغييرات كبيرة غير متوافقة
- **MINOR**: ميزات جديدة متوافقة
- **PATCH**: إصلاحات علل متوافقة

```powershell
# إنشاء tag للإصدار
git tag -a v1.0.26 -m "Release version 1.0.26

Features:
- Push notifications
- Windows security setup
- App icons generation

Improvements:
- Better error handling
- Network retry logic"

# رفع التاج
git push origin v1.0.26

# عرض جميع الإصدارات
git tag -l
```

## ✅ قائمة فحص قبل الرفع

- [ ] تم اختبار جميع التغييرات محلياً
- [ ] لا توجد أخطاء lint أو build
- [ ] تم تحديث التوثيق
- [ ] لم تُرفع أي ملفات حساسة
- [ ] Commit message واضح ومفصل
- [ ] تم سحب آخر التغييرات من main
- [ ] لا توجد نزاعات في الدمج

## 🆘 الأوامر المفيدة

```powershell
# التراجع عن آخر commit (لم يُرفع بعد)
git reset --soft HEAD~1

# التراجع عن تغييرات ملف معين
git checkout -- اسم-الملف

# حذف فرع محلي
git branch -d اسم-الفرع

# حذف فرع بعيد
git push origin --delete اسم-الفرع

# إعادة سمية فرع
git branch -m اسم-قديم اسم-جديد

# البحث في السجل
git log -S "نص للبحث عنه"

# عرض الفرق بين فرعين
git diff main feature/اسم-الميزة
```

## 🎓 مراجع إضافية

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
