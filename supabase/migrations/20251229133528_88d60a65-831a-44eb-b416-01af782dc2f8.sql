-- استخدام extensions.crypt و extensions.gen_salt
-- إعادة تعيين كلمة المرور
UPDATE public.admin_credentials 
SET password_hash = extensions.crypt('you2025', extensions.gen_salt('bf')),
    updated_at = now();

-- تحديث دالة التحقق لاستخدام extensions.crypt
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.admin_credentials LIMIT 1;
  RETURN extensions.crypt(input_password, stored_hash) = stored_hash;
END;
$$;

-- تحديث دالة تغيير كلمة المرور
CREATE OR REPLACE FUNCTION public.update_admin_password(p_old_password text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- إضافة عمود show_question_count للإعدادات
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS show_question_count BOOLEAN DEFAULT false;

-- إضافة دالة لترتيب الفيديوهات
CREATE OR REPLACE FUNCTION public.reorder_videos_authenticated(p_password text, p_video_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  i INTEGER := 1;
  vid UUID;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  FOREACH vid IN ARRAY p_video_ids
  LOOP
    UPDATE public.videos SET display_order = i WHERE id = vid;
    i := i + 1;
  END LOOP;
  
  RETURN true;
END;
$$;

-- إضافة دالة للحصول على عدد الأسئلة للعرض العام
CREATE OR REPLACE FUNCTION public.get_public_questions_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(*)::integer FROM public.questions;
$$;