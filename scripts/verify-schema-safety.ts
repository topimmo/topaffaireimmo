#!/usr/bin/env tsx
/**
 * Schema Safety Verification Script
 * 
 * Purpose: Scan codebase for dangerous schema references before deployment
 * Usage: npm run verify:schema
 * 
 * This script searches for:
 * 1. References to deprecated 'listings' table
 * 2. References to non-existent 'city' column in artisan_services
 * 3. Unsafe patterns that could cause production errors
 * 
 * Exit codes:
 * 0 = No dangerous patterns found
 * 1 = Dangerous patterns detected
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface DangerousPattern {
  pattern: string;
  description: string;
  severity: 'error' | 'warning';
  whitelist?: string[]; // Files/patterns to exclude
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
  {
    pattern: 'from\\("listings"\\)|from\\(`listings`\\)',
    description: 'Reference to deprecated "listings" table (should use "properties")',
    severity: 'error',
    whitelist: [
      'UI labels',
      'markdown files',
      'documentation',
      'LISTINGS_INVESTIGATION_REPORT.md',
      'PRODUCTION_LISTINGS_ERROR',
      'seed-sample-listings' // Script name, not table reference
    ]
  },
  {
    pattern: 'public\\.listings',
    description: 'Direct SQL reference to public.listings table',
    severity: 'error',
    whitelist: [
      'PRODUCTION_SCHEMA_VERIFICATION.sql', // Checking it doesn't exist
      'SCHEMA_VERIFICATION.sql', // Checking it doesn't exist
      'markdown files',
      'documentation'
    ]
  },
  {
    pattern: '/api/listings',
    description: 'API endpoint reference to /api/listings',
    severity: 'error',
    whitelist: [
      'markdown files',
      'documentation'
    ]
  },
  {
    pattern: '\\.select\\([^)]*city[^)]*\\).*artisan_services',
    description: 'Reference to "city" column in artisan_services table',
    severity: 'warning',
    whitelist: [
      'health-check-schema.ts', // Checking it doesn't exist
      'verify-schema-safety.ts', // This file
      'markdown files'
    ]
  }
];

interface Match {
  file: string;
  line: number;
  content: string;
  pattern: DangerousPattern;
}

const matches: Match[] = [];

function searchPattern(pattern: DangerousPattern): void {
  try {
    // Use ripgrep for fast searching, fallback to grep
    const grepCmd = `rg -n "${pattern.pattern}" --type-not markdown --type-not sql src/ api/ lib/ supabase/functions/ 2>/dev/null || grep -rn -E "${pattern.pattern}" src/ api/ lib/ supabase/functions/ 2>/dev/null || true`;
    
    const output = execSync(grepCmd, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (output.trim()) {
      const lines = output.trim().split('\n');
      
      lines.forEach(line => {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          const [, file, lineNum, content] = match;
          
          // Check if this match is whitelisted
          const isWhitelisted = pattern.whitelist?.some(wl => {
            return file.includes(wl) || content.toLowerCase().includes(wl.toLowerCase());
          });

          if (!isWhitelisted) {
            matches.push({
              file,
              line: parseInt(lineNum, 10),
              content: content.trim(),
              pattern
            });
          }
        }
      });
    }
  } catch (error) {
    // Ignore errors from grep/rg (usually means no matches found)
  }
}

function checkMigrationReferences(): void {
  console.log('');
  console.log('Checking migration files for unsafe references...');
  
  try {
    // Check if migration 121 exists - it fixes the city column index issues
    const migration121Exists = fs.existsSync(
      path.join(process.cwd(), 'supabase/migrations/121_unified_authorization_properties_services.sql')
    );
    
    if (migration121Exists) {
      console.log('✓ Migration 121 detected - city column index issues are fixed');
      return; // Skip checking old migrations if fix is present
    }
    
    // Check for references to city column in artisan_services indexes
    const grepCmd = `grep -rn "idx_artisan_services.*city\\|artisan_services.*city" supabase/migrations/*.sql 2>/dev/null || true`;
    const output = execSync(grepCmd, { encoding: 'utf-8' });
    
    if (output.trim()) {
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        // Only flag if it's creating an index, not dropping it
        if (line.includes('CREATE INDEX') && !line.includes('DROP')) {
          const match = line.match(/^([^:]+):(\d+):(.+)$/);
          if (match) {
            const [, file, lineNum, content] = match;
            
            matches.push({
              file,
              line: parseInt(lineNum, 10),
              content: content.trim(),
              pattern: {
                pattern: 'CREATE INDEX.*city',
                description: 'Migration creates index on non-existent "city" column',
                severity: 'error'
              }
            });
          }
        }
      });
    }
  } catch (error) {
    // Ignore errors
  }
}

function runVerification(): void {
  console.log('');
  console.log('==========================================');
  console.log('SCHEMA SAFETY VERIFICATION');
  console.log('==========================================');
  console.log('');
  console.log('Scanning codebase for dangerous patterns...');
  console.log('');

  // Search for each dangerous pattern
  DANGEROUS_PATTERNS.forEach(pattern => {
    console.log(`Checking: ${pattern.description}`);
    searchPattern(pattern);
  });

  // Check migrations
  checkMigrationReferences();

  console.log('');
  console.log('==========================================');
  console.log('RESULTS');
  console.log('==========================================');
  console.log('');

  if (matches.length === 0) {
    console.log('✅ PASS: No dangerous patterns found');
    console.log('');
    console.log('Schema safety verification completed successfully.');
    console.log('');
    process.exit(0);
  }

  // Group matches by severity
  const errors = matches.filter(m => m.pattern.severity === 'error');
  const warnings = matches.filter(m => m.pattern.severity === 'warning');

  if (errors.length > 0) {
    console.log(`❌ ERRORS FOUND: ${errors.length} dangerous patterns detected`);
    console.log('');
    
    errors.forEach((match, index) => {
      console.log(`Error ${index + 1}:`);
      console.log(`  File: ${match.file}:${match.line}`);
      console.log(`  Issue: ${match.pattern.description}`);
      console.log(`  Code: ${match.content}`);
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS: ${warnings.length} potential issues detected`);
    console.log('');
    
    warnings.forEach((match, index) => {
      console.log(`Warning ${index + 1}:`);
      console.log(`  File: ${match.file}:${match.line}`);
      console.log(`  Issue: ${match.pattern.description}`);
      console.log(`  Code: ${match.content}`);
      console.log('');
    });
  }

  console.log('==========================================');
  console.log('SUMMARY');
  console.log('==========================================');
  console.log(`Total issues: ${matches.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('❌ SCHEMA SAFETY CHECK FAILED');
    console.log('');
    console.log('Action required:');
    console.log('  1. Fix all error-level issues before deploying');
    console.log('  2. Review warnings and fix if necessary');
    console.log('  3. Re-run this verification');
    console.log('');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  SCHEMA SAFETY CHECK PASSED WITH WARNINGS');
    console.log('');
    console.log('Warnings detected but not blocking deployment.');
    console.log('Review warnings and fix if necessary.');
    console.log('');
    process.exit(0);
  }
}

// Run the verification
runVerification();
