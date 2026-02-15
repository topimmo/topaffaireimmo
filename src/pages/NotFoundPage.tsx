import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-texture" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />

      <div className="text-center relative z-10 max-w-lg">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold text-[#1B2F3C] leading-none select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-6 rounded-full bg-[#1B2F3C] border border-[#2A3F4C]">
              <Search className="h-12 w-12 text-[#0FC2C0]" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">Page introuvable</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Oops ! La page que vous recherchez semble avoir déménagé ou n'existe plus. Pas d'inquiétude, retrouvez votre chemin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold px-6">
              <Home className="h-4 w-4 mr-2" />Retour à l'accueil
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C] hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
}
