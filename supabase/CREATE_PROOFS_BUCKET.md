# Create Supabase Storage Bucket for Proofs

You need to create a Supabase Storage bucket for proof images.

## Steps:

### Option 1: Using SQL (RECOMMENDED - avoids UI errors)

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **"Create a new bucket"**
4. Set the following:
   - **Name:** `proofs`
   - **Public bucket:** ✅ Yes (so images are accessible via URL)
   - **File size limit:** 5 MB (or your preferred limit)
   - **Allowed MIME types:** `image/*` (or leave empty for all)
5. Go to **SQL Editor** in Supabase Dashboard
6. Run the SQL script: `PROOFS_STORAGE_POLICY.sql`
   - This creates all needed policies via SQL (avoids UI errors)

### Option 2: Using UI (if Option 1 doesn't work)

1. Create the bucket as described above
2. Go to **Storage** → **Policies**
3. Create policies one by one:
   - Policy name: "Users can view proofs"
   - Allowed operations: SELECT
   - Policy definition: `bucket_id = 'proofs'`
   
   Repeat for INSERT and UPDATE with appropriate names.

That's it! The proofs bucket is now ready to use.

