import { Wrench, Droplet, Zap, Hammer, Paintbrush, Key, Scissors, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServiceCategory {
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

const categories: ServiceCategory[] = [
  {
    name: 'Plomberie',
    icon: <Droplet className="h-8 w-8" />,
    count: 342,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Électricité',
    icon: <Zap className="h-8 w-8" />,
    count: 286,
    color: 'from-yellow-500 to-amber-500',
  },
  {
    name: 'Menuiserie',
    icon: <Hammer className="h-8 w-8" />,
    count: 198,
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Peinture',
    icon: <Paintbrush className="h-8 w-8" />,
    count: 254,
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Serrurerie',
    icon: <Key className="h-8 w-8" />,
    count: 167,
    color: 'from-gray-500 to-slate-500',
  },
  {
    name: 'Jardinage',
    icon: <Scissors className="h-8 w-8" />,
    count: 143,
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Déménagement',
    icon: <Truck className="h-8 w-8" />,
    count: 89,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Autres',
    icon: <Wrench className="h-8 w-8" />,
    count: 421,
    color: 'from-[#0FC2C0] to-[#0A9D9B]',
  },
];

interface CategoryCardProps {
  category: ServiceCategory;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Card className="group overflow-hidden bg-[#1B2F3C] border-[#2A3F4C] card-hover cursor-pointer">
      <CardContent className="p-6 space-y-4">
        <div className={cn(
          'w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
          'group-hover:scale-110 transition-transform duration-300',
          category.color
        )}>
          {category.icon}
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg group-hover:text-[#0FC2C0] transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {category.count} professionnels
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceCategories() {
  const navigate = useNavigate();

  const handleViewAllServices = () => {
    navigate('/artisans');
  };

  return (
    <section className="py-16 md:py-24 bg-[#0D2838]">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Explorez nos services
          </h2>
          <p className="text-lg text-gray-300">
            Des artisans qualifiés et vérifiés pour tous vos besoins
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={index} category={category} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button 
            onClick={handleViewAllServices}
            className="text-[#0FC2C0] hover:text-[#0DA9A7] font-medium transition-colors"
          >
            Voir tous les services →
          </button>
        </div>
      </div>
    </section>
  );
}
