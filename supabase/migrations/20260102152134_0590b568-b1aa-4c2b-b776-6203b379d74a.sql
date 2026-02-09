-- إصلاح دالة update_settings_authenticated لاستخدام جدول admin_credentials
CREATE OR REPLACE FUNCTION public.update_settings_authenticated(
  p_password text, 
  p_is_box_open boolean DEFAULT NULL, 
  p_next_session_date timestamp with time zone DEFAULT NULL, 
  p_video_url text DEFAULT NULL, 
  p_video_title text DEFAULT NULL, 
  p_show_countdown boolean DEFAULT NULL, 
  p_show_question_count boolean DEFAULT NULL, 
  p_show_install_page boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- التحقق من كلمة المرور باستخدام دالة verify_admin_password
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.settings SET
    is_box_open = COALESCE(p_is_box_open, is_box_open),
    next_session_date = COALESCE(p_next_session_date, next_session_date),
    video_url = COALESCE(p_video_url, video_url),
    video_title = COALESCE(p_video_title, video_title),
    show_countdown = COALESCE(p_show_countdown, show_countdown),
    show_question_count = COALESCE(p_show_question_count, show_question_count),
    show_install_page = COALESCE(p_show_install_page, show_install_page),
    updated_at = now()
  WHERE id = (SELECT id FROM public.settings LIMIT 1);
  
  RETURN TRUE;
END;
$function$;