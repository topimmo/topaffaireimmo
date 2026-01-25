import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import BannerSlot from "@/components/advertising/BannerSlot";
import AdSenseBanner from "@/components/advertising/AdSenseBanner";
export default function AdBanner({ className, page = 'home', position = 'after_featured' }) {
    return (_jsx("section", { className: cn("py-8 md:py-12", className), children: _jsx("div", { className: "container", children: _jsx(BannerSlot, { page: page, position: position, className: "rounded-xl overflow-hidden", adSenseFallback: _jsx(AdSenseBanner, { slot: "home-middle", format: "horizontal" }) }) }) }));
}
