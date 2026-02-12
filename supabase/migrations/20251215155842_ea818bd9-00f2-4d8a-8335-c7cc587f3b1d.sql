-- 1. Create admin_credentials table to store password separately
CREATE TABLE public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Enable RLS on admin_credentials - NO public access
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Move existing password hash to new table
INSERT INTO public.admin_credentials (password_hash)
SELECT admin_password_hash FROM public.settings LIMIT 1;

-- 4. Remove admin_password_hash column from settings
ALTER TABLE public.settings DROP COLUMN admin_password_hash;

-- 5. Drop existing unsafe policies on settings
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.settings;

-- 6. Create safe policies for settings (public read is OK now without password)
CREATE POLICY "Anyone can read settings"
ON public.settings FOR SELECT
USING (true);

-- 7. Add SELECT policy for questions (admin view via edge function only)
-- For now, no direct SELECT since admin will use service role
-- Questions table already has INSERT policy which is correct

-- 8. Create verify_admin function that uses service role internally
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.admin_credentials LIMIT 1;
  RETURN stored_hash = input_password;
END;
$$;

-- 9. Create function to update settings (requires password verification)
CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password text,
  p_is_box_open boolean DEFAULT NULL,
  p_next_session_date timestamp with time zone DEFAULT NULL,
  p_video_url text DEFAULT NULL,
  p_video_title text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify password first
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  -- Update only provided fields
  UPDATE public.settings SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = COALESCE(p_next_session_date, next_session_date),
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    updated_at = now()
  WHERE id = (SELECT id FROM public.settings LIMIT 1);
  
  RETURN true;
END;
$$;

-- 10. Create function to get questions count (requires password)
CREATE OR REPLACE FUNCTION public.get_questions_count_authenticated(p_password text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN -1;
  END IF;
  
  RETURN (SELECT COUNT(*) FROM public.questions);
END;
$$;

-- 11. Create function to update admin password
CREATE OR REPLACE FUNCTION public.update_admin_password(
  p_old_password text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_old_password) THEN
    RETURN false;
  END IF;
  
  UPDATE public.admin_credentials SET
    password_hash = p_new_password,
    updated_at = now();
  
  RETURN true;
END;
$$;