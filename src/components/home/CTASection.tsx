import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const benefits = [
  'Publication illimitée d\'annonces',
  'Visibilité maximale auprès de milliers d\'acheteurs',
  'Tableau de bord analytique complet',
  'Support client dédié 24/7',
];

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#0A1F2E] via-[#0D2838] to-[#0A1F2E] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 noise-texture"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

      <div className="container relative mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1B2F3C] to-[#0A1F2E] rounded-3xl p-8 md:p-12 border border-[#0FC2C0]/30 shadow-2xl mesh-gradient">
            <div className="text-center space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 rounded-full bg-[#0FC2C0]/20 border border-[#0FC2C0]/30">
                  <span className="text-[#0FC2C0] font-medium text-sm">Rejoignez-nous</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white">
                  Boostez votre activité dès aujourd'hui
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Que vous soyez agent immobilier ou artisan, notre plateforme vous connecte avec des milliers de clients potentiels
                </p>
              </div>

              {/* Benefits */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-left">
                    <CheckCircle2 className="h-5 w-5 text-[#0FC2C0] flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/properties')}
                  className="border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white font-semibold px-8"
                >
                  En savoir plus
                </Button>
              </div>

              {/* Trust Badge */}
              <p className="text-sm text-gray-400">
                Rejoignez plus de 15,000+ professionnels de confiance
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
