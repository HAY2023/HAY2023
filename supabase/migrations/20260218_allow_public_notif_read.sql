-- Allow public read access to notification history so users can receive realtime updates
DROP POLICY IF EXISTS "Block public access to notification history" ON public.notification_history;

CREATE POLICY "Allow public read access to notification history" 
ON public.notification_history 
FOR SELECT 
USING (true);
