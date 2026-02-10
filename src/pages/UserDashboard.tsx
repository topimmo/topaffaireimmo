/**
 * User Dashboard
 * 
 * Simple dashboard for regular users (non-advertisers, non-artisans)
 * Shows profile summary, favorites, and call-to-action options
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Home, Building2, Heart, MessageSquare, Settings } from "lucide-react";

interface Profile {
  full_name: string | null;
  email: string;
  phone: string | null;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/dashboard/user" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error("[UserDashboard] Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const copy = {
    title: isRTL ? "لوحة التحكم" : "Tableau de bord",
    welcome: isRTL ? "مرحباً" : "Bienvenue",
    profileTitle: isRTL ? "ملفي الشخصي" : "Mon profil",
    profileDesc: isRTL ? "معلومات حسابك" : "Informations de votre compte",
    email: isRTL ? "البريد الإلكتروني" : "E-mail",
    phone: isRTL ? "الهاتف" : "Téléphone",
    notProvided: isRTL ? "غير متوفر" : "Non renseigné",
    quickActions: isRTL ? "إجراءات سريعة" : "Actions rapides",
    searchProperties: isRTL ? "البحث عن عقارات" : "Rechercher des biens",
    searchDesc: isRTL ? "ابحث عن عقارك المثالي" : "Trouvez votre bien idéal",
    favorites: isRTL ? "المفضلة" : "Favoris",
    favoritesDesc: isRTL ? "شاهد العقارات المحفوظة" : "Voir vos biens sauvegardés",
    messages: isRTL ? "الرسائل" : "Messages",
    messagesDesc: isRTL ? "تواصل مع الإعلانين" : "Communiquez avec les annonceurs",
    becomeAdvertiser: isRTL ? "أصبح معلن" : "Devenir annonceur",
    becomeAdvertiserDesc: isRTL ? "أنشر عقاراتك الخاصة" : "Publiez vos propres biens",
    settings: isRTL ? "الإعدادات" : "Paramètres",
    settingsDesc: isRTL ? "إدارة حسابك" : "Gérer votre compte",
    comingSoon: isRTL ? "قريباً" : "Prochainement",
  };

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 pb-16">
        <div className={`container px-4 md:px-6 py-8 ${isRTL ? "rtl" : "ltr"}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {copy.welcome}
              {profile?.full_name && `, ${profile.full_name}`}
            </h1>
            <p className="text-muted-foreground">{copy.title}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {copy.profileTitle}
                </CardTitle>
                <CardDescription>{copy.profileDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">{copy.email}:</span>{" "}
                    <span className="text-sm text-muted-foreground">{profile?.email || user?.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{copy.phone}:</span>{" "}
                    <span className="text-sm text-muted-foreground">{profile?.phone || copy.notProvided}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/search")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5" />
                  {copy.searchProperties}
                </CardTitle>
                <CardDescription>{copy.searchDesc}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5" />
                  {copy.favorites}
                  <span className="text-xs ml-auto bg-muted px-2 py-1 rounded">{copy.comingSoon}</span>
                </CardTitle>
                <CardDescription>{copy.favoritesDesc}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  {copy.messages}
                  <span className="text-xs ml-auto bg-muted px-2 py-1 rounded">{copy.comingSoon}</span>
                </CardTitle>
                <CardDescription>{copy.messagesDesc}</CardDescription>
              </CardHeader>
            </Card>

            {/* Become Advertiser CTA */}
            <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {copy.becomeAdvertiser}
                </CardTitle>
                <CardDescription>{copy.becomeAdvertiserDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/add-listing">{copy.becomeAdvertiser}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
