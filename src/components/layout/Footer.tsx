import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0A1F2E] border-t border-[#1B2F3C]">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl text-white">
                TopAffaire<span className="text-[#0FC2C0]">Immo</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              La plateforme premium pour l'immobilier et les services professionnels au Maroc.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="text-gray-400 hover:text-[#0FC2C0] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0FC2C0] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0FC2C0] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0FC2C0] transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h3 className="font-semibold text-white mb-4">Propriétés</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Appartements
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Villas
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Terrains
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Commerces
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Plomberie
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Électricité
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Peinture
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Menuiserie
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Entreprise</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#0FC2C0] transition-colors">
                  Politique de confidentialité
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1B2F3C]">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} TopAffaireImmo. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
