import { TrendingUp, Users, Home, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString('fr-MA')}
      {suffix}
    </span>
  );
}

function StatCard({ icon, value, label, suffix = '', prefix = '' }: StatProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl bg-[#1B2F3C]/50 backdrop-blur-sm border border-[#2A3F4C] hover:border-[#0FC2C0]/50 transition-all hover:shadow-lg">
      <div className="p-3 rounded-full bg-[#0FC2C0]/20">
        {icon}
      </div>
      <div>
        <div className="text-3xl md:text-4xl font-bold text-white">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </div>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export function TrustMetrics() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A1F2E] to-[#0D2838]">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Des chiffres qui parlent
          </h2>
          <p className="text-lg text-gray-300">
            Rejoignez des milliers d'utilisateurs satisfaits sur la plateforme de confiance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="h-8 w-8 text-[#0FC2C0]" />}
            value={15000}
            suffix="+"
            label="Utilisateurs actifs"
          />
          <StatCard
            icon={<Home className="h-8 w-8 text-[#0FC2C0]" />}
            value={8500}
            suffix="+"
            label="Propriétés disponibles"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8 text-[#0FC2C0]" />}
            value={2400}
            suffix="+"
            label="Artisans vérifiés"
          />
          <StatCard
            icon={<ThumbsUp className="h-8 w-8 text-[#0FC2C0]" />}
            value={98}
            suffix="%"
            label="Taux de satisfaction"
          />
        </div>
      </div>
    </section>
  );
}
