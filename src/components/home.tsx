import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import LatestListings from "@/components/home/LatestListings";
import ExploreByCityMap from "@/components/home/ExploreByCityMap";
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
        <AdBanner
          page="home"
          position="home-middle"
          className="max-w-6xl mx-auto"
        />
      </section>

      {/* Latest listings */}
      <section className="mt-16">
        <LatestListings />
      </section>

      {/* Explore by city */}
      <section className="mt-20">
        <ExploreByCityMap />
      </section>
    </main>
  );
}

export default Home;
