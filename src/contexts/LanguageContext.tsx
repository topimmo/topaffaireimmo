import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.buy': 'Acheter',
    'nav.rent': 'Louer',
    'nav.agencies': 'Agences',
    'nav.advertise': 'Annoncer avec nous',
    'nav.addListing': 'Ajouter une annonce',
    'nav.login': 'Connexion',
    'nav.register': 'Inscription',
    'nav.dashboard': 'Tableau de bord',
    'nav.logout': 'Déconnexion',
    'nav.myListings': 'Mes annonces',
    'nav.advertising': 'Publicité',
    'nav.admin': 'Administration',
    
    // Hero
    'hero.title': 'Trouvez votre',
    'hero.titleHighlight': 'Propriété Idéale',
    'hero.subtitle': 'Découvrez des propriétés exceptionnelles à travers le Maroc. Que vous achetiez, louiez ou vendiez – nous sommes là pour vous aider.',
    'hero.forSale': 'À Vendre',
    'hero.forRent': 'À Louer',
    'hero.selectCity': 'Sélectionner une ville',
    'hero.propertyType': 'Type de bien',
    'hero.maxPrice': 'Prix max',
    'hero.search': 'Rechercher',
    
    // Property Types
    'property.apartment': 'Appartement',
    'property.house': 'Maison',
    'property.villa': 'Villa',
    'property.commercial': 'Commercial',
    'property.land': 'Terrain',
    
    // Property Card
    'property.bedrooms': 'Chambres',
    'property.bathrooms': 'Salles de bain',
    'property.area': 'm²',
    'property.forSale': 'À Vendre',
    'property.forRent': 'À Louer',
    'property.perMonth': '/mois',
    
    // Featured & Latest
    'featured.title': 'Propriétés en Vedette',
    'featured.subtitle': 'Sélection premium de nos meilleures annonces',
    'latest.title': 'Dernières Annonces',
    'latest.subtitle': 'Propriétés récemment ajoutées',
    'viewAll': 'Voir tout',
    
    // CTA Section
    'cta.title': 'Prêt à publier votre propriété ?',
    'cta.subtitle': 'Rejoignez des milliers de propriétaires et d\'agences qui font confiance à TopAffaireImmo',
    'cta.button': 'Publier une annonce',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.fullName': 'Nom complet',
    'auth.phone': 'Téléphone',
    'auth.loginButton': 'Se connecter',
    'auth.registerButton': 'S\'inscrire',
    'auth.noAccount': 'Pas de compte ?',
    'auth.haveAccount': 'Déjà un compte ?',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.orContinue': 'Ou continuer avec',
    
    // Auth Tabs
    'auth.phoneTab': 'Téléphone (SMS)',
    'auth.emailTab': 'Email',
    
    // Phone OTP
    'auth.phoneNumber': 'Numéro de téléphone',
    'auth.phonePlaceholder': '+212 6XX XXX XXX ou 06XX XXX XXX',
    'auth.phoneHint': 'Format: +212XXXXXXXXX, 06XXXXXXXX ou 07XXXXXXXX',
    'auth.sendCode': 'Envoyer le code',
    'auth.verifyCode': 'Vérifier',
    'auth.otpCode': 'Code de vérification',
    'auth.otpPlaceholder': '123456',
    'auth.otpHint': 'Code à 6 chiffres',
    'auth.codeSent': 'Code envoyé. Vérifiez vos SMS.',
    'auth.invalidCode': 'Code invalide. Réessayez.',
    'auth.resendCode': 'Renvoyer le code',
    'auth.backToPhone': 'Retour',
    'auth.sendingCode': 'Envoi en cours...',
    'auth.verifying': 'Vérification...',
    'auth.continue': 'Continuer',
    'auth.changePhone': 'Changer de numéro',
    'auth.enterPhoneTitle': 'Entrez votre numéro',
    'auth.verifyPhoneTitle': 'Vérifiez votre téléphone',
    'auth.sentTo': 'Code envoyé au',
    'auth.resendIn': 'Renvoyer dans',
    'auth.seconds': 'secondes',
    
    // Email Auth
    'auth.createAccount': 'Créer un compte',
    'auth.confirmationEmailSent': 'Un email de confirmation a été envoyé.',
    'auth.checkEmail': 'Vérifiez votre email pour le lien de confirmation',
    'auth.accountCreated': 'Compte créé avec succès!',
    
    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.myListings': 'Mes annonces',
    'dashboard.addNew': 'Ajouter une annonce',
    'dashboard.status': 'Statut',
    'dashboard.pending': 'En attente',
    'dashboard.approved': 'Approuvée',
    'dashboard.rejected': 'Refusée',
    'dashboard.inactive': 'Inactive',
    'dashboard.edit': 'Modifier',
    'dashboard.delete': 'Supprimer',
    'dashboard.noListings': 'Aucune annonce pour le moment',
    'dashboard.createFirst': 'Créez votre première annonce',
    
    // Add Listing
    'addListing.title': 'Ajouter une propriété',
    'addListing.subtitle': 'Remplissez les détails pour publier votre annonce',
    'addListing.transactionType': 'Type de transaction',
    'addListing.propertyType': 'Type de bien',
    'addListing.city': 'Ville',
    'addListing.neighborhood': 'Quartier',
    'addListing.selectNeighborhood': 'Sélectionner un quartier',
    'addListing.customNeighborhood': 'Autre quartier (si non listé)',
    'addListing.address': 'Adresse',
    'addListing.price': 'Prix (MAD)',
    'addListing.area': 'Surface (m²)',
    'addListing.bedrooms': 'Chambres',
    'addListing.bathrooms': 'Salles de bain',
    'addListing.title_fr': 'Titre (Français)',
    'addListing.title_ar': 'Titre (Arabe)',
    'addListing.description_fr': 'Description (Français)',
    'addListing.description_ar': 'Description (Arabe)',
    'addListing.images': 'Photos',
    'addListing.uploadImages': 'Télécharger des photos',
    'addListing.phone': 'Téléphone de contact',
    'addListing.submit': 'Publier l\'annonce',
    'addListing.success': 'Annonce soumise !',
    'addListing.successMessage': 'Votre annonce sera examinée et publiée sous 24h.',
    'addListing.loginRequired': 'Veuillez vous connecter pour publier une annonce',
    
    // Search Results
    'search.results': 'Résultats de recherche',
    'search.noResults': 'Aucun résultat trouvé',
    'search.filters': 'Filtres',
    
    // Footer
    'footer.about': 'À propos',
    'footer.contact': 'Contact',
    'footer.privacy': 'Confidentialité',
    'footer.terms': 'Conditions',
    'footer.rights': 'Tous droits réservés',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    
    // Advertising
    'advertising.title': 'Publicité',
    'advertising.loginRequired': 'Connectez-vous pour voir les options publicitaires',
    'advertising.loginMessage': 'Veuillez vous connecter ou créer un compte annonceur pour voir les options publicitaires.',
    'advertising.dashboard': 'Tableau de bord publicitaire',
    'advertising.myAds': 'Mes publicités',
    'advertising.newRequest': 'Nouvelle demande',
    'advertising.availableSlots': 'Emplacements disponibles',
    'advertising.slot': 'Emplacement',
    'advertising.page': 'Page',
    'advertising.position': 'Position',
    'advertising.size': 'Taille',
    'advertising.pricing': 'Tarification',
    'advertising.duration': 'Durée',
    'advertising.days': 'jours',
    'advertising.price': 'Prix',
    'advertising.companyName': 'Nom de l\'entreprise',
    'advertising.contactEmail': 'Email de contact',
    'advertising.contactPhone': 'Téléphone de contact',
    'advertising.selectSlot': 'Sélectionner un emplacement',
    'advertising.selectDuration': 'Sélectionner la durée',
    'advertising.bannerImage': 'Image de la bannière',
    'advertising.uploadBanner': 'Télécharger la bannière',
    'advertising.targetUrl': 'URL cible',
    'advertising.paymentProof': 'Preuve de paiement',
    'advertising.uploadPayment': 'Télécharger la preuve de paiement',
    'advertising.submitRequest': 'Soumettre la demande',
    'advertising.requestSubmitted': 'Demande soumise!',
    'advertising.requestMessage': 'Votre demande publicitaire a été soumise. Notre équipe l\'examinera sous 24-48h.',
    'advertising.status': 'Statut',
    'advertising.pending': 'En attente',
    'advertising.approved': 'Approuvée',
    'advertising.active': 'Active',
    'advertising.rejected': 'Refusée',
    'advertising.expired': 'Expirée',
    'advertising.startDate': 'Date de début',
    'advertising.endDate': 'Date de fin',
    'advertising.noAds': 'Aucune publicité pour le moment',
    'advertising.createFirst': 'Créez votre première campagne publicitaire',
    'advertising.bankTransfer': 'Virement bancaire',
    'advertising.bankDetails': 'Coordonnées bancaires',
    'advertising.7days': '7 jours - 800 MAD',
    'advertising.15days': '15 jours - 1 400 MAD',
    'advertising.30days': '30 jours - 2 500 MAD',
    
    // Admin
    'admin.title': 'Administration',
    'admin.bannerRequests': 'Demandes de bannières',
    'admin.approve': 'Approuver',
    'admin.reject': 'Rejeter',
    'admin.viewPayment': 'Voir le paiement',
    'admin.viewBanner': 'Voir la bannière',
    'admin.notes': 'Notes',
    
    // PWA Install
    'pwa.install': 'Installer l\'app',
    'pwa.installPrompt': 'Installer TopAffaireImmo sur votre appareil',
    'pwa.installDescription': 'Accédez rapidement à TopAffaireImmo depuis votre écran d\'accueil',
    'pwa.installButton': 'Installer',
    'pwa.installLater': 'Plus tard',
    'pwa.iosInstructions': 'Sur iPhone: appuyez sur le bouton Partager puis "Ajouter à l\'écran d\'accueil"',
    'pwa.iosTitle': 'Comment installer sur iOS',
    
    // Push Notifications
    'push.title': 'Notifications',
    'push.enable': 'Activer les notifications',
    'push.disable': 'Désactiver les notifications',
    'push.enabled': 'Activé',
    'push.disabled': 'Désactivé',
    'push.notSupported': 'Notifications non supportées',
    'push.permissionDenied': 'Permission refusée',
    'push.description': 'Recevez des notifications pour les nouvelles propriétés et mises à jour',
    'push.promptTitle': 'Activer les notifications push',
    'push.promptMessage': 'Restez informé des nouvelles propriétés qui correspondent à vos critères de recherche',
    'push.promptAllow': 'Autoriser',
    'push.promptCancel': 'Pas maintenant',
    'push.successEnabled': 'Notifications activées avec succès',
    'push.successDisabled': 'Notifications désactivées',
    'push.errorEnable': 'Erreur lors de l\'activation des notifications',
    'push.errorDisable': 'Erreur lors de la désactivation des notifications',
    
    // FAQ
    'faq.title': 'Questions Fréquentes',
    
    // General FAQ
    'faq.general.q1': 'Comment fonctionne TopAffaireImmo ?',
    'faq.general.a1': 'TopAffaireImmo est une plateforme immobilière qui connecte acheteurs, vendeurs et locataires au Maroc. Vous pouvez rechercher des propriétés par ville, quartier, type et budget. Les annonceurs publient leurs biens et vous pouvez les contacter directement.',
    'faq.general.q2': 'Est-ce que TopAffaireImmo est gratuit ?',
    'faq.general.a2': 'La consultation des annonces est entièrement gratuite pour les visiteurs. Les annonceurs peuvent publier des propriétés avec différentes options tarifaires selon leurs besoins de visibilité.',
    'faq.general.q3': 'Dans quelles villes puis-je trouver des propriétés ?',
    'faq.general.a3': 'TopAffaireImmo couvre toutes les grandes villes du Maroc : Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès, Meknès, Oujda et plus de 50 autres villes à travers le royaume.',
    'faq.general.q4': 'Comment contacter un vendeur ou propriétaire ?',
    'faq.general.a4': 'Sur chaque annonce, vous trouverez un bouton \'Contacter\' qui vous permet d\'envoyer un message directement à l\'annonceur ou de voir son numéro de téléphone pour le contacter.',
    'faq.general.q5': 'Puis-je publier ma propre annonce immobilière ?',
    'faq.general.a5': 'Oui ! Créez un compte gratuit, puis accédez à votre tableau de bord pour publier une nouvelle annonce. Ajoutez des photos, une description détaillée, le prix et les caractéristiques de votre bien.',
    'faq.general.q6': 'Les annonces sont-elles vérifiées ?',
    'faq.general.a6': 'Toutes les annonces sont modérées par notre équipe avant publication pour assurer la qualité et éviter les fraudes. Nous vérifions également les informations des annonceurs.',
    
    // Buying FAQ
    'faq.buying.q1': 'Quels types de propriétés puis-je acheter au Maroc ?',
    'faq.buying.a1': 'Vous pouvez acheter des appartements, maisons, villas, riads, terrains, locaux commerciaux et propriétés de luxe dans toutes les régions du Maroc.',
    'faq.buying.q2': 'Quel est le processus d\'achat immobilier au Maroc ?',
    'faq.buying.a2': 'Le processus inclut : recherche du bien, négociation du prix, signature d\'un compromis de vente, vérification des documents juridiques, paiement chez le notaire et signature de l\'acte définitif.',
    'faq.buying.q3': 'Un étranger peut-il acheter une propriété au Maroc ?',
    'faq.buying.a3': 'Oui, les étrangers peuvent acheter librement des biens immobiliers au Maroc, sauf dans certaines zones agricoles. Les mêmes droits et procédures s\'appliquent que pour les citoyens marocains.',
    'faq.buying.q4': 'Quels sont les frais d\'achat immobilier ?',
    'faq.buying.a4': 'Les frais incluent les droits d\'enregistrement (2,5% à 5%), les honoraires du notaire (environ 1%), les frais d\'agence (2% à 3%), et les taxes selon le type de bien.',
    
    // Renting FAQ
    'faq.renting.q1': 'Comment louer une propriété au Maroc ?',
    'faq.renting.a1': 'Recherchez une propriété à louer, contactez le propriétaire ou l\'agence, visitez le bien, négociez les conditions, signez un contrat de bail et versez le dépôt de garantie et le premier loyer.',
    'faq.renting.q2': 'Quel est le montant du dépôt de garantie ?',
    'faq.renting.a2': 'Le dépôt de garantie est généralement équivalent à 1 ou 2 mois de loyer. Il est restitué à la fin du bail si le logement est rendu en bon état.',
    'faq.renting.q3': 'Quelle est la durée minimale d\'un bail au Maroc ?',
    'faq.renting.a3': 'Pour les locations à usage d\'habitation principale, la durée minimale est d\'un an renouvelable. Pour les locations meublées ou saisonnières, elle peut être plus courte.',
    'faq.renting.q4': 'Quels documents sont nécessaires pour louer ?',
    'faq.renting.a4': 'Vous devez fournir : pièce d\'identité, justificatif de revenus (bulletins de salaire ou attestation d\'emploi), et parfois un garant ou caution bancaire.',
    
    // City FAQ
    'faq.city.q1': 'Quel est le prix moyen d\'un appartement à {city} ?',
    'faq.city.a1': 'Les prix varient selon les quartiers et la taille. À {city}, comptez en moyenne entre 8 000 et 15 000 MAD/m² pour un appartement. Les quartiers résidentiels premium peuvent dépasser 20 000 MAD/m².',
    'faq.city.q2': 'Quels sont les meilleurs quartiers pour vivre à {city} ?',
    'faq.city.a2': 'Les quartiers les plus prisés à {city} offrent un bon équilibre entre qualité de vie, commodités et accessibilité. Consultez nos guides de quartiers pour découvrir les spécificités de chaque zone.',
    'faq.city.q3': 'Comment trouver une villa à vendre à {city} ?',
    'faq.city.a3': 'Utilisez nos filtres de recherche pour sélectionner "{city}", type "Villa" et "À vendre". Vous pouvez aussi affiner par budget, nombre de chambres et quartier pour trouver la villa idéale.',
    'faq.city.q4': 'Y a-t-il des agences immobilières partenaires à {city} ?',
    'faq.city.a4': 'Oui, TopAffaireImmo travaille avec plus de 200 agences immobilières à travers le Maroc, dont plusieurs basées à {city}. Nos partenaires sont vérifiés et professionnels.',
  },
  ar: {
    // Navigation
    'nav.buy': 'شراء',
    'nav.rent': 'إيجار',
    'nav.agencies': 'الوكالات',
    'nav.advertise': 'أعلن معنا',
    'nav.addListing': 'إضافة إعلان',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'إنشاء حساب',
    'nav.dashboard': 'لوحة التحكم',
    'nav.logout': 'تسجيل الخروج',
    'nav.myListings': 'إعلاناتي',
    'nav.advertising': 'الإعلانات',
    'nav.admin': 'الإدارة',
    
    // Hero
    'hero.title': 'اعثر على',
    'hero.titleHighlight': 'عقارك المثالي',
    'hero.subtitle': 'اكتشف عقارات استثنائية في جميع أنحاء المغرب. سواء كنت تشتري أو تستأجر أو تبيع – نحن هنا لمساعدتك.',
    'hero.forSale': 'للبيع',
    'hero.forRent': 'للإيجار',
    'hero.selectCity': 'اختر مدينة',
    'hero.propertyType': 'نوع العقار',
    'hero.maxPrice': 'السعر الأقصى',
    'hero.search': 'بحث',
    
    // Property Types
    'property.apartment': 'شقة',
    'property.house': 'منزل',
    'property.villa': 'فيلا',
    'property.commercial': 'تجاري',
    'property.land': 'أرض',
    
    // Property Card
    'property.bedrooms': 'غرف النوم',
    'property.bathrooms': 'الحمامات',
    'property.area': 'م²',
    'property.forSale': 'للبيع',
    'property.forRent': 'للإيجار',
    'property.perMonth': '/شهر',
    
    // Featured & Latest
    'featured.title': 'عقارات مميزة',
    'featured.subtitle': 'مجموعة مختارة من أفضل إعلاناتنا',
    'latest.title': 'أحدث الإعلانات',
    'latest.subtitle': 'عقارات أضيفت مؤخراً',
    'viewAll': 'عرض الكل',
    
    // CTA Section
    'cta.title': 'هل أنت مستعد لنشر عقارك؟',
    'cta.subtitle': 'انضم إلى آلاف المالكين والوكالات الذين يثقون في TopAffaireImmo',
    'cta.button': 'نشر إعلان',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.fullName': 'الاسم الكامل',
    'auth.phone': 'الهاتف',
    'auth.loginButton': 'دخول',
    'auth.registerButton': 'تسجيل',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.haveAccount': 'لديك حساب بالفعل؟',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.orContinue': 'أو المتابعة مع',
    
    // Auth Tabs
    'auth.phoneTab': 'الهاتف (SMS)',
    'auth.emailTab': 'البريد الإلكتروني',
    
    // Phone OTP
    'auth.phoneNumber': 'رقم الهاتف',
    'auth.phonePlaceholder': '+212 6XX XXX XXX أو 06XX XXX XXX',
    'auth.phoneHint': 'التنسيق: +212XXXXXXXXX، 06XXXXXXXX أو 07XXXXXXXX',
    'auth.sendCode': 'إرسال الرمز',
    'auth.verifyCode': 'تحقق',
    'auth.otpCode': 'رمز التحقق',
    'auth.otpPlaceholder': '123456',
    'auth.otpHint': 'رمز مكون من 6 أرقام',
    'auth.codeSent': 'تم إرسال الرمز. تحقق من رسائلك النصية.',
    'auth.invalidCode': 'رمز غير صالح. حاول مرة أخرى.',
    'auth.resendCode': 'إعادة إرسال الرمز',
    'auth.backToPhone': 'رجوع',
    'auth.sendingCode': 'جاري الإرسال...',
    'auth.verifying': 'جاري التحقق...',
    'auth.continue': 'متابعة',
    'auth.changePhone': 'تغيير الرقم',
    'auth.enterPhoneTitle': 'أدخل رقمك',
    'auth.verifyPhoneTitle': 'تحقق من هاتفك',
    'auth.sentTo': 'تم إرسال الرمز إلى',
    'auth.resendIn': 'إعادة الإرسال خلال',
    'auth.seconds': 'ثانية',
    
    // Email Auth
    'auth.createAccount': 'إنشاء حساب',
    'auth.confirmationEmailSent': 'تم إرسال بريد إلكتروني للتأكيد.',
    'auth.checkEmail': 'تحقق من بريدك الإلكتروني للحصول على رابط التأكيد',
    'auth.accountCreated': 'تم إنشاء الحساب بنجاح!',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.myListings': 'إعلاناتي',
    'dashboard.addNew': 'إضافة إعلان',
    'dashboard.status': 'الحالة',
    'dashboard.pending': 'قيد الانتظار',
    'dashboard.approved': 'معتمد',
    'dashboard.rejected': 'مرفوض',
    'dashboard.inactive': 'غير نشط',
    'dashboard.edit': 'تعديل',
    'dashboard.delete': 'حذف',
    'dashboard.noListings': 'لا توجد إعلانات حتى الآن',
    'dashboard.createFirst': 'أنشئ إعلانك الأول',
    
    // Add Listing
    'addListing.title': 'إضافة عقار',
    'addListing.subtitle': 'املأ التفاصيل لنشر إعلانك',
    'addListing.transactionType': 'نوع المعاملة',
    'addListing.propertyType': 'نوع العقار',
    'addListing.city': 'المدينة',
    'addListing.neighborhood': 'الحي',
    'addListing.selectNeighborhood': 'اختر الحي',
    'addListing.customNeighborhood': 'حي آخر (إذا لم يكن مدرجاً)',
    'addListing.address': 'العنوان',
    'addListing.price': 'السعر (درهم)',
    'addListing.area': 'المساحة (م²)',
    'addListing.bedrooms': 'غرف النوم',
    'addListing.bathrooms': 'الحمامات',
    'addListing.title_fr': 'العنوان (فرنسي)',
    'addListing.title_ar': 'العنوان (عربي)',
    'addListing.description_fr': 'الوصف (فرنسي)',
    'addListing.description_ar': 'الوصف (عربي)',
    'addListing.images': 'الصور',
    'addListing.uploadImages': 'تحميل الصور',
    'addListing.phone': 'هاتف التواصل',
    'addListing.submit': 'نشر الإعلان',
    'addListing.success': 'تم إرسال الإعلان!',
    'addListing.successMessage': 'سيتم مراجعة إعلانك ونشره خلال 24 ساعة.',
    'addListing.loginRequired': 'يرجى تسجيل الدخول لنشر إعلان',
    
    // Search Results
    'search.results': 'نتائج البحث',
    'search.noResults': 'لم يتم العثور على نتائج',
    'search.filters': 'الفلاتر',
    
    // Footer
    'footer.about': 'حول',
    'footer.contact': 'اتصل بنا',
    'footer.privacy': 'الخصوصية',
    'footer.terms': 'الشروط',
    'footer.rights': 'جميع الحقوق محفوظة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    
    // Advertising
    'advertising.title': 'الإعلانات',
    'advertising.loginRequired': 'سجل الدخول لعرض خيارات الإعلان',
    'advertising.loginMessage': 'يرجى تسجيل الدخول أو إنشاء حساب معلن لعرض خيارات الإعلان.',
    'advertising.dashboard': 'لوحة تحكم الإعلانات',
    'advertising.myAds': 'إعلاناتي',
    'advertising.newRequest': 'طلب جديد',
    'advertising.availableSlots': 'المواقع المتاحة',
    'advertising.slot': 'الموقع',
    'advertising.page': 'الصفحة',
    'advertising.position': 'الموضع',
    'advertising.size': 'الحجم',
    'advertising.pricing': 'التسعير',
    'advertising.duration': 'المدة',
    'advertising.days': 'أيام',
    'advertising.price': 'السعر',
    'advertising.companyName': 'اسم الشركة',
    'advertising.contactEmail': 'البريد الإلكتروني',
    'advertising.contactPhone': 'رقم الهاتف',
    'advertising.selectSlot': 'اختر موقعاً',
    'advertising.selectDuration': 'اختر المدة',
    'advertising.bannerImage': 'صورة البانر',
    'advertising.uploadBanner': 'رفع البانر',
    'advertising.targetUrl': 'رابط الوجهة',
    'advertising.paymentProof': 'إثبات الدفع',
    'advertising.uploadPayment': 'رفع إثبات الدفع',
    'advertising.submitRequest': 'إرسال الطلب',
    'advertising.requestSubmitted': 'تم إرسال الطلب!',
    'advertising.requestMessage': 'تم إرسال طلبك الإعلاني. سيقوم فريقنا بمراجعته خلال 24-48 ساعة.',
    'advertising.status': 'الحالة',
    'advertising.pending': 'قيد الانتظار',
    'advertising.approved': 'موافق عليه',
    'advertising.active': 'نشط',
    'advertising.rejected': 'مرفوض',
    'advertising.expired': 'منتهي',
    'advertising.startDate': 'تاريخ البدء',
    'advertising.endDate': 'تاريخ الانتهاء',
    'advertising.noAds': 'لا توجد إعلانات حتى الآن',
    'advertising.createFirst': 'أنشئ حملتك الإعلانية الأولى',
    'advertising.bankTransfer': 'تحويل بنكي',
    'advertising.bankDetails': 'تفاصيل الحساب البنكي',
    'advertising.7days': '7 أيام - 800 درهم',
    'advertising.15days': '15 يوم - 1,400 درهم',
    'advertising.30days': '30 يوم - 2,500 درهم',
    
    // Admin
    'admin.title': 'الإدارة',
    'admin.bannerRequests': 'طلبات البانر',
    'admin.approve': 'موافقة',
    'admin.reject': 'رفض',
    'admin.viewPayment': 'عرض الدفع',
    'admin.viewBanner': 'عرض البانر',
    'admin.notes': 'ملاحظات',
    
    // PWA Install
    'pwa.install': 'تثبيت التطبيق',
    'pwa.installPrompt': 'تثبيت TopAffaireImmo على جهازك',
    'pwa.installDescription': 'الوصول السريع إلى TopAffaireImmo من شاشتك الرئيسية',
    'pwa.installButton': 'تثبيت',
    'pwa.installLater': 'لاحقاً',
    'pwa.iosInstructions': 'في الآيفون: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"',
    'pwa.iosTitle': 'كيفية التثبيت على iOS',
    
    // Push Notifications
    'push.title': 'الإشعارات',
    'push.enable': 'تفعيل الإشعارات',
    'push.disable': 'إيقاف الإشعارات',
    'push.enabled': 'مفعّل',
    'push.disabled': 'معطّل',
    'push.notSupported': 'الإشعارات غير مدعومة',
    'push.permissionDenied': 'الإذن مرفوض',
    'push.description': 'احصل على إشعارات للعقارات الجديدة والتحديثات',
    'push.promptTitle': 'تفعيل إشعارات الدفع',
    'push.promptMessage': 'ابق على اطلاع بالعقارات الجديدة التي تطابق معايير بحثك',
    'push.promptAllow': 'السماح',
    'push.promptCancel': 'ليس الآن',
    'push.successEnabled': 'تم تفعيل الإشعارات بنجاح',
    'push.successDisabled': 'تم إيقاف الإشعارات',
    'push.errorEnable': 'خطأ في تفعيل الإشعارات',
    'push.errorDisable': 'خطأ في إيقاف الإشعارات',
    
    // FAQ
    'faq.title': 'الأسئلة الشائعة',
    
    // General FAQ
    'faq.general.q1': 'كيف يعمل TopAffaireImmo؟',
    'faq.general.a1': 'TopAffaireImmo هو منصة عقارية تربط المشترين والبائعين والمستأجرين في المغرب. يمكنك البحث عن العقارات حسب المدينة والحي والنوع والميزانية. ينشر المعلنون عقاراتهم ويمكنك الاتصال بهم مباشرة.',
    'faq.general.q2': 'هل TopAffaireImmo مجاني؟',
    'faq.general.a2': 'تصفح الإعلانات مجاني تماماً للزوار. يمكن للمعلنين نشر العقارات بخيارات تسعير مختلفة حسب احتياجاتهم للظهور.',
    'faq.general.q3': 'في أي مدن يمكنني العثور على عقارات؟',
    'faq.general.a3': 'يغطي TopAffaireImmo جميع المدن الكبرى في المغرب: الدار البيضاء، الرباط، مراكش، طنجة، أكادير، فاس، مكناس، وجدة وأكثر من 50 مدينة أخرى في جميع أنحاء المملكة.',
    'faq.general.q4': 'كيف أتواصل مع بائع أو مالك؟',
    'faq.general.a4': 'في كل إعلان، ستجد زر "اتصال" يسمح لك بإرسال رسالة مباشرة إلى المعلن أو رؤية رقم هاتفه للاتصال به.',
    'faq.general.q5': 'هل يمكنني نشر إعلاني العقاري الخاص؟',
    'faq.general.a5': 'نعم! أنشئ حساباً مجانياً، ثم انتقل إلى لوحة التحكم لنشر إعلان جديد. أضف الصور ووصفاً تفصيلياً والسعر ومواصفات عقارك.',
    'faq.general.q6': 'هل يتم التحقق من الإعلانات؟',
    'faq.general.a6': 'يتم مراجعة جميع الإعلانات من قبل فريقنا قبل النشر لضمان الجودة وتجنب الاحتيال. كما نتحقق من معلومات المعلنين.',
    
    // Buying FAQ
    'faq.buying.q1': 'ما أنواع العقارات التي يمكنني شراؤها في المغرب؟',
    'faq.buying.a1': 'يمكنك شراء شقق ومنازل وفيلات ورياضات وأراضي ومحلات تجارية وعقارات فاخرة في جميع مناطق المغرب.',
    'faq.buying.q2': 'ما هي عملية شراء العقارات في المغرب؟',
    'faq.buying.a2': 'تشمل العملية: البحث عن العقار، التفاوض على السعر، توقيع وعد البيع، التحقق من المستندات القانونية، الدفع عند الموثق وتوقيع العقد النهائي.',
    'faq.buying.q3': 'هل يمكن للأجانب شراء عقار في المغرب؟',
    'faq.buying.a3': 'نعم، يمكن للأجانب شراء العقارات بحرية في المغرب، باستثناء بعض المناطق الزراعية. تنطبق نفس الحقوق والإجراءات كما هو الحال بالنسبة للمواطنين المغاربة.',
    'faq.buying.q4': 'ما هي رسوم شراء العقارات؟',
    'faq.buying.a4': 'تشمل الرسوم: رسوم التسجيل (2.5٪ إلى 5٪)، أتعاب الموثق (حوالي 1٪)، رسوم الوكالة (2٪ إلى 3٪)، والضرائب حسب نوع العقار.',
    
    // Renting FAQ
    'faq.renting.q1': 'كيف أستأجر عقاراً في المغرب؟',
    'faq.renting.a1': 'ابحث عن عقار للإيجار، اتصل بالمالك أو الوكالة، قم بزيارة العقار، تفاوض على الشروط، وقع عقد الإيجار وادفع الوديعة والإيجار الأول.',
    'faq.renting.q2': 'ما هو مبلغ الوديعة؟',
    'faq.renting.a2': 'تعادل الوديعة عادةً شهراً أو شهرين من الإيجار. يتم إرجاعها في نهاية الإيجار إذا تم إعادة المسكن بحالة جيدة.',
    'faq.renting.q3': 'ما هي المدة الدنيا للإيجار في المغرب؟',
    'faq.renting.a3': 'بالنسبة للإيجار للسكن الرئيسي، الحد الأدنى للمدة هو سنة واحدة قابلة للتجديد. للإيجارات المفروشة أو الموسمية، يمكن أن تكون أقصر.',
    'faq.renting.q4': 'ما هي المستندات اللازمة للإيجار؟',
    'faq.renting.a4': 'يجب تقديم: بطاقة الهوية، إثبات الدخل (قسائم الراتب أو شهادة عمل)، وأحياناً ضامن أو ضمان بنكي.',
    
    // City FAQ
    'faq.city.q1': 'ما هو متوسط سعر الشقة في {city}؟',
    'faq.city.a1': 'تختلف الأسعار حسب الأحياء والمساحة. في {city}، احسب في المتوسط بين 8,000 و 15,000 درهم/م² للشقة. يمكن أن تتجاوز الأحياء السكنية الراقية 20,000 درهم/م².',
    'faq.city.q2': 'ما هي أفضل الأحياء للعيش في {city}؟',
    'faq.city.a2': 'تقدم الأحياء الأكثر شعبية في {city} توازناً جيداً بين جودة الحياة والمرافق وسهولة الوصول. راجع أدلة الأحياء لدينا لاكتشاف خصوصيات كل منطقة.',
    'faq.city.q3': 'كيف أجد فيلا للبيع في {city}؟',
    'faq.city.a3': 'استخدم مرشحات البحث لدينا لتحديد "{city}"، النوع "فيلا" و "للبيع". يمكنك أيضاً التحسين حسب الميزانية وعدد الغرف والحي للعثور على الفيلا المثالية.',
    'faq.city.q4': 'هل هناك وكالات عقارية شريكة في {city}؟',
    'faq.city.a4': 'نعم، يعمل TopAffaireImmo مع أكثر من 200 وكالة عقارية في جميع أنحاء المغرب، بما في ذلك العديد منها في {city}. شركاؤنا محققون ومحترفون.',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
