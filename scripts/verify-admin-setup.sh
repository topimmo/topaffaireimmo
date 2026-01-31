#!/bin/bash

# Admin Setup Verification Script
# This script helps verify that the admin user is properly configured

echo "========================================="
echo "Admin Setup Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo -e "${GREEN}✓${NC} .env file found"

# Check environment variables
if ! grep -q "VITE_SUPABASE_URL" .env; then
    echo -e "${RED}❌ VITE_SUPABASE_URL not found in .env${NC}"
    exit 1
fi

if ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY not found in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase environment variables configured"
echo ""

echo "========================================="
echo "Next Steps for Admin Setup:"
echo "========================================="
echo ""
echo "1. Log into Supabase Dashboard:"
echo "   https://supabase.com/dashboard"
echo ""
echo "2. Go to SQL Editor and run the following queries:"
echo ""
echo -e "${YELLOW}-- Check if admins table exists:${NC}"
echo "SELECT * FROM public.admins;"
echo ""
echo -e "${YELLOW}-- Check your user ID (replace with your email):${NC}"
echo "SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';"
echo ""
echo -e "${YELLOW}-- Add yourself as admin (replace <user-id> with ID from above):${NC}"
echo "INSERT INTO public.admins (user_id) VALUES ('<user-id>');"
echo ""
echo -e "${YELLOW}-- Verify admin was added:${NC}"
echo "SELECT a.user_id, u.email"
echo "FROM public.admins a"
echo "JOIN auth.users u ON a.user_id = u.id;"
echo ""
echo "========================================="
echo "Testing in Browser:"
echo "========================================="
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Login with your admin account"
echo ""
echo "3. Open browser DevTools Console (F12)"
echo ""
echo "4. Run this test:"
echo ""
echo "   const { data: { user } } = await supabase.auth.getUser();"
echo "   console.log('User ID:', user?.id, 'Email:', user?.email);"
echo "   "
echo "   const { data, error } = await supabase"
echo "     .from('admins')"
echo "     .select('user_id')"
echo "     .eq('user_id', user.id)"
echo "     .single();"
echo "   "
echo "   console.log('Admin Status:', { isAdmin: !!data, error });"
echo ""
echo "5. Try to approve/reject a listing and watch the console logs"
echo ""
echo "========================================="
echo "Troubleshooting:"
echo "========================================="
echo ""
echo "If approval/rejection doesn't work:"
echo ""
echo "• Check console logs for error messages"
echo "• Verify you're in the admins table (query above)"
echo "• Check RLS policies are correct:"
echo "  SELECT * FROM pg_policies WHERE tablename = 'properties';"
echo ""
echo "See ROOT_CAUSE_ANALYSIS_APPROVE_REJECT.md for detailed diagnostics"
echo ""
