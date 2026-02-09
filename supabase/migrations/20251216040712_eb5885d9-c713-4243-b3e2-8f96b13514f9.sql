-- Function to delete selected questions by their IDs
CREATE OR REPLACE FUNCTION public.delete_selected_questions_authenticated(p_password text, p_question_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify password first
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  -- Delete selected questions
  DELETE FROM public.questions WHERE id = ANY(p_question_ids);
  
  RETURN true;
END;
$$;