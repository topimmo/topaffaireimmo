import { useLanguage } from "@/contexts/LanguageContext";
import { CMSPageWrapper } from "@/components/CMSPageWrapper";
import { Building2, Users, Award, Globe } from "lucide-react";

const content = {
  fr: {
    title: "À propos de TopAffaireImmo",
    subtitle: "Nous sommes la première plateforme immobilière du Maroc, connectant les chercheurs de propriétés à leur logement idéal depuis 2014. Notre mission est de rendre les transactions immobilières simples, transparentes et accessibles à tous.",
    stats: [
      { label: "Annonces publiées", value: "5 000+", icon: Building2 },
      { label: "Clients satisfaits", value: "10 000+", icon: Users },
      { label: "Années d'expérience", value: "10+", icon: Award },
      { label: "Villes couvertes", value: "50+", icon: Globe },
    ],
    storyTitle: "Notre Histoire",
    storyP1: "Fondée en 2014, TopAffaireImmo a démarré avec une vision simple : transformer la façon dont les Marocains trouvent et vendent des propriétés. Ce qui a commencé comme une petite startup à Casablanca est devenu la plateforme immobilière la plus fiable du pays.",
    storyP2: "Aujourd'hui, nous servons des milliers d'utilisateurs quotidiennement, en partenariat avec plus de 200 agences immobilières et propriétaires individuels pour vous offrir les annonces les plus complètes du Maroc.",
    storyP3: "Notre engagement envers la transparence, l'innovation et la satisfaction client continue de nous propulser alors que nous élargissons nos services pour aider plus de gens à trouver leur propriété idéale.",
    valuesTitle: "Nos Valeurs",
    values: [
      {
        title: "Transparence",
        description: "Nous croyons en une information honnête et directe. Chaque annonce est vérifiée, et nos prix sont clairs sans frais cachés.",
      },
      {
        title: "Innovation",
        description: "Nous améliorons continuellement notre plateforme avec les dernières technologies pour rendre la recherche et la publication de propriétés plus faciles que jamais.",
      },
      {
        title: "Excellence du Service",
        description: "Notre équipe dédiée est toujours prête à vous assister dans votre parcours immobilier, que vous achetiez, vendiez ou louiez.",
      },
    ],
    freeListingTitle: "Publication Gratuite",
    freeListingDescription: "Chez TopAffaireImmo, nous croyons que tout le monde devrait avoir la possibilité de publier ses propriétés gratuitement. C'est pourquoi notre service de publication d'annonces immobilières est entièrement gratuit pour les propriétaires, courtiers et agences.",
  },
  ar: {
    title: "حول TopAffaireImmo",
    subtitle: "نحن المنصة العقارية الرائدة في المغرب، نربط الباحثين عن العقارات بمنازلهم المثالية منذ 2014. مهمتنا هي جعل المعاملات العقارية بسيطة وشفافة ومتاحة للجميع.",
    stats: [
      { label: "إعلان منشور", value: "+5,000", icon: Building2 },
      { label: "عميل راضٍ", value: "+10,000", icon: Users },
      { label: "سنوات خبرة", value: "+10", icon: Award },
      { label: "مدينة مغطاة", value: "+50", icon: Globe },
    ],
    storyTitle: "قصتنا",
    storyP1: "تأسست TopAffaireImmo في 2014 برؤية بسيطة: تحويل طريقة بحث المغاربة عن العقارات وبيعها. ما بدأ كشركة ناشئة صغيرة في الدار البيضاء أصبح المنصة العقارية الأكثر موثوقية في البلاد.",
    storyP2: "اليوم، نخدم آلاف المستخدمين يومياً، بالشراكة مع أكثر من 200 وكالة عقارية ومالكي عقارات أفراد لنقدم لك أكثر الإعلانات شمولاً في المغرب.",
    storyP3: "التزامنا بالشفافية والابتكار ورضا العملاء يستمر في دفعنا للأمام بينما نوسع خدماتنا لمساعدة المزيد من الناس في العثور على عقارهم المثالي.",
    valuesTitle: "قيمنا",
    values: [
      {
        title: "الشفافية",
        description: "نؤمن بالمعلومات الصادقة والمباشرة. كل إعلان موثق، وأسعارنا واضحة بدون رسوم خفية.",
      },
      {
        title: "الابتكار",
        description: "نحسن منصتنا باستمرار بأحدث التقنيات لجعل البحث عن العقارات ونشرها أسهل من أي وقت مضى.",
      },
      {
        title: "التميز في الخدمة",
        description: "فريقنا المتفاني جاهز دائماً لمساعدتك في رحلتك العقارية، سواء كنت تشتري أو تبيع أو تستأجر.",
      },
    ],
    freeListingTitle: "النشر المجاني",
    freeListingDescription: "في TopAffaireImmo، نؤمن أن الجميع يجب أن تتاح لهم الفرصة لنشر عقاراتهم مجاناً. لهذا السبب خدمة نشر الإعلانات العقارية لدينا مجانية تماماً للمالكين والسماسرة والوكالات.",
  },
};

export default function About() {
  const { language, isRTL } = useLanguage();
  const c = content[language];

  return (
    <div className={`bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="pt-24 pb-16">
        <CMSPageWrapper 
          slug="about" 
          defaultTitle={{ fr: c.title, ar: c.title }}
        >
        {/* Hero */}
        <section className="container mb-16">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-6">
              {c.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {c.subtitle}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-primary text-white py-16 mb-16">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {c.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-4 opacity-80" />
                  <p className="font-display text-3xl md:text-4xl font-semibold mb-2">
                    {stat.value}
                  </p>
                  <p className="text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className={isRTL ? 'order-2 md:order-2' : ''}>
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                alt="Real estate team"
                className="rounded-2xl"
              />
            </div>
            <div className={isRTL ? 'order-1 md:order-1' : ''}>
              <h2 className="font-display text-3xl font-semibold mb-4">
                {c.storyTitle}
              </h2>
              <p className="text-muted-foreground mb-4">
                {c.storyP1}
              </p>
              <p className="text-muted-foreground mb-4">
                {c.storyP2}
              </p>
              <p className="text-muted-foreground">
                {c.storyP3}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className={isRTL ? 'order-1 md:order-2' : 'order-2 md:order-1'}>
              <h2 className="font-display text-3xl font-semibold mb-4">
                {c.valuesTitle}
              </h2>
              <div className="space-y-6">
                {c.values.map((value) => (
                  <div key={value.title}>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className={isRTL ? 'order-2 md:order-1' : 'order-1 md:order-2'}>
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
                alt="Team collaboration"
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Free Listing Banner */}
          <div className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
              {c.freeListingTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {c.freeListingDescription}
            </p>
          </div>
        </section>
        </CMSPageWrapper>
      </div>
    </div>
  );
}
