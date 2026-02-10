/**
 * Artisan Dashboard
 * 
 * Dashboard for service providers/artisans
 * Shows onboarding status and service management (placeholder for future features)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wrench, 
  User, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  MapPin,
  Briefcase 
} from "lucide-react";

interface Profile {
  full_name: string | null;
  email: string;
  phone: string | null;
}

export default function ArtisanDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/dashboard/artisan" } });
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
      console.error("[ArtisanDashboard] Error fetching profile:", error);
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
    title: isRTL ? "لوحة تحكم الحرفي" : "Tableau de bord artisan",
    welcome: isRTL ? "مرحباً" : "Bienvenue",
    onboarding: isRTL ? "حالة التسجيل" : "État d'inscription",
    onboardingDesc: isRTL ? "أكمل ملفك الشخصي للبدء" : "Complétez votre profil pour commencer",
    profileCompletion: isRTL ? "اكتمال الملف الشخصي" : "Complétion du profil",
    profile: isRTL ? "الملف الشخصي" : "Profil",
    profileDesc: isRTL ? "المعلومات الأساسية" : "Informations de base",
    services: isRTL ? "الخدمات" : "Services",
    servicesDesc: isRTL ? "أضف خدماتك" : "Ajoutez vos services",
    availability: isRTL ? "التوفر" : "Disponibilité",
    availabilityDesc: isRTL ? "حدد أوقات العمل" : "Définissez vos horaires",
    location: isRTL ? "المناطق المخدومة" : "Zones desservies",
    locationDesc: isRTL ? "أين تعمل؟" : "Où travaillez-vous?",
    completed: isRTL ? "مكتمل" : "Complété",
    pending: isRTL ? "معلق" : "En attente",
    comingSoon: isRTL ? "قريباً" : "Prochainement",
    comingSoonDesc: isRTL 
      ? "يتم تطوير ميزات إدارة الخدمات. سنعلمك عندما تصبح متاحة."
      : "Les fonctionnalités de gestion des services sont en cours de développement. Nous vous informerons lorsqu'elles seront disponibles.",
    quickActions: isRTL ? "إجراءات سريعة" : "Actions rapides",
    manageServices: isRTL ? "إدارة الخدمات" : "Gérer les services",
    setSchedule: isRTL ? "تحديد الجدول" : "Définir l'horaire",
    viewRequests: isRTL ? "عرض الطلبات" : "Voir les demandes",
  };

  // Calculate profile completion (basic example)
  const profileSteps = [
    { 
      id: 1, 
      label: copy.profile, 
      desc: copy.profileDesc,
      completed: !!(profile?.full_name && profile?.phone),
      icon: User 
    },
    { 
      id: 2, 
      label: copy.services, 
      desc: copy.servicesDesc,
      completed: false, // Future: check if services are added
      icon: Briefcase 
    },
    { 
      id: 3, 
      label: copy.availability, 
      desc: copy.availabilityDesc,
      completed: false, // Future: check if schedule is set
      icon: CalendarDays 
    },
    { 
      id: 4, 
      label: copy.location, 
      desc: copy.locationDesc,
      completed: false, // Future: check if service areas are set
      icon: MapPin 
    },
  ];

  const completedSteps = profileSteps.filter(step => step.completed).length;
  const completionPercent = (completedSteps / profileSteps.length) * 100;

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 pb-16">
        <div className={`container px-4 md:px-6 py-8 ${isRTL ? "rtl" : "ltr"}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Wrench className="h-8 w-8 text-primary" />
              {copy.welcome}
              {profile?.full_name && `, ${profile.full_name}`}
            </h1>
            <p className="text-muted-foreground">{copy.title}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Onboarding Card */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{copy.onboarding}</CardTitle>
                    <CardDescription>{copy.onboardingDesc}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{completionPercent}%</div>
                    <div className="text-sm text-muted-foreground">{copy.profileCompletion}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={completionPercent} className="mb-4" />
                <div className="grid gap-3 md:grid-cols-2">
                  {profileSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div 
                        key={step.id} 
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className={`shrink-0 rounded-full p-2 ${step.completed ? 'bg-green-100' : 'bg-muted'}`}>
                          {step.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{step.label}</div>
                          <div className="text-xs text-muted-foreground">{step.desc}</div>
                        </div>
                        <Badge variant={step.completed ? "default" : "secondary"} className="shrink-0 text-xs">
                          {step.completed ? copy.completed : copy.pending}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Notice */}
            <Card className="bg-blue-50 border-blue-200 md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Clock className="h-5 w-5" />
                  {copy.comingSoon}
                </CardTitle>
                <CardDescription className="text-blue-700">
                  {copy.comingSoonDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quick Actions (Disabled for now) */}
            <Card className="opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {copy.manageServices}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="text-xs">{copy.comingSoon}</Badge>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {copy.setSchedule}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="text-xs">{copy.comingSoon}</Badge>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {copy.viewRequests}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="text-xs">{copy.comingSoon}</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
