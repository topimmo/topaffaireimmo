import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import AdBanner from "@/components/home/AdBanner";
import LatestListings from "@/components/home/LatestListings";
import CTASection from "@/components/home/CTASection";

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSearch />
        <FeaturedProperties />
        <AdBanner page="home" position="after_featured" />
        <LatestListings />
        <CTASection />
        <AdBanner page="home" position="before_footer" className="bg-muted/30" />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
