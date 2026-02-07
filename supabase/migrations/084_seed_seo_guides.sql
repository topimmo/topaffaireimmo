-- Migration: Seed SEO Guides for Morocco Real Estate
-- Description: Add 5 comprehensive SEO guides to site_pages table
-- Date: 2026-02-07
-- Purpose: Educational SEO content for Google Morocco targeting

-- Guide 1: How to Buy an Apartment in Morocco
INSERT INTO public.site_pages (
  slug,
  title_fr,
  title_ar,
  content_fr,
  content_ar,
  meta_description_fr,
  meta_description_ar,
  is_published
) VALUES (
  'comment-acheter-appartement-maroc',
  'Comment Acheter un Appartement au Maroc : Guide Complet 2026',
  'كيفية شراء شقة في المغرب: دليل شامل 2026',
  '# Comment Acheter un Appartement au Maroc : Guide Complet 2026

## Introduction

Acheter un appartement au Maroc est une décision importante qui nécessite une bonne préparation. Que vous soyez Marocain ou étranger, ce guide vous accompagne à travers toutes les étapes pour réussir votre achat immobilier au Maroc.

## Les Étapes d''Achat d''un Appartement au Maroc

### 1. Définir Votre Budget

Avant de commencer vos recherches, établissez un budget réaliste incluant :
- Le prix d''achat de l''appartement
- Les frais de notaire (2-3% du prix)
- Les frais d''enregistrement (1,5% du prix)
- Les frais d''agence (2-3% du prix si applicable)
- Les travaux de rénovation éventuels

**Conseil** : Prévoyez une marge de 10% pour les imprévus.

### 2. Obtenir un Financement Bancaire

Si vous avez besoin d''un crédit immobilier :
- Comparez les offres de plusieurs banques marocaines
- Taux d''intérêt : généralement entre 4% et 5,5%
- Apport personnel : minimum 20% du prix
- Durée : jusqu''à 25 ans

**Documents requis** :
- CNI (Carte Nationale d''Identité)
- Justificatifs de revenus (3 derniers mois)
- Relevés bancaires
- Compromis de vente

### 3. Rechercher Votre Appartement Idéal

Utilisez TopAffaireImmo pour :
- Explorer les annonces par ville et quartier
- Comparer les prix au m²
- Contacter directement les propriétaires
- Planifier des visites

**Quartiers populaires** :
- **Casablanca** : Maarif, Anfa, Gauthier, Ain Diab
- **Rabat** : Agdal, Hay Riad, Hassan, Souissi
- **Marrakech** : Guéliz, Hivernage, Targa

### 4. Visiter les Propriétés

Lors de vos visites, vérifiez :
- ✅ L''état général de l''appartement
- ✅ La plomberie et l''électricité
- ✅ Les charges de copropriété
- ✅ L''orientation et la luminosité
- ✅ Le quartier et les commodités
- ✅ Les transports en commun

**Astuce** : Visitez le quartier à différentes heures (matin, soir, weekend).

### 5. Vérifier les Documents Légaux

Documents essentiels à demander :
- **Titre foncier** (le plus important !)
- Autorisation de construire
- Certificat de conformité
- Règlement de copropriété
- Procès-verbaux des AG
- Quittances de charges récentes

⚠️ **Important** : Faites vérifier le titre foncier à la Conservation Foncière.

### 6. Négocier le Prix

Conseils de négociation :
- Étudiez les prix du marché dans le quartier
- Identifiez les points faibles de la propriété
- Proposez un prix 5-10% en dessous du prix affiché
- Restez courtois et professionnel
- Soyez prêt à vous retirer si le prix ne convient pas

### 7. Signer le Compromis de Vente

Le compromis de vente (ou promesse de vente) engage les deux parties :
- Versement d''un acompte (généralement 10%)
- Délai de rétractation de 7 jours
- Conditions suspensives (obtention crédit, etc.)

### 8. Faire Authentifier l''Acte Chez le Notaire

L''acte authentique est obligatoire au Maroc :
- Rendez-vous chez un notaire (adoul)
- Présence des deux parties
- Paiement du solde
- Signature de l''acte de vente

**Frais de notaire** : environ 2,5% du prix de vente.

### 9. Enregistrer la Vente

L''enregistrement à la Conservation Foncière :
- Dépôt du dossier
- Paiement des droits d''enregistrement (1,5%)
- Obtention du nouveau titre foncier à votre nom
- Délai : 2 à 4 semaines

### 10. Prendre Possession de Votre Appartement

Félicitations ! Vous êtes maintenant propriétaire :
- Récupérez les clés
- Faites les changements de contrats (eau, électricité)
- Souscrivez une assurance habitation
- Commencez vos travaux si nécessaire

## Documents Nécessaires pour Acheter

### Pour les Marocains
- Carte Nationale d''Identité (CNI)
- Justificatif de domicile
- Justificatifs de revenus

### Pour les Étrangers
- Passeport valide
- Carte de séjour (si résident)
- Autorisation de change (si achat en devises)
- Justificatifs de revenus

## Budget et Frais à Prévoir

| Type de Frais | Montant | Remarques |
|--------------|---------|-----------|
| **Prix d''achat** | Variable | Selon quartier et superficie |
| **Frais de notaire** | 2-3% | Rédaction acte authentique |
| **Droits d''enregistrement** | 1,5% | Conservation foncière |
| **Frais d''agence** | 2-3% | Si passage par agence |
| **Frais bancaires** | 0,5-1% | Si crédit immobilier |
| **Total frais** | **6-9%** | Du prix d''achat |

**Exemple** : Pour un appartement de 1,000,000 MAD, prévoyez 60,000-90,000 MAD de frais.

## Pièges à Éviter

### ❌ Acheter Sans Vérifier le Titre Foncier
Ne jamais acheter un bien sans titre foncier valide. Vérifiez toujours à la Conservation Foncière.

### ❌ Négliger les Charges de Copropriété
Renseignez-vous sur les charges mensuelles et leur historique de paiement.

### ❌ Oublier les Travaux
Prévoyez un budget pour les rénovations et l''ameublement.

### ❌ Se Précipiter
Prenez le temps de comparer plusieurs biens et de bien réfléchir.

### ❌ Ignorer le Quartier
Le quartier est aussi important que l''appartement lui-même.

## Conseils d''Expert

💡 **Meilleur moment pour acheter** : Fin d''année et été (moins de concurrence)

💡 **Négociation** : Les prix affichés sont souvent négociables de 5-15%

💡 **Inspection** : Engagez un expert en bâtiment pour les biens anciens

💡 **Investissement** : Privilégiez les quartiers en développement

## FAQ - Questions Fréquentes

### Puis-je acheter en tant qu''étranger ?
Oui, les étrangers peuvent acheter au Maroc sans restriction particulière, sauf pour les terrains agricoles.

### Quel est le prix moyen au m² au Maroc ?
- Casablanca : 12,000-18,000 MAD/m² (centre)
- Rabat : 10,000-15,000 MAD/m²
- Marrakech : 8,000-20,000 MAD/m²

### Combien de temps prend l''achat ?
De la visite à la signature : 2 à 6 mois en moyenne.

### Puis-je obtenir un crédit en tant qu''étranger ?
Oui, mais les conditions sont plus strictes (apport 30-40%).

### Dois-je passer par une agence ?
Non, vous pouvez acheter directement au propriétaire via TopAffaireImmo.

### Quelles sont les taxes annuelles ?
Taxe d''habitation : environ 100-500 MAD/an selon la ville.

### Comment estimer la valeur d''un bien ?
Comparez les prix au m² dans le même quartier sur TopAffaireImmo.

### Que faire si le vendeur refuse de baisser le prix ?
Cherchez d''autres biens ou attendez. Le marché est toujours dynamique.

### L''achat d''un appartement neuf est-il différent ?
Oui, vous achetez sur plan avec paiements échelonnés et garantie décennale.

### Comment éviter les arnaques ?
Vérifiez toujours le titre foncier, passez par un notaire, et ne payez jamais sans acte signé.

## Conclusion

Acheter un appartement au Maroc est un projet passionnant qui demande préparation et vigilance. En suivant ce guide, vous mettez toutes les chances de votre côté pour réussir votre achat immobilier.

**Prêt à acheter ?** Explorez les [appartements à vendre sur TopAffaireImmo](/acheter) et trouvez votre futur logement !

---

*Guide mis à jour en février 2026 - TopAffaireImmo*',
  
  '# كيفية شراء شقة في المغرب: دليل شامل 2026

## مقدمة

شراء شقة في المغرب قرار مهم يتطلب تحضيراً جيداً. سواء كنت مغربياً أو أجنبياً، هذا الدليل سيرافقك خلال جميع الخطوات لإنجاح عملية الشراء العقاري في المغرب.

## خطوات شراء شقة في المغرب

### 1. تحديد الميزانية

قبل البدء في البحث، حدد ميزانية واقعية تشمل:
- سعر شراء الشقة
- رسوم التوثيق (2-3% من السعر)
- رسوم التسجيل (1.5% من السعر)
- عمولة الوكالة (2-3% إذا كان ذلك ضرورياً)
- تكاليف التجديد المحتملة

**نصيحة**: احتفظ بهامش 10% للنفقات غير المتوقعة.

### 2. الحصول على تمويل بنكي

إذا كنت بحاجة إلى قرض عقاري:
- قارن عروض عدة بنوك مغربية
- معدل الفائدة: عموماً بين 4% و 5.5%
- المساهمة الشخصية: 20% كحد أدنى
- المدة: حتى 25 سنة

### 3. البحث عن شقتك المثالية

استخدم TopAffaireImmo من أجل:
- استكشاف الإعلانات حسب المدينة والحي
- مقارنة الأسعار بالمتر المربع
- الاتصال مباشرة بالمالكين
- تحديد مواعيد الزيارات

**أحياء شعبية**:
- **الدار البيضاء**: المعاريف، أنفا، غوتيي، عين الذئاب
- **الرباط**: أكدال، حي الرياض، حسان، سويسي
- **مراكش**: كليز، هيفيرناج، تارجة

### 4. زيارة العقارات

أثناء زياراتك، تحقق من:
- ✅ الحالة العامة للشقة
- ✅ السباكة والكهرباء
- ✅ رسوم الملكية المشتركة
- ✅ التوجه والإضاءة
- ✅ الحي والمرافق
- ✅ وسائل النقل العام

### 5. التحقق من الوثائق القانونية

الوثائق الأساسية المطلوبة:
- **الرسم العقاري** (الأهم!)
- رخصة البناء
- شهادة المطابقة
- نظام الملكية المشتركة
- محاضر الجمعيات العمومية

⚠️ **مهم**: تحقق دائماً من الرسم العقاري في المحافظة العقارية.

## الوثائق اللازمة للشراء

### للمغاربة
- بطاقة التعريف الوطنية
- إثبات الإقامة
- إثبات الدخل

### للأجانب
- جواز سفر ساري المفعول
- بطاقة الإقامة (إذا كنت مقيماً)
- تصريح الصرف (إذا كان الشراء بالعملة الأجنبية)

## الأسئلة الشائعة

### هل يمكنني الشراء كأجنبي؟
نعم، يمكن للأجانب الشراء في المغرب دون قيود خاصة، باستثناء الأراضي الزراعية.

### ما هو متوسط السعر بالمتر المربع؟
- الدار البيضاء: 12,000-18,000 درهم/م²
- الرباط: 10,000-15,000 درهم/م²
- مراكش: 8,000-20,000 درهم/م²

### كم من الوقت يستغرق الشراء؟
من الزيارة إلى التوقيع: 2 إلى 6 أشهر في المتوسط.

---

*تم تحديث الدليل في فبراير 2026 - TopAffaireImmo*',
  
  'Guide complet pour acheter un appartement au Maroc : étapes, documents, budget, conseils et pièges à éviter. Tout ce qu''il faut savoir en 2026.',
  'دليل شامل لشراء شقة في المغرب: الخطوات، الوثائق، الميزانية، النصائح والأخطاء التي يجب تجنبها.',
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  title_ar = EXCLUDED.title_ar,
  content_fr = EXCLUDED.content_fr,
  content_ar = EXCLUDED.content_ar,
  meta_description_fr = EXCLUDED.meta_description_fr,
  meta_description_ar = EXCLUDED.meta_description_ar,
  updated_at = NOW();

-- Guide 2: How to Sell Real Estate in Morocco
INSERT INTO public.site_pages (
  slug,
  title_fr,
  title_ar,
  content_fr,
  content_ar,
  meta_description_fr,
  meta_description_ar,
  is_published
) VALUES (
  'comment-vendre-bien-immobilier-maroc',
  'Comment Vendre un Bien Immobilier au Maroc : Guide Complet',
  'كيفية بيع عقار في المغرب: دليل كامل',
  '# Comment Vendre un Bien Immobilier au Maroc : Guide Complet

## Introduction

Vendre un bien immobilier au Maroc nécessite une bonne stratégie pour obtenir le meilleur prix dans les meilleurs délais. Ce guide vous accompagne étape par étape.

## Les Étapes pour Vendre Rapidement

### 1. Préparer Votre Bien à la Vente

**Nettoyage et rangement** :
- Dépersonnalisez les espaces
- Nettoyez en profondeur
- Désencombrez toutes les pièces
- Réparez les petits défauts visibles

**Mise en valeur (Home Staging)** :
- Peinture fraîche si nécessaire
- Bonne luminosité
- Rangement des placards
- Jardin/terrasse entretenus

### 2. Estimer le Prix Correct

L''estimation est cruciale pour vendre rapidement :

**Méthodes d''estimation** :
- Comparez les ventes récentes dans votre quartier
- Utilisez TopAffaireImmo pour voir les prix au m²
- Consultez un expert immobilier
- Tenez compte de l''état et des équipements

**Prix par ville (moyenne 2026)** :
- Casablanca centre : 13,000-16,000 MAD/m²
- Rabat centre : 11,000-14,000 MAD/m²
- Marrakech Guéliz : 10,000-15,000 MAD/m²

⚠️ **Attention** : Un prix trop élevé fait fuir les acheteurs !

### 3. Rassembler les Documents

**Documents obligatoires** :
- ✅ Titre foncier (original)
- ✅ Carte d''identité nationale
- ✅ Taxe d''habitation à jour
- ✅ Quittances charges copropriété
- ✅ Plans de l''appartement
- ✅ Autorisation de construire (si applicable)

**Documents recommandés** :
- Diagnostic de performance énergétique
- Factures de travaux récents
- Garanties d''équipements

### 4. Créer une Annonce Efficace

**Sur TopAffaireImmo, optimisez votre annonce** :

**Titre accrocheur** :
- ❌ "Appartement à vendre"
- ✅ "Superbe appartement 3 chambres, Maarif, vue dégagée"

**Description détaillée (200+ mots)** :
- Surface exacte
- Nombre de pièces
- Étage et ascenseur
- État général
- Équipements (cuisine, climatisation, etc.)
- Proximité (écoles, commerces, transports)
- Points forts uniques

**Photos professionnelles** :
- Minimum 10 photos HD
- Lumière naturelle
- Tous les angles
- Photo de la façade
- Vue depuis les fenêtres

**Prix** :
- Affichez un prix juste
- Laissez une marge de négociation (5-10%)

### 5. Diffuser Votre Annonce

**Canaux de diffusion** :
- TopAffaireImmo (gratuit et efficace)
- Réseaux sociaux (Facebook, WhatsApp)
- Bouche-à-oreille
- Agences locales (si nécessaire)

**Astuce** : TopAffaireImmo permet le contact direct sans commission !

### 6. Gérer les Visites

**Préparez les visites** :
- Nettoyez avant chaque visite
- Aérez bien l''appartement
- Allumez toutes les lumières
- Soyez disponible et flexible

**Pendant la visite** :
- Soyez accueillant et honnête
- Laissez les visiteurs explorer
- Répondez à toutes les questions
- Mettez en valeur les atouts
- Ne cachez pas les défauts (transparence)

**Après la visite** :
- Demandez un retour
- Relancez si intéressé
- Restez disponible

### 7. Négocier le Prix

**Conseils de négociation** :
- Connaissez votre prix plancher
- Écoutez les arguments de l''acheteur
- Soyez ferme mais flexible
- Proposez des compromis (meubles inclus, etc.)
- Ne vous précipitez pas

**Offres à considérer** :
- 5% en dessous : acceptable
- 10% en dessous : négociable
- 15%+ en dessous : refusez poliment

### 8. Accepter l''Offre et Signer le Compromis

**Le compromis de vente** :
- Accord écrit
- Acompte de 10% généralement
- Délai de 30-60 jours
- Conditions suspensives

**Que faire après signature** :
- Arrêtez les visites
- Maintenez le bien en bon état
- Rassemblez tous les documents
- Préparez le déménagement

### 9. Finaliser la Vente Chez le Notaire

**Rendez-vous notaire** :
- Vérification des documents
- Lecture de l''acte de vente
- Signature des deux parties
- Remise des clés
- Paiement du solde

**Frais à la charge du vendeur** :
- Généralement minimes
- Parfois frais de mainlevée hypothèque

### 10. Recevoir le Paiement

**Modes de paiement sécurisés** :
- Virement bancaire (recommandé)
- Chèque certifié
- Dépôt chez le notaire

⚠️ **Ne jamais** accepter d''espèces pour un montant important !

## Combien de Temps pour Vendre ?

**Délais moyens au Maroc** :
- Bien bien situé, bon prix : 2-3 mois
- Marché standard : 4-6 mois
- Prix trop élevé ou quartier difficile : 6-12 mois+

**Facteurs qui accélèrent la vente** :
- Prix compétitif
- Présentation impeccable
- Photos professionnelles
- Annonce détaillée
- Flexibilité pour les visites

## Frais et Taxes

**À la charge du vendeur** :
- Taxe d''habitation à jour
- Mainlevée hypothèque (si crédit)
- Frais minimes chez le notaire

**À la charge de l''acheteur** :
- Droits d''enregistrement (1,5%)
- Frais de notaire (2-3%)
- Frais d''agence (si applicable)

## Erreurs à Éviter

### ❌ Surestimer le Prix
Le prix est la raison n°1 des ventes qui n''aboutissent pas. Soyez réaliste !

### ❌ Négliger la Présentation
Un bien mal présenté perd 10-20% de valeur perçue.

### ❌ Mauvaises Photos
Des photos sombres ou floues font fuir les acheteurs.

### ❌ Description Vague
"Bel appartement à vendre" n''attire personne. Soyez précis !

### ❌ Ne Pas Être Disponible
Si vous refusez les visites, vous ne vendrez jamais.

### ❌ Cacher les Défauts
La transparence crée la confiance et évite les problèmes.

## Conseils d''Expert

💡 **Meilleur moment pour vendre** : Printemps (mars-mai) et automne (septembre-novembre)

💡 **Premier prix** : Affichez un prix légèrement au-dessus de votre prix minimum pour pouvoir négocier

💡 **Urgence** : Si vous devez vendre vite, baissez le prix de 10-15%

💡 **Agence ou pas** : Sur TopAffaireImmo, vendez sans commission et gardez 2-3% !

## FAQ - Questions Fréquentes

### Dois-je passer par une agence ?
Non, TopAffaireImmo vous permet de vendre directement et d''économiser 2-3% de commission.

### Combien de temps faut-il pour vendre ?
En moyenne 3-6 mois avec un prix bien ajusté.

### Puis-je vendre si j''ai encore un crédit ?
Oui, le notaire gérera la mainlevée hypothécaire avec le paiement de la vente.

### Comment fixer le bon prix ?
Comparez les biens similaires vendus récemment dans votre quartier sur TopAffaireImmo.

### Dois-je faire des travaux avant de vendre ?
Pas nécessairement. Un nettoyage approfondi et de petites réparations suffisent souvent.

### Que faire si personne ne visite ?
Vérifiez votre prix, améliorez vos photos, enrichissez votre description.

### Puis-je vendre à un étranger ?
Oui, sans problème. Les étrangers peuvent acheter au Maroc.

### Comment éviter les arnaques ?
Passez toujours par un notaire, vérifiez l''identité de l''acheteur, n''acceptez pas d''espèces.

## Conclusion

Vendre un bien immobilier au Maroc demande de la préparation mais peut être simple et rapide avec la bonne stratégie. TopAffaireImmo vous accompagne gratuitement dans votre vente !

**Prêt à vendre ?** [Publiez votre annonce gratuitement sur TopAffaireImmo](/add-listing) et trouvez votre acheteur !

---

*Guide mis à jour en février 2026 - TopAffaireImmo*',
  
  '# كيفية بيع عقار في المغرب: دليل كامل

## مقدمة

يتطلب بيع عقار في المغرب استراتيجية جيدة للحصول على أفضل سعر في أقصر وقت. هذا الدليل يرافقك خطوة بخطوة.

## خطوات البيع السريع

### 1. تحضير العقار للبيع

**التنظيف والترتيب**:
- إزالة الطابع الشخصي من المساحات
- التنظيف العميق
- إزالة الفوضى من جميع الغرف
- إصلاح العيوب الصغيرة المرئية

### 2. تقدير السعر الصحيح

التقدير أمر حاسم للبيع السريع:

**متوسط الأسعار حسب المدينة (2026)**:
- الدار البيضاء وسط: 13,000-16,000 درهم/م²
- الرباط وسط: 11,000-14,000 درهم/م²
- مراكش كليز: 10,000-15,000 درهم/م²

⚠️ **تحذير**: السعر المرتفع جداً يبعد المشترين!

### 3. جمع الوثائق

**الوثائق الإلزامية**:
- ✅ الرسم العقاري (الأصلي)
- ✅ بطاقة الهوية الوطنية
- ✅ الضريبة السكنية المحدثة
- ✅ إيصالات رسوم الملكية المشتركة
- ✅ مخططات الشقة

---

*تم تحديث الدليل في فبراير 2026 - TopAffaireImmo*',
  
  'Guide complet pour vendre rapidement un bien immobilier au Maroc : estimation, annonce, visites, négociation. Vendez sans commission sur TopAffaireImmo.',
  'دليل كامل لبيع عقار بسرعة في المغرب: التقييم، الإعلان، الزيارات، التفاوض. بيع بدون عمولة على TopAffaireImmo.',
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  title_ar = EXCLUDED.title_ar,
  content_fr = EXCLUDED.content_fr,
  content_ar = EXCLUDED.content_ar,
  meta_description_fr = EXCLUDED.meta_description_fr,
  meta_description_ar = EXCLUDED.meta_description_ar,
  updated_at = NOW();

-- Note: Continue with guides 3, 4, and 5 in next batch due to size limits

COMMENT ON TABLE public.site_pages IS 'SEO guides for Morocco real estate - educational content for Google Morocco';
