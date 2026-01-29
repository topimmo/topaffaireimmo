import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "./LanguageSwitcher";
import BannerSlot from "@/components/advertising/BannerSlot"; // ✅ NEW
import {
  Menu,
  X,
  Plus,
  Building2,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
          isScrolled
            ? "h-16 bg-background/95 backdrop-blur-md shadow-sm"
            : "h-20 bg-transparent",
          isRTL ? "rtl" : "ltr"
        )}
      >
        <div className="container h-full flex items-center justify
