import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
const content = {
    fr: {
        title: "Contactez-nous",
        subtitle: "Vous avez des questions ou besoin d'assistance ? Nous sommes là pour vous aider. Contactez notre équipe et nous vous répondrons dans les plus brefs délais.",
        getInTouch: "Nos Coordonnées",
        address: "Adresse",
        addressValue: "123 Boulevard Mohammed V\nCasablanca, Maroc",
        phone: "Téléphone",
        email: "Email",
        businessHours: "Heures d'ouverture",
        hoursValue: "Lun - Ven: 9h00 - 18h00\nSam: 9h00 - 13h00",
        sendMessage: "Envoyez-nous un message",
        firstName: "Prénom *",
        lastName: "Nom *",
        emailLabel: "Email *",
        phoneLabel: "Téléphone",
        subject: "Sujet *",
        message: "Message *",
        sending: "Envoi en cours...",
        send: "Envoyer le message",
        successTitle: "Message envoyé !",
        successMessage: "Merci de nous avoir contactés. Nous vous répondrons dans les 24 heures.",
        placeholderFirstName: "Jean",
        placeholderLastName: "Dupont",
        placeholderEmail: "jean@exemple.com",
        placeholderPhone: "+212 6XX XX XX XX",
        placeholderSubject: "Comment pouvons-nous vous aider ?",
        placeholderMessage: "Votre message...",
    },
    ar: {
        title: "اتصل بنا",
        subtitle: "هل لديك أسئلة أو تحتاج إلى مساعدة؟ نحن هنا لمساعدتك. تواصل مع فريقنا وسنرد عليك في أقرب وقت ممكن.",
        getInTouch: "معلومات الاتصال",
        address: "العنوان",
        addressValue: "123 شارع محمد الخامس\nالدار البيضاء، المغرب",
        phone: "الهاتف",
        email: "البريد الإلكتروني",
        businessHours: "ساعات العمل",
        hoursValue: "الإثنين - الجمعة: 9:00 - 18:00\nالسبت: 9:00 - 13:00",
        sendMessage: "أرسل لنا رسالة",
        firstName: "الاسم الأول *",
        lastName: "الاسم الأخير *",
        emailLabel: "البريد الإلكتروني *",
        phoneLabel: "الهاتف",
        subject: "الموضوع *",
        message: "الرسالة *",
        sending: "جاري الإرسال...",
        send: "إرسال الرسالة",
        successTitle: "تم إرسال الرسالة!",
        successMessage: "شكراً لتواصلك معنا. سنرد عليك خلال 24 ساعة.",
        placeholderFirstName: "أحمد",
        placeholderLastName: "محمد",
        placeholderEmail: "ahmed@exemple.com",
        placeholderPhone: "+212 6XX XX XX XX",
        placeholderSubject: "كيف يمكننا مساعدتك؟",
        placeholderMessage: "رسالتك...",
    },
};
export default function Contact() {
    const { language, isRTL } = useLanguage();
    const c = content[language];
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        setIsSuccess(true);
    };
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "max-w-2xl mb-12", children: [_jsx("h1", { className: "font-display text-4xl md:text-5xl font-semibold text-foreground mb-4", children: c.title }), _jsx("p", { className: "text-lg text-muted-foreground", children: c.subtitle })] }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-12", children: [_jsx("div", { className: "lg:col-span-1 space-y-8", children: _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-6", children: c.getInTouch }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: `flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(MapPin, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: isRTL ? 'text-right' : '', children: [_jsx("p", { className: "font-medium", children: c.address }), _jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-line", children: c.addressValue })] })] }), _jsxs("div", { className: `flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Phone, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: isRTL ? 'text-right' : '', children: [_jsx("p", { className: "font-medium", children: c.phone }), _jsx("p", { className: "text-sm text-muted-foreground", dir: "ltr", children: "+212 5XX XX XX XX" })] })] }), _jsxs("div", { className: `flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Mail, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: isRTL ? 'text-right' : '', children: [_jsx("p", { className: "font-medium", children: c.email }), _jsx("p", { className: "text-sm text-muted-foreground", dir: "ltr", children: "contact@topaffaireimmo.com" })] })] }), _jsxs("div", { className: `flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Clock, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: isRTL ? 'text-right' : '', children: [_jsx("p", { className: "font-medium", children: c.businessHours }), _jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-line", children: c.hoursValue })] })] })] })] }) }), _jsx("div", { className: "lg:col-span-2", children: _jsx("div", { className: "bg-white rounded-xl border p-8", children: isSuccess ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "h-8 w-8 text-secondary" }) }), _jsx("h3", { className: "font-display text-2xl font-semibold mb-2", children: c.successTitle }), _jsx("p", { className: "text-muted-foreground", children: c.successMessage })] })) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-6", children: c.sendMessage }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "firstName", children: c.firstName }), _jsx(Input, { id: "firstName", placeholder: c.placeholderFirstName, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "lastName", children: c.lastName }), _jsx(Input, { id: "lastName", placeholder: c.placeholderLastName, required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: c.emailLabel }), _jsx(Input, { id: "email", type: "email", placeholder: c.placeholderEmail, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phone", children: c.phoneLabel }), _jsx(Input, { id: "phone", type: "tel", placeholder: c.placeholderPhone, dir: "ltr" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "subject", children: c.subject }), _jsx(Input, { id: "subject", placeholder: c.placeholderSubject, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "message", children: c.message }), _jsx(Textarea, { id: "message", placeholder: c.placeholderMessage, rows: 5, required: true })] }), _jsx(Button, { type: "submit", size: "lg", className: "w-full", disabled: isSubmitting, children: isSubmitting ? c.sending : c.send })] })] })) }) })] })] }) }), _jsx(Footer, {})] }));
}
