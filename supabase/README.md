# Supabase Database Setup

This folder contains all database migrations, functions, and templates for TopAffaireImmo.

## Quick Start

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run all migrations
supabase db push
```

## Folder Structure

```
supabase/
├── migrations/       # SQL migration files (schema only)
├── seed/             # Demo/seed data files (data only)
├── functions/        # Edge functions (currently unused)
├── templates/        # Email templates
└── config.toml       # Supabase configuration
```

## Migrations

We have 42 migration files tracking the evolution of the database schema.

### Key Migrations

- **001-010**: Initial schema and early iterations
- **020-024**: Full rebuild (024 files are deprecated - data moved to seed)
- **025-032**: Profile trigger fixes and RLS policies
- **033-035**: Advertising inquiries and signup fixes
- **036-037**: Facebook integration
- **038-042**: Comprehensive production fixes
- **043-052**: Security fixes and admin system improvements

**Important:** Migrations contain ONLY schema changes (tables, columns, constraints, RLS, functions). 
All demo/sample data has been moved to `supabase/seed/seed_demo_data.sql`.

### Running Migrations

#### Fresh Database (Recommended)

To set up a brand new database:

```bash
# Reset database (WARNING: destroys all data)
supabase db reset

# Or apply all migrations fresh
supabase db push
```

#### Incremental Updates

If you have existing data:

```bash
# Pull remote changes
supabase db pull

# Push local changes
supabase db push
```

## Database Schema

### Tables

#### User Management

1. **profiles**
   - Stores user profiles (linked to auth.users)
   - Fields: role, agency_name, phone, whatsapp, approved_advertiser
   - RLS: Users can read own profile, admins can read all

#### Real Estate

2. **properties**
   - Real estate listings
   - Fields: title (FR/AR), description, price, city, status
   - RLS: Public read, owner write, admin full access

3. **property_images**
   - Images for properties (max 10 per property)
   - RLS: Public read, owner write

4. **cities**
   - Moroccan cities (bilingual)
   - RLS: Public read, admin write

5. **neighborhoods**
   - City neighborhoods (bilingual)
   - RLS: Public read, admin write

6. **property_types**
   - Types: apartment, villa, house, land, commercial
   - RLS: Public read, admin write

#### Banner Advertising

7. **banner_slots**
   - Ad position templates (homepage, sidebar, etc.)
   - RLS: Public read, admin write

8. **banner_requests**
   - Ad campaigns with approval workflow
   - States: pending → approved → active → expired
   - RLS: Owner read/write own, admin full access

9. **payments**
   - Payment records for services
   - RLS: Owner read own, admin read all

#### CMS

10. **site_settings**
    - Key-value configuration store
    - RLS: Public read, admin write

11. **advertising_inquiries**
    - Contact form submissions
    - RLS: Admin read all

### Database Functions

#### handle_new_user()

Trigger function that automatically creates a profile when a user signs up.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, approved_advertiser)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'real_estate_advertiser'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### check_user_role()

Helper function for role-based access control.

```sql
CREATE OR REPLACE FUNCTION check_user_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Row Level Security (RLS)

All tables have RLS enabled with policies like:

#### Properties

```sql
-- Anyone can read approved properties
CREATE POLICY "Public can read approved properties"
  ON properties FOR SELECT
  USING (status = 'approved');

-- Users can read their own properties
CREATE POLICY "Users can read own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own properties
CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do anything
CREATE POLICY "Admins have full access"
  ON properties
  USING (check_user_role(auth.uid(), 'admin'));
```

## Storage Buckets

### Creating Buckets

Run this SQL in Supabase SQL Editor:

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('property-images', 'property-images', true),
  ('banner-images', 'banner-images', true),
  ('payment-receipts', 'payment-receipts', false),
  ('agency-logos', 'agency-logos', true);
```

### Bucket Policies

#### property-images (Public)

```sql
-- Anyone can read
CREATE POLICY "Public can read property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Authenticated users can upload
CREATE POLICY "Users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own
CREATE POLICY "Users can delete own property images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### payment-receipts (Private)

```sql
-- Only owner can read
CREATE POLICY "Users can read own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can upload own
CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Seeding Data

### Demo Data (Development Only)

For local development, you can load demo data using the seed file:

```bash
# Apply migrations first
supabase db push

# Then load demo data (optional - for local dev only)
# Option 1: Using psql
psql -h localhost -U postgres -d postgres -f supabase/seed/seed_demo_data.sql

# Option 2: Using Supabase CLI
cat supabase/seed/seed_demo_data.sql | supabase db execute
```

**IMPORTANT:** 
- The seed file contains demo admin profiles and sample properties
- It should ONLY be used for local development/testing
- Do NOT run this in production
- The seed file assumes the schema is already created via migrations
- Requires superuser or service role privileges
- See `supabase/seed/README.md` for detailed instructions

### Sample Cities

```sql
INSERT INTO cities (name_fr, name_ar, slug) VALUES
  ('Casablanca', 'الدار البيضاء', 'casablanca'),
  ('Rabat', 'الرباط', 'rabat'),
  ('Marrakech', 'مراكش', 'marrakech'),
  ('Tanger', 'طنجة', 'tanger'),
  ('Agadir', 'أكادير', 'agadir'),
  ('Fès', 'فاس', 'fes');
```

### Sample Property Types

```sql
INSERT INTO property_types (name_fr, name_ar, slug) VALUES
  ('Appartement', 'شقة', 'appartement'),
  ('Villa', 'فيلا', 'villa'),
  ('Maison', 'منزل', 'maison'),
  ('Terrain', 'أرض', 'terrain'),
  ('Commercial', 'تجاري', 'commercial');
```

### Creating Admin User

After signup, run:

```sql
UPDATE profiles
SET 
  role = 'admin',
  approved_advertiser = true
WHERE email = 'admin@example.com';
```

## Maintenance

### Backup Database

```bash
# Dump schema and data
supabase db dump -f backup.sql

# Schema only
supabase db dump --schema-only -f schema.sql

# Data only
supabase db dump --data-only -f data.sql
```

### Reset Database

```bash
# WARNING: This deletes all data!
supabase db reset
```

### Generate TypeScript Types

```bash
# Update src/types/supabase.ts with latest schema
npm run types:supabase
```

Requires `SUPABASE_PROJECT_ID` environment variable.

## Common Tasks

### Add a New Table

1. Create migration file:

```bash
supabase migration new add_table_name
```

2. Edit the SQL file in `supabase/migrations/`

3. Apply migration:

```bash
supabase db push
```

4. Update TypeScript types:

```bash
npm run types:supabase
```

### Modify RLS Policy

1. Create migration:

```bash
supabase migration new update_rls_policy_name
```

2. Drop old policy, create new one:

```sql
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

CREATE POLICY "new_policy_name"
  ON table_name
  FOR SELECT
  USING ( ... );
```

3. Apply:

```bash
supabase db push
```

### Add Index for Performance

```sql
-- In a new migration
CREATE INDEX idx_properties_city 
  ON properties(city);

CREATE INDEX idx_properties_status 
  ON properties(status);
```

## Troubleshooting

### Migration Conflicts

If migrations conflict:

```bash
# Pull remote state
supabase db pull

# Review changes
git diff supabase/migrations/

# Resolve conflicts manually
# Then push
supabase db push
```

### RLS Policy Issues

If queries fail with permission errors:

1. Check RLS is enabled: Supabase Dashboard → **Table Editor**
2. Review policies: **Authentication** → **Policies**
3. Test policy in SQL Editor:

```sql
-- Test as user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM properties;
```

### Storage Upload Fails

1. Verify bucket exists
2. Check bucket is public (if needed)
3. Verify RLS policies on `storage.objects`
4. Check file size limits

## Production Checklist

Before going live:

- [ ] All migrations applied
- [ ] RLS enabled on all tables
- [ ] Storage buckets created
- [ ] Storage policies configured
- [ ] Database backups scheduled
- [ ] Admin user created
- [ ] Sample data removed (if any)
- [ ] Indexes added for performance
- [ ] Connection pooling configured (if needed)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
