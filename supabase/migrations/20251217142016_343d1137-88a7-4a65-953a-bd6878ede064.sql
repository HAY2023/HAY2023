-- Add show_countdown column to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS show_countdown boolean NOT NULL DEFAULT true;

-- Update the update_settings_authenticated function to support show_countdown
CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password text, 
  p_is_box_open boolean DEFAULT NULL, 
  p_next_session_date timestamp with time zone DEFAULT NULL, 
  p_video_url text DEFAULT NULL, 
  p_video_title text DEFAULT NULL,
  p_show_countdown boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    updated_at = now()
  WHERE id = (SELECT id FROM public.settings LIMIT 1);
  
  RETURN true;
END;
$function$;