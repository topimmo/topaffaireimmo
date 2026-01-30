import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import LatestListings from "@/components/home/LatestListings";
import PropertyCategories from "@/components/home/PropertyCategories";
import AdBanner from "@/components/home/AdBanner";

function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <HeroSearch />

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
