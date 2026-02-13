# Marketplace System - Testing & Implementation Guide

## Test Plan Overview

This document provides a comprehensive testing strategy for the marketplace system. Tests are organized by feature area with specific scenarios and expected results.

---

## Phase 1: Database Schema Tests

### Test 1.1: Junction Table Migration

**Objective**: Verify artisan_profile_neighborhoods table created correctly

**Pre-conditions**:
- Run migration `093_create_artisan_profile_neighborhoods_join_table.sql`

**Test Steps**:
```sql
-- 1. Verify table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'artisan_profile_neighborhoods';

-- 2. Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'artisan_profile_neighborhoods'
ORDER BY ordinal_position;

-- 3. Verify foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'artisan_profile_neighborhoods'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Verify unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'artisan_profile_neighborhoods'
  AND constraint_type = 'UNIQUE';

-- 5. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'artisan_profile_neighborhoods';
```

**Expected Results**:
- ✅ Table `artisan_profile_neighborhoods` exists
- ✅ Columns: id (UUID), artisan_profile_id (UUID), neighborhood_id (INTEGER), created_at (TIMESTAMPTZ)
- ✅ FK to `artisan_profiles.id` ON DELETE CASCADE
- ✅ FK to `neighborhoods.id` ON DELETE CASCADE
- ✅ UNIQUE constraint on `(artisan_profile_id, neighborhood_id)`
- ✅ Indexes on artisan_profile_id, neighborhood_id, and composite

**Pass Criteria**: All verifications pass

---

### Test 1.2: Data Migration from Array to Join Table

**Objective**: Verify existing neighborhood_ids data migrated to junction table

**Pre-conditions**:
- Existing artisan_profiles with neighborhood_ids array populated
- Migration 093 run successfully

**Test Steps**:
```sql
-- 1. Check if migration copied data
SELECT COUNT(*) as total_associations 
FROM artisan_profile_neighborhoods;

-- 2. Compare counts (if old column still exists)
SELECT 
  ap.id,
  ap.business_name,
  COALESCE(array_length(ap.neighborhood_ids, 1), 0) as old_count,
  COUNT(apn.neighborhood_id) as new_count
FROM artisan_profiles ap
LEFT JOIN artisan_profile_neighborhoods apn ON apn.artisan_profile_id = ap.id
WHERE ap.neighborhood_ids IS NOT NULL
GROUP BY ap.id, ap.business_name, ap.neighborhood_ids;

-- 3. Check for orphaned records
SELECT * FROM artisan_profile_neighborhoods apn
WHERE NOT EXISTS (
  SELECT 1 FROM artisan_profiles WHERE id = apn.artisan_profile_id
)
OR NOT EXISTS (
  SELECT 1 FROM neighborhoods WHERE id = apn.neighborhood_id
);
```

**Expected Results**:
- ✅ All neighborhoods from arrays are in junction table
- ✅ Counts match between old and new structure
- ✅ No orphaned records
- ✅ No duplicates (unique constraint enforced)

**Pass Criteria**: Data integrity maintained, all records migrated

---

### Test 1.3: Requests Table Creation

**Objective**: Verify requests table structure and constraints

**Test Steps**:
```sql
-- 1. Verify table and columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'requests'
ORDER BY ordinal_position;

-- 2. Verify CHECK constraints
SELECT 
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'requests'
  AND con.contype = 'c'; -- CHECK constraints

-- 3. Verify foreign keys
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'requests'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Verify triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'requests';
```

**Expected Results**:
- ✅ All required columns present
- ✅ Status CHECK constraint with valid values
- ✅ Urgency CHECK constraint  with valid values
- ✅ Budget constraints (budget_max >= budget_min)
- ✅ FKs to client_id, artisan_profile_id, service_category_id, city_id
- ✅ Triggers: updated_at, auto_update_view_status, auto_log_status

**Pass Criteria**: All constraints and triggers present

---

### Test 1.4: Reviews Table Creation

**Objective**: Verify reviews table structure and rating constraints

**Test Steps**:
```sql
-- 1. Check rating constraints
INSERT INTO reviews (client_id, artisan_profile_id, rating, review_text)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM artisan_profiles LIMIT 1),
  6, -- Invalid rating
  'Test'
);
-- Expected: ERROR - rating must be 1-5

-- 2. Verify unique constraint
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'reviews'
  AND constraint_type = 'UNIQUE';

-- 3. Test rating stats function
SELECT * FROM get_artisan_rating_stats(
  (SELECT id FROM artisan_profiles LIMIT 1)
);
```

**Expected Results**:
- ✅ Rating constraint rejects values outside 1-5 range
- ✅ UNIQUE constraint on (client_id, artisan_profile_id, request_id)
- ✅ Rating stats function returns correct structure

**Pass Criteria**: All constraints work, function executes

---

## Phase 2: Row-Level Security Tests

### Test 2.1: Artisan Profile Neighborhoods RLS

**Objective**: Verify RLS policies work correctly

**Test Scenarios**:

#### Scenario A: Public Read Access
```sql
-- Test as anonymous user
SET ROLE anon;

SELECT * FROM artisan_profile_neighborhoods
LIMIT 10;

-- Expected: SUCCESS - public can view
```

#### Scenario B: Artisan Insert Own
```sql
-- Test as authenticated artisan
SET ROLE authenticated;
SET request.jwt.claim.sub = '<artisan-user-id>';

-- Insert neighborhood for own profile
INSERT INTO artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
VALUES ('<own-artisan-profile-id>', 1);

-- Expected: SUCCESS

-- Try insert for another artisan's profile
INSERT INTO artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
VALUES ('<other-artisan-profile-id>', 1);

-- Expected: ERROR - policy violation
```

#### Scenario C: Artisan Delete Own
```sql
-- Delete own neighborhood
DELETE FROM artisan_profile_neighborhoods
WHERE artisan_profile_id = '<own-artisan-profile-id>'
  AND neighborhood_id = 1;

-- Expected: SUCCESS

-- Try delete another's neighborhood
DELETE FROM artisan_profile_neighborhoods
WHERE artisan_profile_id = '<other-artisan-profile-id>'
  AND neighborhood_id = 1;

-- Expected: ERROR - policy violation
```

**Pass Criteria**: All scenarios behave as expected

---

### Test 2.2: Requests RLS Policies

**Test Scenarios**:

#### Scenario A: Client Create Request
```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = '<client-user-id>';

-- Create request to artisan
SELECT * FROM create_service_request(
  p_artisan_profile_id := '<artisan-profile-id>',
  p_title := 'Need plumbing repair',
  p_description := 'Leaking pipe in kitchen',
  p_client_phone := '+212600000000'
);

-- Expected: SUCCESS
```

#### Scenario B: Client View Own Requests
```sql
SELECT * FROM requests
WHERE client_id = '<client-user-id>';

-- Expected: SUCCESS - see own requests

SELECT * FROM requests
WHERE client_id = '<other-client-user-id>';

-- Expected: EMPTY - cannot see others' requests
```

#### Scenario C: Artisan View Received Requests
```sql
SET request.jwt.claim.sub = '<artisan-user-id>';

SELECT * FROM requests
WHERE artisan_profile_id IN (
  SELECT id FROM artisan_profiles WHERE user_id = '<artisan-user-id>'
);

-- Expected: SUCCESS - see requests sent to them
```

#### Scenario D: Artisan Update Request Status
```sql
UPDATE requests
SET status = 'accepted',
    artisan_response = 'I can help with this'
WHERE id = '<request-id>'
  AND artisan_profile_id IN (
    SELECT id FROM artisan_profiles WHERE user_id = '<artisan-user-id>'
  );

-- Expected: SUCCESS
```

**Pass Criteria**: RLS correctly filters based on user role

---

### Test 2.3: Reviews RLS Policies

**Test Scenarios**:

#### Scenario A: Public Read Reviews
```sql
SET ROLE anon;

SELECT * FROM reviews
WHERE is_hidden = FALSE
LIMIT 10;

-- Expected: SUCCESS - public can view non-hidden reviews

SELECT * FROM reviews
WHERE is_hidden = TRUE
LIMIT 10;

-- Expected: EMPTY - cannot see hidden reviews
```

#### Scenario B: Client Create Review
```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = '<client-user-id>';

INSERT INTO reviews (
  client_id,
  artisan_profile_id,
  rating,
  review_text
) VALUES (
  '<client-user-id>',
  '<artisan-profile-id>',
  5,
  'Excellent service!'
);

-- Expected: SUCCESS
```

#### Scenario C: Artisan Respond to Review
```sql
SET request.jwt.claim.sub = '<artisan-user-id>';

UPDATE reviews
SET artisan_response = 'Thank you for your feedback!',
    artisan_responded_at = NOW()
WHERE artisan_profile_id IN (
  SELECT id FROM artisan_profiles WHERE user_id = '<artisan-user-id>'
)
AND id = '<review-id>';

-- Expected: SUCCESS - can add response

-- Try to change rating (not allowed)
UPDATE reviews
SET rating = 1
WHERE id = '<review-id>';

-- Expected: ERROR - policy prevents rating change
```

**Pass Criteria**: Reviews follow access control rules

---

## Phase 3: Business Logic Tests

### Test 3.1: Neighborhood Validation Trigger

**Objective**: Verify neighborhoods must belong to artisan's city

**Test Steps**:
```sql
-- 1. Get an artisan in Casablanca (city_id = 1)
SELECT id, city_id FROM artisan_profiles WHERE city_id = 1 LIMIT 1;

-- 2. Try to add neighborhood from Rabat (city_id = 2)
INSERT INTO artisan_profile_neighborhoods (
  artisan_profile_id,
  neighborhood_id
) VALUES (
  '<artisan-id-from-casablanca>',
  (SELECT id FROM neighborhoods WHERE city_id = 2 LIMIT 1)
);

-- Expected: ERROR - neighborhood doesn't belong to artisan's city
```

**Expected Result**: ✅ Trigger prevents city mismatch

**Pass Criteria**: Cannot add neighborhoods from different city

---

### Test 3.2: Request Status Auto-Update on View

**Objective**: Status auto-updates from 'pending' to 'viewed' when viewed

**Test Steps**:
```sql
-- 1. Create request with status 'pending'
-- (use create_service_request function)

-- 2. Artisan views request
UPDATE requests
SET viewed_by_artisan_at = NOW()
WHERE id = '<request-id>';

-- 3. Check status
SELECT status FROM requests WHERE id = '<request-id>';

-- Expected: status = 'viewed' (auto-updated by trigger)
```

**Expected Result**: ✅ Status automatically changed

**Pass Criteria**: Trigger updates status correctly

---

### Test 3.3: Request Status History Logging

**Objective**: Status changes are automatically logged

**Test Steps**:
```sql
-- 1. Create request (status: pending)

-- 2. Update status
UPDATE requests SET status = 'viewed' WHERE id = '<request-id>';
UPDATE requests SET status = 'accepted' WHERE id = '<request-id>';

-- 3. Check history
SELECT * FROM request_status_history
WHERE request_id = '<request-id>'
ORDER BY created_at ASC;

-- Expected: 2 records
-- - pending -> viewed
-- - viewed -> accepted
```

**Expected Result**: ✅ All status changes logged

**Pass Criteria**: History accurately reflects changes

---

### Test 3.4: Rating Statistics Calculation

**Objective**: Rating stats function calculates correctly

**Test Steps**:
```sql
-- 1. Create test reviews with known ratings
INSERT INTO reviews (client_id, artisan_profile_id, rating, review_text)
VALUES 
  ('<client1>', '<artisan-id>', 5, 'Excellent'),
  ('<client2>', '<artisan-id>', 4, 'Good'),
  ('<client3>', '<artisan-id>', 5, 'Great');

-- 2. Calculate stats
SELECT * FROM get_artisan_rating_stats('<artisan-id>');

-- Expected:
-- avg_rating: 4.67
-- total_reviews: 3
-- rating_5_count: 2
-- rating_4_count: 1
```

**Expected Result**: ✅ Calculations match manual calculation

**Pass Criteria**: Function returns accurate statistics

---

## Phase 4: Integration Tests

### Test 4.1: Complete Onboarding Flow

**Objective**: Test full artisan onboarding end-to-end

**Test Steps**:

1. **User Registration**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'artisan@test.com',
     password: 'Test123456'
   });
   // Expected: User created, profile auto-created
   ```

2. **Update Role to Artisan**
   ```sql
   UPDATE profiles SET user_role = 'artisan' WHERE id = '<user-id>';
   ```

3. **Create Artisan Profile**
   ```typescript
   const { data, error } = await supabase.rpc('create_my_artisan_profile', {
     p_service_category_id: '<plumbing-category-id>',
     p_business_name: 'Hassan Plumbing',
     p_phone: '+212600000001',
     p_city_id: 1, // Casablanca
     p_neighborhood_ids: [],
     // ... other fields
   });
   // Expected: Profile created with is_verified = false
   ```

4. **Add Neighborhoods**
   ```typescript
   // Delete existing
   await supabase
     .from('artisan_profile_neighborhoods')
     .delete()
     .eq('artisan_profile_id', artisanProfileId);
   
   // Insert new
   const neighborhoods = [1, 2, 3].map(nid => ({
     artisan_profile_id: artisanProfileId,
     neighborhood_id: nid
   }));
   
   await supabase
     .from('artisan_profile_neighborhoods')
     .insert(neighborhoods);
   
   // Expected: 3 neighborhoods added
   ```

5. **Admin Verification**
   ```sql
   UPDATE artisan_profiles
   SET is_verified = TRUE,
       is_active = TRUE,
       verified_at = NOW()
   WHERE id = '<artisan-profile-id>';
   ```

6. **Verify Profile is Searchable**
   ```typescript
   const { data } = await supabase
     .from('artisan_profiles')
     .select(`
       *,
       service_category:service_categories(*),
       city:cities(*),
       neighborhoods:artisan_profile_neighborhoods(
         neighborhood:neighborhoods(*)
       )
     `)
     .eq('id', artisanProfileId)
     .eq('is_verified', true)
     .eq('is_active', true)
     .single();
   
   // Expected: Profile returned with all relations
   ```

**Pass Criteria**: Full flow completes without errors

---

### Test 4.2: Request Creation and Response Flow

**Objective**: Test complete request lifecycle

**Test Steps**:

1. **Client Creates Request**
   ```typescript
   const { data } = await supabase.rpc('create_service_request', {
     p_artisan_profile_id: artisanId,
     p_title: 'Urgent plumbing needed',
     p_description: 'Burst pipe in bathroom',
     p_client_phone: '+212600000002'
   });
   ```

2. **Artisan Views Request**
   ```typescript
   const { data } = await supabase
     .from('requests')
     .update({ viewed_by_artisan_at: new Date().toISOString() })
     .eq('id', requestId)
     .select()
     .single();
   
   // Expected: status changed to 'viewed'
   ```

3. **Artisan Accepts Request**
   ```typescript
   await supabase
     .from('requests')
     .update({
       status: 'accepted',
       artisan_response: 'I can come today at 2pm',
       artisan_responded_at: new Date().toISOString()
     })
     .eq('id', requestId);
   ```

4. **Check Status History**
   ```typescript
   const { data } = await supabase
     .from('request_status_history')
     .select('*')
     .eq('request_id', requestId)
     .order('created_at', { ascending: true });
   
   // Expected: 2 records (pending->viewed, viewed->accepted)
   ```

5. **Complete Request**
   ```typescript
   await supabase
     .from('requests')
     .update({ status: 'completed' })
     .eq('id', requestId);
   ```

6. **Client Leaves Review**
   ```typescript
   await supabase
     .from('reviews')
     .insert({
       client_id: clientId,
       artisan_profile_id: artisanId,
       request_id: requestId,
       rating: 5,
       review_text: 'Fast and professional service'
     });
   ```

**Pass Criteria**: All steps succeed, data consistent

---

## Phase 5: Performance Tests

### Test 5.1: Search Performance

**Objective**: Verify search queries perform well

**Test Query**:
```sql
EXPLAIN ANALYZE
SELECT 
  ap.*,
  sc.name_fr as category_name,
  c.name_fr as city_name,
  COUNT(apn.neighborhood_id) as neighborhood_count
FROM artisan_profiles ap
JOIN service_categories sc ON sc.id = ap.service_category_id
JOIN cities c ON c.id = ap.city_id
LEFT JOIN artisan_profile_neighborhoods apn ON apn.artisan_profile_id = ap.id
WHERE ap.city_id = 1
  AND ap.service_category_id = '<plumbing-id>'
  AND ap.is_verified = TRUE
  AND ap.is_active = TRUE
GROUP BY ap.id, sc.name_fr, c.name_fr
ORDER BY ap.is_boosted DESC, ap.created_at DESC
LIMIT 20;
```

**Expected Results**:
- ✅ Uses index on (city_id, service_category_id, is_verified, is_active)
- ✅ Execution time < 50ms for 10,000 artisans
- ✅ No sequential scans on large tables

**Pass Criteria**: Query executes efficiently with indexes

---

### Test 5.2: Neighborhood Filter Performance

**Objective**: JOIN on junction table performs well

**Test Query**:
```sql
EXPLAIN ANALYZE
SELECT DISTINCT ap.*
FROM artisan_profiles ap
JOIN artisan_profile_neighborhoods apn ON apn.artisan_profile_id = ap.id
WHERE ap.city_id = 1
  AND apn.neighborhood_id IN (1, 2, 3, 4, 5)
  AND ap.is_verified = TRUE
  AND ap.is_active = TRUE
ORDER BY ap.is_boosted DESC
LIMIT 20;
```

**Expected Results**:
- ✅ Uses indexes on junction table
- ✅ Execution time < 100ms
- ✅ Efficient JOIN strategy

**Pass Criteria**: Performance acceptable for production

---

## Phase 6: Error Handling Tests

### Test 6.1: Constraint Violations

**Test**: Duplicate neighborhood assignment
```sql
INSERT INTO artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
VALUES ('<artisan-id>', 1);

-- Try duplicate
INSERT INTO artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
VALUES ('<artisan-id>', 1);

-- Expected: ERROR - unique constraint violation
```

**Pass Criteria**: Appropriate error raised

---

### Test 6.2: Invalid References

**Test**: Invalid artisan_profile_id
```sql
INSERT INTO artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
VALUES ('00000000-0000-0000-0000-000000000000', 1);

-- Expected: ERROR - foreign key violation
```

**Pass Criteria**: FK constraint prevents invalid data

---

## Test Execution Checklist

### Pre-Deployment Testing

- [ ] All migrations run successfully in order
- [ ] No migration errors or warnings
- [ ] All tables created with correct structure
- [ ] All indexes created
- [ ] All triggers created
- [ ] All RLS policies created
- [ ] Sample data seeded successfully

### Schema Validation

- [ ] Junction table has correct FK types (UUID and INTEGER)
- [ ] All foreign keys have ON DELETE actions
- [ ] Unique constraints in place
- [ ] Check constraints validated

### Security Testing

- [ ] RLS enabled on all tables
- [ ] Anonymous users can only read public data
- [ ] Authenticated users can only modify own data
- [ ] Admins have full access
- [ ] No privilege escalation possible

### Functional Testing

- [ ] Artisan onboarding flow works end-to-end
- [ ] Request creation and lifecycle works
- [ ] Review creation and stats work
- [ ] Media upload and display works
- [ ] Status history logging works
- [ ] Validation triggers work

### Performance Testing

- [ ] Search queries use indexes
- [ ] JOIN queries perform well
- [ ] No N+1 query issues
- [ ] Pagination works efficiently

### Integration Testing

- [ ] Supabase client queries work
- [ ] Server actions execute correctly
- [ ] RPC functions callable from client
- [ ] Realtime subscriptions work (if used)

---

## Rollback Plan

If issues are found:

1. **Immediate Rollback**: Use Supabase migration rollback
   ```bash
   supabase db reset --local
   ```

2. **Selective Rollback**: Drop specific tables
   ```sql
   DROP TABLE IF EXISTS artisan_profile_neighborhoods CASCADE;
   DROP TABLE IF EXISTS requests CASCADE;
   -- etc.
   ```

3. **Data Recovery**: Restore from backup if needed

---

## Success Criteria

**All tests must pass before production deployment:**

✅ Schema tests: 100% pass  
✅ RLS tests: 100% pass  
✅ Business logic tests: 100% pass  
✅ Integration tests: 100% pass  
✅ Performance tests: All queries < 100ms  
✅ Error handling: All constraints work  

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Testing Team**: TopAffaireImmo QA
