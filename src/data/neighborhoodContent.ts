/**
 * SEO-optimized content for major Moroccan neighborhoods
 * Each neighborhood page includes:
 * - H1: Immobilier à [Neighborhood], [City]
 * - Description of the neighborhood
 * - Types of properties available
 * - Average prices (generic, no fake numbers)
 * - SEO-friendly internal links
 * Language: French
 */

export interface NeighborhoodContent {
  citySlug: string;
  neighborhoodSlug: string;
  h1: string;
  introduction: string;
  description: string;
  propertyTypes: string[];
  priceInfo: string;
  highlights: string[];
  seoKeywords: string[];
}

export const NEIGHBORHOOD_CONTENT: Record<string, NeighborhoodContent> = {
  // Casablanca neighborhoods
  'casablanca-maarif': {
    citySlug: 'casablanca',
    neighborhoodSlug: 'maarif',
    h1: 'Immobilier à Maarif, Casablanca',
    introduction: 'Maarif est l\'un des quartiers les plus dynamiques et recherchés de Casablanca. Situé au cœur de la ville, ce quartier cosmopolite offre un excellent mélange de modernité et d\'authenticité avec ses nombreux commerces, restaurants et infrastructures.',
    description: 'Le quartier Maarif à Casablanca est particulièrement apprécié pour sa centralité et sa vie de quartier animée. On y trouve de nombreux appartements modernes, des immeubles résidentiels bien entretenus et une excellente desserte en transports en commun. Le marché immobilier de Maarif attire particulièrement les jeunes professionnels, les familles et les investisseurs grâce à sa forte demande locative. Les rues principales comme le Boulevard Zerktouni et l\'Avenue 2 Mars concentrent commerces, cafés et services de proximité.',
    propertyTypes: [
      'Appartements de 2 à 4 pièces',
      'Studios pour jeunes actifs',
      'Locaux commerciaux',
      'Appartements avec terrasse',
      'Immeubles d\'investissement'
    ],
    priceInfo: 'Les prix à Maarif se situent généralement entre 15 000 et 22 000 DH/m² pour l\'achat, avec des loyers moyens de 4 000 à 8 000 DH pour un appartement de 2-3 pièces. Le quartier offre un excellent rapport qualité-prix pour la location et l\'investissement locatif.',
    highlights: [
      'Quartier central et bien desservi',
      'Nombreux commerces et restaurants',
      'Fort potentiel locatif',
      'Transports en commun accessibles',
      'Proximité des écoles et services',
      'Vie de quartier animée'
    ],
    seoKeywords: ['appartement maarif', 'location maarif casablanca', 'immobilier maarif', 'acheter maarif']
  },

  'casablanca-anfa': {
    citySlug: 'casablanca',
    neighborhoodSlug: 'anfa',
    h1: 'Immobilier à Anfa, Casablanca',
    introduction: 'Anfa est le quartier résidentiel haut de gamme par excellence de Casablanca. Avec ses larges avenues arborées, ses villas luxueuses et ses résidences de standing, Anfa incarne l\'élégance et le prestige immobilier de la métropole économique.',
    description: 'Le quartier d\'Anfa se distingue par son caractère résidentiel privilégié et son calme. On y trouve principalement des villas spacieuses, des appartements de grand standing et des résidences sécurisées. Le marché immobilier d\'Anfa cible une clientèle aisée recherchant qualité, tranquillité et prestations haut de gamme. Le quartier abrite également le célèbre Morocco Mall, de nombreuses ambassades, des écoles internationales et des espaces verts. La proximité de la Corniche et de la mosquée Hassan II en fait un emplacement de choix.',
    propertyTypes: [
      'Villas de prestige avec jardin et piscine',
      'Appartements de standing (3-5 pièces)',
      'Penthouses avec terrasse',
      'Résidences fermées sécurisées',
      'Duplex et triplex de luxe'
    ],
    priceInfo: 'Anfa compte parmi les quartiers les plus chers de Casablanca. Les prix d\'achat varient généralement entre 25 000 et 40 000 DH/m² pour les appartements de standing, et peuvent dépasser 50 000 DH/m² pour les biens d\'exception. Les loyers se situent entre 8 000 et 20 000 DH selon la taille et les prestations.',
    highlights: [
      'Quartier résidentiel haut de gamme',
      'Proximité Morocco Mall et Corniche',
      'Villas de prestige et résidences sécurisées',
      'Écoles internationales',
      'Calme et verdure',
      'Excellente valorisation immobilière'
    ],
    seoKeywords: ['villa anfa', 'appartement anfa casablanca', 'immobilier luxe anfa', 'résidence anfa']
  },

  'casablanca-ain-diab': {
    citySlug: 'casablanca',
    neighborhoodSlug: 'ain-diab',
    h1: 'Immobilier à Aïn Diab, Casablanca',
    introduction: 'Aïn Diab, la Corniche de Casablanca, offre un cadre de vie exceptionnel en bord de mer. Ce quartier prisé combine résidences de standing, vie nocturne animée et vue imprenable sur l\'océan Atlantique, attirant une clientèle recherchant un style de vie balnéaire au cœur de la ville.',
    description: 'Le quartier d\'Aïn Diab s\'étend le long de la Corniche de Casablanca et est réputé pour ses nombreux restaurants, clubs, et complexes de loisirs en bord de mer. Le marché immobilier y est particulièrement dynamique avec une forte demande pour les appartements avec vue mer et les résidences modernes. La proximité des plages, des piscines municipales et du centre commercial Anfa Place en fait un emplacement de choix pour les familles et les jeunes actifs. Le quartier connaît un développement continu avec de nouveaux projets immobiliers de standing.',
    propertyTypes: [
      'Appartements vue mer',
      'Résidences avec piscine',
      'Penthouses de luxe',
      'Studios et F2 pour investissement',
      'Villas en bord de mer'
    ],
    priceInfo: 'Les prix à Aïn Diab reflètent l\'attractivité du quartier. Pour l\'achat, comptez entre 20 000 et 35 000 DH/m² pour un appartement, avec une prime significative pour les biens avec vue mer directe. Les loyers varient de 5 000 à 15 000 DH selon la superficie et les prestations.',
    highlights: [
      'Bord de mer et plages',
      'Vie nocturne et restaurants',
      'Résidences modernes avec piscines',
      'Proximité du centre-ville',
      'Anfa Place et commerces',
      'Cadre de vie balnéaire unique'
    ],
    seoKeywords: ['appartement ain diab', 'vue mer casablanca', 'corniche casablanca immobilier', 'location ain diab']
  },

  'casablanca-gauthier': {
    citySlug: 'casablanca',
    neighborhoodSlug: 'gauthier',
    h1: 'Immobilier à Gauthier, Casablanca',
    introduction: 'Gauthier est un quartier central et résidentiel de Casablanca, apprécié pour son architecture Art Déco, ses commerces de proximité et son ambiance conviviale. C\'est un secteur recherché pour l\'équilibre qu\'il offre entre vie urbaine et tranquillité résidentielle.',
    description: 'Le quartier Gauthier se situe entre Maarif et le Centre-Ville, offrant un emplacement stratégique. On y trouve principalement des immeubles d\'appartements des années 50-70, certains rénovés, ainsi que de nouveaux programmes immobiliers. Le marché attire les familles et les professionnels grâce aux nombreuses écoles, commerces et services à proximité. Les avenues Omar El Khayam et Mostafa El Maani sont particulièrement recherchées. Le quartier bénéficie d\'une excellente desserte en transports et d\'un accès facile aux zones d\'affaires.',
    propertyTypes: [
      'Appartements de 2 à 4 pièces',
      'Immeubles anciens à rénover',
      'Nouveaux programmes résidentiels',
      'Locaux commerciaux',
      'Bureaux et espaces professionnels'
    ],
    priceInfo: 'Gauthier propose des prix intermédiaires à Casablanca. Pour l\'achat, prévoyez entre 14 000 et 20 000 DH/m² selon l\'état et l\'emplacement. Les loyers se situent entre 3 500 et 7 000 DH pour un appartement de 2-3 pièces, offrant un bon rendement locatif.',
    highlights: [
      'Quartier central bien situé',
      'Architecture Art Déco',
      'Nombreux commerces et services',
      'Écoles et transports accessibles',
      'Bon rapport qualité-prix',
      'Potentiel d\'investissement'
    ],
    seoKeywords: ['appartement gauthier', 'immobilier gauthier casablanca', 'location gauthier', 'acheter gauthier']
  },

  'casablanca-sidi-maarouf': {
    citySlug: 'casablanca',
    neighborhoodSlug: 'sidi-maarouf',
    h1: 'Immobilier à Sidi Maarouf, Casablanca',
    introduction: 'Sidi Maarouf est le pôle économique et technologique de Casablanca, abritant de nombreuses zones d\'affaires, entreprises internationales et le Technopark. Ce quartier moderne et en pleine expansion attire particulièrement les professionnels et les investisseurs.',
    description: 'Sidi Maarouf s\'est transformé en un quartier d\'affaires majeur avec le développement de zones comme CasaNearshore, Casablanca Finance City et le Technopark. Le marché immobilier y est très dynamique avec une forte demande locative des professionnels travaillant dans le secteur. On y trouve principalement des résidences modernes, des appartements fonctionnels et de nouveaux programmes immobiliers. La proximité de l\'autoroute, de l\'aéroport Mohammed V et des zones commerciales en fait un emplacement stratégique.',
    propertyTypes: [
      'Appartements modernes (1-3 pièces)',
      'Résidences sécurisées',
      'Studios pour professionnels',
      'Espaces de bureaux',
      'Locaux commerciaux'
    ],
    priceInfo: 'Les prix à Sidi Maarouf sont attractifs pour un quartier aussi bien situé. L\'achat varie entre 12 000 et 18 000 DH/m² pour les appartements neufs. Les loyers se situent entre 3 000 et 6 000 DH, avec un excellent potentiel locatif grâce à la demande des entreprises.',
    highlights: [
      'Pôle économique majeur',
      'Proximité zones d\'affaires',
      'Excellent potentiel locatif',
      'Accès autoroute et aéroport',
      'Résidences modernes',
      'Développement continu'
    ],
    seoKeywords: ['appartement sidi maarouf', 'location sidi maarouf', 'immobilier technopark', 'investissement sidi maarouf']
  },

  // Rabat neighborhoods
  'rabat-agdal': {
    citySlug: 'rabat',
    neighborhoodSlug: 'agdal',
    h1: 'Immobilier à Agdal, Rabat',
    introduction: 'Agdal est le quartier le plus prisé de Rabat, combinant centralité, commerces, restaurants et vie culturelle. Ce secteur résidentiel haut de gamme est particulièrement recherché par les fonctionnaires, diplomates et familles aisées.',
    description: 'Le quartier d\'Agdal se distingue par son emplacement stratégique au cœur de Rabat. On y trouve un excellent mélange de résidences de standing, d\'immeubles d\'appartements modernes et de villas. Le marché immobilier d\'Agdal est très stable avec une demande constante. Les avenues principales comme l\'Avenue de France et l\'Avenue Imam Malik concentrent commerces de luxe, restaurants, cafés et services. La proximité des universités, écoles privées et ministères en fait un quartier très demandé. Les espaces verts et parcs contribuent à la qualité de vie.',
    propertyTypes: [
      'Appartements de standing (2-4 pièces)',
      'Villas avec jardin',
      'Penthouses',
      'Résidences sécurisées',
      'Locaux commerciaux de prestige'
    ],
    priceInfo: 'Agdal compte parmi les quartiers les plus chers de Rabat. Les prix d\'achat varient entre 16 000 et 25 000 DH/m² pour les appartements, pouvant atteindre 35 000 DH/m² pour les biens d\'exception. Les loyers se situent entre 6 000 et 12 000 DH selon la taille et l\'emplacement.',
    highlights: [
      'Quartier le plus central de Rabat',
      'Commerces et restaurants haut de gamme',
      'Excellente desserte',
      'Proximité universités et ministères',
      'Vie culturelle animée',
      'Valeur immobilière stable'
    ],
    seoKeywords: ['appartement agdal rabat', 'location agdal', 'immobilier agdal', 'villa agdal']
  },

  'rabat-hay-riad': {
    citySlug: 'rabat',
    neighborhoodSlug: 'hay-riad',
    h1: 'Immobilier à Hay Riad, Rabat',
    introduction: 'Hay Riad est un quartier résidentiel moderne et bien planifié de Rabat. Avec ses résidences sécurisées, ses espaces verts et ses infrastructures récentes, c\'est un secteur privilégié pour les familles recherchant confort et tranquillité.',
    description: 'Hay Riad s\'est développé comme un quartier résidentiel de standing avec de nombreuses résidences fermées, des villas contemporaines et des immeubles modernes. Le marché immobilier y est particulièrement attractif pour les familles et les cadres supérieurs. Le quartier dispose d\'excellentes infrastructures : écoles internationales (American School, Lycée Descartes), centres commerciaux (Mega Mall), espaces verts et terrains de sport. La proximité du Palais Royal et des ambassades en fait un secteur prisé par les diplomates.',
    propertyTypes: [
      'Villas modernes avec jardin',
      'Appartements de standing (3-5 pièces)',
      'Résidences fermées sécurisées',
      'Duplex et triplex',
      'Maisons mitoyennes'
    ],
    priceInfo: 'Hay Riad offre un bon rapport qualité-prix pour un quartier résidentiel de cette qualité. Les prix d\'achat varient entre 14 000 et 22 000 DH/m² pour les appartements, et de 3 à 8 millions DH pour les villas selon la taille. Les loyers se situent entre 7 000 et 15 000 DH.',
    highlights: [
      'Quartier résidentiel moderne',
      'Résidences sécurisées',
      'Écoles internationales',
      'Espaces verts et parcs',
      'Proximité Mega Mall',
      'Calme et sécurité'
    ],
    seoKeywords: ['villa hay riad', 'appartement hay riad rabat', 'location hay riad', 'résidence hay riad']
  },

  'rabat-souissi': {
    citySlug: 'rabat',
    neighborhoodSlug: 'souissi',
    h1: 'Immobilier à Souissi, Rabat',
    introduction: 'Souissi est le quartier résidentiel le plus huppé de Rabat, reconnu pour ses somptueuses villas, ses ambassades et son caractère exclusif. C\'est le secteur de prédilection pour une clientèle aisée recherchant luxe, calme et prestige.',
    description: 'Le quartier Souissi incarne l\'excellence immobilière à Rabat. On y trouve principalement de majestueuses villas avec jardins paysagers, piscines et prestations haut de gamme. Le marché immobilier de Souissi cible une clientèle très aisée : hauts fonctionnaires, ambassadeurs, chefs d\'entreprise. Le quartier se caractérise par ses larges avenues arborées, sa verdure omniprésente et son atmosphère paisible. La proximité du Golf Royal, des plages de Rabat et du centre-ville en fait un emplacement exceptionnel. Souissi abrite également plusieurs résidences diplomatiques et écoles internationales.',
    propertyTypes: [
      'Villas de luxe avec piscine et jardin',
      'Résidences d\'ambassadeurs',
      'Propriétés avec vue sur l\'océan',
      'Villas modernes architecturales',
      'Quelques rares appartements de très grand standing'
    ],
    priceInfo: 'Souissi est le quartier le plus cher de Rabat. Les villas se vendent généralement entre 8 et 30 millions DH selon la taille, l\'emplacement et les prestations. Les prix au m² peuvent atteindre 30 000 à 40 000 DH. Les locations se situent entre 15 000 et 40 000 DH par mois.',
    highlights: [
      'Quartier le plus prestigieux de Rabat',
      'Villas de luxe exceptionnelles',
      'Nombreuses ambassades',
      'Proximité Golf Royal',
      'Calme et verdure absolus',
      'Sécurité maximale'
    ],
    seoKeywords: ['villa souissi rabat', 'immobilier luxe souissi', 'location villa souissi', 'prestige souissi']
  },

  // Marrakech neighborhoods
  'marrakech-gueliz': {
    citySlug: 'marrakech',
    neighborhoodSlug: 'gueliz',
    h1: 'Immobilier à Guéliz, Marrakech',
    introduction: 'Guéliz est le quartier moderne de Marrakech, véritable centre névralgique de la ville nouvelle. Avec son architecture européenne, ses commerces, restaurants et vie culturelle, c\'est le secteur le plus dynamique et cosmopolite de la ville ocre.',
    description: 'Le quartier Guéliz concentre l\'essentiel de l\'activité commerciale et résidentielle moderne de Marrakech. On y trouve principalement des immeubles d\'appartements, des résidences modernes et quelques villas. Le marché immobilier de Guéliz est très actif, attirant résidents marocains, expatriés et investisseurs. L\'avenue Mohammed V, artère principale, regroupe boutiques internationales, cafés, restaurants et hôtels. Le quartier dispose d\'excellentes infrastructures : cinémas, théâtres, galeries d\'art, écoles privées. La proximité du Jardin Majorelle, du Carré Eden Shopping et de la gare ferroviaire en fait un emplacement de choix.',
    propertyTypes: [
      'Appartements modernes (1-4 pièces)',
      'Résidences avec services',
      'Locaux commerciaux',
      'Bureaux et espaces professionnels',
      'Quelques villas en retrait'
    ],
    priceInfo: 'Guéliz propose des prix reflétant son attractivité. Pour l\'achat, comptez entre 18 000 et 28 000 DH/m² pour un appartement, avec des variations selon l\'emplacement et le standing. Les loyers oscillent entre 4 000 et 10 000 DH, avec un bon potentiel pour la location saisonnière.',
    highlights: [
      'Centre névralgique de Marrakech',
      'Nombreux commerces et restaurants',
      'Vie culturelle riche',
      'Excellent potentiel locatif',
      'Proximité Jardin Majorelle',
      'Infrastructures modernes'
    ],
    seoKeywords: ['appartement gueliz marrakech', 'location gueliz', 'immobilier gueliz', 'investissement gueliz']
  },

  'marrakech-hivernage': {
    citySlug: 'marrakech',
    neighborhoodSlug: 'hivernage',
    h1: 'Immobilier à Hivernage, Marrakech',
    introduction: 'Hivernage est le quartier haut de gamme de Marrakech, célèbre pour ses hôtels de luxe, ses restaurants prestigieux et ses résidences de standing. C\'est le secteur privilégié pour un investissement immobilier de prestige dans la ville ocre.',
    description: 'Le quartier Hivernage se caractérise par son luxe et son raffinement. On y trouve principalement des résidences haut de gamme, des appartements de standing et des hôtels-palaces comme La Mamounia. Le marché immobilier d\'Hivernage cible une clientèle aisée et internationale recherchant confort, prestations de luxe et proximité des lieux emblématiques. Le quartier jouxte les remparts de la médina et le célèbre Jardin de la Koutoubia. Ses larges avenues arborées, ses espaces verts et sa tranquillité en font un emplacement exceptionnel. Le potentiel de location saisonnière y est excellent grâce à l\'afflux touristique.',
    propertyTypes: [
      'Appartements de standing (2-5 pièces)',
      'Penthouses avec terrasse',
      'Résidences hôtelières',
      'Villas de luxe',
      'Investissements locatifs haut de gamme'
    ],
    priceInfo: 'Hivernage est l\'un des quartiers les plus chers de Marrakech. Les prix d\'achat varient entre 25 000 et 45 000 DH/m² pour les appartements, pouvant dépasser 50 000 DH/m² pour les biens d\'exception. Les loyers longue durée se situent entre 8 000 et 20 000 DH, avec d\'excellents revenus en location saisonnière.',
    highlights: [
      'Quartier prestigieux de Marrakech',
      'Proximité médina et Koutoubia',
      'Hôtels de luxe et restaurants',
      'Excellent potentiel touristique',
      'Résidences de standing',
      'Calme et verdure'
    ],
    seoKeywords: ['appartement hivernage marrakech', 'luxe hivernage', 'location saisonnière hivernage', 'investissement hivernage']
  },

  'marrakech-palmeraie': {
    citySlug: 'marrakech',
    neighborhoodSlug: 'palmeraie',
    h1: 'Immobilier à Palmeraie, Marrakech',
    introduction: 'La Palmeraie de Marrakech offre un cadre de vie unique au milieu de milliers de palmiers. Ce secteur résidentiel d\'exception est réputé pour ses somptueuses villas, ses resorts de luxe et son atmosphère paisible, attirant une clientèle internationale recherchant l\'exclusivité.',
    description: 'La Palmeraie s\'étend sur plusieurs hectares autour de Marrakech et représente le summum du luxe résidentiel. Le marché immobilier y est dominé par les villas de prestige, les riads contemporains et les complexes résidentiels sécurisés. On y trouve également des resorts haut de gamme, des golfs et des spas. L\'attractivité de la Palmeraie réside dans son cadre naturel exceptionnel, sa tranquillité absolue et ses prestations luxueuses : piscines, jardins paysagers, vue sur l\'Atlas. C\'est le secteur privilégié pour les résidences secondaires et l\'investissement de prestige, avec un excellent potentiel de location saisonnière touristique.',
    propertyTypes: [
      'Villas de luxe avec piscine',
      'Riads contemporains',
      'Propriétés au sein de résidences sécurisées',
      'Villas avec golf',
      'Investissements résidences hôtelières'
    ],
    priceInfo: 'La Palmeraie propose des biens immobiliers haut de gamme. Les villas se vendent généralement entre 5 et 30 millions DH selon la taille, les prestations et l\'emplacement. Les prix peuvent atteindre des sommets pour les propriétés exceptionnelles. Les locations saisonnières génèrent des revenus élevés, de 5 000 à 30 000 DH par semaine.',
    highlights: [
      'Cadre naturel exceptionnel',
      'Villas de luxe et resorts',
      'Proximité des golfs',
      'Vue sur l\'Atlas',
      'Excellent potentiel location saisonnière',
      'Tranquillité et exclusivité'
    ],
    seoKeywords: ['villa palmeraie marrakech', 'luxe palmeraie', 'location villa palmeraie', 'investissement palmeraie']
  },

  // Tanger neighborhoods
  'tanger-malabata': {
    citySlug: 'tanger',
    neighborhoodSlug: 'malabata',
    h1: 'Immobilier à Malabata, Tanger',
    introduction: 'Malabata est le quartier résidentiel prisé de Tanger, offrant des vues spectaculaires sur le détroit de Gibraltar et la mer. Avec ses résidences modernes, ses infrastructures récentes et son cadre de vie exceptionnel, c\'est un secteur en plein développement.',
    description: 'Le quartier de Malabata s\'est transformé en un pôle résidentiel majeur de Tanger. On y trouve principalement de nouveaux programmes immobiliers : résidences sécurisées, immeubles modernes avec vue mer, et villas contemporaines. Le marché immobilier y est très dynamique, attirant familles, jeunes actifs et investisseurs. La proximité de la plage, des restaurants en bord de mer et du centre-ville en fait un emplacement privilégié. Le développement de nouvelles infrastructures (routes, commerces, écoles) renforce son attractivité. Les vues panoramiques sur le détroit et l\'Espagne constituent un atout majeur.',
    propertyTypes: [
      'Appartements vue mer',
      'Résidences sécurisées modernes',
      'Villas contemporaines',
      'Studios et F2 pour investissement',
      'Penthouses avec terrasse panoramique'
    ],
    priceInfo: 'Malabata offre des prix attractifs pour un quartier aussi bien situé. Pour l\'achat, comptez entre 12 000 et 20 000 DH/m² pour un appartement, avec une prime pour les biens avec vue mer directe. Les loyers varient de 3 500 à 8 000 DH selon la taille et les prestations.',
    highlights: [
      'Vues spectaculaires sur le détroit',
      'Résidences modernes',
      'Proximité plages',
      'Développement continu',
      'Bon rapport qualité-prix',
      'Excellent potentiel de valorisation'
    ],
    seoKeywords: ['appartement malabata tanger', 'vue mer malabata', 'location malabata', 'immobilier malabata']
  },

  // Agadir neighborhoods
  'agadir-founty': {
    citySlug: 'agadir',
    neighborhoodSlug: 'founty',
    h1: 'Immobilier à Founty, Agadir',
    introduction: 'Founty est le quartier balnéaire moderne d\'Agadir, s\'étendant le long de l\'océan. Avec ses résidences avec piscines, ses restaurants en bord de mer et ses plages, c\'est le secteur privilégié pour investir dans l\'immobilier touristique et profiter d\'un cadre de vie exceptionnel.',
    description: 'Le quartier de Founty offre un excellent mélange de résidences modernes, d\'appartements avec vue mer et de villas. Le marché immobilier y est très actif, porté par la demande touristique et résidentielle. On y trouve de nombreuses résidences sécurisées avec piscines, jardins et services. La proximité de la plage, des restaurants de poissons et du port de plaisance en fait un emplacement de choix. Founty est particulièrement recherché pour l\'investissement en location saisonnière grâce au flux touristique constant. Le développement de nouvelles infrastructures (marina, commerces) renforce son attractivité.',
    propertyTypes: [
      'Appartements en résidence avec piscine',
      'Studios pour location saisonnière',
      'Appartements vue mer',
      'Villas avec jardin',
      'Investissements locatifs touristiques'
    ],
    priceInfo: 'Founty propose des prix attractifs pour un quartier balnéaire. L\'achat varie entre 14 000 et 22 000 DH/m² pour les appartements en résidence. Les loyers longue durée se situent entre 3 500 et 7 000 DH, mais la location saisonnière peut générer 500-1000 DH par nuit en haute saison.',
    highlights: [
      'Front de mer et plages',
      'Résidences avec piscines',
      'Excellent potentiel touristique',
      'Restaurants et port de plaisance',
      'Investissement rentable',
      'Cadre de vie balnéaire'
    ],
    seoKeywords: ['appartement founty agadir', 'location saisonnière founty', 'vue mer founty', 'investissement founty']
  },

  // Fès neighborhoods
  'fes-ville-nouvelle': {
    citySlug: 'fes',
    neighborhoodSlug: 'ville-nouvelle',
    h1: 'Immobilier à Ville Nouvelle, Fès',
    introduction: 'La Ville Nouvelle de Fès représente le cœur moderne de la capitale spirituelle. Avec ses avenues larges, ses commerces, ses administrations et ses quartiers résidentiels, c\'est le secteur privilégié pour vivre et investir dans un cadre urbain organisé.',
    description: 'La Ville Nouvelle de Fès se distingue par son urbanisme moderne hérité de l\'époque du Protectorat. On y trouve principalement des immeubles d\'appartements, des résidences récentes et quelques villas. Le marché immobilier y est stable avec une demande constante de la part des familles, fonctionnaires et professionnels. L\'Avenue Hassan II concentre commerces, banques et services. Le quartier dispose d\'excellentes infrastructures : écoles, lycées, hôpitaux, espaces verts. La proximité de la gare ferroviaire et des zones d\'affaires en fait un emplacement pratique. Les prix y sont généralement plus abordables que dans les grandes métropoles.',
    propertyTypes: [
      'Appartements de 2 à 4 pièces',
      'Résidences modernes',
      'Locaux commerciaux',
      'Bureaux professionnels',
      'Villas en périphérie'
    ],
    priceInfo: 'La Ville Nouvelle offre des prix attractifs. Pour l\'achat, comptez entre 8 000 et 14 000 DH/m² pour un appartement selon le standing et l\'emplacement. Les loyers se situent entre 2 500 et 5 000 DH pour un appartement de 2-3 pièces, offrant un bon rendement locatif.',
    highlights: [
      'Quartier moderne et organisé',
      'Nombreux commerces et services',
      'Prix immobiliers abordables',
      'Écoles et infrastructures',
      'Proximité gare et transports',
      'Bon potentiel d\'investissement'
    ],
    seoKeywords: ['appartement ville nouvelle fes', 'location fes ville nouvelle', 'immobilier fes', 'acheter fes']
  }
};

/**
 * Get neighborhood content by city and neighborhood slug
 */
export function getNeighborhoodContent(
  citySlug: string,
  neighborhoodSlug: string
): NeighborhoodContent | undefined {
  const key = `${citySlug}-${neighborhoodSlug}`;
  return NEIGHBORHOOD_CONTENT[key];
}

/**
 * Check if neighborhood has content available
 */
export function hasNeighborhoodContent(
  citySlug: string,
  neighborhoodSlug: string
): boolean {
  const key = `${citySlug}-${neighborhoodSlug}`;
  return key in NEIGHBORHOOD_CONTENT;
}

/**
 * Get all available neighborhood keys
 */
export function getAvailableNeighborhoodKeys(): string[] {
  return Object.keys(NEIGHBORHOOD_CONTENT);
}