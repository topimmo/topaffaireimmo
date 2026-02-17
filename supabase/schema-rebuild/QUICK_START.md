# Quick Start Guide - Supabase Schema Rebuild

> **⚡ Fast deployment guide for TopAffaireImmo database schema**

---

## 🚀 One-Line Deploy

```bash
# Via psql (recommended for production)
cat 01_types.sql 02_tables.sql 03_indexes.sql 04_rls.sql 05_triggers.sql 06_seed.sql | psql $DATABASE_URL

# Or one by one (safer, easier to debug)
psql $DATABASE_URL -f 01_types.sql
psql $DATABASE_URL -f 02_tables.sql
psql $DATABASE_URL -f 03_indexes.sql
psql $DATABASE_URL -f 04_rls.sql
psql $DATABASE_URL -f 05_triggers.sql
psql $DATABASE_URL -f 06_seed.sql
```

---

## 📋 What This Creates

| Component | Count | Details |
|-----------|-------|---------|
| **Tables** | 40+ | Complete app schema |
| **Indexes** | 150+ | Full-text search, performance |
| **RLS Policies** | 100+ | Security layer |
| **RPC Functions** | 22 | Business logic |
| **Triggers** | 21 | Auto-updates |
| **Cities** | 18 | Morocco coverage |
| **Neighborhoods** | 80+ | Major cities |
| **Service Categories** | 12 | Home services |

---

## ✅ Post-Deployment Checklist

### 1. Verify Schema

```bash
psql $DATABASE_URL -f VERIFICATION.sql
```

**Expected output:**
```
✓ Tables: 40+
✓ Indexes: 150+
✓ RLS enabled: 40+ tables
✓ Functions: 22
✓ Cities: 18
✓ Neighborhoods: 80+
```

### 2. Create First Admin

```sql
-- In Supabase SQL Editor or psql
INSERT INTO admin_whitelist (email) VALUES ('admin@example.com');

-- Then have that user sign up via your app
-- They will automatically get admin role
```

### 3. Setup Storage Buckets

Run the setup script:

```bash
node scripts/setup-storage-buckets.js
```

Or manually in Supabase Dashboard:

| Bucket | Public | Max Size | File Types |
|--------|--------|----------|------------|
| property-images | ✓ | 5MB | image/jpeg, image/png, image/webp |
| artisan-avatars | ✓ | 2MB | image/jpeg, image/png |
| banner-images | ✓ | 5MB | image/jpeg, image/png, image/gif |
| payment-receipts | ✗ | 10MB | image/*, application/pdf |
| agency-logos | ✓ | 2MB | image/jpeg, image/png, image/svg+xml |

### 4. Generate TypeScript Types

```bash
npm run types:supabase
```

---

## 🔍 Quick Tests

### Test 1: Check Tables

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Test 2: Verify RLS

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All should show `rowsecurity = true` ✓

### Test 3: Test Admin Function

```sql
-- Replace with actual admin user_id
SELECT is_admin(); -- Should return true for admins
```

### Test 4: Check Seed Data

```sql
SELECT name_fr FROM cities ORDER BY name_fr;
```

Should return: Agadir, Casablanca, Essaouira, Fès, Marrakech, etc.

---

## 🎯 Common Commands

### Count Tables

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### List All Indexes

```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### Check Function Signatures

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### View RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 🐛 Troubleshooting

### Error: "relation already exists"

**Solution:** Drop the table first (destructive!)

```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

Or skip that table if it's correct.

### Error: "permission denied"

**Solution:** Run as superuser or use Supabase service role

```bash
psql $SERVICE_ROLE_DATABASE_URL -f migration.sql
```

### Error: "function does not exist"

**Solution:** Make sure to run `05_triggers.sql` which contains all RPC functions.

---

## 📚 File Reference

| File | Purpose | Lines |
|------|---------|-------|
| `01_types.sql` | Enums and custom types | 30 |
| `02_tables.sql` | All table definitions | 741 |
| `03_indexes.sql` | Performance indexes | 256 |
| `04_rls.sql` | Security policies | 680 |
| `05_triggers.sql` | Triggers + RPC functions | 692 |
| `06_seed.sql` | Reference data | 307 |
| `VERIFICATION.sql` | Post-migration checks | 84 |
| `README.md` | Detailed documentation | 380 |

---

## 🔗 Full Documentation

- **Complete Schema Plan:** `/SUPABASE_SCHEMA_PLAN.md`
- **Migration Guide:** `README.md` (in this directory)
- **Verification:** `VERIFICATION.sql`

---

## 💡 Pro Tips

1. **Always backup before migration**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Test in development first**
   - Never run directly in production
   - Test with sample data
   - Verify app still works

3. **Use transactions for safety**
   ```sql
   BEGIN;
   \i 01_types.sql
   \i 02_tables.sql
   -- ... etc
   COMMIT; -- or ROLLBACK if something went wrong
   ```

4. **Monitor performance**
   - Check slow query log after migration
   - Analyze table statistics: `ANALYZE;`
   - Update planner statistics: `VACUUM ANALYZE;`

---

**Ready to deploy? Start with step 1! 🚀**
