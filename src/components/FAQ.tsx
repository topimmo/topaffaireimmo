import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  className?: string;
}

export function FAQ({ items, title, className = "" }: FAQProps) {
  const { t } = useLanguage();
  const faqTitle = title || t('faq.title');

  // Generate FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <section className={`w-full ${className}`}>
      {/* Inject FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="container mx-auto px-4">
        <h2 className="section-title mb-10 text-center">{faqTitle}</h2>
        
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-3">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-xl px-6 bg-card shadow-sm">
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold py-5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground pb-5 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// Predefined FAQ sets for different pages - now use translation keys
export function getGeneralFAQ(t: (key: string) => string): FAQItem[] {
  return [
    {
      question: t('faq.general.q1'),
      answer: t('faq.general.a1')
    },
    {
      question: t('faq.general.q2'),
      answer: t('faq.general.a2')
    },
    {
      question: t('faq.general.q3'),
      answer: t('faq.general.a3')
    },
    {
      question: t('faq.general.q4'),
      answer: t('faq.general.a4')
    },
    {
      question: t('faq.general.q5'),
      answer: t('faq.general.a5')
    },
    {
      question: t('faq.general.q6'),
      answer: t('faq.general.a6')
    }
  ];
}

export function getBuyingFAQ(t: (key: string) => string): FAQItem[] {
  return [
    {
      question: t('faq.buying.q1'),
      answer: t('faq.buying.a1')
    },
    {
      question: t('faq.buying.q2'),
      answer: t('faq.buying.a2')
    },
    {
      question: t('faq.buying.q3'),
      answer: t('faq.buying.a3')
    },
    {
      question: t('faq.buying.q4'),
      answer: t('faq.buying.a4')
    }
  ];
}

export function getRentingFAQ(t: (key: string) => string): FAQItem[] {
  return [
    {
      question: t('faq.renting.q1'),
      answer: t('faq.renting.a1')
    },
    {
      question: t('faq.renting.q2'),
      answer: t('faq.renting.a2')
    },
    {
      question: t('faq.renting.q3'),
      answer: t('faq.renting.a3')
    },
    {
      question: t('faq.renting.q4'),
      answer: t('faq.renting.a4')
    }
  ];
}

export function getCityFAQ(t: (key: string) => string, cityName: string): FAQItem[] {
  return [
    {
      question: t('faq.city.q1').replace('{city}', cityName),
      answer: t('faq.city.a1').replace(/{city}/g, cityName)
    },
    {
      question: t('faq.city.q2').replace('{city}', cityName),
      answer: t('faq.city.a2').replace(/{city}/g, cityName)
    },
    {
      question: t('faq.city.q3').replace('{city}', cityName),
      answer: t('faq.city.a3').replace(/{city}/g, cityName)
    },
    {
      question: t('faq.city.q4').replace('{city}', cityName),
      answer: t('faq.city.a4').replace(/{city}/g, cityName)
    }
  ];
}

// Legacy exports for backward compatibility - these will use French by default
// Components should migrate to using the functions above with the t function
export const generalFAQ: FAQItem[] = [
  {
    question: "Comment fonctionne TopAffaireImmo ?",
    answer: "TopAffaireImmo est une plateforme immobilière qui connecte acheteurs, vendeurs et locataires au Maroc. Vous pouvez rechercher des propriétés par ville, quartier, type et budget. Les annonceurs publient leurs biens et vous pouvez les contacter directement."
  },
  {
    question: "Est-ce que TopAffaireImmo est gratuit ?",
    answer: "La consultation des annonces est entièrement gratuite pour les visiteurs. Les annonceurs peuvent publier des propriétés avec différentes options tarifaires selon leurs besoins de visibilité."
  },
  {
    question: "Dans quelles villes puis-je trouver des propriétés ?",
    answer: "TopAffaireImmo couvre toutes les grandes villes du Maroc : Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès, Meknès, Oujda et plus de 50 autres villes à travers le royaume."
  },
  {
    question: "Comment contacter un vendeur ou propriétaire ?",
    answer: "Sur chaque annonce, vous trouverez un bouton 'Contacter' qui vous permet d'envoyer un message directement à l'annonceur ou de voir son numéro de téléphone pour le contacter."
  },
  {
    question: "Puis-je publier ma propre annonce immobilière ?",
    answer: "Oui ! Créez un compte gratuit, puis accédez à votre tableau de bord pour publier une nouvelle annonce. Ajoutez des photos, une description détaillée, le prix et les caractéristiques de votre bien."
  },
  {
    question: "Les annonces sont-elles vérifiées ?",
    answer: "Toutes les annonces sont modérées par notre équipe avant publication pour assurer la qualité et éviter les fraudes. Nous vérifions également les informations des annonceurs."
  }
];

export const buyingFAQ: FAQItem[] = [
  {
    question: "Quels types de propriétés puis-je acheter au Maroc ?",
    answer: "Vous pouvez acheter des appartements, maisons, villas, riads, terrains, locaux commerciaux et propriétés de luxe dans toutes les régions du Maroc."
  },
  {
    question: "Quel est le processus d'achat immobilier au Maroc ?",
    answer: "Le processus inclut : recherche du bien, négociation du prix, signature d'un compromis de vente, vérification des documents juridiques, paiement chez le notaire et signature de l'acte définitif."
  },
  {
    question: "Un étranger peut-il acheter une propriété au Maroc ?",
    answer: "Oui, les étrangers peuvent acheter librement des biens immobiliers au Maroc, sauf dans certaines zones agricoles. Les mêmes droits et procédures s'appliquent que pour les citoyens marocains."
  },
  {
    question: "Quels sont les frais d'achat immobilier ?",
    answer: "Les frais incluent les droits d'enregistrement (2,5% à 5%), les honoraires du notaire (environ 1%), les frais d'agence (2% à 3%), et les taxes selon le type de bien."
  }
];

export const rentingFAQ: FAQItem[] = [
  {
    question: "Comment louer une propriété au Maroc ?",
    answer: "Recherchez une propriété à louer, contactez le propriétaire ou l'agence, visitez le bien, négociez les conditions, signez un contrat de bail et versez le dépôt de garantie et le premier loyer."
  },
  {
    question: "Quel est le montant du dépôt de garantie ?",
    answer: "Le dépôt de garantie est généralement équivalent à 1 ou 2 mois de loyer. Il est restitué à la fin du bail si le logement est rendu en bon état."
  },
  {
    question: "Quelle est la durée minimale d'un bail au Maroc ?",
    answer: "Pour les locations à usage d'habitation principale, la durée minimale est d'un an renouvelable. Pour les locations meublées ou saisonnières, elle peut être plus courte."
  },
  {
    question: "Quels documents sont nécessaires pour louer ?",
    answer: "Vous devez fournir : pièce d'identité, justificatif de revenus (bulletins de salaire ou attestation d'emploi), et parfois un garant ou caution bancaire."
  }
];

