#!/bin/bash

# =====================================================
# Signup Fix Verification Script
# =====================================================
# 
# This script verifies that Migration 045 has been 
# applied correctly and the signup fix is working.
#
# Usage: 
#   ./scripts/verify-signup-fix.sh
#
# Requirements:
#   - Supabase CLI installed (supabase)
#   - PostgreSQL client (psql) if using direct connection
#   - jq for JSON parsing (optional)
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Signup Fix Verification Script"
echo "  Migration 045: Admin Whitelist & Signup Fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to print test result
print_result() {
  local test_name=$1
  local result=$2
  local message=$3
  
  if [ "$result" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    ((PASSED++))
  elif [ "$result" = "FAIL" ]; then
    echo -e "${RED}✗${NC} $test_name"
    echo -e "  ${RED}Error: $message${NC}"
    ((FAILED++))
  elif [ "$result" = "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $test_name"
    echo -e "  ${YELLOW}Warning: $message${NC}"
    ((WARNINGS++))
  else
    echo -e "${BLUE}ℹ${NC} $test_name: $message"
  fi
}

# Function to run SQL query via Supabase CLI
run_query() {
  local query=$1
  supabase db query "$query" 2>&1 || echo "ERROR"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Supabase CLI
if command -v supabase &> /dev/null; then
  print_result "Supabase CLI installed" "PASS"
else
  print_result "Supabase CLI installed" "FAIL" "Install via: npm install -g supabase"
  exit 1
fi

# Check if linked to project
if supabase status &> /dev/null; then
  print_result "Connected to Supabase project" "PASS"
else
  print_result "Connected to Supabase project" "FAIL" "Run: supabase link --project-ref YOUR_PROJECT_ID"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Database Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check admin_whitelist table exists
result=$(run_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_whitelist';")
if echo "$result" | grep -q "1"; then
  print_result "admin_whitelist table exists" "PASS"
else
  print_result "admin_whitelist table exists" "FAIL" "Migration 045 not applied. Run: supabase db push"
fi

# Check profiles table exists
result=$(run_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';")
if echo "$result" | grep -q "1"; then
  print_result "profiles table exists" "PASS"
else
  print_result "profiles table exists" "FAIL" "Run database migrations"
fi

# Check admin_whitelist columns
result=$(run_query "SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_whitelist' AND column_name IN ('email', 'created_at', 'notes');")
if echo "$result" | grep -q "email"; then
  print_result "admin_whitelist has required columns" "PASS"
else
  print_result "admin_whitelist has required columns" "FAIL" "Table schema incorrect"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Triggers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check on_auth_user_created trigger
result=$(run_query "SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass;")
if echo "$result" | grep -q "1"; then
  print_result "on_auth_user_created trigger exists" "PASS"
else
  print_result "on_auth_user_created trigger exists" "FAIL" "Trigger not installed"
fi

# Check on_profile_check_admin_whitelist trigger
result=$(run_query "SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_profile_check_admin_whitelist' AND tgrelid = 'public.profiles'::regclass;")
if echo "$result" | grep -q "1"; then
  print_result "on_profile_check_admin_whitelist trigger exists" "PASS"
else
  print_result "on_profile_check_admin_whitelist trigger exists" "FAIL" "Trigger not installed"
fi

# Check trigger is enabled
result=$(run_query "SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';")
if echo "$result" | grep -q "O"; then
  print_result "on_auth_user_created trigger is enabled" "PASS"
else
  print_result "on_auth_user_created trigger is enabled" "WARN" "Trigger might be disabled"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check handle_new_user function exists
result=$(run_query "SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user';")
if echo "$result" | grep -q "1"; then
  print_result "handle_new_user function exists" "PASS"
else
  print_result "handle_new_user function exists" "FAIL" "Function not created"
fi

# Check handle_new_user is SECURITY DEFINER
result=$(run_query "SELECT prosecdef FROM pg_proc WHERE proname = 'handle_new_user';")
if echo "$result" | grep -q "t"; then
  print_result "handle_new_user is SECURITY DEFINER" "PASS"
else
  print_result "handle_new_user is SECURITY DEFINER" "FAIL" "Function should be SECURITY DEFINER"
fi

# Check handle_new_user checks admin_whitelist
result=$(run_query "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';")
if echo "$result" | grep -q "admin_whitelist"; then
  print_result "handle_new_user checks admin_whitelist" "PASS"
else
  print_result "handle_new_user checks admin_whitelist" "FAIL" "Function doesn't check whitelist"
fi

# Check check_and_promote_admin function exists
result=$(run_query "SELECT COUNT(*) FROM pg_proc WHERE proname = 'check_and_promote_admin';")
if echo "$result" | grep -q "1"; then
  print_result "check_and_promote_admin function exists" "PASS"
else
  print_result "check_and_promote_admin function exists" "FAIL" "Function not created"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Checking RLS Policies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check RLS enabled on admin_whitelist
result=$(run_query "SELECT rowsecurity FROM pg_tables WHERE tablename = 'admin_whitelist';")
if echo "$result" | grep -q "t"; then
  print_result "RLS enabled on admin_whitelist" "PASS"
else
  print_result "RLS enabled on admin_whitelist" "FAIL" "RLS should be enabled"
fi

# Check RLS enabled on profiles
result=$(run_query "SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';")
if echo "$result" | grep -q "t"; then
  print_result "RLS enabled on profiles" "PASS"
else
  print_result "RLS enabled on profiles" "FAIL" "RLS should be enabled"
fi

# Check admin_whitelist has policies
result=$(run_query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'admin_whitelist';")
count=$(echo "$result" | grep -oE '[0-9]+' | head -1)
if [ "$count" -ge 4 ]; then
  print_result "admin_whitelist has RLS policies" "PASS" "$count policies found"
else
  print_result "admin_whitelist has RLS policies" "WARN" "Expected 4 policies, found $count"
fi

# Check profiles has policies
result=$(run_query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';")
count=$(echo "$result" | grep -oE '[0-9]+' | head -1)
if [ "$count" -ge 3 ]; then
  print_result "profiles has RLS policies" "PASS" "$count policies found"
else
  print_result "profiles has RLS policies" "WARN" "Expected at least 3 policies, found $count"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Checking Environment (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check .env file exists
if [ -f ".env" ]; then
  print_result ".env file exists" "PASS"
  
  # Check VITE_SUPABASE_URL
  if grep -q "VITE_SUPABASE_URL=" .env; then
    url=$(grep "VITE_SUPABASE_URL=" .env | cut -d'=' -f2)
    if [[ $url == https://*.supabase.co ]]; then
      print_result "VITE_SUPABASE_URL is set" "PASS"
    else
      print_result "VITE_SUPABASE_URL is set" "WARN" "URL format might be incorrect"
    fi
  else
    print_result "VITE_SUPABASE_URL is set" "FAIL" "Not found in .env"
  fi
  
  # Check VITE_SUPABASE_ANON_KEY
  if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
    print_result "VITE_SUPABASE_ANON_KEY is set" "PASS"
  else
    print_result "VITE_SUPABASE_ANON_KEY is set" "FAIL" "Not found in .env"
  fi
  
  # Check for service_role key (security check)
  if grep -qi "service.*role" .env; then
    print_result "No service_role key in .env" "WARN" "Service role key should not be in .env (client-side exposure)"
  else
    print_result "No service_role key in .env" "PASS"
  fi
else
  print_result ".env file exists" "WARN" "Create from .env.example for local development"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "Tests Passed:   ${GREEN}$PASSED${NC}"
echo -e "Tests Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings:       ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  VERIFICATION FAILED${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Please fix the failed checks before deploying to production."
  echo "Refer to: docs/DEPLOYMENT_GUIDE_SIGNUP_FIX.md"
  echo ""
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  VERIFICATION PASSED WITH WARNINGS${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Some non-critical issues were found. Review warnings above."
  echo ""
  exit 0
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ALL CHECKS PASSED${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "✓ Migration 045 is properly installed"
  echo "✓ All database objects are in place"
  echo "✓ Ready for signup testing"
  echo ""
  echo "Next steps:"
  echo "1. Add admin emails to whitelist (see deployment guide)"
  echo "2. Test signup flow (normal + whitelisted)"
  echo "3. Monitor logs for any issues"
  echo ""
  exit 0
fi
