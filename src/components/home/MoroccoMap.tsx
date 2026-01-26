import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin } from "lucide-react";

interface City {
  name: string;
  nameAr: string;
  slug: string;
  x: number; // percentage position on SVG
  y: number; // percentage position on SVG
}

const cities: City[] = [
  { name: "Tanger", nameAr: "طنجة", slug: "tanger", x: 32, y: 8 },
  { name: "Casablanca", nameAr: "الدار البيضاء", slug: "casablanca", x: 25, y: 45 },
  { name: "Rabat", nameAr: "الرباط", slug: "rabat", x: 28, y: 38 },
  { name: "Fès", nameAr: "فاس", slug: "fes", x: 42, y: 32 },
  { name: "Marrakech", nameAr: "مراكش", slug: "marrakech", x: 35, y: 65 },
  { name: "Agadir", nameAr: "أكادير", slug: "agadir", x: 20, y: 85 },
];

export default function MoroccoMap() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const handleCityClick = (slug: string) => {
    navigate(`/${slug}`);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* SVG Map Container */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-auto"
        style={{ maxHeight: "500px" }}
      >
        {/* Simplified Morocco outline path */}
        <path
          d="M 30 5 L 45 5 L 55 10 L 62 15 L 68 25 L 70 35 L 72 45 L 70 55 L 65 65 L 58 75 L 50 82 L 42 88 L 35 92 L 28 95 L 22 95 L 18 90 L 15 82 L 12 72 L 10 60 L 12 50 L 15 40 L 18 30 L 22 20 L 25 12 L 30 5 Z"
          fill="#F5F5DC"
          stroke="#D4A373"
          strokeWidth="0.5"
          className="transition-colors duration-300"
        />

        {/* Cities as pins */}
        {cities.map((city) => (
          <g
            key={city.slug}
            onMouseEnter={() => setHoveredCity(city.slug)}
            onMouseLeave={() => setHoveredCity(null)}
            onClick={() => handleCityClick(city.slug)}
            className="cursor-pointer"
          >
            {/* Pin circle */}
            <circle
              cx={city.x}
              cy={city.y}
              r={hoveredCity === city.slug ? "2.5" : "2"}
              fill="#D4A373"
              stroke="#fff"
              strokeWidth="0.5"
              className="transition-all duration-300"
            />
            
            {/* Hover tooltip */}
            {hoveredCity === city.slug && (
              <g>
                <rect
                  x={city.x - 8}
                  y={city.y - 8}
                  width="16"
                  height="5"
                  fill="#1F2937"
                  rx="1"
                  opacity="0.95"
                />
                <text
                  x={city.x}
                  y={city.y - 5}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="3"
                  fontWeight="600"
                >
                  {isRTL ? city.nameAr : city.name}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-terracotta" />
        <span>{isRTL ? "انقر على المدينة لاستكشاف العقارات" : "Cliquez sur une ville pour explorer les propriétés"}</span>
      </div>
    </div>
  );
}
