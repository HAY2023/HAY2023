-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- 1. Create flash_messages table
-- =============================================
CREATE TABLE public.flash_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  text_direction TEXT NOT NULL DEFAULT 'rtl',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on flash_messages
ALTER TABLE public.flash_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read flash messages
CREATE POLICY "Anyone can read flash messages" 
ON public.flash_messages FOR SELECT 
USING (true);

-- =============================================
-- 2. Add flash message authenticated function
-- =============================================
CREATE OR REPLACE FUNCTION public.add_flash_message_authenticated(
  p_password TEXT,
  p_message TEXT,
  p_text_direction TEXT DEFAULT 'rtl',
  p_color TEXT DEFAULT '#3b82f6',
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.flash_messages (message, text_direction, color, start_date, end_date)
  VALUES (p_message, p_text_direction, p_color, p_start_date, p_end_date)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- =============================================
-- 3. Delete flash message authenticated function
-- =============================================
CREATE OR REPLACE FUNCTION public.delete_flash_message_authenticated(
  p_password TEXT,
  p_flash_message_id UUID
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
  
  DELETE FROM public.flash_messages WHERE id = p_flash_message_id;
  RETURN true;
END;
$$;

-- =============================================
-- 4. Security Fix: Update admin password to use bcrypt hash
-- =============================================
UPDATE public.admin_credentials 
SET password_hash = crypt(password_hash, gen_salt('bf'));

-- =============================================
-- 5. Security Fix: Update verify_admin_password to use bcrypt
-- =============================================
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.admin_credentials LIMIT 1;
  RETURN crypt(input_password, stored_hash) = stored_hash;
END;
$$;

-- =============================================
-- 6. Security Fix: Update update_admin_password to use bcrypt
-- =============================================
CREATE OR REPLACE FUNCTION public.update_admin_password(p_old_password TEXT, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_old_password) THEN
    RETURN false;
  END IF;
  
  UPDATE public.admin_credentials SET
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = now();
  
  RETURN true;
END;
$$;

-- =============================================
-- 7. Security Fix: Add explicit DENY policies for questions UPDATE/DELETE
-- =============================================
CREATE POLICY "Block question updates" 
ON public.questions FOR UPDATE 
USING (false);

CREATE POLICY "Block question deletes" 
ON public.questions FOR DELETE 
USING (false);

-- =============================================
-- 8. Security Fix: Update all SECURITY DEFINER functions with proper search_path
-- =============================================
CREATE OR REPLACE FUNCTION public.delete_selected_questions_authenticated(p_password TEXT, p_question_ids UUID[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.questions WHERE id = ANY(p_question_ids);
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_video_authenticated(p_password TEXT, p_title TEXT, p_url TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id UUID;
  max_order INTEGER;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN NULL;
  END IF;
  
  SELECT COALESCE(MAX(display_order), 0) + 1 INTO max_order FROM public.videos;
  
  INSERT INTO public.videos (title, url, display_order)
  VALUES (p_title, p_url, max_order)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_video_authenticated(p_password TEXT, p_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.videos WHERE id = p_video_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_announcement_authenticated(p_password TEXT, p_message TEXT, p_type TEXT DEFAULT 'info')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.announcements (message, type)
  VALUES (p_message, p_type)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_announcement_authenticated(p_password TEXT, p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.announcements WHERE id = p_announcement_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password TEXT, 
  p_is_box_open BOOLEAN DEFAULT NULL, 
  p_next_session_date TIMESTAMPTZ DEFAULT NULL, 
  p_video_url TEXT DEFAULT NULL, 
  p_video_title TEXT DEFAULT NULL, 
  p_show_countdown BOOLEAN DEFAULT NULL
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
  
  UPDATE public.settings SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = COALESCE(p_next_session_date, next_session_date),
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    updated_at = now()
  WHERE id = (SELECT id FROM public.settings LIMIT 1);
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_questions_count_authenticated(p_password TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN -1;
  END IF;
  
  RETURN (SELECT COUNT(*) FROM public.questions);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_questions_authenticated(p_password TEXT)
RETURNS TABLE(id UUID, category TEXT, question_text TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT q.id, q.category, q.question_text, q.created_at 
  FROM public.questions q 
  ORDER BY q.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_all_questions_authenticated(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.questions;
  
  RETURN true;
END;
$$;

-- =============================================
-- 9. Security Fix: Delete videos storage bucket
-- =============================================
DELETE FROM storage.objects WHERE bucket_id = 'videos';
DELETE FROM storage.buckets WHERE id = 'videos';