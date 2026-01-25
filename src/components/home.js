import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import AdBanner from "@/components/home/AdBanner";
import LatestListings from "@/components/home/LatestListings";
import ExploreCities from "@/components/home/ExploreCities";
function Home() {
    return (_jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsx(Header, {}), _jsxs("main", { className: "flex-1", children: [_jsx(HeroSearch, {}), _jsx(FeaturedProperties, {}), _jsx(AdBanner, { page: "home", position: "after_featured" }), _jsx(LatestListings, {}), _jsx(ExploreCities, {}), _jsx(AdBanner, { page: "home", position: "before_footer", className: "bg-muted/30" })] }), _jsx(Footer, {})] }));
}
export default Home;
