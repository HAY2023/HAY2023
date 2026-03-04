
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS countdown_animation_type integer DEFAULT 1;

CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password text,
  p_is_box_open boolean DEFAULT NULL,
  p_next_session_date text DEFAULT NULL,
  p_video_url text DEFAULT NULL,
  p_video_title text DEFAULT NULL,
  p_show_countdown boolean DEFAULT NULL,
  p_show_question_count boolean DEFAULT NULL,
  p_show_install_page boolean DEFAULT NULL,
  p_countdown_style integer DEFAULT NULL,
  p_countdown_bg_color text DEFAULT NULL,
  p_countdown_text_color text DEFAULT NULL,
  p_countdown_border_color text DEFAULT NULL,
  p_countdown_title text DEFAULT NULL,
  p_content_filter_enabled boolean DEFAULT NULL,
  p_maintenance_mode boolean DEFAULT NULL,
  p_maintenance_message text DEFAULT NULL,
  p_countdown_animation_type integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  SELECT verify_admin_password(p_password) INTO v_valid;
  IF NOT v_valid THEN
    RETURN false;
  END IF;

  UPDATE settings SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = CASE WHEN p_next_session_date IS NOT NULL THEN p_next_session_date::timestamptz ELSE next_session_date END,
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    show_question_count = COALESCE(p_show_question_count, show_question_count),
    show_install_page = COALESCE(p_show_install_page, show_install_page),
    countdown_style = COALESCE(p_countdown_style, countdown_style),
    countdown_bg_color = COALESCE(p_countdown_bg_color, countdown_bg_color),
    countdown_text_color = COALESCE(p_countdown_text_color, countdown_text_color),
    countdown_border_color = COALESCE(p_countdown_border_color, countdown_border_color),
    countdown_title = COALESCE(p_countdown_title, countdown_title),
    content_filter_enabled = COALESCE(p_content_filter_enabled, content_filter_enabled),
    maintenance_mode = COALESCE(p_maintenance_mode, maintenance_mode),
    maintenance_message = COALESCE(p_maintenance_message, maintenance_message),
    countdown_animation_type = COALESCE(p_countdown_animation_type, countdown_animation_type),
    updated_at = now();

  RETURN true;
END;
$$;
