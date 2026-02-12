-- Create function to delete all questions (requires admin authentication)
CREATE OR REPLACE FUNCTION public.delete_all_questions_authenticated(p_password text)
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
  
  -- Delete all questions
  DELETE FROM public.questions;
  
  RETURN true;
END;
$$;