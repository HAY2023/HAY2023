-- إصلاح pgcrypto وكلمة المرور
-- تفعيل pgcrypto في extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- إعادة تعيين كلمة المرور مع hash صحيح
UPDATE public.admin_credentials 
SET password_hash = extensions.crypt('you2025', extensions.gen_salt('bf')),
    updated_at = now();

-- تحديث دالة التحقق من كلمة المرور
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.admin_credentials LIMIT 1;
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN extensions.crypt(input_password, stored_hash) = stored_hash;
END;
$$;

-- تحديث دالة تغيير كلمة المرور
CREATE OR REPLACE FUNCTION public.update_admin_password(p_old_password TEXT, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_old_password) THEN
    RETURN false;
  END IF;
  
  UPDATE public.admin_credentials SET
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    updated_at = now();
  
  RETURN true;
END;
$$;

-- تحديث دالة الإعدادات لدعم show_question_count
CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password TEXT,
  p_is_box_open BOOLEAN DEFAULT NULL,
  p_next_session_date TIMESTAMPTZ DEFAULT NULL,
  p_video_url TEXT DEFAULT NULL,
  p_video_title TEXT DEFAULT NULL,
  p_show_countdown BOOLEAN DEFAULT NULL,
  p_show_question_count BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  UPDATE public.settings SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = COALESCE(p_next_session_date, next_session_date),
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    show_question_count = COALESCE(p_show_question_count, show_question_count),
    updated_at = now()
  WHERE id = (SELECT id FROM public.settings LIMIT 1);
  
  RETURN true;
END;
$$;

-- إضافة حجم الخط لجدول الرسائل الفلاش
ALTER TABLE public.flash_messages ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'md';

-- إنشاء جدول إعدادات الإشعارات
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notify_on_question BOOLEAN DEFAULT true,
  notify_every_n_questions INTEGER DEFAULT 10,
  admin_fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل RLS على جدول الإشعارات
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة العامة
CREATE POLICY "Anyone can read notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (true);

-- إضافة عداد الأسئلة لتتبع الإشعارات
ALTER TABLE public.notification_settings ADD COLUMN IF NOT EXISTS questions_since_last_notification INTEGER DEFAULT 0;

-- دالة لتحديث إعدادات الإشعارات
CREATE OR REPLACE FUNCTION public.update_notification_settings_authenticated(
  p_password TEXT,
  p_notify_on_question BOOLEAN DEFAULT NULL,
  p_notify_every_n_questions INTEGER DEFAULT NULL,
  p_admin_fcm_token TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  -- إدخال أو تحديث
  INSERT INTO public.notification_settings (notify_on_question, notify_every_n_questions, admin_fcm_token)
  VALUES (
    COALESCE(p_notify_on_question, true),
    COALESCE(p_notify_every_n_questions, 10),
    p_admin_fcm_token
  )
  ON CONFLICT (id) DO UPDATE SET
    notify_on_question = COALESCE(p_notify_on_question, notification_settings.notify_on_question),
    notify_every_n_questions = COALESCE(p_notify_every_n_questions, notification_settings.notify_every_n_questions),
    admin_fcm_token = COALESCE(p_admin_fcm_token, notification_settings.admin_fcm_token),
    updated_at = now();
  
  RETURN true;
END;
$$;

-- إضافة حجم خط للرسائل الفلاش في الدالة
CREATE OR REPLACE FUNCTION public.add_flash_message_authenticated(
  p_password TEXT,
  p_message TEXT,
  p_text_direction TEXT DEFAULT 'rtl',
  p_color TEXT DEFAULT '#3b82f6',
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_font_size TEXT DEFAULT 'md'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.flash_messages (message, text_direction, color, start_date, end_date, font_size)
  VALUES (p_message, p_text_direction, p_color, p_start_date, p_end_date, p_font_size)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;