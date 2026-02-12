-- Add show_install_page column to settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS show_install_page BOOLEAN DEFAULT true;

-- Update the update_settings_authenticated function to include show_install_page
CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password TEXT,
  p_is_box_open BOOLEAN DEFAULT NULL,
  p_next_session_date TIMESTAMPTZ DEFAULT NULL,
  p_video_url TEXT DEFAULT NULL,
  p_video_title TEXT DEFAULT NULL,
  p_show_countdown BOOLEAN DEFAULT NULL,
  p_show_question_count BOOLEAN DEFAULT NULL,
  p_show_install_page BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM admin_settings LIMIT 1;
  
  IF stored_hash IS NULL OR stored_hash != crypt(p_password, stored_hash) THEN
    RETURN FALSE;
  END IF;
  
  UPDATE settings SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = COALESCE(p_next_session_date, next_session_date),
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    show_question_count = COALESCE(p_show_question_count, show_question_count),
    show_install_page = COALESCE(p_show_install_page, show_install_page),
    updated_at = now();
  
  RETURN TRUE;
END;
$$;