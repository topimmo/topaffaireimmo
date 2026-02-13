/**
 * Role Selection Page
 * 
 * Shown to users with user_role='user' after signup/login
 * to choose their path: Immobilier (agent) or Services (merchant)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Wrench, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type RoleChoice = "immobilier" | "services";
type AnnouncerType = "proprietaire" | "courtier" | "agence";

export default function SelectRole() {
  const { user, refreshSession } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<"choice" | "immobilier-type">("choice");
  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null);
  const [announcerType, setAnnouncerType] = useState<AnnouncerType | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(false);

  const copy = {
    headline: isRTL
      ? "اختر مسارك"
      : "Choisissez votre parcours",
    subheadline: isRTL
      ? "كيف تريد استخدام المنصة؟"
      : "Comment souhaitez-vous utiliser la plateforme ?",
    immobilier: {
      title: isRTL ? "العقارات" : "Immobilier",
      description: isRTL
        ? "أعلن عن عقارات للبيع أو الإيجار"
        : "Annoncez des propriétés à vendre ou à louer",
    },
    services: {
      title: isRTL ? "الخدمات" : "Services",
      description: isRTL
        ? "قدم خدمات منزلية كحرفي"
        : "Proposez des services à domicile en tant qu'artisan",
    },
    immobilierTypes: {
      headline: isRTL ? "ما هو نوع المعلن؟" : "Quel type d'annonceur êtes-vous ?",
      proprietaire: {
        title: isRTL ? "مالك" : "Propriétaire",
        description: isRTL ? "أملك عقار وأريد بيعه أو تأجيره" : "Je possède un bien à vendre ou louer",
      },
      courtier: {
        title: isRTL ? "سمسار" : "Courtier",
        description: isRTL ? "أنا سمسار عقاري مستقل" : "Je suis courtier immobilier indépendant",
      },
      agence: {
        title: isRTL ? "وكالة" : "Agence",
        description: isRTL ? "أنا وكالة عقارية" : "Je suis une agence immobilière",
      },
    },
    agencyNameLabel: isRTL ? "اسم الوكالة" : "Nom de l'agence",
    agencyNamePlaceholder: isRTL ? "مثال: وكالة العقارات المميزة" : "Ex: Agence Immobilière Premium",
    continue: isRTL ? "متابعة" : "Continuer",
    back: isRTL ? "رجوع" : "Retour",
  };

  const handleRoleChoice = async (choice: RoleChoice) => {
    setSelectedRole(choice);
    
    if (choice === "immobilier") {
      // Show immobilier type selection
      setStep("immobilier-type");
    } else {
      // Services - directly set merchant role
      await setUserRole("merchant");
    }
  };

  const handleImmoTypeChoice = async (type: AnnouncerType) => {
    setAnnouncerType(type);
    
    if (type === "agence") {
      // Show agency name input - user will click continue
      return;
    }
    
    // For proprietaire and courtier, directly set role
    await setUserRole("agent", type);
  };

  const handleAgencySubmit = async () => {
    if (!agencyName.trim()) {
      toast.error(isRTL ? "الرجاء إدخال اسم الوكالة" : "Veuillez entrer le nom de l'agence");
      return;
    }
    
    await setUserRole("agent", "agence", agencyName.trim());
  };

  const setUserRole = async (
    role: "agent" | "merchant",
    announcer?: AnnouncerType,
    agency?: string
  ) => {
    if (!user) {
      toast.error(isRTL ? "غير مصرح" : "Non authentifié");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("set_user_role", {
        p_role: role,
        p_announcer_type: announcer || null,
        p_agency_name: agency || null,
      });

      if (error) throw error;

      // Refresh session to get updated profile
      await refreshSession();

      // Show success message
      toast.success(
        isRTL 
          ? "تم تحديث ملفك الشخصي بنجاح" 
          : "Profil mis à jour avec succès"
      );

      // Redirect based on role
      if (role === "agent") {
        navigate("/dashboard");
      } else if (role === "merchant") {
        navigate("/artisan/onboarding");
      }
    } catch (error: any) {
      console.error("[SelectRole] Error setting role:", error);
      toast.error(
        isRTL
          ? "حدث خطأ. يرجى المحاولة مرة أخرى."
          : "Une erreur s'est produite. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20 py-20", isRTL && "rtl")}>
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="section-title mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
            {step === "choice" ? copy.headline : copy.immobilierTypes.headline}
          </h1>
          {step === "choice" && (
            <p className="section-subtitle animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">
              {copy.subheadline}
            </p>
          )}
        </div>

        {/* Step 1: Role Choice */}
        {step === "choice" && (
          <div className="grid gap-8 md:gap-10 sm:grid-cols-2">
            {/* Immobilier Card */}
            <button
              onClick={() => handleRoleChoice("immobilier")}
              disabled={loading}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "border border-border/40 shadow-lg hover:shadow-2xl",
                "bg-card hover:bg-gradient-to-br from-primary/5 via-primary/8 to-primary/3",
                "p-10 md:p-12 text-start transition-all duration-500",
                "hover:-translate-y-2 hover:border-border/60 hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                "animate-in fade-in slide-in-from-bottom-4 duration-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-8 bg-primary/12 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md">
                <Building2 className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4 tracking-tight text-foreground">
                {copy.immobilier.title}
              </h3>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                {copy.immobilier.description}
              </p>
              <div className="inline-flex items-center gap-2 font-semibold text-base text-primary group-hover:gap-3 transition-all duration-300">
                <span>{copy.continue}</span>
                <ArrowRight className={cn("w-5 h-5 transition-transform duration-300", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
              </div>
            </button>

            {/* Services Card */}
            <button
              onClick={() => handleRoleChoice("services")}
              disabled={loading}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "border border-border/40 shadow-lg hover:shadow-2xl",
                "bg-card hover:bg-gradient-to-br from-secondary/5 via-secondary/8 to-secondary/3",
                "p-10 md:p-12 text-start transition-all duration-500",
                "hover:-translate-y-2 hover:border-border/60 hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:ring-offset-2",
                "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-8 bg-secondary/12 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md">
                <Wrench className="w-10 h-10 md:w-12 md:h-12 text-secondary" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4 tracking-tight text-foreground">
                {copy.services.title}
              </h3>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                {copy.services.description}
              </p>
              <div className="inline-flex items-center gap-2 font-semibold text-base text-secondary group-hover:gap-3 transition-all duration-300">
                <span>{copy.continue}</span>
                <ArrowRight className={cn("w-5 h-5 transition-transform duration-300", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Immobilier Type Selection */}
        {step === "immobilier-type" && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {/* Proprietaire */}
              <button
                onClick={() => handleImmoTypeChoice("proprietaire")}
                disabled={loading || announcerType === "agence"}
                className={cn(
                  "group relative overflow-hidden rounded-xl",
                  "border border-border/40 shadow hover:shadow-lg",
                  "bg-card hover:bg-muted/50",
                  "p-6 text-start transition-all duration-300",
                  "hover:-translate-y-1",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  announcerType === "proprietaire" && "ring-2 ring-primary"
                )}
              >
                <h3 className="font-semibold text-xl mb-2">{copy.immobilierTypes.proprietaire.title}</h3>
                <p className="text-muted-foreground">{copy.immobilierTypes.proprietaire.description}</p>
              </button>

              {/* Courtier */}
              <button
                onClick={() => handleImmoTypeChoice("courtier")}
                disabled={loading || announcerType === "agence"}
                className={cn(
                  "group relative overflow-hidden rounded-xl",
                  "border border-border/40 shadow hover:shadow-lg",
                  "bg-card hover:bg-muted/50",
                  "p-6 text-start transition-all duration-300",
                  "hover:-translate-y-1",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  announcerType === "courtier" && "ring-2 ring-primary"
                )}
              >
                <h3 className="font-semibold text-xl mb-2">{copy.immobilierTypes.courtier.title}</h3>
                <p className="text-muted-foreground">{copy.immobilierTypes.courtier.description}</p>
              </button>

              {/* Agence */}
              <button
                onClick={() => handleImmoTypeChoice("agence")}
                disabled={loading}
                className={cn(
                  "group relative overflow-hidden rounded-xl",
                  "border border-border/40 shadow hover:shadow-lg",
                  "bg-card hover:bg-muted/50",
                  "p-6 text-start transition-all duration-300",
                  "hover:-translate-y-1",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  announcerType === "agence" && "ring-2 ring-primary"
                )}
              >
                <h3 className="font-semibold text-xl mb-2">{copy.immobilierTypes.agence.title}</h3>
                <p className="text-muted-foreground">{copy.immobilierTypes.agence.description}</p>
              </button>

              {/* Agency Name Input (shown if agence selected) */}
              {announcerType === "agence" && (
                <div className="mt-4 p-6 bg-muted/30 rounded-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <label htmlFor="agency-name" className="block text-sm font-medium mb-2">
                    {copy.agencyNameLabel}
                  </label>
                  <input
                    id="agency-name"
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder={copy.agencyNamePlaceholder}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleAgencySubmit}
                    disabled={loading || !agencyName.trim()}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.continue}
                  </button>
                </div>
              )}
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setStep("choice");
                setAnnouncerType(null);
                setAgencyName("");
              }}
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className={cn("w-4 h-4", isRTL ? "" : "rotate-180")} />
              {copy.back}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
