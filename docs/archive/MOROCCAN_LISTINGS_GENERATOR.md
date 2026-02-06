# Moroccan Real Estate Listings Generator

## Overview

This script generates **200 realistic, SEO-optimized Moroccan real estate listings** in **French and Arabic** to populate a property website and boost SEO rankings.

## 🎯 Key Features

- ✅ **200 total listings** with precise distribution
- ✅ **Bilingual content**: French & Arabic only (NO English)
- ✅ **SEO-optimized**: 90-130 word descriptions with natural keywords
- ✅ **Realistic pricing**: Adjusted for city location and property type
- ✅ **Diverse neighborhoods**: Multiple quartiers per city, no excessive repetition
- ✅ **Geographic coverage**: Major cities + Saharan/Southern regions
- ✅ **Multiple advertiser types**: Propriétaires, courtiers, and agencies

## 📊 Distribution Summary

### Advertiser Types
- **Propriétaire** (Owner): 80 listings
- **Courtier** (Broker): 70 listings
- **Agence** (Agency): 50 listings

### Property Categories
- **Apartment**: 70 listings
- **Villa**: 35 listings
- **House**: 35 listings
- **Land**: 25 listings
- **Commercial** (Bureau + Commercial): 35 listings
  - Bureau (Office): 20
  - Commercial (Retail): 15

### City Distribution
- **Major Cities** (140 listings):
  - Casablanca, Rabat, Tanger, Marrakech, Agadir, Fès, Meknès, Oujda

- **Southern/Saharan Cities** (60 listings):
  - Laâyoune, Dakhla, Smara, Boujdour, Tan-Tan, Guelmim

### Featured Listings
- Approximately **10%** of listings are marked as featured

## 🚀 Usage

### Running the Generator

```bash
npm run generate:moroccan-listings
```

### Output

The script generates a JSON file: `moroccan-listings-200.json`

**File size**: ~360 KB
**Format**: Array of 200 property listing objects

## 📋 Output Schema

Each listing contains the following fields:

```json
{
  "advertiser_type": "proprietaire" | "courtier" | "agence",
  "transaction_type": "vente" | "location",
  "property_type": "apartment" | "villa" | "house" | "land" | "commercial",
  "category_label_fr": "Appartement | Villa | Maison | Terrain | Bureau | Commercial",
  "category_label_ar": "شقة | فيلا | منزل | أرض | مكتب | تجاري",
  "city": "Casablanca",
  "quartier": "Maarif",
  "price": 1500000,
  "area_sqm": 120,
  "bedrooms": 3,
  "bathrooms": 2,
  "title_fr": "Appartement à vendre à Maarif, Casablanca",
  "title_ar": "شقة للبيع في Maarif، الدار البيضاء",
  "description_fr": "90-130 word French description...",
  "description_ar": "90-130 word Arabic description...",
  "featured": false,
  "status": "approved",
  "is_archived": false
}
```

## 🔍 SEO Optimization

### Title Format
- **French**: `[Property type] + [transaction] + [à/en] + [quartier], [city]`
- **Arabic**: Natural equivalent with proper grammar

### Description Content (90-130 words)

**French SEO Keywords**:
- immobilier
- vente / location
- investissement
- quartier
- commodités
- ville
- valorisation
- rentable

**Arabic SEO Keywords** (MSA):
- عقاري / عقارات
- بيع / إيجار
- استثمار
- حي
- مرافق
- مدينة
- قيمة
- مربح

### Description Quality
- ✅ Natural, fluent language
- ✅ Realistic Moroccan real estate terminology
- ✅ Location-specific details
- ✅ Investment and lifestyle benefits
- ✅ Credible property features
- ✅ Unique content per listing (minimal repetition)

## 🏙️ Cities & Neighborhoods

### Major Cities

**Casablanca** (الدار البيضاء)
- Neighborhoods: Maarif, Bourgogne, Gauthier, Ain Diab, Sidi Maârouf, Anfa, California, Racine, Oasis, Belvedère

**Rabat** (الرباط)
- Neighborhoods: Agdal, Hay Riad, Hassan, Souissi, Ocean, Médina, Yacoub El Mansour, Aviation, Les Orangers, Diour Jamaa

**Tanger** (طنجة)
- Neighborhoods: Malabata, Ibéria, Marshan, Médina, Boukhalef, California, Tanger City Center, Branes, Administratif, Moghogha

**Marrakech** (مراكش)
- Neighborhoods: Guéliz, Hivernage, Palmeraie, Médina, Targa, Massira, Agdal, Daoudiate, Route de Casablanca, Ménara

**Agadir** (أكادير)
- Neighborhoods: Talborjt, Hay Dakhla, Founty, Secteur Touristique, Tikiouine, Charaf, Anza, Val d'Argan, Sonaba, Centre Ville

**Fès** (فاس)
- Neighborhoods: Ville Nouvelle, Narjiss, Atlas, Bensouda, Saiss, Médina Fès El Bali, Zouagha, Route d'Imouzzer, Ain Kadous, Benjellik

**Meknès** (مكناس)
- Neighborhoods: Hamria, Ville Nouvelle, Belle Vue, Toulal, Mansour, Saada, Marjane, Riad, Zitoune, Médina

**Oujda** (وجدة)
- Neighborhoods: Hay Al Qods, Lazaret, Centre Ville, Hay Salam, Al Matar, Université, Hay Nasr, Wilaya, Hay Zerktouni, Hay Bourgeoisie

### Southern/Saharan Cities

**Laâyoune** (العيون)
- Neighborhoods: Hay Al Wifaq, Centre Ville, Hay Nasr, Maatalla, Zoug, Hay Al Massira, Daoura, Hay Al Qods

**Dakhla** (الداخلة)
- Neighborhoods: Centre Ville, Corniche, Hay Essalam, Port, Hay Al Wahda, Bir Anzarane, Douar Tifaritiyne

**Smara** (السمارة)
- Neighborhoods: Centre Ville, Hay Moulay Abdellah, Hay Essalam, Hay Al Wifaq, Hay Al Massira, Hay Nasr

**Boujdour** (بوجدور)
- Neighborhoods: Centre Ville, Hay Al Massira, Hay Al Wahda, Hay Essalam, Hay Nasr

**Tan-Tan** (طانطان)
- Neighborhoods: Centre Ville, Hay Al Massira, Hay Nasr, Hay Moulay Rachid, Hay Essalam

**Guelmim** (كلميم)
- Neighborhoods: Centre Ville, Hay Salam, Hay Al Massira, Hay Nasr, Asrir, Hay Bir Anzarane

## 💰 Pricing Strategy

### Base Prices by Property Type

- **Apartments**: 500,000 - 2,500,000 MAD (sale) | 3,000 - 12,000 MAD (rent)
- **Villas**: 2,000,000 - 8,000,000 MAD (sale)
- **Houses**: 1,200,000 - 4,000,000 MAD (sale)
- **Land**: 400,000 - 3,000,000 MAD (sale)
- **Commercial/Bureau**: 800,000 - 4,000,000 MAD (sale) | 3,500 - 18,000 MAD (rent)

### Regional Adjustment

- **Major Cities**: 100% of base price
- **Southern/Saharan**: 60% of base price (more affordable)

## 🛠️ Technical Details

### Dependencies
- TypeScript (via `tsx`)
- Node.js >= 18
- No external API dependencies (fully self-contained)

### Script Location
```
scripts/generate-moroccan-listings.ts
```

### NPM Script
```json
{
  "scripts": {
    "generate:moroccan-listings": "npx tsx scripts/generate-moroccan-listings.ts"
  }
}
```

## 📈 Quality Assurance

### Automated Checks
✅ **Exact distribution** matches requirements (200 total)
✅ **Advertiser split** verified (80/70/50)
✅ **Category split** verified (70/35/35/25/35)
✅ **City distribution** verified (140 major / 60 southern)
✅ **Word count** validated (90-130 words per description)
✅ **Unique content** - high diversity across listings

### Manual Verification
- ✅ No English content in titles or descriptions
- ✅ Natural, fluent French and Arabic
- ✅ Realistic Moroccan real estate terminology
- ✅ Appropriate pricing for regions
- ✅ Credible property features
- ✅ Diverse neighborhood distribution

## 🔄 Regeneration

To regenerate listings (e.g., with different randomization):

```bash
# Remove existing output
rm moroccan-listings-200.json

# Generate new listings
npm run generate:moroccan-listings
```

Each run produces a different randomized set while maintaining the exact distribution requirements.

## 📝 Database Mapping

**Note**: Property types in the script are mapped to database values:

| Script Value | Database Value | Notes |
|-------------|---------------|-------|
| `proprietaire` | `owner` | Advertiser type |
| `courtier` | `broker` | Advertiser type |
| `agence` | `agency` | Advertiser type |
| `vente` | `sale` | Transaction type |
| `location` | `rent` | Transaction type |
| `bureau` | `commercial` | Property type (office) |
| `commercial` | `commercial` | Property type (retail) |

## 🎯 Use Cases

1. **Initial Data Seeding**: Populate a new property website
2. **SEO Bootstrap**: Create indexed content for search engines
3. **Demo/Testing**: Realistic data for development and testing
4. **Market Research**: Sample data representing Moroccan real estate market
5. **Performance Testing**: Load testing with realistic data volumes

## 📄 License

Part of the TopAffaireImmo platform.

---

**Generated**: 2026-02-03  
**Version**: 1.0.0  
**Listings**: 200 properties across Morocco
