export interface City {
  name: string;
  nameAr: string;
  slug: string;
}

export interface CityWithCoordinates extends City {
  x: number; // percentage position on SVG
  y: number; // percentage position on SVG
}

export const FEATURED_CITIES: City[] = [
  { name: "Casablanca", nameAr: "الدار البيضاء", slug: "casablanca" },
  { name: "Rabat", nameAr: "الرباط", slug: "rabat" },
  { name: "Marrakech", nameAr: "مراكش", slug: "marrakech" },
  { name: "Tanger", nameAr: "طنجة", slug: "tanger" },
  { name: "Agadir", nameAr: "أكادير", slug: "agadir" },
  { name: "Fès", nameAr: "فاس", slug: "fes" },
];

export const CITIES_WITH_MAP_COORDINATES: CityWithCoordinates[] = [
  { name: "Tanger", nameAr: "طنجة", slug: "tanger", x: 32, y: 8 },
  { name: "Casablanca", nameAr: "الدار البيضاء", slug: "casablanca", x: 25, y: 45 },
  { name: "Rabat", nameAr: "الرباط", slug: "rabat", x: 28, y: 38 },
  { name: "Fès", nameAr: "فاس", slug: "fes", x: 42, y: 32 },
  { name: "Marrakech", nameAr: "مراكش", slug: "marrakech", x: 35, y: 65 },
  { name: "Agadir", nameAr: "أكادير", slug: "agadir", x: 20, y: 85 },
];
