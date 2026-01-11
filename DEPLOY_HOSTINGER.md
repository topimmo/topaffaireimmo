# 🚀 Guide de Déploiement Hostinger - TopAffaireImmo

## Prérequis

- Compte Hostinger avec hébergement Web activé
- Accès au panneau de contrôle hPanel
- Accès FTP ou File Manager
- Projet Supabase configuré avec toutes les migrations appliquées

---

## 📋 Étape 1: Préparation du Build

### 1.1 Vérifier les variables d'environnement

Créez un fichier `.env.production` à la racine du projet:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

**⚠️ Important:** Ne jamais exposer `SUPABASE_SERVICE_KEY` côté client!

### 1.2 Générer le Build

```bash
# Installer les dépendances
npm install

# Créer le build de production
npm run build
```

Le dossier `dist/` sera créé avec tous les fichiers optimisés.

### 1.3 Vérifier le build

```bash
# Optionnel: tester localement
npm run preview
```

---

## 📤 Étape 2: Upload sur Hostinger

### Option A: Via File Manager (Recommandé)

1. Connectez-vous à **hPanel** → **File Manager**
2. Naviguez vers `public_html`
3. **Supprimez** tout le contenu existant (sauf si vous avez d'autres sites)
4. Cliquez sur **Upload**
5. Sélectionnez **tous les fichiers** du dossier `dist/`
6. Attendez la fin de l'upload

### Option B: Via FTP

1. Utilisez FileZilla ou un client FTP similaire
2. Connectez-vous avec vos identifiants FTP Hostinger
3. Naviguez vers `/public_html/`
4. Uploadez tout le contenu de `dist/`

### Option C: Via SSH (Premium/Business)

```bash
# Se connecter en SSH
ssh u123456789@votre-domaine.com

# Naviguer vers public_html
cd public_html

# Supprimer l'ancien contenu
rm -rf *

# Uploader via rsync (depuis votre machine locale)
rsync -avz --delete dist/ u123456789@votre-domaine.com:~/public_html/
```

---

## ⚙️ Étape 3: Configuration du Serveur

### 3.1 Fichier .htaccess

Le fichier `.htaccess` est déjà inclus dans `public/.htaccess`. Il sera copié dans `dist/` lors du build.

**Fonctionnalités incluses:**
- ✅ Routage SPA (React Router)
- ✅ Redirection HTTPS
- ✅ Compression Gzip
- ✅ Cache des assets statiques (1 an)
- ✅ Headers de sécurité
- ✅ Protection contre les attaques courantes

### 3.2 Vérification du .htaccess

Si le fichier n'est pas présent après l'upload:

1. Créez-le manuellement dans `public_html`
2. Copiez le contenu de `public/.htaccess`
3. Assurez-vous que le fichier est bien visible (les fichiers commençant par `.` peuvent être cachés)

---

## 🔒 Étape 4: Configuration SSL (HTTPS)

### Via hPanel:

1. hPanel → **SSL**
2. Cliquez sur **Installer SSL**
3. Sélectionnez le domaine
4. Attendez l'activation (peut prendre jusqu'à 24h)

### Vérification:

```bash
# Tester HTTPS
curl -I https://votre-domaine.com
```

---

## 🌐 Étape 5: Configuration DNS (Si nouveau domaine)

### Pointage vers Hostinger:

1. hPanel → **Domaines** → **DNS Zone**
2. Vérifiez que les enregistrements A pointent vers votre IP Hostinger
3. Si vous utilisez un domaine externe:
   - Modifiez les nameservers chez votre registrar
   - OU ajoutez un enregistrement A vers l'IP Hostinger

---

## ✅ Étape 6: Tests Finaux

### 6.1 Tests Fonctionnels

- [ ] Page d'accueil charge correctement
- [ ] Navigation entre les pages fonctionne (pas d'erreur 404)
- [ ] Inscription utilisateur fonctionne
- [ ] Connexion utilisateur fonctionne
- [ ] Création d'annonce immobilière (compte real_estate)
- [ ] Création de bannière publicitaire (compte commercial)
- [ ] Panel Admin accessible (compte admin)
- [ ] Mot de passe oublié fonctionne
- [ ] Upload d'images fonctionne

### 6.2 Tests Techniques

- [ ] Pas d'erreurs dans la console (F12)
- [ ] HTTPS actif (cadenas vert)
- [ ] Assets chargés correctement
- [ ] Pas d'erreurs CORS
- [ ] Temps de chargement < 3s

### 6.3 Test des Rôles

**Compte Real Estate (Immobilier):**
- Peut créer des annonces immobilières
- Voit le Dashboard immobilier
- N'a PAS accès au Dashboard commercial
- N'a PAS accès au Panel Admin

**Compte Commercial (Publicités):**
- Peut créer des bannières publicitaires
- Voit le Dashboard commercial
- N'a PAS accès au Dashboard immobilier
- N'a PAS accès au Panel Admin

**Compte Admin:**
- Accès à toutes les sections
- Peut approuver/rejeter annonces
- Peut approuver/rejeter bannières
- Peut gérer les utilisateurs

---

## 🔧 Dépannage

### Erreur 404 sur les routes

**Cause:** Le serveur ne gère pas le routage SPA.

**Solution:**
1. Vérifiez que `.htaccess` est présent
2. Activez `mod_rewrite` (contact support Hostinger)

### Erreurs CORS avec Supabase

**Cause:** L'URL du site n'est pas autorisée dans Supabase.

**Solution:**
1. Dashboard Supabase → Authentication → URL Configuration
2. Ajoutez votre domaine dans "Site URL" et "Redirect URLs"

### Images/Assets ne se chargent pas

**Cause:** Chemins incorrects ou cache.

**Solution:**
1. Videz le cache du navigateur
2. Vérifiez que les chemins commencent par `/` et non `./`

### Connexion Supabase échoue

**Cause:** Variables d'environnement incorrectes.

**Solution:**
1. Vérifiez `VITE_SUPABASE_URL` dans le build
2. Vérifiez `VITE_SUPABASE_ANON_KEY` dans le build
3. Reconstruisez avec les bonnes valeurs

---

## 📊 Configuration Supabase

### Variables requises côté client:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### URL à autoriser dans Supabase:

1. Dashboard Supabase → Authentication → URL Configuration
2. **Site URL:** `https://votre-domaine.com`
3. **Redirect URLs:** 
   - `https://votre-domaine.com/`
   - `https://votre-domaine.com/reset-password`
   - `https://votre-domaine.com/login`

---

## 🎯 Checklist de Déploiement

- [ ] Build généré sans erreurs
- [ ] Fichiers uploadés dans public_html
- [ ] .htaccess présent et configuré
- [ ] SSL activé
- [ ] DNS configuré
- [ ] Supabase URLs autorisées
- [ ] Tests fonctionnels passés
- [ ] Tests des rôles passés
- [ ] Pas d'erreurs console

---

## 📞 Support

- **Hostinger:** [support.hostinger.com](https://support.hostinger.com)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)

---

*Dernière mise à jour: $(date)*
