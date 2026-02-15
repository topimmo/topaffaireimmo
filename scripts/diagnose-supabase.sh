#!/bin/bash
# Supabase Diagnostic Script (Bash version)
# 
# This script provides a quick diagnostic of Supabase migrations and configuration.
# For detailed analysis, use: npx tsx scripts/diagnose-supabase.ts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo "================================================================================"
echo -e "${BOLD}${CYAN}SUPABASE DIAGNOSTIC SCRIPT${NC}"
echo "================================================================================"
echo ""
echo "This is a simplified diagnostic script."
echo "For comprehensive analysis, run: npx tsx scripts/diagnose-supabase.ts"
echo ""

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}Error: supabase/migrations directory not found${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "--------------------------------------------------------------------------------"
echo -e "${BOLD}Local Migrations Count${NC}"
echo "--------------------------------------------------------------------------------"

# Count migrations
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" ! -name "REMEDIATION*" | wc -l)
echo -e "${GREEN}Total SQL migration files: ${MIGRATION_COUNT}${NC}"

# List first and last
FIRST_MIGRATION=$(ls supabase/migrations/*.sql 2>/dev/null | head -1 | xargs basename)
LAST_MIGRATION=$(ls supabase/migrations/*.sql 2>/dev/null | tail -1 | xargs basename)

echo "First: ${FIRST_MIGRATION}"
echo "Last:  ${LAST_MIGRATION}"
echo ""

echo "--------------------------------------------------------------------------------"
echo -e "${BOLD}Search for Known Issues${NC}"
echo "--------------------------------------------------------------------------------"

# Search for site_settings
echo -e "\n${CYAN}Searching for 'site_settings' references...${NC}"
SITE_SETTINGS_COUNT=$(grep -r "site_settings" supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "Found in ${SITE_SETTINGS_COUNT} lines across migrations"

# Check for description column issue
echo -e "\n${YELLOW}Checking migration 074 for description column issue...${NC}"
if [ -f "supabase/migrations/074_fix_site_settings_contact_fields.sql" ]; then
    if grep -q "description_fr" supabase/migrations/074_fix_site_settings_contact_fields.sql; then
        echo -e "${GREEN}✓ Migration 074 uses description_fr (correct)${NC}"
    elif grep -q ", description" supabase/migrations/074_fix_site_settings_contact_fields.sql; then
        echo -e "${RED}⚠️  Migration 074 uses 'description' column - THIS WILL FAIL${NC}"
        echo "   The site_settings table has 'description_fr' and 'description_ar', not 'description'"
        echo "   Fix required before applying migrations!"
    fi
else
    echo "Migration 074 not found (may have different naming)"
fi

# Check for auth.users modifications
echo -e "\n${CYAN}Checking for auth.users modifications...${NC}"
AUTH_USERS_ALTERS=$(grep -r "ALTER TABLE auth.users\|UPDATE auth.users\|INSERT INTO auth.users" supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ "$AUTH_USERS_ALTERS" -eq "0" ]; then
    echo -e "${GREEN}✓ No direct auth.users modifications found${NC}"
else
    echo -e "${RED}⚠️  Found ${AUTH_USERS_ALTERS} potential auth.users modifications${NC}"
    echo "   Review these carefully - auth.users should not be directly modified"
fi

# Check environment files
echo ""
echo "--------------------------------------------------------------------------------"
echo -e "${BOLD}Environment Check${NC}"
echo "--------------------------------------------------------------------------------"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check for required variables (without showing values)
    REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env 2>/dev/null; then
            echo -e "${GREEN}  ✓ ${var} is set${NC}"
        else
            echo -e "${YELLOW}  ⚠️  ${var} not found or not set${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "   Copy from .env.example: cp .env.example .env"
fi

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example exists (template)${NC}"
fi

# SQL queries section
echo ""
echo "================================================================================"
echo -e "${BOLD}${CYAN}NEXT STEPS${NC}"
echo "================================================================================"
echo ""
echo -e "${BOLD}1. Check remote migrations in Supabase SQL Editor:${NC}"
echo ""
cat << 'EOF'
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
EOF

echo ""
echo -e "${BOLD}2. Verify site_settings table structure:${NC}"
echo ""
cat << 'EOF'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'site_settings'
ORDER BY ordinal_position;
EOF

echo ""
echo -e "${BOLD}3. Link to Supabase project and apply migrations:${NC}"
echo ""
echo "   npx supabase login"
echo "   npx supabase link --project-ref YOUR_PROJECT_ID"
echo "   npx supabase db push"

echo ""
echo -e "${BOLD}4. For detailed diagnostics, run:${NC}"
echo ""
echo "   npx tsx scripts/diagnose-supabase.ts"

echo ""
echo -e "${BOLD}5. Read the full diagnostic report:${NC}"
echo ""
echo "   cat DIAGNOSTIC_REPORT.md"

echo ""
echo "================================================================================"
echo -e "${GREEN}Diagnostic complete!${NC}"
echo "================================================================================"
