import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import LatestListings from "@/components/home/LatestListings";
import ExploreByCityMap from "@/components/home/ExploreByCityMap";

function Home() {
  return (
    <main className="flex-1">
      <HeroSearch />
      <FeaturedProperties />
      <LatestListings />
      <ExploreByCityMap />
    </main>
  );
}

export default Home;
