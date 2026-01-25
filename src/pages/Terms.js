import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
const content = {
    fr: {
        title: "Conditions Générales d'Utilisation",
        lastUpdated: "Dernière mise à jour : Janvier 2025",
        sections: [
            {
                title: "1. Acceptation des conditions",
                content: "En accédant et en utilisant TopAffaireImmo (\"la Plateforme\"), vous acceptez d'être lié par ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.",
            },
            {
                title: "2. Description des services",
                content: "TopAffaireImmo fournit une plateforme en ligne de petites annonces immobilières, permettant aux utilisateurs de publier des propriétés à vendre ou à louer et de parcourir les annonces disponibles. Nous agissons en tant qu'intermédiaire et ne participons pas aux transactions immobilières réelles.",
            },
            {
                title: "3. Responsabilités de l'utilisateur",
                content: "En utilisant notre Plateforme, vous acceptez de :",
                list: [
                    "Fournir des informations exactes et véridiques dans toutes les annonces",
                    "Ne publier que des propriétés que vous possédez ou êtes autorisé à publier",
                    "Ne pas publier de contenu trompeur, frauduleux ou illégal",
                    "Respecter les droits de propriété intellectuelle d'autrui",
                    "Ne pas utiliser la Plateforme à des fins illégales",
                    "Maintenir vos coordonnées à jour",
                ],
            },
            {
                title: "4. Directives pour les annonces",
                content: "Toutes les annonces immobilières doivent :",
                list: [
                    "Contenir des descriptions et des prix exacts",
                    "Inclure des photos réelles et non modifiées de la propriété",
                    "Être destinées à des transactions immobilières légitimes uniquement",
                    "Se conformer à toutes les lois immobilières marocaines applicables",
                ],
                footer: "Nous nous réservons le droit de réviser, modifier ou supprimer toute annonce qui enfreint ces directives sans préavis.",
            },
            {
                title: "5. Publication gratuite des annonces",
                content: "La publication d'annonces immobilières sur TopAffaireImmo est entièrement gratuite pour tous les utilisateurs, qu'ils soient propriétaires, courtiers ou agences. Il n'y a aucun frais caché pour la publication ou la promotion de vos propriétés.",
            },
            {
                title: "6. Exclusion de garantie",
                content: "La Plateforme est fournie \"en l'état\" sans garantie d'aucune sorte. Nous ne garantissons pas l'exactitude, l'exhaustivité ou la fiabilité des informations contenues dans les annonces. Les utilisateurs sont responsables de vérifier les détails des propriétés et de faire preuve de diligence raisonnable avant toute transaction.",
            },
            {
                title: "7. Limitation de responsabilité",
                content: "TopAffaireImmo ne saurait être tenu responsable de tout dommage direct, indirect, accessoire ou consécutif découlant de l'utilisation de notre Plateforme ou de toute transaction effectuée par son intermédiaire. Nous ne sommes pas responsables des litiges entre acheteurs, vendeurs, propriétaires ou locataires.",
            },
            {
                title: "8. Propriété intellectuelle",
                content: "Tout le contenu de TopAffaireImmo, y compris les logos, les designs, les textes et les logiciels, est notre propriété ou nous est concédé sous licence et est protégé par les lois sur la propriété intellectuelle. Les utilisateurs conservent la propriété du contenu qu'ils soumettent mais nous accordent une licence pour l'afficher et le distribuer sur notre Plateforme.",
            },
            {
                title: "9. Modifications des conditions",
                content: "Nous pouvons mettre à jour ces Conditions Générales d'Utilisation à tout moment. Les modifications seront effectives dès leur publication sur notre site web. L'utilisation continue de la Plateforme après les modifications constitue l'acceptation des nouvelles conditions.",
            },
            {
                title: "10. Droit applicable",
                content: "Ces Conditions Générales d'Utilisation sont régies et interprétées conformément aux lois du Maroc. Tout litige sera soumis à la compétence exclusive des tribunaux de Casablanca.",
            },
            {
                title: "11. Contactez-nous",
                content: "Pour toute question concernant ces Conditions Générales d'Utilisation, veuillez nous contacter :",
                contact: {
                    email: "contact@topaffaireimmo.com",
                    address: "123 Boulevard Mohammed V, Casablanca, Maroc",
                },
            },
        ],
    },
    ar: {
        title: "الشروط والأحكام",
        lastUpdated: "آخر تحديث: يناير 2025",
        sections: [
            {
                title: "1. قبول الشروط",
                content: "من خلال الوصول إلى TopAffaireImmo (\"المنصة\") واستخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا.",
            },
            {
                title: "2. وصف الخدمات",
                content: "توفر TopAffaireImmo منصة إلكترونية للإعلانات العقارية المبوبة، تتيح للمستخدمين نشر العقارات للبيع أو الإيجار وتصفح الإعلانات المتاحة. نحن نعمل كوسيط ولا نشارك في المعاملات العقارية الفعلية.",
            },
            {
                title: "3. مسؤوليات المستخدم",
                content: "عند استخدام منصتنا، فإنك توافق على:",
                list: [
                    "تقديم معلومات دقيقة وصادقة في جميع الإعلانات",
                    "نشر العقارات التي تملكها أو مخول لك بنشرها فقط",
                    "عدم نشر محتوى مضلل أو احتيالي أو غير قانوني",
                    "احترام حقوق الملكية الفكرية للآخرين",
                    "عدم استخدام المنصة لأي غرض غير قانوني",
                    "الحفاظ على معلومات الاتصال الخاصة بك محدثة",
                ],
            },
            {
                title: "4. إرشادات الإعلانات",
                content: "يجب أن تتضمن جميع إعلانات العقارات:",
                list: [
                    "أوصاف وأسعار دقيقة",
                    "صور حقيقية وغير معدلة للعقار الفعلي",
                    "معاملات عقارية مشروعة فقط",
                    "الامتثال لجميع القوانين العقارية المغربية المعمول بها",
                ],
                footer: "نحتفظ بالحق في مراجعة أو تعديل أو إزالة أي إعلان ينتهك هذه الإرشادات دون إشعار مسبق.",
            },
            {
                title: "5. نشر الإعلانات مجانًا",
                content: "نشر الإعلانات العقارية على TopAffaireImmo مجاني تمامًا لجميع المستخدمين، سواء كانوا ملاكًا أو وسطاء أو وكالات. لا توجد رسوم خفية لنشر عقاراتك أو الترويج لها.",
            },
            {
                title: "6. إخلاء المسؤولية",
                content: "يتم توفير المنصة \"كما هي\" دون ضمانات من أي نوع. نحن لا نضمن دقة أو اكتمال أو موثوقية أي معلومات إعلانية. المستخدمون مسؤولون عن التحقق من تفاصيل العقار وإجراء العناية الواجبة قبل أي معاملة.",
            },
            {
                title: "7. حدود المسؤولية",
                content: "لن تكون TopAffaireImmo مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام منصتنا أو أي معاملات تتم من خلالها. نحن لسنا مسؤولين عن النزاعات بين المشترين والبائعين والملاك أو المستأجرين.",
            },
            {
                title: "8. الملكية الفكرية",
                content: "جميع المحتويات على TopAffaireImmo، بما في ذلك الشعارات والتصاميم والنصوص والبرامج، هي ملكنا أو مرخصة لنا ومحمية بموجب قوانين الملكية الفكرية. يحتفظ المستخدمون بملكية المحتوى الذي يقدمونه ولكنهم يمنحوننا ترخيصًا لعرضه وتوزيعه على منصتنا.",
            },
            {
                title: "9. تعديلات على الشروط",
                content: "قد نقوم بتحديث هذه الشروط والأحكام في أي وقت. ستكون التغييرات سارية المفعول عند نشرها على موقعنا الإلكتروني. يشكل الاستمرار في استخدام المنصة بعد التغييرات قبولاً للشروط الجديدة.",
            },
            {
                title: "10. القانون الحاكم",
                content: "تخضع هذه الشروط والأحكام للقوانين المغربية وتُفسر وفقًا لها. تخضع أي نزاعات للاختصاص القضائي الحصري لمحاكم الدار البيضاء.",
            },
            {
                title: "11. اتصل بنا",
                content: "لأي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا:",
                contact: {
                    email: "contact@topaffaireimmo.com",
                    address: "123 شارع محمد الخامس، الدار البيضاء، المغرب",
                },
            },
        ],
    },
};
export default function Terms() {
    const { language, isRTL } = useLanguage();
    const t = content[language];
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-4xl", children: [_jsx("h1", { className: "font-display text-4xl md:text-5xl font-semibold text-foreground mb-4", children: t.title }), _jsx("p", { className: "text-muted-foreground mb-8", children: t.lastUpdated }), _jsx("div", { className: "prose prose-neutral max-w-none", children: _jsx("div", { className: "bg-white rounded-xl border p-8 space-y-8", children: t.sections.map((section, index) => (_jsxs("section", { children: [_jsx("h2", { className: "font-display text-2xl font-semibold mb-4", children: section.title }), _jsx("p", { className: "text-muted-foreground", children: section.content }), section.list && (_jsx("ul", { className: `list-disc ${isRTL ? 'pr-6' : 'pl-6'} text-muted-foreground space-y-2 mt-4`, children: section.list.map((item, i) => (_jsx("li", { children: item }, i))) })), section.footer && (_jsx("p", { className: "text-muted-foreground mt-4", children: section.footer })), section.contact && (_jsxs("p", { className: "text-muted-foreground mt-2", children: [isRTL ? 'البريد الإلكتروني' : 'Email', ": ", section.contact.email, _jsx("br", {}), isRTL ? 'العنوان' : 'Adresse', ": ", section.contact.address] }))] }, index))) }) })] }) }), _jsx(Footer, {})] }));
}
