/**
 * Minimal tests for service categories normalization and slug validation.
 * Run with: npx tsx src/tests/service-categories-normalization.test.ts
 */

import {
  normalizeServiceCategories,
  SERVICE_SLUG_REGEX,
  type ServiceCategoryRow,
} from '../lib/services';

type TestResult = { name: string; passed: boolean; details?: string };

const tests: TestResult[] = [];

// Test: slug regex accepts lowercase + hyphen
tests.push({
  name: 'Valid slug regex',
  passed: SERVICE_SLUG_REGEX.test('plomberie-pro'),
});

// Test: invalid slug is rejected by regex
tests.push({
  name: 'Invalid slug regex (spaces)',
  passed: !SERVICE_SLUG_REGEX.test('invalid slug'),
});

// Test: normalization skips invalid slug and falls back
(() => {
  const { categories } = normalizeServiceCategories([
    {
      id: '1',
      slug: 'invalid slug',
      name_fr: 'Test',
      name_ar: 'تجربة',
      icon: 'wrench',
      sort_order: 1,
      is_active: true,
    } as ServiceCategoryRow,
  ]);

  const hasInvalid = categories.some((c) => c.slug === 'invalid slug');
  tests.push({
    name: 'Normalization skips invalid slug',
    passed: !hasInvalid,
    details: hasInvalid ? 'Invalid slug propagated to UI' : undefined,
  });
})();

// Test: normalization preserves valid slug
(() => {
  const { categories } = normalizeServiceCategories([
    {
      id: '2',
      slug: 'plomberie',
      name_fr: 'Plomberie',
      name_ar: 'السباكة',
      icon: 'wrench',
      sort_order: 2,
      is_active: true,
    } as ServiceCategoryRow,
  ]);

  const found = categories.find((c) => c.slug === 'plomberie');
  tests.push({
    name: 'Normalization keeps valid slug',
    passed: Boolean(found),
    details: found ? undefined : 'Valid slug missing after normalization',
  });
})();

let passed = 0;
let failed = 0;

for (const test of tests) {
  if (test.passed) {
    console.log(`✅ PASS: ${test.name}`);
    passed += 1;
  } else {
    console.error(`❌ FAIL: ${test.name}`);
    if (test.details) console.error(`   Details: ${test.details}`);
    failed += 1;
  }
}

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
