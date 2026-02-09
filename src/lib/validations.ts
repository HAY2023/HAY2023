import { z } from 'zod';

// التحقق من السؤال
export const questionSchema = z.object({
  category: z.string().min(1, 'يجب اختيار الفئة'),
  question_text: z.string()
    .min(10, 'السؤال قصير جداً - يجب أن يكون 10 أحرف على الأقل')
    .max(2000, 'السؤال طويل جداً - الحد الأقصى 2000 حرف'),
  customCategory: z.string().max(50, 'اسم الفئة طويل جداً').optional(),
});

// التحقق من الإعلان
export const announcementSchema = z.object({
  message: z.string()
    .min(1, 'الرسالة مطلوبة')
    .max(500, 'الرسالة طويلة جداً - الحد الأقصى 500 حرف'),
  type: z.enum(['info', 'warning', 'success', 'error']),
});

// التحقق من رسالة الفلاش
export const flashMessageSchema = z.object({
  message: z.string()
    .min(1, 'الرسالة مطلوبة')
    .max(300, 'الرسالة طويلة جداً - الحد الأقصى 300 حرف'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صالح - استخدم صيغة HEX مثل #3b82f6'),
});

// التحقق من كلمة المرور
export const passwordSchema = z.string()
  .min(4, 'كلمة المرور قصيرة جداً')
  .max(100, 'كلمة المرور طويلة جداً');

// التحقق من رابط الفيديو
export const videoSchema = z.object({
  title: z.string()
    .min(1, 'عنوان الفيديو مطلوب')
    .max(200, 'العنوان طويل جداً'),
  url: z.string()
    .url('رابط غير صالح')
    .refine(
      (url) => url.includes('youtube.com') || url.includes('youtu.be'),
      'يجب أن يكون رابط YouTube'
    ),
});

// التحقق من المراجعة اللغوية
export const reviewSchema = z.object({
  reviewed_text: z.string().max(2000, 'النص المراجع طويل جداً').optional(),
  reviewer_notes: z.string().max(500, 'الملاحظات طويلة جداً').optional(),
  review_status: z.enum(['pending', 'reviewed', 'approved', 'rejected']),
});

// دالة مساعدة للتحقق مع عرض الخطأ
export function validateWithToast<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  onError: (message: string) => void
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    onError(firstError.message);
    return null;
  }
  return result.data;
}
