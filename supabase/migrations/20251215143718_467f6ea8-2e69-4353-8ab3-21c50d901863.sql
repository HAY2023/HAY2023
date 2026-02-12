-- سياسة تحديث الإعدادات (للجميع مؤقتًا - يتحقق من كلمة المرور في الكود)
CREATE POLICY "Anyone can update settings" 
ON public.settings 
FOR UPDATE 
USING (true);

-- سياسة رفع الفيديوهات
CREATE POLICY "Anyone can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos');