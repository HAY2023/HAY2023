-- Create push_tokens table for storing device notification tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT DEFAULT 'unknown',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: No direct public access (only through edge functions with service key)
CREATE POLICY "No direct access to push tokens" 
ON public.push_tokens 
FOR ALL 
USING (false);

-- Add comment
COMMENT ON TABLE public.push_tokens IS 'Stores push notification tokens for mobile devices';