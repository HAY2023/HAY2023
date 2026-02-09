-- Drop both versions with exact signatures
DROP FUNCTION IF EXISTS public.update_settings_authenticated(
  p_password text,
  p_is_box_open boolean,
  p_next_session_date text,
  p_video_url text,
  p_video_title text,
  p_show_countdown boolean,
  p_show_question_count boolean,
  p_show_install_page boolean,
  p_maintenance_mode boolean,
  p_maintenance_message text,
  p_content_filter_enabled boolean,
  p_countdown_style integer,
  p_countdown_bg_color text,
  p_countdown_text_color text,
  p_countdown_border_color text
);

DROP FUNCTION IF EXISTS public.update_settings_authenticated(
  p_password text,
  p_is_box_open boolean,
  p_next_session_date text,
  p_video_url text,
  p_video_title text,
  p_show_countdown boolean,
  p_show_question_count boolean,
  p_show_install_page boolean,
  p_countdown_style integer,
  p_content_filter_enabled boolean,
  p_maintenance_mode boolean,
  p_maintenance_message text,
  p_countdown_bg_color text,
  p_countdown_text_color text,
  p_countdown_border_color text
);

-- Create the single unified function
CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password text,
  p_is_box_open boolean DEFAULT NULL,
  p_next_session_date text DEFAULT NULL,
  p_video_url text DEFAULT NULL,
  p_video_title text DEFAULT NULL,
  p_show_countdown boolean DEFAULT NULL,
  p_show_question_count boolean DEFAULT NULL,
  p_show_install_page boolean DEFAULT NULL,
  p_maintenance_mode boolean DEFAULT NULL,
  p_maintenance_message text DEFAULT NULL,
  p_content_filter_enabled boolean DEFAULT NULL,
  p_countdown_style integer DEFAULT NULL,
  p_countdown_bg_color text DEFAULT NULL,
  p_countdown_text_color text DEFAULT NULL,
  p_countdown_border_color text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_valid boolean;
BEGIN
  SELECT verify_admin_password(p_password) INTO is_valid;
  
  IF NOT is_valid THEN
    RETURN false;
  END IF;
  
  UPDATE settings
  SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = CASE 
      WHEN p_next_session_date IS NOT NULL THEN p_next_session_date::timestamp with time zone 
      ELSE next_session_date 
    END,
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    show_question_count = COALESCE(p_show_question_count, show_question_count),
    show_install_page = COALESCE(p_show_install_page, show_install_page),
    maintenance_mode = COALESCE(p_maintenance_mode, maintenance_mode),
    maintenance_message = COALESCE(p_maintenance_message, maintenance_message),
    content_filter_enabled = COALESCE(p_content_filter_enabled, content_filter_enabled),
    countdown_style = COALESCE(p_countdown_style, countdown_style),
    countdown_bg_color = COALESCE(p_countdown_bg_color, countdown_bg_color),
    countdown_text_color = COALESCE(p_countdown_text_color, countdown_text_color),
    countdown_border_color = COALESCE(p_countdown_border_color, countdown_border_color),
    updated_at = now()
  WHERE id = (SELECT id FROM settings LIMIT 1);
  
  RETURN true;
END;
$$;