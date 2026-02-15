import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchHero } from '@/components/home/SearchHero';
import { TrustMetrics } from '@/components/home/TrustMetrics';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { ServiceCategories } from '@/components/home/ServiceCategories';
import { TopArtisans } from '@/components/home/TopArtisans';
import { CTASection } from '@/components/home/CTASection';
import { AdSlot } from '@/components/shared/AdSlot';

function Home() {
  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />
      <main>
        <SearchHero />
        {/* Post-Hero Ad Slot */}
        <div className="container mx-auto px-4 md:px-8 py-4">
          <AdSlot variant="banner" slotId="home-post-hero" />
        </div>
        <TrustMetrics />
        <FeaturedProperties />
        {/* Mid-Page Ad Slot */}
        <div className="container mx-auto px-4 md:px-8 py-4">
          <AdSlot variant="banner" slotId="home-mid-page" />
        </div>
        <ServiceCategories />
        <TopArtisans />
        {/* Pre-Footer Ad Slot */}
        <div className="container mx-auto px-4 md:px-8 py-4">
          <AdSlot variant="banner" slotId="home-pre-footer" />
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
