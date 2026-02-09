-- Create videos table for multiple videos
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Anyone can read active videos
CREATE POLICY "Anyone can read videos" 
ON public.videos 
FOR SELECT 
USING (true);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements
CREATE POLICY "Anyone can read announcements" 
ON public.announcements 
FOR SELECT 
USING (true);

-- Create function to manage videos
CREATE OR REPLACE FUNCTION public.add_video_authenticated(
  p_password TEXT,
  p_title TEXT,
  p_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Create function to delete video
CREATE OR REPLACE FUNCTION public.delete_video_authenticated(
  p_password TEXT,
  p_video_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.videos WHERE id = p_video_id;
  RETURN true;
END;
$$;

-- Create function to manage announcements
CREATE OR REPLACE FUNCTION public.add_announcement_authenticated(
  p_password TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Create function to delete announcement
CREATE OR REPLACE FUNCTION public.delete_announcement_authenticated(
  p_password TEXT,
  p_announcement_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.announcements WHERE id = p_announcement_id;
  RETURN true;
END;
$$;