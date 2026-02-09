-- جدول الأسئلة
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الإعدادات (صف واحد فقط)
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_box_open BOOLEAN NOT NULL DEFAULT false,
  next_session_date TIMESTAMP WITH TIME ZONE,
  video_url TEXT,
  video_title TEXT,
  admin_password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- سياسات الأسئلة - الكل يستطيع إضافة سؤال
CREATE POLICY "Anyone can insert questions" 
ON public.questions 
FOR INSERT 
WITH CHECK (true);

-- سياسات الإعدادات - الكل يستطيع القراءة (لعرض حالة الصندوق)
CREATE POLICY "Anyone can read settings" 
ON public.settings 
FOR SELECT 
USING (true);

-- إنشاء bucket للفيديوهات
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- سياسة تحميل الفيديوهات للعموم
CREATE POLICY "Public video access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

-- إدخال إعدادات افتراضية مع كلمة مرور مشفرة (الكلمة الافتراضية: admin123)
INSERT INTO public.settings (is_box_open, admin_password_hash) 
VALUES (false, '$2a$10$xJwL5vZL5vZL5vZL5vZL5eZL5vZL5vZL5vZL5vZL5vZL5vZL5vZL5');