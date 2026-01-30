# Supabase Seed Data

This directory contains seed/demo data files for local development and testing.

## Important Notes

⚠️ **DO NOT run seed files in production!**

- Seed files are for local development and testing only
- They assume the schema is already created via migrations
- They should be run MANUALLY after running migrations

## Files

### `seed_demo_data.sql`

Contains demo data for local development:
- 1 demo admin profile (`demo@topaffaireimmo.com`)
- 8 sample property listings across different Moroccan cities

## Usage

### Prerequisites

1. Ensure migrations are applied first:
   ```bash
   supabase db push
   ```

2. The demo profile requires a corresponding user in `auth.users` with ID `00000000-0000-0000-0000-000000000001`

### Running the Seed File

**Option 1: Using psql**
```bash
psql -h localhost -U postgres -d postgres -f supabase/seed/seed_demo_data.sql
```

**Option 2: Using Supabase CLI** (if supported in your version)
```bash
supabase db execute -f supabase/seed/seed_demo_data.sql
```

**Option 3: Via Supabase Dashboard**
1. Go to SQL Editor in your Supabase Dashboard
2. Copy the contents of `seed_demo_data.sql`
3. Run the SQL

## How It Works

The seed file:
1. Wraps everything in a transaction (BEGIN/COMMIT)
2. Temporarily disables RLS on `profiles` and `properties` tables
3. Inserts/updates demo data using `ON CONFLICT` for idempotency
4. Re-enables RLS
5. Commits the transaction

## Demo Data Details

### Demo Admin Profile
- **ID**: `00000000-0000-0000-0000-000000000001`
- **Email**: `demo@topaffaireimmo.com`
- **Role**: admin
- **Status**: verified and active

### Demo Properties
8 sample properties featuring:
- Apartments, villas, houses, commercial spaces, and land
- Located in major Moroccan cities (Casablanca, Rabat, Marrakech, Tangier, Agadir, Fès)
- Mix of sale and rental properties
- All approved and ready to display
- French and Arabic titles/descriptions

## Re-running the Seed File

The seed file is idempotent - you can run it multiple times:
- Demo profile is updated if it exists (ON CONFLICT clause)
- Demo properties are deleted and re-inserted to ensure clean state

## Troubleshooting

### "violates foreign key constraint on profiles"

The demo profile insert may fail if:
- The corresponding user doesn't exist in `auth.users`
- Another profile with the same email already exists

**Solution**: Either:
1. Create a user via Supabase Auth with the demo UUID first, OR
2. Modify the UUID and email in the seed file to match an existing user

### RLS Policy Errors

If you get RLS policy errors:
- Ensure RLS is properly disabled in the seed file (it should be)
- Check that the transaction is being used (BEGIN/COMMIT)
- Verify you're running as a superuser or service role

## Adding More Seed Data

To add more demo data:
1. Edit `seed_demo_data.sql`
2. Add INSERT statements within the transaction
3. Use `ON CONFLICT` clauses to make inserts idempotent
4. Ensure RLS is disabled for your tables
5. Test locally before committing

## Separation from Migrations

**Why is seed data separate from migrations?**

- **Migrations** = Schema changes (DDL)
  - Tables, columns, constraints
  - Indexes, functions, triggers
  - RLS policies
  - Safe to run in production

- **Seed Data** = Demo data (DML)
  - Sample profiles, properties
  - Test data for development
  - NOT safe for production
  - Should be manually applied

This separation ensures:
- ✅ `supabase db push` only applies schema changes
- ✅ Production databases don't get test data
- ✅ Clean separation of concerns
- ✅ Developers can choose when to load demo data
