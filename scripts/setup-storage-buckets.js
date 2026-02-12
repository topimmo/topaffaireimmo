#!/usr/bin/env node

/**
 * Storage Bucket Setup Script
 * 
 * This script helps verify and create the required storage buckets
 * in Supabase for the application to work properly.
 * 
 * Usage:
 *   npm run setup:storage-buckets
 * 
 * Or directly:
 *   node scripts/setup-storage-buckets.js
 */

console.log('🪣 Storage Bucket Setup Guide\n');
console.log('━'.repeat(60));

console.log('\n📋 Required Buckets:');
console.log('   1. property-images (max 5MB, images only)');
console.log('   2. banner-images (max 2MB, images/gif)');
console.log('   3. payment-receipts (max 5MB, images/PDFs)');
console.log('   4. agency-logos (max 1MB, images/SVG, PUBLIC)');

console.log('\n🔧 Setup Options:\n');

console.log('Option 1: Run Migration (Recommended)');
console.log('──────────────────────────────────────');
console.log('If you have Supabase CLI installed:');
console.log('  1. cd to project root');
console.log('  2. Run: supabase db push');
console.log('  3. Migration 065_verify_storage_buckets.sql will run automatically');
console.log('');
console.log('Or run migration manually in Supabase SQL Editor:');
console.log('  1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql');
console.log('  2. Copy contents of: supabase/migrations/065_verify_storage_buckets.sql');
console.log('  3. Paste and execute\n');

console.log('Option 2: Manual Creation via Dashboard');
console.log('────────────────────────────────────────');
console.log('  1. Go to: https://app.supabase.com/project/YOUR_PROJECT/storage/buckets');
console.log('  2. Click "New bucket" for each:');
console.log('');
console.log('  Bucket: property-images');
console.log('    Name: property-images');
console.log('    Public: No');
console.log('    File size limit: 5242880 (5MB)');
console.log('    Allowed MIME types: image/jpeg, image/png, image/webp');
console.log('');
console.log('  Bucket: banner-images');
console.log('    Name: banner-images');
console.log('    Public: No');
console.log('    File size limit: 1048576 (1MB)');
console.log('    Allowed MIME types: image/jpeg, image/png, image/gif, image/webp');
console.log('');
console.log('  Bucket: payment-receipts');
console.log('    Name: payment-receipts');
console.log('    Public: No');
console.log('    File size limit: 2097152 (2MB)');
console.log('    Allowed MIME types: image/jpeg, image/png, application/pdf');
console.log('');
console.log('  Bucket: agency-logos');
console.log('    Name: agency-logos');
console.log('    Public: Yes ⚠️ (must be public)');
console.log('    File size limit: 524288 (512KB)');
console.log('    Allowed MIME types: image/jpeg, image/png, image/webp, image/svg+xml');
console.log('');

console.log('Option 3: SQL Script');
console.log('────────────────────');
console.log('Run this SQL in Supabase SQL Editor:');
console.log('');
console.log('```sql');
console.log("INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)");
console.log("VALUES");
console.log("  ('property-images', 'property-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),");
console.log("  ('banner-images', 'banner-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),");
console.log("  ('payment-receipts', 'payment-receipts', false, 2097152, ARRAY['image/jpeg', 'image/png', 'application/pdf']),");
console.log("  ('agency-logos', 'agency-logos', true, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])");
console.log("ON CONFLICT (id) DO UPDATE SET");
console.log("  public = EXCLUDED.public,");
console.log("  file_size_limit = EXCLUDED.file_size_limit,");
console.log("  allowed_mime_types = EXCLUDED.allowed_mime_types;");
console.log('```\n');

console.log('📝 Verification:');
console.log('──────────────');
console.log('After creating buckets, verify:');
console.log('  1. All 4 buckets appear in Storage dashboard');
console.log('  2. agency-logos is marked as PUBLIC');
console.log('  3. Others are PRIVATE');
console.log('  4. No console warnings about missing buckets when app loads');
console.log('');

console.log('⚠️  Important Notes:');
console.log('───────────────────');
console.log('  • agency-logos MUST be public (for displaying logos on public pages)');
console.log('  • Other buckets should be private (protected by RLS policies)');
console.log('  • If buckets already exist, ON CONFLICT will update settings');
console.log('  • Storage warnings in console are non-blocking but should be fixed');
console.log('');

console.log('🔒 RLS Policies:');
console.log('────────────────');
console.log('The application uses Row Level Security (RLS) for storage buckets.');
console.log('Users can only access their own files based on folder structure:');
console.log('  • Files are organized as: bucket/user_id/file.jpg');
console.log('  • RLS checks that user_id matches auth.uid()');
console.log('  • See storage RLS policies in Supabase dashboard for details');
console.log('');

console.log('━'.repeat(60));
console.log('\n✅ Follow one of the options above to create storage buckets');
console.log('📖 See: supabase/migrations/065_verify_storage_buckets.sql');
console.log('📖 See: PRODUCTION_DEPLOYMENT_GUIDE.md for more details\n');

process.exit(0);
