-- Create Storage Policies for proofs bucket via SQL Editor
-- Run this in Supabase SQL Editor AFTER creating the bucket via UI
--
-- Steps:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a bucket named "proofs" (public bucket recommended)
-- 3. Then run this SQL script

-- Policy for SELECT (viewing proofs)
CREATE POLICY "Users can view proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'proofs');

-- Policy for INSERT (uploading proofs)
CREATE POLICY "Users can upload proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proofs');

-- Policy for UPDATE (updating proofs)
CREATE POLICY "Users can update proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'proofs')
WITH CHECK (bucket_id = 'proofs');

-- Note: DELETE policy is optional, only add if you want users to delete their proofs
-- CREATE POLICY "Users can delete proofs"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'proofs');

