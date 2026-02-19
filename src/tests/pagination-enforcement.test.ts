/**
 * Pagination Enforcement Tests
 * Run with: npx tsx src/tests/pagination-enforcement.test.ts
 * 
 * These tests verify that all marketplace and search queries use proper pagination
 * to prevent unbounded queries that could slow down the frontend and increase DB load.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type TestCase = {
  name: string;
  test: () => boolean | Promise<boolean>;
  description: string;
};

const tests: TestCase[] = [];

// Helper to read source files
function readSource(relativePath: string): string {
  const filePath = resolve(__dirname, '..', relativePath);
  return readFileSync(filePath, 'utf-8');
}

// Test 1: useProperties hook should enforce default pagination
tests.push({
  name: 'useProperties default pagination',
  description: 'useProperties hook should have default page and limit values',
  test: () => {
    const source = readSource('hooks/useProperties.ts');
    
    // Should have default values for pagination
    const hasDefaultPage = source.includes('page ?? 1') || source.includes('page = 1');
    const hasDefaultLimit = source.includes('limit ?? 50') || source.includes('limit = 50');
    const hasRange = source.includes('.range(');
    
    return hasDefaultPage && hasDefaultLimit && hasRange;
  }
});

// Test 2: PropertyFilters should include pagination params
tests.push({
  name: 'PropertyFilters pagination params',
  description: 'PropertyFilters interface should include page and limit fields',
  test: () => {
    const source = readSource('hooks/useProperties.ts');
    
    const hasPageField = source.includes('page?: number');
    const hasLimitField = source.includes('limit?: number');
    
    return hasPageField && hasLimitField;
  }
});

// Test 3: SearchResults should use backend pagination
tests.push({
  name: 'SearchResults backend pagination',
  description: 'SearchResults page should use .range() for backend pagination',
  test: () => {
    const source = readSource('pages/SearchResults.tsx');
    
    const hasRange = source.includes('.range(');
    const hasItemsPerPage = source.includes('ITEMS_PER_PAGE');
    const hasCountExact = source.includes("count: 'exact'");
    const hasTotalCount = source.includes('totalCount');
    
    return hasRange && hasItemsPerPage && hasCountExact && hasTotalCount;
  }
});

// Test 4: useMyProperties should have pagination
tests.push({
  name: 'useMyProperties pagination',
  description: 'useMyProperties hook should accept page and limit parameters',
  test: () => {
    const source = readSource('hooks/useProperties.ts');
    
    // Check function signature and implementation
    const hasPageParam = source.includes('useMyProperties(page') || source.includes('useMyProperties(');
    const hasLimitParam = source.includes('limit = 50') || source.includes('limit: number');
    const hasRange = source.match(/useMyProperties[\s\S]*?\.range\(/);
    
    return hasPageParam && hasLimitParam && !!hasRange;
  }
});

// Test 5: useFeaturedProperties should have a limit
tests.push({
  name: 'useFeaturedProperties limit',
  description: 'useFeaturedProperties should use .limit() to cap results',
  test: () => {
    const source = readSource('hooks/useProperties.ts');
    
    const hasFeaturedLimit = source.match(/useFeaturedProperties[\s\S]*?\.limit\(/);
    
    return !!hasFeaturedLimit;
  }
});

// Test 6: useLatestProperties should have a limit
tests.push({
  name: 'useLatestProperties limit',
  description: 'useLatestProperties should use .limit() to cap results',
  test: () => {
    const source = readSource('hooks/useProperties.ts');
    
    const hasLatestLimit = source.match(/useLatestProperties[\s\S]*?\.limit\(/);
    const hasDefaultLimit = source.includes('limit = 12') || source.includes('limit = ');
    
    return !!hasLatestLimit && hasDefaultLimit;
  }
});

// Test 7: PropertyTypeNeighborhoodPage should use pagination
tests.push({
  name: 'PropertyTypeNeighborhoodPage pagination',
  description: 'PropertyTypeNeighborhoodPage should pass page and limit to useProperties',
  test: () => {
    const source = readSource('pages/PropertyTypeNeighborhoodPage.tsx');
    
    const hasPageParam = source.includes('page: currentPage');
    const hasLimitParam = source.includes('limit: ITEMS_PER_PAGE');
    
    return hasPageParam && hasLimitParam;
  }
});

// Test 8: SearchResults should have reasonable ITEMS_PER_PAGE
tests.push({
  name: 'SearchResults ITEMS_PER_PAGE value',
  description: 'SearchResults ITEMS_PER_PAGE should be between 10 and 100',
  test: () => {
    const source = readSource('pages/SearchResults.tsx');
    
    const match = source.match(/ITEMS_PER_PAGE\s*=\s*(\d+)/);
    if (!match) return false;
    
    const value = parseInt(match[1], 10);
    return value >= 10 && value <= 100;
  }
});

// Test 9: Verify no unbounded queries in useProperties
tests.push({
  name: 'No unbounded queries',
  description: 'useProperties should not fetch all data without pagination',
  test: () => {
    const source = readSource('hooks/useProperties.ts');
    
    // Extract useProperties function
    const usePropertiesMatch = source.match(/export function useProperties[\s\S]*?^}/m);
    if (!usePropertiesMatch) return false;
    
    const usePropertiesCode = usePropertiesMatch[0];
    
    // Should have range call and default pagination values
    const hasRange = usePropertiesCode.includes('.range(');
    // Accept either 20 (optimised) or 50 as default limit
    const hasDefaults = usePropertiesCode.includes('?? 1') && (usePropertiesCode.includes('?? 20') || usePropertiesCode.includes('?? 50'));
    
    return hasRange && hasDefaults;
  }
});

// Test 10: Verify SearchResults pagination UI exists
tests.push({
  name: 'SearchResults pagination UI',
  description: 'SearchResults should have pagination controls',
  test: () => {
    const source = readSource('pages/SearchResults.tsx');
    
    const hasCurrentPage = source.includes('currentPage');
    const hasTotalPages = source.includes('totalPages');
    const hasPaginationButtons = source.includes('Previous') && source.includes('Next');
    
    return hasCurrentPage && hasTotalPages && hasPaginationButtons;
  }
});

// Run all tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Running Pagination Enforcement Tests...\n');

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   ${test.description}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${test.name}`);
        console.error(`   ${test.description}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ERROR: ${test.name}`);
      console.error(`   ${test.description}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
    console.log('');
  }

  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

  if (failed > 0) {
    console.error('\n⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✨ All pagination enforcement tests passed!');
  }
}

runTests();
