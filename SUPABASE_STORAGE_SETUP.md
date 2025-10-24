# Supabase Storage Setup Guide

## Konfigurasi Supabase Storage untuk Upload Gambar

### 1. Buat Storage Bucket

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda: `fkjdzdqvansmlfvggtmq`
3. Pergi ke **Storage** di sidebar
4. Klik **New bucket**
5. Atur sebagai berikut:
   - **Name**: `cafetaria-images`
   - **Public bucket**: ✅ (Centang)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

### 2. Setup Storage Policies (RLS)

Setelah bucket dibuat, setup policies untuk keamanan:

#### Policy 1: Public Read Access

```sql
-- Allow public to read images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cafetaria-images');
```

#### Policy 2: Authenticated Upload

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cafetaria-images' AND
  auth.role() = 'authenticated'
);
```

#### Policy 3: Owner Delete

```sql
-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cafetaria-images' AND
  auth.uid() = owner
);
```

### 3. Get API Keys

1. Pergi ke **Settings** → **API**
2. Copy credentials:
   - **Project URL**: `https://fkjdzdqvansmlfvggtmq.supabase.co`
   - **anon public key**: Copy untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Copy untuk `SUPABASE_SERVICE_ROLE_KEY`

### 4. Update .env File

Tambahkan ke file `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://fkjdzdqvansmlfvggtmq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### 5. Struktur URL

Setelah upload, gambar akan tersedia di:

```
https://fkjdzdqvansmlfvggtmq.supabase.co/storage/v1/object/public/cafetaria-images/uploads/[filename]
```

### 6. Test Upload

1. Login sebagai MITRA atau PENGURUS
2. Upload gambar item baru
3. Gambar akan otomatis tersimpan di Supabase Storage
4. URL akan dikembalikan dalam format:
   ```
   https://fkjdzdqvansmlfvggtmq.supabase.co/storage/v1/object/public/cafetaria-images/uploads/1234567890-abc123.jpg
   ```

## Keuntungan Supabase Storage

✅ **CDN Global**: Gambar di-cache di edge locations worldwide
✅ **Scalable**: Tidak perlu worry tentang storage space
✅ **Secure**: Built-in RLS (Row Level Security)
✅ **Fast**: Optimized untuk serving images
✅ **Backup**: Automatic backups included
✅ **Free Tier**: 1GB storage gratis

## Troubleshooting

### Error: "Failed to upload file to storage"

- Pastikan bucket `cafetaria-images` sudah dibuat
- Cek policies sudah di-setup dengan benar
- Verify API keys di .env file

### Error: "Bucket not found"

- Nama bucket harus exact: `cafetaria-images`
- Bucket harus public untuk read access

### Images tidak load

- Pastikan bucket public
- Check URL format benar
- Verify CORS settings di Supabase jika perlu

## Migration dari Local Storage

Jika sebelumnya sudah ada gambar di `/public/uploads`:

1. Upload manual ke Supabase Storage via dashboard
2. Atau buat script migration untuk bulk upload
3. Update database dengan URL baru

## Notes

- Max file size: 5MB per image
- Supported formats: JPEG, JPG, PNG, WebP
- Auto-generated unique filenames
- Organized dalam folder `uploads/`
