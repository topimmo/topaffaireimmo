# Supabase Remediation - Quick Reference Card

## 🚨 EMERGENCY: Critical Security Fix (30 minutes)

If you only have time for one thing, do this NOW:

```sql
-- 1. Revoke admin table access from anon
REVOKE ALL ON public.admin_audit_logs FROM anon, authenticated;
REVOKE ALL ON public.admin_notifications FROM anon, authenticated;

-- 2. Verify sensitive lead data is protected
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('property_leads', 'advertising_inquiries')
  AND cmd = 'SELECT';
-- Should NOT show policies for 'anon' role

-- 3. Revoke sensitive column access
REVOKE SELECT (email, phone) ON public.property_leads FROM anon, authenticated;
REVOKE SELECT (email, phone) ON public.advertising_inquiries FROM anon, authenticated;

-- 4. Test forms still work (in browser or API client)
-- Submit a test lead/inquiry - should work
-- Try to read leads as anon - should fail
```

**✅ Done!** You've secured the critical issues. Schedule remaining fixes during low-traffic hours.

---

## 📋 Full Rollout Checklist (Copy to Your Project Management Tool)

### Phase 1: Assessment (1 hour, anytime)
```
[ ] Run Section A queries → List security issues
[ ] Run Section B queries → List performance issues  
[ ] Document current state
[ ] Schedule maintenance windows
```

### Phase 2: Security (30 min, anytime)
```
[ ] Execute Section D (Critical Security Fixes)
[ ] Verify anon cannot read admin tables
[ ] Verify anon cannot read leads/inquiries
[ ] Test forms still accept submissions
```

### Phase 3: Indexes Batch 1 (1 hour, 2-4 AM)
```
[ ] Create idx_property_views_property_created
[ ] Create idx_property_leads_advertiser_status_created
[ ] Create idx_contact_clicks_property_created
[ ] Create idx_advertising_inquiries_status_created
[ ] Run EXPLAIN to verify index usage
```

### Phase 4: Indexes Batch 2 (1 hour, 2-4 AM next day)
```
[ ] Create idx_property_leads_email
[ ] Create idx_property_leads_phone
[ ] Create idx_property_views_user_created
[ ] Create idx_contact_clicks_type_created
[ ] Create idx_property_leads_source_created
[ ] Create idx_advertising_inquiries_email
[ ] Performance test (Section G.3)
```

### Phase 5: Function Security (15 min, anytime)
```
[ ] List vulnerable functions (Section F.1)
[ ] Fix update_property_leads_updated_at
[ ] Fix any other SECURITY DEFINER functions
[ ] Verify all secured (Section F.5)
[ ] Test triggers still work
```

### Phase 6: Verification (30 min, anytime)
```
[ ] Run Section G.1 (Security checks) - all pass
[ ] Run Section G.2 (Performance checks) - all pass
[ ] Run Section G.3 (Test queries) - use indexes
[ ] Check Security Advisor - issues reduced
```

### Phase 7: Monitoring (24-48 hours)
```
[ ] Monitor Supabase Dashboard
[ ] Monitor application logs
[ ] Run Section J monitoring queries
[ ] Document final results
```

---

## 🎯 Critical SQL Snippets

### Check if RLS is Enabled
```sql
SELECT tablename, 
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('property_leads', 'advertising_inquiries');
```

### Check anon Permissions
```sql
SELECT table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon' 
  AND table_name LIKE '%lead%' OR table_name LIKE '%inquir%';
```

### Create Index (Safe for Production)
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name
ON table_name(column1, column2 DESC);
```

### Check Index Usage
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM table_name 
WHERE column1 = 'value' 
ORDER BY column2 DESC;
-- Look for "Index Scan using idx_name"
```

### Drop Index (Rollback)
```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_name;
```

### Fix SECURITY DEFINER Function
```sql
ALTER FUNCTION function_name() SET search_path = public;
```

### Monitor Slow Queries
```sql
SELECT queryid, substring(query, 1, 80), 
  mean_exec_time::numeric(10,2) as mean_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC LIMIT 10;
```

---

## 🔥 Troubleshooting

### "Index already exists" error
```sql
-- Use IF NOT EXISTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table(col);
```

### "Permission denied" error
```sql
-- Check your role
SELECT current_user, current_database();

-- May need to be postgres role (Supabase gives you this)
```

### Forms stopped working
```sql
-- Check if INSERT policy exists for anon
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'property_leads' AND cmd = 'INSERT';

-- Should see policy with roles including 'anon' or 'public'
```

### Queries still slow after indexes
```sql
-- Check if index is being used
EXPLAIN (ANALYZE) SELECT ... ;

-- May need to ANALYZE table
ANALYZE table_name;

-- Check index exists
\di+ idx_name
```

### Index creation stuck
```sql
-- Check progress
SELECT * FROM pg_stat_progress_create_index;

-- If stuck, can cancel (safe with CONCURRENTLY)
-- Find PID from above query, then:
SELECT pg_cancel_backend(pid);
```

---

## 📊 Expected Results

### Security Metrics

| Metric | Before | After |
|--------|--------|-------|
| Security Advisor Issues | 5 | 0 |
| Tables without RLS | 3 | 0 |
| anon can read admin tables | Yes ❌ | No ✅ |
| anon can read lead emails/phones | Yes ❌ | No ✅ |
| SECURITY DEFINER without search_path | 2+ | 0 |

### Performance Metrics

| Query | Before | After |
|-------|--------|-------|
| Property analytics (30 days) | 5-10s | <100ms |
| Advertiser lead dashboard | 2-5s | <50ms |
| Admin inquiry list | 1-3s | <200ms |
| Contact click analytics | 3-8s | <100ms |
| Lead source attribution | 5-10s | <150ms |

---

## 🔄 One-Liner Status Checks

Copy-paste these to check progress:

```sql
-- Security status
SELECT 
  COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as tables_without_rls,
  COUNT(CASE WHEN prosecdef AND proconfig IS NULL THEN 1 END) as vulnerable_functions
FROM pg_tables 
FULL JOIN pg_proc ON true 
WHERE schemaname = 'public';

-- Performance status  
SELECT 
  COUNT(*) as indexes_created,
  pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

-- Overall health
SELECT 
  (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 100) as slow_queries,
  (SELECT COUNT(*) FROM pg_stat_user_tables WHERE n_dead_tup > n_live_tup * 0.2) as bloated_tables;
```

---

## 📁 File Reference

- **Main SQL File:** `docs/SUPABASE_SECURITY_PERFORMANCE_REMEDIATION_PLAN.sql`  
  → Copy-paste sections into Supabase SQL Editor

- **Full Guide:** `docs/SUPABASE_SECURITY_PERFORMANCE_REMEDIATION_GUIDE.md`  
  → Read for detailed explanations

- **This Card:** `docs/SUPABASE_REMEDIATION_QUICK_REFERENCE.md`  
  → Keep open during execution

---

## ⏱️ Time Estimates

- **Security only:** 45 minutes (Phases 1-2, 5-6)
- **Performance only:** 3 hours (Phases 1, 3-4, 6)
- **Full remediation:** 4-5 hours (All phases)
- **Ongoing monitoring:** 15 min/day for first week

---

## 🎓 Learn More

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [SECURITY DEFINER Best Practices](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

---

**Need Help?** Refer to full guide or contact DevOps team.

**Version:** 1.0 | **Date:** 2026-02-05
