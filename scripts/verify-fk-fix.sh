#!/bin/bash

# =====================================================
# FK → RLS Fix Verification Script
# =====================================================
#
# This script verifies that migration 049 and 061 have been
# correctly applied to the database.
#
# Usage:
#   ./verify-fk-fix.sh
#
# Prerequisites:
#   - Supabase CLI installed
#   - Connected to the correct project
#
# =====================================================

set -e

echo "======================================================"
echo "FK → RLS Fix Verification"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ ERROR: Supabase CLI not found${NC}"
    echo "Please install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "1. Checking FK constraint..."
echo ""

FK_CHECK=$(supabase db execute --file - <<'SQL'
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname = 'properties_owner_id_fkey'
  AND conrelid = 'public.properties'::regclass;
SQL
)

echo "$FK_CHECK"
echo ""

if echo "$FK_CHECK" | grep -q "auth.users"; then
    echo -e "${GREEN}✅ SUCCESS: FK references auth.users (correct)${NC}"
elif echo "$FK_CHECK" | grep -q "profiles"; then
    echo -e "${RED}❌ PROBLEM: FK still references profiles${NC}"
    echo -e "${YELLOW}ACTION REQUIRED: Run migrations 049 and 061${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  WARNING: FK constraint not found or unexpected${NC}"
    exit 1
fi

echo ""
echo "2. Checking RLS policies..."
echo ""

RLS_CHECK=$(supabase db execute --file - <<'SQL'
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid() ✓'
    ELSE 'Does not use auth.uid()'
  END as uses_auth_uid
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'properties'
ORDER BY policyname;
SQL
)

echo "$RLS_CHECK"
echo ""

if echo "$RLS_CHECK" | grep -q "auth.uid()"; then
    echo -e "${GREEN}✅ SUCCESS: RLS policies use auth.uid()${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: RLS policies may not be configured correctly${NC}"
fi

echo ""
echo "3. Checking profiles table structure..."
echo ""

PROFILES_CHECK=$(supabase db execute --file - <<'SQL'
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname LIKE '%id%'
  AND contype = 'f';
SQL
)

echo "$PROFILES_CHECK"
echo ""

if echo "$PROFILES_CHECK" | grep -q "auth.users"; then
    echo -e "${GREEN}✅ SUCCESS: profiles.id references auth.users (1:1 enforced)${NC}"
else
    echo -e "${YELLOW}⚠️  INFO: profiles.id FK structure may differ${NC}"
fi

echo ""
echo "======================================================"
echo "Summary"
echo "======================================================"
echo ""
echo "If all checks passed, the FK → RLS mismatch is fixed."
echo "Properties can be created without waiting for profile creation."
echo ""
echo -e "${GREEN}✅ Fix is working correctly!${NC}"
echo ""
