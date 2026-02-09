-- Create function to update video
CREATE OR REPLACE FUNCTION public.update_video_authenticated(
  p_password text,
  p_video_id uuid,
  p_title text DEFAULT NULL,
  p_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid boolean;
BEGIN
  -- Verify admin password
  SELECT verify_admin_password(p_password) INTO v_is_valid;
  
  IF NOT v_is_valid THEN
    RETURN false;
  END IF;
  
  -- Update video
  UPDATE videos
  SET 
    title = COALESCE(p_title, title),
    url = COALESCE(p_url, url)
  WHERE id = p_video_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;