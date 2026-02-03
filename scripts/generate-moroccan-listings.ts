/**
 * Generate 200 Realistic Moroccan Real Estate Listings
 * 
 * This script generates SEO-optimized property listings in French and Arabic
 * for a Moroccan real estate platform, following strict distribution requirements.
 * 
 * Requirements:
 * - 200 total listings
 * - Advertiser split: 80 owner, 70 broker, 50 agency
 * - Category split: apartment: 70, villa: 35, house: 35, land: 25, commercial: 35 (bureau 20 + commercial 15)
 * - City split: 140 major cities, 60 southern/Saharan cities
 * - Content ONLY in French and Arabic (NO English)
 * - SEO-optimized titles and descriptions
 * 
 * Usage:
 *   npm run generate:moroccan-listings
 */

import * as fs from 'fs';
import * as path from 'path';

// =====================================================
// CONFIGURATION
// =====================================================

const OUTPUT_FILE = path.join(process.cwd(), 'moroccan-listings-200.json');

// Distribution requirements
const TOTAL_LISTINGS = 200;
const ADVERTISER_DISTRIBUTION = {
  proprietaire: 80,  // Maps to 'owner' in DB
  courtier: 70,      // Maps to 'broker' in DB
  agence: 50         // Maps to 'agency' in DB
};

const CATEGORY_DISTRIBUTION = {
  apartment: 70,
  villa: 35,
  house: 35,
  land: 25,
  bureau: 20,      // Maps to 'commercial' in DB
  commercial: 15   // Maps to 'commercial' in DB
};

// City data with neighborhoods
interface CityData {
  name_fr: string;
  name_ar: string;
  neighborhoods: string[];
  isSouthern: boolean;
}

const MAJOR_CITIES: CityData[] = [
  {
    name_fr: 'Casablanca',
    name_ar: 'الدار البيضاء',
    neighborhoods: ['Maarif', 'Bourgogne', 'Gauthier', 'Ain Diab', 'Sidi Maârouf', 'Anfa', 'California', 'Racine', 'Oasis', 'Belvedère'],
    isSouthern: false
  },
  {
    name_fr: 'Rabat',
    name_ar: 'الرباط',
    neighborhoods: ['Agdal', 'Hay Riad', 'Hassan', 'Souissi', 'Ocean', 'Médina', 'Yacoub El Mansour', 'Aviation', 'Les Orangers', 'Diour Jamaa'],
    isSouthern: false
  },
  {
    name_fr: 'Tanger',
    name_ar: 'طنجة',
    neighborhoods: ['Malabata', 'Ibéria', 'Marshan', 'Médina', 'Boukhalef', 'California', 'Tanger City Center', 'Branes', 'Administratif', 'Moghogha'],
    isSouthern: false
  },
  {
    name_fr: 'Marrakech',
    name_ar: 'مراكش',
    neighborhoods: ['Guéliz', 'Hivernage', 'Palmeraie', 'Médina', 'Targa', 'Massira', 'Agdal', 'Daoudiate', 'Route de Casablanca', 'Ménara'],
    isSouthern: false
  },
  {
    name_fr: 'Agadir',
    name_ar: 'أكادير',
    neighborhoods: ['Talborjt', 'Hay Dakhla', 'Founty', 'Secteur Touristique', 'Tikiouine', 'Charaf', 'Anza', 'Val d\'Argan', 'Sonaba', 'Centre Ville'],
    isSouthern: false
  },
  {
    name_fr: 'Fès',
    name_ar: 'فاس',
    neighborhoods: ['Ville Nouvelle', 'Narjiss', 'Atlas', 'Bensouda', 'Saiss', 'Médina Fès El Bali', 'Zouagha', 'Route d\'Imouzzer', 'Ain Kadous', 'Benjellik'],
    isSouthern: false
  },
  {
    name_fr: 'Meknès',
    name_ar: 'مكناس',
    neighborhoods: ['Hamria', 'Ville Nouvelle', 'Belle Vue', 'Toulal', 'Mansour', 'Saada', 'Marjane', 'Riad', 'Zitoune', 'Médina'],
    isSouthern: false
  },
  {
    name_fr: 'Oujda',
    name_ar: 'وجدة',
    neighborhoods: ['Hay Al Qods', 'Lazaret', 'Centre Ville', 'Hay Salam', 'Al Matar', 'Université', 'Hay Nasr', 'Wilaya', 'Hay Zerktouni', 'Hay Bourgeoisie'],
    isSouthern: false
  }
];

const SOUTHERN_CITIES: CityData[] = [
  {
    name_fr: 'Laâyoune',
    name_ar: 'العيون',
    neighborhoods: ['Hay Al Wifaq', 'Centre Ville', 'Hay Nasr', 'Maatalla', 'Zoug', 'Hay Al Massira', 'Daoura', 'Hay Al Qods'],
    isSouthern: true
  },
  {
    name_fr: 'Dakhla',
    name_ar: 'الداخلة',
    neighborhoods: ['Centre Ville', 'Corniche', 'Hay Essalam', 'Port', 'Hay Al Wahda', 'Bir Anzarane', 'Douar Tifaritiyne'],
    isSouthern: true
  },
  {
    name_fr: 'Smara',
    name_ar: 'السمارة',
    neighborhoods: ['Centre Ville', 'Hay Moulay Abdellah', 'Hay Essalam', 'Hay Al Wifaq', 'Hay Al Massira', 'Hay Nasr'],
    isSouthern: true
  },
  {
    name_fr: 'Boujdour',
    name_ar: 'بوجدور',
    neighborhoods: ['Centre Ville', 'Hay Al Massira', 'Hay Al Wahda', 'Hay Essalam', 'Hay Nasr'],
    isSouthern: true
  },
  {
    name_fr: 'Tan-Tan',
    name_ar: 'طانطان',
    neighborhoods: ['Centre Ville', 'Hay Al Massira', 'Hay Nasr', 'Hay Moulay Rachid', 'Hay Essalam'],
    isSouthern: true
  },
  {
    name_fr: 'Guelmim',
    name_ar: 'كلميم',
    neighborhoods: ['Centre Ville', 'Hay Salam', 'Hay Al Massira', 'Hay Nasr', 'Asrir', 'Hay Bir Anzarane'],
    isSouthern: true
  }
];

// =====================================================
// SEO CONTENT TEMPLATES
// =====================================================

interface PropertyTemplate {
  property_type: string;
  transaction_type: 'vente' | 'location';
  title_fr_patterns: string[];
  title_ar_patterns: string[];
  description_fr_patterns: string[];
  description_ar_patterns: string[];
  price_range: { min: number; max: number };
  area_range: { min: number; max: number };
  bedrooms_range?: { min: number; max: number };
  bathrooms_range?: { min: number; max: number };
}

const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  // APARTMENTS FOR SALE
  {
    property_type: 'apartment',
    transaction_type: 'vente',
    title_fr_patterns: [
      'Appartement à vendre à {quartier}, {city}',
      'Bel appartement en vente {quartier}, {city}',
      'Appartement moderne à {quartier}, {city}',
      'Superbe appartement {quartier}, {city}'
    ],
    title_ar_patterns: [
      'شقة للبيع في {quartier}، {city}',
      'شقة جميلة للبيع في {quartier}، {city}',
      'شقة عصرية للبيع في {quartier}، {city}',
      'شقة رائعة للبيع في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Magnifique appartement de {bedrooms} chambres situé dans le quartier recherché de {quartier} à {city}. D\'une superficie généreuse de {area} m², ce bien immobilier d\'exception offre {bathrooms} salles de bain modernes et un séjour lumineux parfaitement aménagé. Proche de toutes les commodités urbaines incluant commerces variés, écoles réputées et transports en commun efficaces. Idéal pour investissement immobilier rentable ou résidence principale confortable. Cette opportunité rare est à saisir dans un quartier en pleine expansion économique, offrant un excellent potentiel de valorisation. Le quartier bénéficie d\'une vie de quartier animée avec restaurants, cafés et centres de loisirs. Finitions de qualité supérieure et charges de copropriété raisonnables.',
      'Découvrez cet appartement exceptionnel de {bedrooms} chambres à {quartier}, {city}, véritable perle de l\'immobilier marocain. Avec ses {area} m² optimisés et {bathrooms} salles de bain élégantes, ce logement spacieux bénéficie d\'un emplacement privilégié dans un environnement résidentiel. Quartier calme et sécurisé, proche des commodités essentielles comme supermarchés, pharmacies et services bancaires. Parfait pour familles recherchant confort et qualité de vie ou investisseurs avisés souhaitant un placement sûr. Belle opportunité immobilière dans une zone stratégique en développement constant. Exposition optimale garantissant luminosité naturelle tout au long de la journée. Parking disponible et espaces verts à proximité pour le bien-être.',
      'Appartement spacieux de {bedrooms} chambres à vendre à {quartier}, {city}, représentant une excellente affaire immobilière. Surface habitable généreuse de {area} m² avec {bathrooms} salles de bain modernes équipées avec goût. Secteur très prisé offrant un accès facile aux services essentiels, restaurants gastronomiques et centres commerciaux modernes. Excellent potentiel locatif assurant rentabilité et valorisation garantie sur le long terme. Investissement sûr dans l\'immobilier marocain avec documentation complète et situation juridique claire. Le quartier attire une clientèle qualifiée recherchant proximité et commodités. Architecture contemporaine avec matériaux nobles et isolation thermique performante. Idéal pour résidence principale ou investissement locatif pérenne.',
      'Profitez de cette opportunité unique à {quartier}, {city}, pour acquérir un bien d\'exception. Appartement lumineux de {bedrooms} chambres offrant {area} m² d\'espace de vie optimisé, équipé de {bathrooms} salles de bain avec finitions soignées. Quartier dynamique et recherché offrant toutes commodités à proximité immédiate incluant transports, commerces et services. Idéal pour location rentable garantissant revenus stables ou habitation personnelle dans un cadre agréable. Emplacement stratégique pour investissement rentable avec potentiel d\'appréciation significatif. Environnement sécurisé avec gardiennage et accès contrôlé. Proximité des axes routiers facilitant déplacements quotidiens. Charges maîtrisées et gestion professionnelle de la copropriété.'
    ],
    description_ar_patterns: [
      'شقة رائعة من {bedrooms} غرف نوم تقع في حي {quartier} المرموق في {city}. تبلغ مساحتها السخية {area} متر مربع، وتحتوي على {bathrooms} حمامات عصرية وصالة مضيئة مهيأة بشكل مثالي. قريبة من جميع المرافق الحضرية بما في ذلك المحلات التجارية المتنوعة والمدارس المرموقة ووسائل النقل العام الفعالة. مثالية للاستثمار العقاري المربح أو السكن الرئيسي المريح. هذه الفرصة النادرة يجب اغتنامها في حي في توسع اقتصادي كامل، مع إمكانات ممتازة لارتفاع القيمة. يتمتع الحي بحياة حيوية مع مطاعم ومقاهي ومراكز ترفيه. تشطيبات عالية الجودة ورسوم ملكية مشتركة معقولة.',
      'اكتشف هذه الشقة الاستثنائية من {bedrooms} غرف نوم في {quartier}، {city}، جوهرة حقيقية للعقارات المغربية. مع مساحتها المحسنة {area} متر مربع و {bathrooms} حمامات أنيقة، يتمتع هذا المسكن الواسع بموقع متميز في بيئة سكنية. حي هادئ وآمن، قريب من المرافق الأساسية مثل السوبرماركت والصيدليات والخدمات المصرفية. مثالي للعائلات الباحثة عن الراحة وجودة الحياة أو للمستثمرين الأذكياء الراغبين في استثمار آمن. فرصة عقارية جميلة في منطقة استراتيجية في تطور مستمر. توجيه مثالي يضمن الإضاءة الطبيعية طوال اليوم. موقف سيارات متاح ومساحات خضراء قريبة للرفاهية.',
      'شقة واسعة من {bedrooms} غرف نوم للبيع في {quartier}، {city}، تمثل صفقة عقارية ممتازة. مساحة سكنية سخية {area} متر مربع مع {bathrooms} حمامات عصرية مجهزة بذوق. قطاع مرغوب جدا يوفر وصولا سهلا إلى الخدمات الأساسية والمطاعم الفاخرة والمراكز التجارية الحديثة. إمكانات تأجيرية ممتازة تضمن الربحية وارتفاع القيمة المضمون على المدى الطويل. استثمار آمن في العقارات المغربية مع توثيق كامل ووضعية قانونية واضحة. يجذب الحي زبائن مؤهلين يبحثون عن القرب والمرافق. عمارة معاصرة مع مواد نبيلة وعزل حراري فعال. مثالية للسكن الرئيسي أو الاستثمار الإيجاري المستدام.',
      'استفد من هذه الفرصة الفريدة في {quartier}، {city}، لاقتناء عقار استثنائي. شقة مضيئة من {bedrooms} غرف نوم توفر {area} متر مربع من مساحة المعيشة المحسنة، مجهزة ب {bathrooms} حمامات مع تشطيبات متقنة. حي ديناميكي ومطلوب يوفر جميع المرافق في الجوار المباشر بما في ذلك النقل والمحلات والخدمات. مثالية للإيجار المربح الذي يضمن دخلا مستقرا أو السكن الشخصي في إطار مريح. موقع استراتيجي لاستثمار مربح مع إمكانات تقدير كبيرة. بيئة آمنة مع حراسة ووصول مراقب. قرب من المحاور الطرقية لتسهيل التنقلات اليومية. رسوم متحكم فيها وإدارة مهنية للملكية المشتركة.'
    ],
    price_range: { min: 500000, max: 2500000 },
    area_range: { min: 60, max: 150 },
    bedrooms_range: { min: 1, max: 4 },
    bathrooms_range: { min: 1, max: 3 }
  },
  // APARTMENTS FOR RENT
  {
    property_type: 'apartment',
    transaction_type: 'location',
    title_fr_patterns: [
      'Appartement à louer à {quartier}, {city}',
      'Location appartement {quartier}, {city}',
      'Appartement meublé à louer {quartier}, {city}',
      'Bel appartement en location {quartier}, {city}'
    ],
    title_ar_patterns: [
      'شقة للإيجار في {quartier}، {city}',
      'إيجار شقة في {quartier}، {city}',
      'شقة مفروشة للإيجار في {quartier}، {city}',
      'شقة جميلة للإيجار في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Appartement confortable de {bedrooms} chambres à louer dans {quartier}, {city}, offrant un cadre de vie exceptionnel. Superficie généreuse de {area} m² avec {bathrooms} salles de bain modernes et équipées. Bien entretenu et situé dans un quartier calme, résidentiel et particulièrement sécurisé avec gardiennage permanent. Proche de toutes commodités essentielles incluant écoles réputées, commerces variés et transports en commun efficaces. Idéal pour familles nombreuses ou professionnels expatriés recherchant confort et tranquillité. Disponible immédiatement pour location longue durée avec conditions avantageuses. Charges de copropriété raisonnables incluant eau et entretien. Environnement verdoyant et espaces de stationnement sécurisés. Connexion internet fibre disponible pour télétravail.',
      'Louez cet agréable appartement de {bedrooms} chambres à {quartier}, {city}, dans un environnement résidentiel prisé. Surface habitable optimisée de {area} m² comprenant {bathrooms} salles de bain élégantes et fonctionnelles. Emplacement privilégié dans un secteur résidentiel très recherché offrant qualité de vie exceptionnelle. Toutes commodités urbaines à proximité immédiate pour faciliter votre quotidien. Parfait pour résidence principale confortable ou location meublée haut de gamme. Charges réduites et excellente connexion aux axes principaux facilitant déplacements. Immeuble moderne avec ascenseur et système de sécurité performant. Balcon spacieux offrant vue dégagée. Parking privatif et cave de rangement inclus dans le loyer mensuel.',
      'Disponible à la location: appartement spacieux de {bedrooms} chambres à {quartier}, {city}, dans résidence standing. {area} m² habitables avec {bathrooms} salles de bain parfaitement équipées et modernes. Quartier dynamique et cosmopolite offrant restaurants gastronomiques, supermarchés internationaux et services variés à proximité. Convient parfaitement aux familles internationales et professionnels expatriés recherchant confort moderne. Location flexible avec possibilité de meublé complet selon vos besoins spécifiques. Environnement multiculturel et accueillant avec écoles internationales proches. Transports publics à proximité facilitant mobilité urbaine. Charges transparentes et gestion professionnelle de la copropriété. Cuisine équipée avec électroménager moderne.',
      'Découvrez cet appartement lumineux de {bedrooms} pièces en location à {quartier}, {city}, offrant confort optimal. {area} m² parfaitement aménagés avec {bathrooms} salles de bain équipées d\'installations modernes. Situé dans une résidence sécurisée haut standing avec gardiennage 24h/24 et système surveillance. Proximité immédiate des commodités essentielles incluant centres médicaux, pharmacies et services bancaires. Idéal pour location courte ou longue durée selon vos besoins professionnels. Rapport qualité-prix exceptionnel dans secteur résidentiel recherché. Exposition optimale garantissant luminosité naturelle abondante. Possibilité bail renouvelable avec conditions avantageuses. Espaces verts et aires de jeux pour enfants dans résidence.'
    ],
    description_ar_patterns: [
      'شقة مريحة من {bedrooms} غرف نوم للإيجار في {quartier}، {city}، توفر إطار حياة استثنائي. مساحة سخية {area} متر مربع مع {bathrooms} حمامات عصرية ومجهزة. محافظ عليها جيدا وتقع في حي هادئ وسكني وآمن بشكل خاص مع حراسة دائمة. قريبة من جميع المرافق الأساسية بما في ذلك مدارس مرموقة ومحلات تجارية متنوعة ووسائل نقل عام فعالة. مثالية للعائلات الكبيرة أو المهنيين المغتربين الباحثين عن الراحة والهدوء. متاحة فورا للإيجار طويل الأمد مع شروط مفيدة. رسوم ملكية مشتركة معقولة تشمل الماء والصيانة. بيئة خضراء ومساحات وقوف آمنة. اتصال انترنت فايبر متاح للعمل عن بعد.',
      'استأجر هذه الشقة الجميلة من {bedrooms} غرف نوم في {quartier}، {city}، في بيئة سكنية محبوبة. مساحة سكنية محسنة {area} متر مربع تشمل {bathrooms} حمامات أنيقة وعملية. موقع متميز في قطاع سكني مرغوب جدا يوفر جودة حياة استثنائية. جميع المرافق الحضرية في الجوار المباشر لتسهيل يومياتك. مثالية للسكن الرئيسي المريح أو الإيجار المفروش الراقي. رسوم منخفضة واتصال ممتاز بالمحاور الرئيسية لتسهيل التنقلات. مبنى حديث مع مصعد ونظام أمن فعال. شرفة واسعة توفر إطلالة مفتوحة. موقف سيارات خاص وقبو تخزين مشمول في الإيجار الشهري.',
      'متاح للإيجار: شقة واسعة من {bedrooms} غرف نوم في {quartier}، {city}، في مجمع سكني راقي. {area} متر مربع قابلة للسكن مع {bathrooms} حمامات مجهزة بشكل مثالي وعصرية. حي ديناميكي وعالمي يوفر مطاعم فاخرة وسوبرماركت دولية وخدمات متنوعة قريبة. مناسبة تماما للعائلات الدولية والمهنيين المغتربين الباحثين عن الراحة الحديثة. إيجار مرن مع إمكانية التأثيث الكامل حسب احتياجاتك المحددة. بيئة متعددة الثقافات ومرحبة مع مدارس دولية قريبة. وسائل نقل عامة قريبة لتسهيل التنقل الحضري. رسوم شفافة وإدارة مهنية للملكية المشتركة. مطبخ مجهز بأجهزة كهربائية حديثة.',
      'اكتشف هذه الشقة المضيئة من {bedrooms} غرف للإيجار في {quartier}، {city}، توفر راحة مثلى. {area} متر مربع مهيأة بشكل مثالي مع {bathrooms} حمامات مجهزة بمنشآت عصرية. تقع في مجمع سكني آمن راقي مع حراسة على مدار الساعة ونظام مراقبة. قرب فوري من المرافق الأساسية بما في ذلك مراكز طبية وصيدليات وخدمات مصرفية. مثالية للإيجار قصير أو طويل الأمد حسب احتياجاتك المهنية. نسبة جودة-سعر استثنائية في قطاع سكني مرغوب. توجيه مثالي يضمن إضاءة طبيعية وفيرة. إمكانية عقد إيجار قابل للتجديد مع شروط مفيدة. مساحات خضراء ومناطق لعب للأطفال في المجمع السكني.'
    ],
    price_range: { min: 3000, max: 12000 },
    area_range: { min: 50, max: 130 },
    bedrooms_range: { min: 1, max: 3 },
    bathrooms_range: { min: 1, max: 2 }
  },
  // VILLAS FOR SALE
  {
    property_type: 'villa',
    transaction_type: 'vente',
    title_fr_patterns: [
      'Villa à vendre à {quartier}, {city}',
      'Magnifique villa {quartier}, {city}',
      'Villa de luxe à vendre {quartier}, {city}',
      'Superbe villa avec jardin {quartier}, {city}'
    ],
    title_ar_patterns: [
      'فيلا للبيع في {quartier}، {city}',
      'فيلا رائعة في {quartier}، {city}',
      'فيلا فاخرة للبيع في {quartier}، {city}',
      'فيلا رائعة مع حديقة في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Villa exceptionnelle de {bedrooms} chambres à vendre à {quartier}, {city}, représentant le summum du luxe immobilier. Surface totale généreuse de {area} m² édifiée sur terrain arboré magnifique avec piscine privée chauffée et jardin paysagé par architecte. {bathrooms} salles de bain de standing équipées avec matériaux nobles, salon spacieux avec cheminée décorative et espaces de réception élégants. Architecture moderne alliant tradition marocaine et design contemporain avec finitions haut de gamme. Quartier résidentiel calme, sécurisé avec surveillance permanente et apprécié des familles aisées. Idéal pour familles recherchant confort absolu, intimité préservée et qualité de vie exceptionnelle. Investissement de prestige dans l\'immobilier de luxe avec potentiel de valorisation important.',
      'Découvrez cette villa de prestige de {bedrooms} chambres à {quartier}, {city}, véritable havre de paix et de raffinement. {area} m² d\'espace de vie luxueux comprenant {bathrooms} salles de bain élégantes avec équipements haut de gamme. Grand jardin méditerranéen avec piscine chauffée à débordement, espace barbecue aménagé et pool house équipé. Proximité immédiate golf réputé, écoles internationales prestigieuses et centres commerciaux haut standing. Garage double spacieux et système de sécurité avancé avec vidéosurveillance. Opportunité rare et exclusive sur le marché immobilier marocain pour acquéreurs exigeants. Cuisine équipée professionnelle et terrasses panoramiques. Exposition sud optimale garantissant ensoleillement maximal.',
      'Superbe villa contemporaine de {bedrooms} chambres située à {quartier}, {city}, offrant prestations exceptionnelles. Surface habitable luxueuse de {area} m² comprenant {bathrooms} salles de bain avec finitions luxueuses et équipements modernes. Terrain paysagé professionnel avec piscine à débordement spectaculaire, pool house aménagé et espaces détente. Vue panoramique imprenable sur environnement et exposition optimale garantissant luminosité naturelle. Secteur privilégié et recherché avec toutes commodités haut de gamme à proximité immédiate. Placement sûr et valorisant dans l\'immobilier haut standing marocain avec rendement garanti. Domotique intégrée et matériaux écologiques. Quartier calme prisé par clientèle internationale aisée.',
      'Villa familiale spacieuse de {bedrooms} chambres à vendre {quartier}, {city}, combinant confort et élégance. {area} m² répartis harmonieusement sur deux niveaux avec {bathrooms} salles de bain modernes équipées. Jardin arboré méditerranéen, terrasse couverte pour réceptions et piscine avec système filtration moderne. Quartier calme et verdoyant recherché par familles aisées privilégiant qualité de vie. Proche écoles privées internationales réputées, cliniques modernes et espaces verts aménagés. Excellent potentiel de valorisation immobilière dans secteur en développement constant. Architecture marocaine traditionnelle rénovée avec goût. Garage triple et dépendances pour personnel domestique.'
    ],
    description_ar_patterns: [
      'فيلا استثنائية من {bedrooms} غرف نوم للبيع في {quartier}، {city}، تمثل قمة الرفاهية العقارية. مساحة إجمالية سخية {area} متر مربع مبنية على أرض مشجرة رائعة مع مسبح خاص مدفأ وحديقة منسقة من قبل مهندس معماري. {bathrooms} حمامات فاخرة مجهزة بمواد نبيلة، صالون واسع مع مدفأة زخرفية ومساحات استقبال أنيقة. هندسة معمارية حديثة تجمع بين التقاليد المغربية والتصميم المعاصر مع تشطيبات راقية. حي سكني هادئ وآمن مع مراقبة دائمة ومقدر من العائلات الميسورة. مثالية للعائلات الباحثة عن الراحة المطلقة والخصوصية المحفوظة وجودة حياة استثنائية. استثمار مرموق في العقارات الفاخرة مع إمكانات ارتفاع قيمة كبيرة.',
      'اكتشف هذه الفيلا المرموقة من {bedrooms} غرف نوم في {quartier}، {city}، ملاذ حقيقي من السلام والرقي. {area} متر مربع من مساحة المعيشة الفاخرة تشمل {bathrooms} حمامات أنيقة مع معدات راقية. حديقة متوسطية كبيرة مع مسبح مدفأ لا متناهي ومنطقة شواء مهيأة وبيت مسبح مجهز. قرب فوري من ملعب جولف مشهور ومدارس دولية مرموقة ومراكز تجارية راقية. مرآب مزدوج واسع ونظام أمن متقدم مع مراقبة فيديو. فرصة نادرة وحصرية في سوق العقارات المغربي للمشترين المتطلبين. مطبخ مجهز احترافي وشرفات بانورامية. توجيه جنوبي مثالي يضمن أقصى قدر من أشعة الشمس.',
      'فيلا معاصرة رائعة من {bedrooms} غرف نوم تقع في {quartier}، {city}، توفر خدمات استثنائية. مساحة سكنية فاخرة {area} متر مربع تشمل {bathrooms} حمامات مع تشطيبات فاخرة ومعدات حديثة. أرض منسقة احترافيا مع مسبح لا متناهي مذهل وبيت مسبح مهيأ ومساحات استرخاء. إطلالة بانورامية خلابة على البيئة وتوجيه مثالي يضمن إضاءة طبيعية. قطاع متميز ومرغوب مع جميع المرافق الراقية في الجوار المباشر. استثمار آمن ومربح في العقارات الراقية المغربية مع عائد مضمون. أتمتة منزلية متكاملة ومواد صديقة للبيئة. حي هادئ محبوب من الزبائن الدوليين الميسورين.',
      'فيلا عائلية واسعة من {bedrooms} غرف نوم للبيع في {quartier}، {city}، تجمع بين الراحة والأناقة. {area} متر مربع موزعة بشكل متناسق على مستويين مع {bathrooms} حمامات عصرية مجهزة. حديقة متوسطية مشجرة، شرفة مغطاة للاستقبالات ومسبح مع نظام ترشيح حديث. حي هادئ وأخضر مطلوب من العائلات الميسورة التي تفضل جودة الحياة. قريبة من مدارس خاصة دولية مرموقة وعيادات حديثة ومساحات خضراء مهيأة. إمكانات ممتازة لارتفاع القيمة العقارية في قطاع في تطور مستمر. هندسة معمارية مغربية تقليدية مجددة بذوق رفيع. مرآب ثلاثي وملحقات للموظفين المنزليين.'
    ],
    price_range: { min: 2000000, max: 8000000 },
    area_range: { min: 200, max: 600 },
    bedrooms_range: { min: 3, max: 7 },
    bathrooms_range: { min: 2, max: 5 }
  },
  // HOUSES FOR SALE
  {
    property_type: 'house',
    transaction_type: 'vente',
    title_fr_patterns: [
      'Maison à vendre à {quartier}, {city}',
      'Belle maison familiale {quartier}, {city}',
      'Maison moderne à vendre {quartier}, {city}',
      'Maison avec terrasse {quartier}, {city}'
    ],
    title_ar_patterns: [
      'منزل للبيع في {quartier}، {city}',
      'منزل عائلي جميل في {quartier}، {city}',
      'منزل عصري للبيع في {quartier}، {city}',
      'منزل مع شرفة في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Maison confortable de {bedrooms} chambres à vendre à {quartier}, {city}, idéale pour première acquisition immobilière. Surface habitable de {area} m² avec {bathrooms} salles de bain modernes et petit jardin privatif fleuri. Architecture traditionnelle marocaine authentique rénovée avec goût et respect du cachet original. Quartier familial calme et sécurisé proche de toutes commodités essentielles incluant écoles publiques réputées et commerces de proximité. Idéale pour première acquisition immobilière ou investissement locatif rentable générant revenus réguliers. Prix attractif très compétitif et excellent état général nécessitant aucun travaux. Environnement résidentiel agréable avec voisinage convivial. Transports publics à proximité facilitant déplacements quotidiens. Potentiel d\'aménagement des combles pour surface supplémentaire.',
      'Belle maison de {bedrooms} chambres située {quartier}, {city}, offrant charme et authenticité marocaine. {area} m² habitables comprenant {bathrooms} salles de bain modernes équipées avec finitions soignées. Terrasse ensoleillée orientée sud et cour intérieure typique avec fontaine décorative traditionnelle. Secteur résidentiel recherché avec toutes commodités accessibles à pied en quelques minutes. Parfaite pour famille nombreuse recherchant espace ou colocation étudiante dans environnement calme. Bon rapport qualité-prix exceptionnel dans le secteur immobilier local actuel. Cuisine traditionnelle marocaine avec possibilité modernisation. Proximité marchés locaux et souks traditionnels. Cave de rangement et petit atelier. Charges de copropriété réduites.',
      'Maison traditionnelle de {bedrooms} pièces à vendre {quartier}, {city}, alliant charme et modernité. Surface totale généreuse {area} m² avec {bathrooms} salles de bain rénovées récemment. Charme authentique marocain préservé avec rénovations récentes respectant architecture traditionnelle locale. Proximité immédiate transports en commun, marchés quotidiens et services publics essentiels. Convient parfaitement à résidence principale familiale ou location saisonnière touristique rentable. Potentiel important d\'aménagement et de valorisation avec possibilité extension. Patio central traditionnel avec zelliges d\'origine. Quartier vivant avec commerces de bouche. Toiture récemment rénovée et isolation thermique renforcée.',
      'Découvrez cette maison de {bedrooms} chambres à {quartier}, {city}, dans quartier résidentiel prisé. {area} m² bien agencés et optimisés avec {bathrooms} salles de bain équipées modernes. Petit jardin arboré méditerranéen et garage attenant pouvant accueillir deux véhicules. Quartier calme et sécurisé particulièrement prisé des familles avec enfants scolarisés. Proche écoles réputées offrant enseignement de qualité et centres médicaux modernes. Excellent investissement immobilier à prix très compétitif sur marché local. Menuiseries récentes double vitrage garantissant isolation phonique. Possibilité aménagement terrasse sur toit. Système chauffage moderne et économique. Documentation complète et situation juridique claire.'
    ],
    description_ar_patterns: [
      'منزل مريح من {bedrooms} غرف نوم للبيع في {quartier}، {city}، مثالي للشراء العقاري الأول. مساحة سكنية {area} متر مربع مع {bathrooms} حمامات عصرية وحديقة صغيرة خاصة مزهرة. هندسة معمارية مغربية تقليدية أصيلة مجددة بذوق واحترام للطابع الأصلي. حي عائلي هادئ وآمن قريب من جميع المرافق الأساسية بما في ذلك مدارس عمومية مرموقة ومحلات تجارية قريبة. مثالية للشراء العقاري الأول أو الاستثمار الإيجاري المربح الذي يولد دخلا منتظما. سعر جذاب تنافسي جدا وحالة عامة ممتازة لا تتطلب أي أشغال. بيئة سكنية مريحة مع جوار ودي. وسائل نقل عامة قريبة لتسهيل التنقلات اليومية. إمكانات تهيئة العلية لمساحة إضافية.',
      'منزل جميل من {bedrooms} غرف نوم يقع في {quartier}، {city}، يوفر السحر والأصالة المغربية. {area} متر مربع قابلة للسكن تشمل {bathrooms} حمامات عصرية مجهزة مع تشطيبات متقنة. شرفة مشمسة موجهة نحو الجنوب وفناء داخلي نموذجي مع نافورة زخرفية تقليدية. قطاع سكني مرغوب مع جميع المرافق في متناول المشي في بضع دقائق. مثالية للعائلات الكبيرة الباحثة عن مساحة أو السكن المشترك للطلاب في بيئة هادئة. نسبة جودة-سعر استثنائية في القطاع العقاري المحلي الحالي. مطبخ مغربي تقليدي مع إمكانية التحديث. قرب من الأسواق المحلية والأسواق التقليدية. قبو تخزين وورشة صغيرة. رسوم ملكية مشتركة منخفضة.',
      'منزل تقليدي من {bedrooms} غرف للبيع في {quartier}، {city}، يجمع بين السحر والحداثة. مساحة إجمالية سخية {area} متر مربع مع {bathrooms} حمامات مجددة حديثا. سحر مغربي أصيل محفوظ مع تجديدات حديثة تحترم الهندسة المعمارية التقليدية المحلية. قرب فوري من وسائل النقل العام والأسواق اليومية والخدمات العامة الأساسية. مناسبة تماما للسكن الرئيسي العائلي أو الإيجار الموسمي السياحي المربح. إمكانات كبيرة للتهيئة وارتفاع القيمة مع إمكانية التوسع. فناء مركزي تقليدي مع زليج أصلي. حي حيوي مع محلات بيع المواد الغذائية. سقف مجدد حديثا وعزل حراري معزز.',
      'اكتشف هذا المنزل من {bedrooms} غرف نوم في {quartier}، {city}، في حي سكني محبوب. {area} متر مربع مرتبة جيدا ومحسنة مع {bathrooms} حمامات مجهزة عصرية. حديقة صغيرة متوسطية مشجرة ومرآب ملحق يمكنه استيعاب سيارتين. حي هادئ وآمن محبوب بشكل خاص من العائلات مع أطفال في المدارس. قريب من مدارس مرموقة توفر تعليما ذا جودة ومراكز طبية حديثة. استثمار عقاري ممتاز بسعر تنافسي جدا في السوق المحلي. نجارة حديثة بزجاج مزدوج تضمن العزل الصوتي. إمكانية تهيئة شرفة على السطح. نظام تدفئة حديث واقتصادي. وثائق كاملة ووضعية قانونية واضحة.'
    ],
    price_range: { min: 1200000, max: 4000000 },
    area_range: { min: 120, max: 300 },
    bedrooms_range: { min: 2, max: 5 },
    bathrooms_range: { min: 2, max: 4 }
  },
  // LAND FOR SALE
  {
    property_type: 'land',
    transaction_type: 'vente',
    title_fr_patterns: [
      'Terrain à vendre à {quartier}, {city}',
      'Terrain constructible {quartier}, {city}',
      'Belle parcelle de terrain {quartier}, {city}',
      'Terrain viabilisé à vendre {quartier}, {city}'
    ],
    title_ar_patterns: [
      'أرض للبيع في {quartier}، {city}',
      'أرض قابلة للبناء في {quartier}، {city}',
      'قطعة أرض جميلة في {quartier}، {city}',
      'أرض مجهزة للبيع في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Terrain constructible de {area} m² à vendre {quartier}, {city}, offrant opportunité foncière exceptionnelle. Titre foncier parfaitement en règle et toutes autorisations administratives disponibles pour construction immédiate. Zone résidentielle en développement rapide avec infrastructure moderne incluant routes pavées et éclairage public. Accès facile et sécurisé à tous réseaux incluant eau potable, électricité et assainissement collectif. Idéal pour construction villa individuelle familiale ou immeuble résidentiel avec appartements locatifs. Emplacement stratégique dans quartier recherché avec forte demande locative garantissant rentabilité. Investissement foncier sécurisé et rentable à moyen terme avec potentiel appréciation significative. Proximité écoles et commerces. Terrain plat facilitant construction. Environnement calme et verdoyant.',
      'Parcelle de terrain de {area} m² située {quartier}, {city}, dans secteur à fort potentiel immobilier. Terrain plat et entièrement viabilisé prêt à bâtir sans délai administratif supplémentaire. Secteur calme et particulièrement recherché par promoteurs immobiliers et investisseurs avisés. Proximité immédiate routes principales facilitant accès et commodités urbaines essentielles. Parfait pour projet résidentiel haut standing ou commercial selon zonage autorisé. Potentiel de valorisation important et rapide dans zone en expansion économique constante. Opportunité rare pour investisseurs avisés recherchant placement sûr et rentable. Documentation complète disponible. Possibilité lotissement avec autorisations. Zone cadastrée et bornée. Prix négociable pour transaction rapide.',
      'Terrain de {area} m² à vendre dans {quartier}, {city}, offrant emplacement privilégié stratégique. Emplacement privilégié avec excellente accessibilité routière et visibilité optimale depuis axes principaux. Documents administratifs complets et situation juridique parfaitement claire sans contentieux. Zone urbanisée moderne avec tous services publics disponibles et accessibles immédiatement. Convient parfaitement pour villa individuelle de prestige ou petit lotissement résidentiel familial. Marché immobilier local dynamique garantissant plus-value substantielle à court terme. Placement sûr et valorisant dans foncier marocain avec rendement garanti. Exposition sud idéale. Sol de qualité constructible. Voisinage résidentiel établi. Infrastructure complète disponible.',
      'Belle opportunité foncière à {quartier}, {city}, dans quartier résidentiel en plein essor. Terrain de {area} m² parfaitement bien situé et facile d\'accès depuis axes routiers principaux. Titre de propriété sécurisé et certificat d\'urbanisme favorable pour construction résidentielle. Quartier en pleine croissance démographique avec demande immobilière forte et soutenue. Idéal promoteur immobilier professionnel ou particulier souhaitant construire résidence personnelle. Rentabilité assurée grâce à localisation stratégique dans zone prisée. Prix attractif très compétitif pour superficie et emplacement proposés. Possibilité financement bancaire. Zone non inondable. Quartier sécurisé et surveillé. Investissement pérenne et sécurisé.'
    ],
    description_ar_patterns: [
      'أرض قابلة للبناء مساحتها {area} متر مربع للبيع في {quartier}، {city}، توفر فرصة عقارية استثنائية. سند ملكية قانوني بشكل مثالي وجميع التراخيص الإدارية متاحة للبناء الفوري. منطقة سكنية في تطور سريع مع بنية تحتية حديثة بما في ذلك طرق مرصوفة وإنارة عامة. وصول سهل وآمن لجميع الشبكات بما في ذلك المياه الصالحة للشرب والكهرباء والصرف الصحي الجماعي. مثالية لبناء فيلا عائلية فردية أو مبنى سكني مع شقق للإيجار. موقع استراتيجي في حي مرغوب مع طلب إيجاري قوي يضمن الربحية. استثمار عقاري آمن ومربح على المدى المتوسط مع إمكانات تقدير كبيرة. قرب من المدارس والمحلات التجارية. أرض مستوية تسهل البناء. بيئة هادئة وخضراء.',
      'قطعة أرض {area} متر مربع تقع في {quartier}، {city}، في قطاع ذو إمكانات عقارية قوية. أرض مستوية ومجهزة بالكامل جاهزة للبناء بدون تأخير إداري إضافي. قطاع هادئ ومطلوب بشكل خاص من المطورين العقاريين والمستثمرين الأذكياء. قرب فوري من الطرق الرئيسية لتسهيل الوصول والمرافق الحضرية الأساسية. مثالية لمشروع سكني راقي أو تجاري حسب تقسيم المناطق المسموح. إمكانات ارتفاع قيمة كبيرة وسريعة في منطقة في توسع اقتصادي مستمر. فرصة نادرة للمستثمرين الأذكياء الباحثين عن استثمار آمن ومربح. وثائق كاملة متاحة. إمكانية تقسيم بتراخيص. منطقة مساحية ومحددة. سعر قابل للتفاوض لمعاملة سريعة.',
      'أرض {area} متر مربع للبيع في {quartier}، {city}، توفر موقعا متميزا استراتيجيا. موقع متميز مع إمكانية وصول طرقية ممتازة ورؤية مثالية من المحاور الرئيسية. وثائق إدارية كاملة ووضعية قانونية واضحة تماما بدون نزاعات. منطقة حضرية حديثة مع جميع الخدمات العامة متاحة وقابلة للوصول فورا. مناسبة تماما لفيلا فردية مرموقة أو تقسيم سكني صغير عائلي. سوق عقاري محلي ديناميكي يضمن قيمة مضافة كبيرة على المدى القصير. استثمار آمن ومربح في الأراضي المغربية مع عائد مضمون. توجيه جنوبي مثالي. تربة ذات جودة قابلة للبناء. جوار سكني ثابت. بنية تحتية كاملة متاحة.',
      'فرصة عقارية جميلة في {quartier}، {city}، في حي سكني في ازدهار كامل. أرض {area} متر مربع موقع جيد تماما وسهل الوصول من المحاور الطرقية الرئيسية. سند ملكية آمن وشهادة تخطيط حضري إيجابية للبناء السكني. حي في نمو ديموغرافي كامل مع طلب عقاري قوي ومستدام. مثالي للمطور العقاري المحترف أو فرد يرغب في بناء إقامة شخصية. ربحية مضمونة بفضل الموقع الاستراتيجي في منطقة محبوبة. سعر جذاب تنافسي جدا للمساحة والموقع المقترحين. إمكانية تمويل بنكي. منطقة غير معرضة للفيضانات. حي آمن ومراقب. استثمار مستدام وآمن.'
    ],
    price_range: { min: 400000, max: 3000000 },
    area_range: { min: 100, max: 1500 }
  },
  // COMMERCIAL/BUREAU FOR SALE
  {
    property_type: 'commercial',
    transaction_type: 'vente',
    title_fr_patterns: [
      'Local commercial à vendre {quartier}, {city}',
      'Bureau à vendre à {quartier}, {city}',
      'Espace commercial {quartier}, {city}',
      'Boutique à vendre {quartier}, {city}'
    ],
    title_ar_patterns: [
      'محل تجاري للبيع في {quartier}، {city}',
      'مكتب للبيع في {quartier}، {city}',
      'مساحة تجارية في {quartier}، {city}',
      'دكان للبيع في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Local commercial de {area} m² à vendre {quartier}, {city}, dans zone commerciale dynamique. Emplacement stratégique premium dans zone commerciale très dynamique avec fort passage piéton quotidien. Vitrine attrayante offrant visibilité maximale et agencement moderne optimisé pour activité commerciale. Proximité immédiate banques, restaurants réputés et services essentiels attirant clientèle diverse. Idéal commerce de détail, bureau professionnel, cabinet médical ou activités tertiaires variées. Rentabilité locative élevée garantie grâce à emplacement privilégié et demande constante. Investissement commercial sécurisé dans secteur porteur avec croissance économique soutenue. Climatisation et électricité aux normes. Parking client disponible. Charges raisonnables incluant eau et entretien. Configuration modulable selon besoins.',
      'Bureau professionnel de {area} m² situé {quartier}, {city}, dans immeuble moderne et sécurisé. Espace lumineux et particulièrement bien agencé dans immeuble moderne offrant prestations haut standing. Climatisation performante, parking sécurisé réservé et sécurité renforcée avec contrôle accès inclus. Quartier d\'affaires central très recherché par entreprises locales et multinationales établies. Parfait pour cabinet avocat, comptable expert ou société conseil recherchant visibilité professionnelle. Excellent potentiel de valorisation dans secteur tertiaire en pleine expansion économique. Opportunité rare et exclusive pour investisseur commercial avisé recherchant rendement élevé. Ascenseur moderne et espaces communs entretenus. Réception avec accueil professionnel. Connexion internet fibre très haut débit.',
      'Espace commercial de {area} m² à vendre {quartier}, {city}, offrant visibilité exceptionnelle. Grande visibilité optimale sur axe très passant avec stationnement aisé pour clientèle. Aménagé spécifiquement pour activité commerciale variée ou artisanale avec installations adaptées. Secteur en développement économique constant attirant entreprises et commerces diversifiés. Convient parfaitement boutique mode, showroom automobile ou espace restauration moderne. Rendement locatif attractif garanti grâce à emplacement et dynamisme commercial. Prix compétitif exceptionnel pour emplacement premium dans zone commerciale stratégique. Façade vitrée moderne et éclairage professionnel. Réserve et sanitaires aménagés. Accès livraisons facilité. Zonage commercial autorisant activités variées.',
      'Local professionnel {area} m² dans {quartier}, {city}, avec excellent potentiel commercial. Accès facile et excellente accessibilité transport public et privé facilitant flux clients. Configuration modulable permettant adaptation selon activité souhaitée et besoins spécifiques. Zone commerciale établie et prisée avec clientèle fidèle et régulière déjà établie. Idéal startup innovante, agence communication ou point vente spécialisé recherchant visibilité. Charges réduites et gestion simplifiée permettant rentabilité optimale dès première année. Placement sûr et valorisant dans immobilier commercial avec garantie rendement locatif. Système sécurité moderne installé. Double vitrage isolant phonique. Emplacement angle très visible. Documentation juridique complète disponible.'
    ],
    description_ar_patterns: [
      'محل تجاري {area} متر مربع للبيع في {quartier}، {city}، في منطقة تجارية ديناميكية. موقع استراتيجي ممتاز في منطقة تجارية ديناميكية جدا مع حركة مشاة يومية قوية. واجهة جذابة توفر رؤية قصوى وترتيب عصري محسن للنشاط التجاري. قرب فوري من البنوك والمطاعم المشهورة والخدمات الأساسية التي تجذب زبائن متنوعين. مثالي لتجارة التجزئة أو مكتب مهني أو عيادة طبية أو أنشطة ثالثة متنوعة. ربحية إيجارية عالية مضمونة بفضل الموقع المتميز والطلب المستمر. استثمار تجاري آمن في قطاع واعد مع نمو اقتصادي مستدام. تكييف هواء وكهرباء حسب المعايير. موقف سيارات للزبائن متاح. رسوم معقولة تشمل الماء والصيانة. تكوين قابل للتعديل حسب الاحتياجات.',
      'مكتب مهني {area} متر مربع يقع في {quartier}، {city}، في مبنى حديث وآمن. مساحة مضيئة ومرتبة بشكل جيد بشكل خاص في مبنى حديث يوفر خدمات راقية. تكييف هواء فعال، موقف سيارات آمن محجوز وأمن معزز مع تحكم في الوصول مشمول. حي أعمال مركزي مطلوب جدا من الشركات المحلية والمتعددة الجنسيات الثابتة. مثالي لمكتب محاماة أو محاسب خبير أو شركة استشارية تبحث عن رؤية مهنية. إمكانات ارتفاع قيمة ممتازة في القطاع الثالث في توسع اقتصادي كامل. فرصة نادرة وحصرية للمستثمر التجاري الذكي الباحث عن عائد مرتفع. مصعد حديث ومساحات مشتركة مصانة. استقبال مع ترحيب مهني. اتصال انترنت فايبر عالي السرعة جدا.',
      'مساحة تجارية {area} متر مربع للبيع في {quartier}، {city}، توفر رؤية استثنائية. رؤية مثالية كبيرة على محور مزدحم جدا مع سهولة الوقوف للزبائن. مهيأة خصيصا لنشاط تجاري متنوع أو حرفي مع منشآت مناسبة. قطاع في تطور اقتصادي مستمر يجذب شركات ومحلات تجارية متنوعة. مناسبة تماما لمتجر أزياء أو صالة عرض سيارات أو مساحة مطاعم حديثة. عائد إيجاري جذاب مضمون بفضل الموقع والديناميكية التجارية. سعر تنافسي استثنائي لموقع ممتاز في منطقة تجارية استراتيجية. واجهة زجاجية حديثة وإضاءة مهنية. مخزن ومراحيض مهيأة. وصول تسليم ميسر. تقسيم مناطق تجاري يسمح بأنشطة متنوعة.',
      'محل مهني {area} متر مربع في {quartier}، {city}، مع إمكانات تجارية ممتازة. وصول سهل وإمكانية وصول ممتازة بالنقل العام والخاص لتسهيل تدفق الزبائن. تكوين قابل للتعديل يسمح بالتكيف حسب النشاط المطلوب والاحتياجات المحددة. منطقة تجارية ثابتة ومحبوبة مع زبائن أوفياء ومنتظمين ثابتين بالفعل. مثالي لشركة ناشئة مبتكرة أو وكالة اتصالات أو نقطة بيع متخصصة تبحث عن رؤية. رسوم منخفضة وإدارة مبسطة تسمح بربحية مثلى من السنة الأولى. استثمار آمن ومربح في العقارات التجارية مع ضمان عائد إيجاري. نظام أمن حديث مثبت. زجاج مزدوج عازل صوتي. موقع زاوية مرئي جدا. وثائق قانونية كاملة متاحة.'
    ],
    price_range: { min: 800000, max: 4000000 },
    area_range: { min: 40, max: 250 }
  },
  // COMMERCIAL FOR RENT
  {
    property_type: 'commercial',
    transaction_type: 'location',
    title_fr_patterns: [
      'Local commercial à louer {quartier}, {city}',
      'Bureau à louer à {quartier}, {city}',
      'Espace commercial en location {quartier}, {city}',
      'Boutique à louer {quartier}, {city}'
    ],
    title_ar_patterns: [
      'محل تجاري للإيجار في {quartier}، {city}',
      'مكتب للإيجار في {quartier}، {city}',
      'مساحة تجارية للإيجار في {quartier}، {city}',
      'دكان للإيجار في {quartier}، {city}'
    ],
    description_fr_patterns: [
      'Local commercial {area} m² à louer {quartier}, {city}, dans environnement commercial dynamique. Emplacement premium exceptionnel avec vitrine attrayante sur rue très passante garantissant visibilité. Aménagement soigné professionnel et équipements modernes incluant climatisation et système sécurité. Zone commerciale attractive et établie avec clientèle fidèle et régulière déjà constituée. Convient parfaitement pour commerce alimentaire, boutique mode, services professionnels ou activités tertiaires. Loyer raisonnable et compétitif incluant charges courantes eau et entretien espaces communs. Disponible immédiatement pour exploitation commerciale sans délai avec bail flexible. Proximité transports publics et parking clients. Connexion internet fibre disponible. Secteur piétonnier animé. Possibilité enseigne extérieure.',
      'Bureau professionnel {area} m² en location {quartier}, {city}, offrant prestations haut standing. Espace climatisé moderne avec connexion internet fibre très haut débit pour activités tertiaires. Immeuble sécurisé avec accès contrôlé professionnel et parking réservé pour employés visiteurs. Quartier d\'affaires central très fréquenté et prisé par entreprises locales internationales. Idéal cabinet conseil professionnel, agence communication ou siège social entreprise recherchant prestige. Bail flexible et adaptable selon besoins spécifiques entreprise en croissance ou établie. Excellent rapport qualité-prix dans secteur tertiaire avec services inclus. Ascenseur moderne rapide et espaces communs entretenus. Réception professionnelle avec accueil. Salles réunion disponibles. Configuration bureaux modulable.',
      'Espace commercial {area} m² disponible {quartier}, {city}, avec excellente visibilité commerciale. Configuration adaptable permettant aménagement pour diverses activités commerciales artisanales ou professionnelles. Visibilité optimale garantie et accessibilité facilitée avec stationnement aisé pour clientèle. Secteur dynamique en pleine expansion économique attirant commerces et services diversifiés. Parfait showroom produits, atelier création ou espace coworking moderne pour entrepreneurs. Conditions locatives particulièrement avantageuses avec charges maîtrisées et transparentes. Opportunité commerciale à saisir rapidement dans zone commerciale stratégique en développement. Éclairage professionnel LED. Sanitaires modernes conformes. Accès PMR aménagé. Zonage autorisant activités variées.',
      'Local professionnel {area} m² à louer {quartier}, {city}, prêt exploitation immédiate. Bien entretenu et prêt à usage immédiat sans travaux nécessitant investissement supplémentaire. Proche transports publics efficaces et axes routiers principaux facilitant accès clients employés. Zone mixte résidentiel-commercial équilibrée offrant dynamisme et stabilité clientèle. Convient parfaitement professions libérales médicales ou activités tertiaires services aux entreprises. Charges maîtrisées et gestion transparente professionnelle permettant rentabilité optimale. Prix attractif très compétitif pour localisation stratégique dans secteur recherché. Double vitrage isolation phonique thermique. Système chauffage moderne économique. Cuisine équipée disponible. Possibilité bail longue durée renouvelable.'
    ],
    description_ar_patterns: [
      'محل تجاري {area} متر مربع للإيجار في {quartier}، {city}، في بيئة تجارية ديناميكية. موقع ممتاز استثنائي مع واجهة جذابة على شارع مزدحم جدا يضمن الرؤية. ترتيب متقن احترافي ومعدات حديثة بما في ذلك تكييف الهواء ونظام الأمن. منطقة تجارية جذابة وثابتة مع زبائن أوفياء ومنتظمين مكونين بالفعل. مناسبة تماما لتجارة الأغذية أو محل أزياء أو خدمات مهنية أو أنشطة ثالثة. إيجار معقول وتنافسي يشمل الرسوم الجارية للمياه وصيانة المساحات المشتركة. متاحة فورا للاستغلال التجاري بدون تأخير مع عقد إيجار مرن. قرب من وسائل النقل العام وموقف سيارات للزبائن. اتصال انترنت فايبر متاح. قطاع مشاة حيوي. إمكانية لافتة خارجية.',
      'مكتب مهني {area} متر مربع للإيجار في {quartier}، {city}، يوفر خدمات راقية. مساحة مكيفة حديثة مع اتصال انترنت فايبر عالي السرعة جدا للأنشطة الثالثة. مبنى آمن مع دخول مراقب احترافي وموقف سيارات محجوز للموظفين والزوار. حي أعمال مركزي مزدحم جدا ومحبوب من الشركات المحلية الدولية. مثالي لمكتب استشاري مهني أو وكالة اتصالات أو مقر رئيسي لشركة تبحث عن المكانة. عقد إيجار مرن وقابل للتكيف حسب الاحتياجات المحددة لشركة في نمو أو ثابتة. نسبة جودة-سعر ممتازة في القطاع الثالث مع خدمات مشمولة. مصعد حديث سريع ومساحات مشتركة مصانة. استقبال احترافي مع ترحيب. قاعات اجتماعات متاحة. تكوين مكاتب قابل للتعديل.',
      'مساحة تجارية {area} متر مربع متاحة في {quartier}، {city}، مع رؤية تجارية ممتازة. تكوين قابل للتكيف يسمح بالتهيئة لأنشطة تجارية حرفية أو مهنية متنوعة. رؤية مثالية مضمونة وإمكانية وصول ميسرة مع سهولة الوقوف للزبائن. قطاع ديناميكي في توسع اقتصادي كامل يجذب محلات تجارية وخدمات متنوعة. مثالية لصالة عرض منتجات أو ورشة إبداع أو مساحة عمل مشتركة حديثة لرواد الأعمال. شروط إيجار مفيدة بشكل خاص مع رسوم متحكم فيها وشفافة. فرصة تجارية للاستيلاء عليها بسرعة في منطقة تجارية استراتيجية في تطور. إضاءة مهنية LED. مراحيض حديثة مطابقة. وصول للأشخاص ذوي الحركة المحدودة مهيأ. تقسيم مناطق يسمح بأنشطة متنوعة.',
      'محل مهني {area} متر مربع للإيجار في {quartier}، {city}، جاهز للاستغلال الفوري. محافظ عليه جيدا وجاهز للاستخدام الفوري بدون أشغال تتطلب استثمارا إضافيا. قريب من وسائل نقل عامة فعالة ومحاور طرقية رئيسية لتسهيل وصول الزبائن والموظفين. منطقة مختلطة سكنية-تجارية متوازنة توفر ديناميكية واستقرار الزبائن. مناسبة تماما للمهن الحرة الطبية أو الأنشطة الثالثة والخدمات للشركات. رسوم متحكم فيها وإدارة شفافة مهنية تسمح بربحية مثلى. سعر جذاب تنافسي جدا لموقع استراتيجي في قطاع مرغوب. زجاج مزدوج عزل صوتي حراري. نظام تدفئة حديث اقتصادي. مطبخ مجهز متاح. إمكانية عقد إيجار طويل الأمد قابل للتجديد.'
    ],
    price_range: { min: 3500, max: 18000 },
    area_range: { min: 35, max: 200 }
  }
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// =====================================================
// LISTING GENERATION
// =====================================================

interface Listing {
  advertiser_type: string;
  transaction_type: string;
  property_type: string;
  category_label_fr: string;
  category_label_ar: string;
  city: string;
  quartier: string;
  price: number;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
  featured: boolean;
  status: string;
  is_archived: boolean;
}

function generateListings(): Listing[] {
  const listings: Listing[] = [];
  
  // Create distribution arrays
  const advertiserPool: string[] = [];
  advertiserPool.push(...Array(ADVERTISER_DISTRIBUTION.proprietaire).fill('proprietaire'));
  advertiserPool.push(...Array(ADVERTISER_DISTRIBUTION.courtier).fill('courtier'));
  advertiserPool.push(...Array(ADVERTISER_DISTRIBUTION.agence).fill('agence'));
  
  const categoryPool: string[] = [];
  categoryPool.push(...Array(CATEGORY_DISTRIBUTION.apartment).fill('apartment'));
  categoryPool.push(...Array(CATEGORY_DISTRIBUTION.villa).fill('villa'));
  categoryPool.push(...Array(CATEGORY_DISTRIBUTION.house).fill('house'));
  categoryPool.push(...Array(CATEGORY_DISTRIBUTION.land).fill('land'));
  categoryPool.push(...Array(CATEGORY_DISTRIBUTION.bureau).fill('bureau'));
  categoryPool.push(...Array(CATEGORY_DISTRIBUTION.commercial).fill('commercial'));
  
  // Shuffle for randomness
  const shuffledAdvertisers = shuffleArray(advertiserPool);
  const shuffledCategories = shuffleArray(categoryPool);
  
  // Generate 200 listings
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const advertiserType = shuffledAdvertisers[i];
    let categoryType = shuffledCategories[i];
    
    // Determine if this should be from a southern city (60/200 = 30%)
    const isSouthern = i < 60;
    
    // Select city
    const cityPool = isSouthern ? SOUTHERN_CITIES : MAJOR_CITIES;
    const city = randomChoice(cityPool);
    const quartier = randomChoice(city.neighborhoods);
    
    // Select appropriate template
    // Bureau maps to commercial in the DB
    const dbPropertyType = categoryType === 'bureau' ? 'commercial' : categoryType;
    
    const applicableTemplates = PROPERTY_TEMPLATES.filter(t => 
      (categoryType === 'bureau' && t.property_type === 'commercial') ||
      (categoryType === 'commercial' && t.property_type === 'commercial') ||
      (t.property_type === categoryType)
    );
    
    const template = randomChoice(applicableTemplates);
    
    // Generate property details
    const area = randomInt(template.area_range.min, template.area_range.max);
    const bedrooms = template.bedrooms_range ? randomInt(template.bedrooms_range.min, template.bedrooms_range.max) : null;
    const bathrooms = template.bathrooms_range ? randomInt(template.bathrooms_range.min, template.bathrooms_range.max) : null;
    
    // Calculate price based on city (southern cities cheaper)
    const priceMultiplier = city.isSouthern ? 0.6 : 1.0;
    const basePrice = randomInt(template.price_range.min, template.price_range.max);
    const price = Math.round(basePrice * priceMultiplier);
    
    // Generate titles
    const title_fr_template = randomChoice(template.title_fr_patterns);
    const title_ar_template = randomChoice(template.title_ar_patterns);
    
    const title_fr = title_fr_template
      .replace('{quartier}', quartier)
      .replace('{city}', city.name_fr);
    
    const title_ar = title_ar_template
      .replace('{quartier}', quartier)
      .replace('{city}', city.name_ar);
    
    // Generate descriptions
    const description_fr_template = randomChoice(template.description_fr_patterns);
    const description_ar_template = randomChoice(template.description_ar_patterns);
    
    const description_fr = description_fr_template
      .replace(/{quartier}/g, quartier)
      .replace(/{city}/g, city.name_fr)
      .replace(/{area}/g, area.toString())
      .replace(/{bedrooms}/g, bedrooms?.toString() || '')
      .replace(/{bathrooms}/g, bathrooms?.toString() || '');
    
    const description_ar = description_ar_template
      .replace(/{quartier}/g, quartier)
      .replace(/{city}/g, city.name_ar)
      .replace(/{area}/g, area.toString())
      .replace(/{bedrooms}/g, bedrooms?.toString() || '')
      .replace(/{bathrooms}/g, bathrooms?.toString() || '');
    
    // Category labels
    const categoryLabels: Record<string, { fr: string; ar: string }> = {
      apartment: { fr: 'Appartement', ar: 'شقة' },
      villa: { fr: 'Villa', ar: 'فيلا' },
      house: { fr: 'Maison', ar: 'منزل' },
      land: { fr: 'Terrain', ar: 'أرض' },
      bureau: { fr: 'Bureau', ar: 'مكتب' },
      commercial: { fr: 'Commercial', ar: 'تجاري' }
    };
    
    const labels = categoryLabels[categoryType];
    
    // Featured: ~10% of listings
    const featured = Math.random() < 0.10;
    
    listings.push({
      advertiser_type: advertiserType,
      transaction_type: template.transaction_type,
      property_type: dbPropertyType,
      category_label_fr: labels.fr,
      category_label_ar: labels.ar,
      city: city.name_fr,
      quartier,
      price,
      area_sqm: area,
      bedrooms,
      bathrooms,
      title_fr,
      title_ar,
      description_fr,
      description_ar,
      featured,
      status: 'approved',
      is_archived: false
    });
  }
  
  return listings;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏠 Moroccan Real Estate Listings Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Generating 200 realistic Moroccan property listings...');
  console.log('');
  
  const listings = generateListings();
  
  // Verify distribution
  const advertiserCounts = {
    proprietaire: listings.filter(l => l.advertiser_type === 'proprietaire').length,
    courtier: listings.filter(l => l.advertiser_type === 'courtier').length,
    agence: listings.filter(l => l.advertiser_type === 'agence').length
  };
  
  const categoryCounts = {
    apartment: listings.filter(l => l.property_type === 'apartment').length,
    villa: listings.filter(l => l.property_type === 'villa').length,
    house: listings.filter(l => l.property_type === 'house').length,
    land: listings.filter(l => l.property_type === 'land').length,
    commercial: listings.filter(l => l.property_type === 'commercial').length
  };
  
  const southernCount = listings.filter(l => 
    SOUTHERN_CITIES.some(c => c.name_fr === l.city)
  ).length;
  
  const majorCount = listings.length - southernCount;
  const featuredCount = listings.filter(l => l.featured).length;
  
  console.log('✅ Generation Complete!');
  console.log('');
  console.log('📊 Distribution Summary:');
  console.log('');
  console.log('Advertiser Types:');
  console.log(`  - Propriétaire: ${advertiserCounts.proprietaire} (target: 80)`);
  console.log(`  - Courtier: ${advertiserCounts.courtier} (target: 70)`);
  console.log(`  - Agence: ${advertiserCounts.agence} (target: 50)`);
  console.log('');
  console.log('Property Categories:');
  console.log(`  - Apartment: ${categoryCounts.apartment} (target: 70)`);
  console.log(`  - Villa: ${categoryCounts.villa} (target: 35)`);
  console.log(`  - House: ${categoryCounts.house} (target: 35)`);
  console.log(`  - Land: ${categoryCounts.land} (target: 25)`);
  console.log(`  - Commercial: ${categoryCounts.commercial} (target: 35 = bureau 20 + commercial 15)`);
  console.log('');
  console.log('City Distribution:');
  console.log(`  - Major Cities: ${majorCount} (target: 140)`);
  console.log(`  - Southern/Saharan: ${southernCount} (target: 60)`);
  console.log('');
  console.log(`Featured Listings: ${featuredCount} (~${Math.round(featuredCount/TOTAL_LISTINGS*100)}%)`);
  console.log('');
  
  // Write to file
  const jsonOutput = JSON.stringify(listings, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonOutput, 'utf-8');
  
  console.log(`📄 Output saved to: ${OUTPUT_FILE}`);
  console.log(`📏 File size: ${(jsonOutput.length / 1024).toFixed(2)} KB`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ All listings generated with French & Arabic content!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

main();
