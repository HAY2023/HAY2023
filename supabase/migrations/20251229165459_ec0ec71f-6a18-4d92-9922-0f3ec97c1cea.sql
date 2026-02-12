-- جدول تسجيل دخول لوحة التحكم
CREATE TABLE public.admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_size TEXT,
  is_authorized BOOLEAN DEFAULT false,
  password_attempted BOOLEAN DEFAULT false
);

-- تفعيل RLS
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- سياسة: لا يمكن لأحد قراءة السجلات عبر العميل
CREATE POLICY "No public access to admin logs"
ON public.admin_access_logs
FOR ALL
USING (false);

-- إضافة أعمدة المراجعة اللغوية لجدول الأسئلة
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_text TEXT,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- دالة لتسجيل الدخول (تُستخدم من Edge Function)
CREATE OR REPLACE FUNCTION public.log_admin_access(
  p_ip_address TEXT,
  p_country TEXT,
  p_city TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_screen_size TEXT,
  p_is_authorized BOOLEAN,
  p_password_attempted BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.admin_access_logs (
    ip_address, country, city, device_type, browser, os, screen_size, is_authorized, password_attempted
  ) VALUES (
    p_ip_address, p_country, p_city, p_device_type, p_browser, p_os, p_screen_size, p_is_authorized, p_password_attempted
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- دالة لجلب سجلات الدخول (للمسؤول فقط)
CREATE OR REPLACE FUNCTION public.get_admin_access_logs_authenticated(p_password TEXT)
RETURNS TABLE(
  id UUID,
  accessed_at TIMESTAMPTZ,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_size TEXT,
  is_authorized BOOLEAN,
  password_attempted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.accessed_at, a.ip_address, a.country, a.city, 
    a.device_type, a.browser, a.os, a.screen_size, a.is_authorized, a.password_attempted
  FROM public.admin_access_logs a
  ORDER BY a.accessed_at DESC
  LIMIT 100;
END;
$$;

-- دالة لتحديث حالة المراجعة
CREATE OR REPLACE FUNCTION public.update_question_review_authenticated(
  p_password TEXT,
  p_question_id UUID,
  p_review_status TEXT,
  p_reviewed_text TEXT DEFAULT NULL,
  p_reviewer_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  UPDATE public.questions SET
    review_status = COALESCE(p_review_status, review_status),
    reviewed_text = COALESCE(p_reviewed_text, reviewed_text),
    reviewer_notes = COALESCE(p_reviewer_notes, reviewer_notes)
  WHERE id = p_question_id;
  
  RETURN true;
END;
$$;

-- تفعيل Realtime للإعدادات
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;