import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
const content = {
    fr: {
        title: "Politique de Confidentialité",
        lastUpdated: "Dernière mise à jour : Janvier 2025",
        sections: [
            {
                title: "1. Introduction",
                content: "TopAffaireImmo (\"nous\", \"notre\" ou \"nos\") s'engage à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web ou utilisez nos services.",
            },
            {
                title: "2. Informations que nous collectons",
                content: "Nous pouvons collecter les types d'informations suivants :",
                list: [
                    "Informations personnelles : Nom, adresse e-mail, numéro de téléphone et autres coordonnées que vous fournissez lors de la soumission d'une annonce ou en nous contactant.",
                    "Informations sur les propriétés : Détails sur les propriétés que vous publiez, y compris les images, descriptions et prix.",
                    "Données d'utilisation : Informations sur la façon dont vous interagissez avec notre site web, y compris les pages visitées, le temps passé et les requêtes de recherche.",
                    "Informations sur l'appareil : Type de navigateur, système d'exploitation et identifiants de l'appareil.",
                ],
            },
            {
                title: "3. Comment nous utilisons vos informations",
                content: "Nous utilisons les informations collectées pour :",
                list: [
                    "Fournir et maintenir nos services",
                    "Traiter et publier les annonces immobilières",
                    "Répondre à vos demandes et demandes d'assistance",
                    "Améliorer notre site web et l'expérience utilisateur",
                    "Envoyer des mises à jour pertinentes et des communications marketing",
                    "Afficher des publicités ciblées via Google AdSense",
                ],
            },
            {
                title: "4. Cookies et suivi",
                content: "Nous utilisons des cookies et des technologies de suivi similaires pour améliorer votre expérience de navigation et analyser le trafic du site web. Des services tiers comme Google AdSense peuvent également placer des cookies sur votre appareil. Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.",
            },
            {
                title: "5. Partage d'informations",
                content: "Nous pouvons partager vos informations avec :",
                list: [
                    "Acheteurs ou locataires potentiels (coordonnées pour les annonces)",
                    "Prestataires de services qui nous aident à exploiter notre plateforme",
                    "Autorités légales lorsque la loi l'exige",
                ],
                footer: "Nous ne vendons pas vos informations personnelles à des tiers.",
            },
            {
                title: "6. Sécurité des données",
                content: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès, modification ou destruction non autorisé. Cependant, aucune transmission sur Internet n'est totalement sécurisée et nous ne pouvons garantir une sécurité absolue.",
            },
            {
                title: "7. Vos droits",
                content: "Vous avez le droit de :",
                list: [
                    "Accéder aux informations personnelles que nous détenons sur vous",
                    "Demander la correction des informations inexactes",
                    "Demander la suppression de vos informations",
                    "Vous désinscrire des communications marketing",
                ],
            },
            {
                title: "8. Contactez-nous",
                content: "Si vous avez des questions sur cette Politique de Confidentialité ou souhaitez exercer vos droits, veuillez nous contacter à :",
                contact: {
                    email: "privacy@topaffaireimmo.com",
                    address: "123 Boulevard Mohammed V, Casablanca, Maroc",
                },
            },
        ],
    },
    ar: {
        title: "سياسة الخصوصية",
        lastUpdated: "آخر تحديث: يناير 2025",
        sections: [
            {
                title: "1. مقدمة",
                content: "تلتزم TopAffaireImmo (\"نحن\" أو \"لنا\" أو \"خاصتنا\") بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها والإفصاح عنها وحمايتها عند زيارة موقعنا الإلكتروني أو استخدام خدماتنا.",
            },
            {
                title: "2. المعلومات التي نجمعها",
                content: "قد نجمع الأنواع التالية من المعلومات:",
                list: [
                    "المعلومات الشخصية: الاسم، عنوان البريد الإلكتروني، رقم الهاتف وتفاصيل الاتصال الأخرى التي تقدمها عند تقديم إعلان أو الاتصال بنا.",
                    "معلومات العقارات: تفاصيل العقارات التي تنشرها، بما في ذلك الصور والأوصاف والأسعار.",
                    "بيانات الاستخدام: معلومات حول كيفية تفاعلك مع موقعنا، بما في ذلك الصفحات التي تمت زيارتها والوقت المستغرق واستعلامات البحث.",
                    "معلومات الجهاز: نوع المتصفح ونظام التشغيل ومعرفات الجهاز.",
                ],
            },
            {
                title: "3. كيف نستخدم معلوماتك",
                content: "نستخدم المعلومات المجمعة من أجل:",
                list: [
                    "توفير خدماتنا والحفاظ عليها",
                    "معالجة ونشر إعلانات العقارات",
                    "الرد على استفساراتك وطلبات الدعم",
                    "تحسين موقعنا وتجربة المستخدم",
                    "إرسال التحديثات ذات الصلة والاتصالات التسويقية",
                    "عرض الإعلانات المستهدفة عبر Google AdSense",
                ],
            },
            {
                title: "4. ملفات تعريف الارتباط والتتبع",
                content: "نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتحسين تجربة التصفح وتحليل حركة المرور على الموقع. قد تضع خدمات الطرف الثالث مثل Google AdSense أيضًا ملفات تعريف الارتباط على جهازك. يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال إعدادات متصفحك.",
            },
            {
                title: "5. مشاركة المعلومات",
                content: "قد نشارك معلوماتك مع:",
                list: [
                    "المشترين أو المستأجرين المحتملين (معلومات الاتصال للإعلانات)",
                    "مقدمي الخدمات الذين يساعدوننا في تشغيل منصتنا",
                    "السلطات القانونية عندما يتطلب القانون ذلك",
                ],
                footer: "نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة.",
            },
            {
                title: "6. أمن البيانات",
                content: "نطبق التدابير التقنية والتنظيمية المناسبة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو التدمير. ومع ذلك، لا يوجد نقل عبر الإنترنت آمن تمامًا، ولا يمكننا ضمان الأمان المطلق.",
            },
            {
                title: "7. حقوقك",
                content: "لديك الحق في:",
                list: [
                    "الوصول إلى المعلومات الشخصية التي نحتفظ بها عنك",
                    "طلب تصحيح المعلومات غير الدقيقة",
                    "طلب حذف معلوماتك",
                    "إلغاء الاشتراك في الاتصالات التسويقية",
                ],
            },
            {
                title: "8. اتصل بنا",
                content: "إذا كانت لديك أسئلة حول سياسة الخصوصية هذه أو ترغب في ممارسة حقوقك، يرجى الاتصال بنا على:",
                contact: {
                    email: "privacy@topaffaireimmo.com",
                    address: "123 شارع محمد الخامس، الدار البيضاء، المغرب",
                },
            },
        ],
    },
};
export default function Privacy() {
    const { language, isRTL } = useLanguage();
    const t = content[language];
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-4xl", children: [_jsx("h1", { className: "font-display text-4xl md:text-5xl font-semibold text-foreground mb-4", children: t.title }), _jsx("p", { className: "text-muted-foreground mb-8", children: t.lastUpdated }), _jsx("div", { className: "prose prose-neutral max-w-none", children: _jsx("div", { className: "bg-white rounded-xl border p-8 space-y-8", children: t.sections.map((section, index) => (_jsxs("section", { children: [_jsx("h2", { className: "font-display text-2xl font-semibold mb-4", children: section.title }), _jsx("p", { className: "text-muted-foreground", children: section.content }), section.list && (_jsx("ul", { className: `list-disc ${isRTL ? 'pr-6' : 'pl-6'} text-muted-foreground space-y-2 mt-4`, children: section.list.map((item, i) => (_jsx("li", { children: item }, i))) })), section.footer && (_jsx("p", { className: "text-muted-foreground mt-4", children: section.footer })), section.contact && (_jsxs("p", { className: "text-muted-foreground mt-2", children: [isRTL ? 'البريد الإلكتروني' : 'Email', ": ", section.contact.email, _jsx("br", {}), isRTL ? 'العنوان' : 'Adresse', ": ", section.contact.address] }))] }, index))) }) })] }) }), _jsx(Footer, {})] }));
}
