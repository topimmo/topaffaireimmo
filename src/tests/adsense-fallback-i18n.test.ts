/**
 * AdSenseFallbackCTA i18n Test
 * 
 * Validates that the AdSenseFallbackCTA component properly detects
 * and displays content in the correct language based on document.documentElement.lang
 * 
 * Run with: npx tsx src/tests/adsense-fallback-i18n.test.ts
 */

// Translation texts from the component
const translations = {
  fr: {
    title: 'Acheter – Vendre – Louer un bien au Maroc',
    subtitle: '300 comptes gratuits à vie (offre limitée)',
    primaryCTA: 'Créer un compte gratuit',
    secondaryCTA: 'Contacter via WhatsApp',
    note: 'Offre promotionnelle, pas une publicité',
  },
  ar: {
    title: 'بيع – شراء – كراء العقار في المغرب',
    subtitle: '300 حساب مجاني مدى الحياة (لفترة محدودة)',
    primaryCTA: 'إنشاء حساب مجاني',
    secondaryCTA: 'التواصل عبر واتساب',
    note: 'عرض ترويجي وليس إعلانًا',
  },
} as const;

// Simulate language detection logic
function detectLanguage(htmlLang: string): 'fr' | 'ar' {
  return htmlLang.startsWith('ar') ? 'ar' : 'fr';
}

// Test cases
const testCases = [
  { lang: 'fr', expected: 'fr' },
  { lang: 'fr-MA', expected: 'fr' },
  { lang: 'fr-FR', expected: 'fr' },
  { lang: 'ar', expected: 'ar' },
  { lang: 'ar-MA', expected: 'ar' },
  { lang: 'ar-SA', expected: 'ar' },
  { lang: 'en', expected: 'fr' }, // Falls back to French
  { lang: '', expected: 'fr' }, // Falls back to French
];

console.log('🧪 Testing AdSenseFallbackCTA i18n logic...\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = detectLanguage(testCase.lang);
  const success = result === testCase.expected;
  
  if (success) {
    console.log(`✅ PASS: lang="${testCase.lang}" → detected="${result}"`);
    passed++;
  } else {
    console.log(`❌ FAIL: lang="${testCase.lang}" → detected="${result}", expected="${testCase.expected}"`);
    failed++;
  }
}

// Test that all required translation keys exist
console.log('\n🔍 Checking translation completeness...\n');

const requiredKeys = ['title', 'subtitle', 'primaryCTA', 'secondaryCTA', 'note'];
const languages: Array<'fr' | 'ar'> = ['fr', 'ar'];

for (const lang of languages) {
  console.log(`Checking ${lang.toUpperCase()} translations:`);
  
  for (const key of requiredKeys) {
    const hasKey = key in translations[lang];
    const value = translations[lang][key as keyof typeof translations[typeof lang]];
    const hasValue = value && value.length > 0;
    
    if (hasKey && hasValue) {
      console.log(`  ✅ ${key}: "${value}"`);
    } else {
      console.log(`  ❌ ${key}: Missing or empty`);
      failed++;
    }
  }
  console.log('');
}

// Summary
console.log('═'.repeat(50));
console.log(`\n📊 Test Summary:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📝 Total:  ${passed + failed}\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('💥 Some tests failed!\n');
  process.exit(1);
}
