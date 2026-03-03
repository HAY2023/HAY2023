# GitHub Setup Guide
# دليل إعداد المستودع على GitHub

## 📝 الأوامر الأساسية

```powershell
# رفع التغييرات
git add .
git commit -m "✨ feat: وصف الميزة"
git push origin main

# إنشاء فرع جديد
git checkout -b feature/اسم-الميزة

# تحديث من السيرفر
git pull origin main
```

## 🏷️ معايير Commit Messages

- ✨ **feat**: ميزة جديدة
- 🐛 **fix**: إصلاح خطأ
- 📚 **docs**: تحديث التوثيق
- 🎨 **style**: تنسيق الكود
- ♻️ **refactor**: إعادة هيكلة
- ⚡ **perf**: تحسين الأداء

## 📈 إدارة الإصدارات

```powershell
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```
