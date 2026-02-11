import {
  Wrench,
  Zap,
  Wind,
  PaintRoller,
  Sparkles,
  Leaf,
  LucideIcon,
  Shield,
  Hammer,
  Truck,
  DoorOpen,
  Axe,
  Key,
  SatelliteDish,
  HardHat,
  ShieldAlert,
  Sofa,
} from "lucide-react";

export const SERVICE_SLUG_REGEX = /^[a-z0-9-]+$/;

export type ServiceCategoryRow = {
  id?: string;
  slug: string | null;
  name_fr: string | null;
  name_ar: string | null;
  description_fr?: string | null;
  description_ar?: string | null;
  icon?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  // Additional fields should be ignored in normalization to keep mapping safe
  [key: string]: unknown;
};

export type ServiceCategory = {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  icon: LucideIcon;
  gradient: string;
};

const DEFAULT_SERVICE_ICON = Shield;

const ICON_MAP: Record<string, LucideIcon> = {
  wrench: Wrench,
  tool: Wrench,
  plumbing: Wrench,
  plomberie: Wrench,
  zap: Zap,
  electricite: Zap,
  electricite_: Zap,
  electricity: Zap,
  wind: Wind,
  climatisation: Wind,
  clim: Wind,
  paint: PaintRoller,
  paintbrush: PaintRoller,
  "paint-roller": PaintRoller,
  peinture: PaintRoller,
  sparkles: Sparkles,
  nettoyage: Sparkles,
  cleaning: Sparkles,
  leaf: Leaf,
  jardinage: Leaf,
  garden: Leaf,
  hammer: Hammer,
  renovation: Hammer,
  truck: Truck,
  demenagement: Truck,
  moving: Truck,
  "door-open": DoorOpen,
  "aluminium-menuiserie": DoorOpen,
  axe: Axe,
  "menuiserie-bois": Axe,
  key: Key,
  serrurerie: Key,
  lock: Key,
  "satellite-dish": SatelliteDish,
  "internet-parabole": SatelliteDish,
  satellite: SatelliteDish,
  "hard-hat": HardHat,
  "nettoyage-fin-chantier": HardHat,
  construction: HardHat,
  "shield-alert": ShieldAlert,
  "securite-alarmes": ShieldAlert,
  alarm: ShieldAlert,
  sofa: Sofa,
  "decoration-interieure": Sofa,
  decor: Sofa,
};

export const FALLBACK_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "plomberie",
    slug: "plomberie",
    nameFr: "Plomberie",
    nameAr: "السباكة",
    descriptionFr: "Installation et réparation plomberie",
    descriptionAr: "تركيب وصيانة السباكة",
    icon: Wrench,
    gradient: "from-blue-50 to-blue-100",
  },
  {
    id: "electricite",
    slug: "electricite",
    nameFr: "Électricité",
    nameAr: "الكهرباء",
    descriptionFr: "Dépannage et installations électriques",
    descriptionAr: "أعمال كهربائية وإصلاح الأعطال",
    icon: Zap,
    gradient: "from-amber-50 to-amber-100",
  },
  {
    id: "climatisation",
    slug: "climatisation",
    nameFr: "Climatisation",
    nameAr: "التكييف",
    descriptionFr: "Installation et entretien climatisation",
    descriptionAr: "تركيب وصيانة أجهزة التكييف",
    icon: Wind,
    gradient: "from-cyan-50 to-cyan-100",
  },
  {
    id: "renovation",
    slug: "renovation",
    nameFr: "Rénovation / Travaux",
    nameAr: "ترميم / أشغال",
    descriptionFr: "Rénovation intérieure et extérieure, petits travaux",
    descriptionAr: "أعمال الترميم الداخلية والخارجية",
    icon: Hammer,
    gradient: "from-orange-50 to-orange-100",
  },
  {
    id: "peinture",
    slug: "peinture",
    nameFr: "Peinture",
    nameAr: "الطلاء",
    descriptionFr: "Peinture intérieure et extérieure",
    descriptionAr: "أعمال الطلاء الداخلية والخارجية",
    icon: PaintRoller,
    gradient: "from-rose-50 to-rose-100",
  },
  {
    id: "nettoyage",
    slug: "nettoyage",
    nameFr: "Nettoyage",
    nameAr: "التنظيف",
    descriptionFr: "Nettoyage ménager et professionnel",
    descriptionAr: "خدمات التنظيف المنزلي والمهني",
    icon: Sparkles,
    gradient: "from-emerald-50 to-emerald-100",
  },
  {
    id: "demenagement",
    slug: "demenagement",
    nameFr: "Déménagement",
    nameAr: "نقل الأثاث",
    descriptionFr: "Services de déménagement professionnel",
    descriptionAr: "خدمات نقل الأثاث الاحترافية",
    icon: Truck,
    gradient: "from-indigo-50 to-indigo-100",
  },
  {
    id: "aluminium-menuiserie",
    slug: "aluminium-menuiserie",
    nameFr: "Aluminium & Menuiserie",
    nameAr: "الألمنيوم والنجارة",
    descriptionFr: "Fenêtres, portes aluminium et menuiserie",
    descriptionAr: "نوافذ وأبواب ألمنيوم ونجارة",
    icon: DoorOpen,
    gradient: "from-slate-50 to-slate-100",
  },
  {
    id: "menuiserie-bois",
    slug: "menuiserie-bois",
    nameFr: "Menuiserie bois",
    nameAr: "نجارة الخشب",
    descriptionFr: "Fabrication et réparation de meubles en bois",
    descriptionAr: "صناعة وإصلاح الأثاث الخشبي",
    icon: Axe,
    gradient: "from-amber-50 to-yellow-100",
  },
  {
    id: "serrurerie",
    slug: "serrurerie",
    nameFr: "Serrurerie",
    nameAr: "أقفال ومفاتيح",
    descriptionFr: "Ouverture de portes, changement de serrures",
    descriptionAr: "فتح الأبواب وتغيير الأقفال",
    icon: Key,
    gradient: "from-zinc-50 to-zinc-100",
  },
  {
    id: "internet-parabole",
    slug: "internet-parabole",
    nameFr: "Internet / Parabole / Caméras",
    nameAr: "إنترنت / صحن / كاميرات",
    descriptionFr: "Installation internet, antennes et vidéosurveillance",
    descriptionAr: "تركيب الإنترنت والصحن وكاميرات المراقبة",
    icon: SatelliteDish,
    gradient: "from-violet-50 to-violet-100",
  },
  {
    id: "jardinage",
    slug: "jardinage",
    nameFr: "Jardinage",
    nameAr: "البستنة",
    descriptionFr: "Entretien des jardins et espaces verts",
    descriptionAr: "العناية بالحدائق والمساحات الخضراء",
    icon: Leaf,
    gradient: "from-lime-50 to-lime-100",
  },
];

// Top 6 priority slugs for hero section
export const TOP_SERVICE_SLUGS = [
  "plomberie",
  "electricite",
  "climatisation",
  "renovation",
  "peinture",
  "nettoyage",
] as const;

const FALLBACK_STYLES_BY_SLUG = FALLBACK_SERVICE_CATEGORIES.reduce<
  Record<string, Pick<ServiceCategory, "gradient" | "icon" | "nameFr" | "nameAr" | "descriptionFr" | "descriptionAr">>
>((acc, category) => {
  acc[category.slug] = {
    gradient: category.gradient,
    icon: category.icon,
    nameFr: category.nameFr,
    nameAr: category.nameAr,
    descriptionFr: category.descriptionFr,
    descriptionAr: category.descriptionAr,
  };
  return acc;
}, {});

function resolveIcon(row: ServiceCategoryRow, fallback?: LucideIcon) {
  const key = row.icon?.toLowerCase()?.trim() || row.slug?.toLowerCase()?.trim();
  return (key && ICON_MAP[key]) || fallback || DEFAULT_SERVICE_ICON;
}

export function normalizeServiceCategories(rows?: ServiceCategoryRow[]) {
  if (!rows || rows.length === 0) {
    return {
      categories: FALLBACK_SERVICE_CATEGORIES,
      skipped: [],
      usedFallback: true,
    };
  }

  const categories: ServiceCategory[] = [];
  const skipped: { slug?: string | null; reason: string }[] = [];

  const gradients = [
    "from-blue-50 to-blue-100",
    "from-amber-50 to-amber-100",
    "from-cyan-50 to-cyan-100",
    "from-rose-50 to-rose-100",
    "from-emerald-50 to-emerald-100",
    "from-lime-50 to-lime-100",
    "from-slate-50 to-slate-100",
  ];

  const sortedRows = [...rows].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  sortedRows.forEach((row, index) => {
    const slug = row.slug?.trim().toLowerCase();
    if (!slug) {
      skipped.push({ slug: row.slug, reason: "missing-slug" });
      return;
    }

    if (!SERVICE_SLUG_REGEX.test(slug)) {
      skipped.push({ slug, reason: "invalid-slug" });
      return;
    }

    const nameFr = row.name_fr?.trim();
    const nameAr = row.name_ar?.trim();

    if (!nameFr && !nameAr) {
      skipped.push({ slug, reason: "missing-name" });
      return;
    }

    const style = FALLBACK_STYLES_BY_SLUG[slug];
    categories.push({
      id: row.id || slug,
      slug,
      nameFr: nameFr || nameAr || slug,
      nameAr: nameAr || nameFr || slug,
      descriptionFr: row.description_fr || style?.descriptionFr || nameFr || "",
      descriptionAr: row.description_ar || style?.descriptionAr || nameAr || "",
      icon: resolveIcon(row, style?.icon),
      gradient: style?.gradient || gradients[index % gradients.length],
    });
  });

  return {
    categories: categories.length ? categories : FALLBACK_SERVICE_CATEGORIES,
    skipped,
    usedFallback: categories.length === 0,
  };
}
