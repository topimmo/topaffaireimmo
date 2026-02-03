import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import LatestListings from "@/components/home/LatestListings";
import PropertyCategories from "@/components/home/PropertyCategories";
import AdBanner from "@/components/home/AdBanner";
import PromoBanner from "@/components/PromoBanner";

function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <HeroSearch />

      {/* Promo Banner (home-top) */}
      <section className="mt-8">
        <div className="container mx-auto px-4">
          <PromoBanner position="home-top" />
        </div>
      </section>

      {/* Featured properties */}
      <section className="mt-12">
        <FeaturedProperties />
      </section>

      {/* ✅ Ad banner (home middle) */}
      <section className="mt-12">
        <div className="my-6 min-h-[90px]">
          <AdBanner
            page="home"
            position="home-middle"
            className="max-w-6xl mx-auto"
          />
        </div>
      </section>

      {/* Promo Banner (home-middle) */}
      <section className="mt-8">
        <div className="container mx-auto px-4">
          <PromoBanner position="home-middle" />
        </div>
      </section>

      {/* Latest listings */}
      <section className="mt-16">
        <LatestListings />
      </section>

      {/* Property Categories */}
      <PropertyCategories />
    </main>
  );
}

export default Home;
