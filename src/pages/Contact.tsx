import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CMSPageWrapper } from "@/components/CMSPageWrapper";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <CMSPageWrapper 
          slug="contact" 
          defaultTitle={{ fr: c.title, ar: c.title }}
        >
        <div className="container">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4">
              {c.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {c.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-display text-xl font-semibold mb-6">
                  {c.getInTouch}
                </h2>

                <div className="space-y-6">
                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium">{c.address}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {c.addressValue}
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium">{c.phone}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        +212 5XX XX XX XX
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium">{c.email}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        contact@topaffaireimmo.com
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium">{c.businessHours}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {c.hoursValue}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border p-8">
                {isSuccess ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-2">
                      {c.successTitle}
                    </h3>
                    <p className="text-muted-foreground">
                      {c.successMessage}
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-semibold mb-6">
                      {c.sendMessage}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">{c.firstName}</Label>
                          <Input
                            id="firstName"
                            placeholder={c.placeholderFirstName}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">{c.lastName}</Label>
                          <Input
                            id="lastName"
                            placeholder={c.placeholderLastName}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{c.emailLabel}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={c.placeholderEmail}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{c.phoneLabel}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={c.placeholderPhone}
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">{c.subject}</Label>
                        <Input
                          id="subject"
                          placeholder={c.placeholderSubject}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{c.message}</Label>
                        <Textarea
                          id="message"
                          placeholder={c.placeholderMessage}
                          rows={5}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? c.sending : c.send}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </CMSPageWrapper>
      </main>

      <Footer />
    </div>
  );
}
