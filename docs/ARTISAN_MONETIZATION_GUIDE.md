# Artisan Onboarding & Monetization System - Guide Complet

## 🎯 Vue d'Ensemble / نظرة عامة

Ce document explique le système de monétisation pour les artisans (prestataires de services) sur TopAffaireImmo.

This document explains the monetization system for artisans (service providers) on TopAffaireImmo.

---

## 📋 Table des Matières / جدول المحتويات

1. [Architecture Système / بنية النظام](#architecture)
2. [Modèle de Données / نموذج البيانات](#data-model)
3. [Sécurité RLS / أمان RLS](#security)
4. [Flux Utilisateur / تدفق المستخدم](#user-flows)
5. [Configuration Admin / إعدادات المسؤول](#admin-config)
6. [Traductions AR/FR / الترجمات](#translations)

---

## <a name="architecture"></a>🏗️ Architecture Système

### Tables Principales / الجداول الرئيسية

```
cities                      -- Villes marocaines / المدن المغربية
neighborhoods               -- Quartiers par ville / أحياء المدينة
service_categories          -- Catégories de service / فئات الخدمات
artisan_profiles           -- Profils des artisans / ملفات الحرفيين
wallets                    -- Portefeuilles MAD / محافظ بالدرهم
wallet_transactions        -- Historique / سجل المعاملات
contact_access_passes      -- Passes d'accès temporaires / تصاريح الوصول
platform_settings          -- Configuration globale / الإعدادات العامة
```

### Fonctions RPC Sécurisées / وظائف RPC الآمنة

```sql
-- Gestion Portefeuille / إدارة المحفظة
ensure_wallet_exists(user_id)           -- Créer si manquant / إنشاء إذا كان مفقودًا
get_my_wallet_balance()                 -- Consulter solde / الاطلاع على الرصيد
admin_topup_wallet(user_id, amount)     -- Recharge admin / شحن من المسؤول

-- Gestion Artisan / إدارة الحرفي
create_my_artisan_profile(...)          -- Créer profil / إنشاء الملف
toggle_artisan_boost(profile_id, bool)  -- Activer boost / تفعيل الرفع

-- Accès Contact / الوصول إلى الاتصال
check_contact_access(...)               -- Vérifier accès / التحقق من الوصول
debit_wallet_for_contact(...)           -- Payer pour révéler / الدفع للكشف
```

---

## <a name="data-model"></a>📊 Modèle de Données

### artisan_profiles (Migration 091)

**Avant (cities INTEGER[]):**
```sql
cities INTEGER[] -- Multiple villes / مدن متعددة
```

**Après (city_id + neighborhood_ids):**
```sql
city_id INTEGER NOT NULL              -- Ville principale / المدينة الرئيسية
neighborhood_ids INTEGER[] DEFAULT '{}' -- Quartiers optionnels / أحياء اختيارية
```

**Raison du changement / سبب التغيير:**
- 🎯 Un artisan opère dans UNE ville principale
- 🏘️ Il peut servir plusieurs quartiers de cette ville
- 🔍 Meilleure recherche géographique
- 💡 Support du scope "quartiers" dans les passes d'accès

### contact_access_passes (Scope Quartiers)

```sql
CREATE TABLE contact_access_passes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  city_id INTEGER NOT NULL,              -- Ville requise / مدينة مطلوبة
  service_category_id UUID NOT NULL,     -- Catégorie requise / فئة مطلوبة
  neighborhood_ids INTEGER[] DEFAULT NULL, -- Scope optionnel / نطاق اختياري
  expires_at TIMESTAMPTZ NOT NULL,       -- Expiration (12h) / انتهاء الصلاحية
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Règles du Scope / قواعد النطاق:**

1. `neighborhood_ids = NULL` → Accès TOUTE LA VILLE / الوصول إلى المدينة بأكملها
2. `neighborhood_ids = [1, 2, 3]` → Accès aux quartiers 1, 2, 3 uniquement / الوصول للأحياء 1، 2، 3 فقط
3. Toujours limité à `city_id` + `service_category_id` / دائمًا محدود بالمدينة والفئة

---

## <a name="security"></a>🔒 Sécurité RLS (Row Level Security)

### artisan_profiles - Politiques RLS

```sql
-- 1. Public : Voir seulement actifs + vérifiés
CREATE POLICY "Public can read active artisan profiles"
  ON artisan_profiles FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);

-- 2. Artisan : Voir son propre profil (même non vérifié)
CREATE POLICY "Artisans can read own profiles"
  ON artisan_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Artisan : Créer son profil
CREATE POLICY "Artisans can create own profiles"
  ON artisan_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Artisan : Modifier MAIS pas is_verified/is_active
CREATE POLICY "Artisans can update own profiles"
  ON artisan_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      auth.uid() IN (SELECT user_id FROM admins)
      OR (
        NEW.is_verified = OLD.is_verified
        AND NEW.is_active = OLD.is_active
      )
    )
  );

-- 5. Admin : Tout accès
CREATE POLICY "Admins can manage all artisan profiles"
  ON artisan_profiles FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins));
```

### Protection Anti-Auto-Vérification / الحماية ضد التحقق الذاتي

✅ **Artisan NE PEUT PAS:**
- Changer `is_verified` à `true` / تغيير is_verified إلى true
- Changer `is_active` / تغيير is_active

✅ **Seul Admin PEUT:**
- Vérifier un artisan / التحقق من حرفي
- Activer/désactiver un profil / تفعيل/تعطيل ملف

---

## <a name="user-flows"></a>👤 Flux Utilisateur

### 1️⃣ Onboarding Artisan / تسجيل الحرفي

```
┌─────────────────────────────────────────┐
│  /artisan/onboarding                    │
│  ┌─────────────────────────────────┐    │
│  │ 1. Choisir catégorie de service │    │
│  │    اختيار فئة الخدمة             │    │
│  ├─────────────────────────────────┤    │
│  │ 2. Nom d'activité                │    │
│  │    الإسم التجاري                │    │
│  ├─────────────────────────────────┤    │
│  │ 3. Ville UNIQUE (required)       │    │
│  │    المدينة (مطلوب)              │    │
│  ├─────────────────────────────────┤    │
│  │ 4. Quartiers (optional)          │    │
│  │    الأحياء (اختياري)            │    │
│  │    ☑ Hay Hassani                 │    │
│  │    ☑ Maarif                      │    │
│  │    ☐ Anfa                        │    │
│  ├─────────────────────────────────┤    │
│  │ 5. Téléphone (required)          │    │
│  │    رقم الهاتف (مطلوب)           │    │
│  ├─────────────────────────────────┤    │
│  │ 6. WhatsApp (optional)           │    │
│  │    واتساب (اختياري)             │    │
│  ├─────────────────────────────────┤    │
│  │ 7. Description (optional)        │    │
│  │    وصف الخدمة (اختياري)         │    │
│  └─────────────────────────────────┘    │
│           ⬇                              │
│  [Valider et créer / تأكيد وإنشاء]      │
└─────────────────────────────────────────┘
           ⬇
┌─────────────────────────────────────────┐
│  RPC: create_my_artisan_profile()       │
│  ✓ Validation des données               │
│  ✓ Vérification quartiers ⊂ ville       │
│  ✓ Création profil (non vérifié)        │
│  ✓ Création portefeuille (solde 0)      │
└─────────────────────────────────────────┘
           ⬇
┌─────────────────────────────────────────┐
│  État: En attente de validation         │
│  حالة: بانتظار المراجعة                │
│                                          │
│  ⚠️ Profil visible seulement après      │
│     validation admin                    │
└─────────────────────────────────────────┘
```

### 2️⃣ Tableau de Bord Artisan / لوحة تحكم الحرفي

**SI Monetization OFF / إذا كان التحقيق من الدخل موقّف:**
```
┌─────────────────────────────────────────┐
│  /dashboard/artisan                     │
│  ┌─────────────────────────────────┐    │
│  │ Statut du profil                 │    │
│  │ ✅ Vérifié / مُفعّل             │    │
│  │ 👁️ Visible / مرئي              │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ❌ Pas de portefeuille affiché         │
│  ❌ Pas de boost visible                │
└─────────────────────────────────────────┘
```

**SI Monetization ON / إذا كان التحقيق من الدخل مفعّل:**
```
┌─────────────────────────────────────────┐
│  /dashboard/artisan                     │
│  ┌─────────────────────────────────┐    │
│  │ Statut du profil                 │    │
│  │ ✅ Vérifié / مُفعّل             │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 💰 Ma Wallet / محفظتي           │    │
│  │ Solde: 150 MAD / الرصيد: 150 درهم│   │
│  │                                  │    │
│  │ ℹ️ Rechargement manuel (admin)   │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ ⚡ Boost de visibilité            │    │
│  │ الرفع فنتائج البحث               │    │
│  │                                  │    │
│  │ [Toggle ON/OFF]                  │    │
│  │                                  │    │
│  │ ℹ️ Min 50 MAD requis              │    │
│  │ خاص يكون فالرصيد على الأقل 50 درهم│   │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 3️⃣ Client Cherche Artisan / العميل يبحث عن حرفي

**SI Monetization OFF:**
```
┌─────────────────────────────────────────┐
│  Liste des artisans / قائمة الحرفيين    │
│  ┌─────────────────────────────────┐    │
│  │ 🔧 Ahmed - Plomberie             │    │
│  │ 📍 Casablanca - Maarif           │    │
│  │ ☎️ 0612345678 ← VISIBLE          │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🔧 Fatima - Plomberie            │    │
│  │ 📍 Casablanca - Anfa             │    │
│  │ ☎️ 0623456789 ← VISIBLE          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**SI Monetization ON (sans pass):**
```
┌─────────────────────────────────────────┐
│  Liste des artisans / قائمة الحرفيين    │
│  ┌─────────────────────────────────┐    │
│  │ ⚡ Ahmed - Plomberie (BOOSTED)   │    │
│  │ 📍 Casablanca - Maarif           │    │
│  │ [كشف الرقم (5 دراهم)]           │    │
│  │ ℹ️ كتخلص غير مرة وحدة...         │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🔧 Fatima - Plomberie            │    │
│  │ 📍 Casablanca - Anfa             │    │
│  │ [Afficher le numéro (5 MAD)]     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**SI Monetization ON (avec pass actif):**
```
┌─────────────────────────────────────────┐
│  🎫 Accès actif jusqu'au: 15:30         │
│  ولوج مفعل حتى: 15:30                   │
│  ─────────────────────────────────       │
│  ┌─────────────────────────────────┐    │
│  │ ⚡ Ahmed - Plomberie (BOOSTED)   │    │
│  │ 📍 Casablanca - Maarif           │    │
│  │ ☎️ 0612345678 ✓ ولوج مفعل        │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🔧 Fatima - Plomberie            │    │
│  │ 📍 Casablanca - Anfa             │    │
│  │ ☎️ 0623456789 ✓ Accès actif      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 4️⃣ Flux Paiement Contact / تدفق دفع الاتصال

```
Client clique "Afficher le numéro"
العميل ينقر على "كشف الرقم"
           ⬇
┌─────────────────────────────────────────┐
│  Dialog Confirmation / حوار التأكيد      │
│  ┌─────────────────────────────────┐    │
│  │ Votre solde actuel: 50 MAD       │    │
│  │ رصيدك الحالي: 50 درهم           │    │
│  ├─────────────────────────────────┤    │
│  │ Prix: 5 MAD / الثمن: 5 دراهم     │    │
│  ├─────────────────────────────────┤    │
│  │ ✓ Accès 12h                      │    │
│  │ ✓ Tous les artisans Plomberie   │    │
│  │   à Casablanca (quartiers choisis)│   │
│  └─────────────────────────────────┘    │
│  [Confirmer (5 MAD) / تأكيد]            │
└─────────────────────────────────────────┘
           ⬇
┌─────────────────────────────────────────┐
│  RPC: debit_wallet_for_contact()        │
│  ✓ Vérif solde ≥ 5 MAD                  │
│  ✓ Débit atomique: 50 → 45 MAD          │
│  ✓ Création transaction audit           │
│  ✓ Création pass (expire dans 12h)      │
│  ✓ Scope: city + category + quartiers   │
└─────────────────────────────────────────┘
           ⬇
┌─────────────────────────────────────────┐
│  ✅ تم! دابا تقدر تشوف جميع الأرقام     │
│  C'est bon ! Vous pouvez voir tous les  │
│  numéros pendant 12h.                    │
└─────────────────────────────────────────┘
```

---

## <a name="admin-config"></a>⚙️ Configuration Admin

### /admin/monetization

```
┌─────────────────────────────────────────┐
│  Monétisation / تحقيق الدخل              │
│  ┌─────────────────────────────────┐    │
│  │ Master Switch                    │    │
│  │ [✓] تفعيل النظام                │    │
│  │     Activer la monétisation      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Features / الميزات               │    │
│  │ [✓] الدفع مقابل كشف الرقم        │    │
│  │     Pay-per-contact              │    │
│  │                                  │    │
│  │ [✓] Boost de visibilité          │    │
│  │     الدفع مقابل الظهور           │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Pricing / الأسعار                │    │
│  │ Prix affichage: [5] MAD          │    │
│  │ ثمن كشف الرقم: [5] درهم          │    │
│  │                                  │    │
│  │ Min artisan: [50] MAD            │    │
│  │ الحد الأدنى: [50] درهم           │    │
│  │                                  │    │
│  │ Durée accès: [12] heures         │    │
│  │ مدة الولوج: [12] ساعة            │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [💾 Enregistrer / حفظ التغييرات]       │
└─────────────────────────────────────────┘
```

**Effet Immédiat / التأثير الفوري:**
- Cache effacé automatiquement / التخزين المؤقت يُمسح تلقائيًا
- Changements visibles en < 60s / التغييرات مرئية في أقل من 60 ثانية

---

## <a name="translations"></a>🌍 Traductions AR/FR

### Onboarding

| Contexte | Français (FR) | العربية (AR) |
|----------|--------------|--------------|
| Page title | Créer un profil prestataire | إنشاء حساب حرفي |
| Service | Catégorie de service | الحرفة |
| Business | Nom / Activité | الإسم التجاري |
| City | Ville | المدينة |
| Neighborhoods | Quartiers (optionnel) | الأحياء (اختياري) |
| Phone | Téléphone | رقم الهاتف |
| WhatsApp | WhatsApp (optionnel) | واتساب (اختياري) |
| Description | Description (optionnel) | وصف الخدمة (اختياري) |
| Submit | Valider et créer | تأكيد وإنشاء الحساب |
| Success | Profil créé ! Il est en attente de validation. | تم إنشاء حسابك! دابا كاين فمرحلة المراجعة. |
| Pending | Votre profil est en attente de validation. Il sera visible après vérification. | حسابك باقي ما تراجعش من طرف الإدارة. غادي يبان للناس منين يتأكّد. |

### Wallet / المحفظة

| Contexte | Français (FR) | العربية (AR) |
|----------|--------------|--------------|
| Balance label | Solde : | الرصيد: |
| Empty | Vous n'avez pas encore de solde. | مازال ماعندكش رصيد. |
| Top-up note | Le rechargement est manuel (par l'admin) pour le moment. | التعبئة كتدار يدوياً من طرف الإدارة حالياً. |

### Boost / الرفع

| Contexte | Français (FR) | العربية (AR) |
|----------|--------------|--------------|
| Title | Boost de visibilité | الرفع فنتائج البحث (Boost) |
| Toggle | Activer le boost | فعّل الرفع ديال الظهور |
| Min required | Il faut au moins {min} MAD de solde pour activer le boost. | خاص يكون فالرصيد على الأقل {min} درهم باش تقدر تفعّل الرفع. |
| Enabled | Activé — vous apparaissez en haut dans votre ville. | مفعّل — غادي تبان من الأوائل فـ المدينة ديالك. |
| Disabled | Désactivé — vous restez visible mais plus bas. | موقّف — غادي تبان عادي ولكن من اللخر. |
| Loading | Mise à jour... | كنحدّث الحالة... |

### Reveal Phone / كشف الرقم

| Contexte | Français (FR) | العربية (AR) |
|----------|--------------|--------------|
| Button (no access) | Afficher le numéro ({fee} MAD) | كشف الرقم ({fee} دراهم) |
| Helper text | Vous payez une seule fois et vous voyez tous les numéros de la même catégorie dans la même ville (et quartiers sélectionnés) pendant 12h. | كتخلص غير مرة وحدة وكيبانولك جميع أرقام نفس الحرفة فـ نفس المدينة (والأحياء اللي مختار) لمدة 12 ساعة. |
| Error (insufficient) | Solde insuffisant. Rechargez votre portefeuille pour afficher le numéro. | رصيدك ما كافيش. عَمّر المحفظة باش تكشف الرقم. |
| Loading | Traitement... | كنعالج الطلب... |
| Success toast | C'est bon ! Vous pouvez voir tous les numéros de cette catégorie dans cette ville pendant 12h. | تم! دابا تقدر تشوف جميع الأرقام فـ هاد الحرفة فـ هاد المدينة لمدة 12 ساعة. |
| Badge (has access) | Accès actif | ولوج مفعل |

### Access Pass Scope / نطاق الولوج

| Contexte | Français (FR) | العربية (AR) |
|----------|--------------|--------------|
| City-wide | Cet accès couvre toute la ville. | هاذ الولوج كينطبق على كامل المدينة. |
| Neighborhoods only | Cet accès couvre uniquement les quartiers sélectionnés. | هاذ الولوج كينطبق غير على الأحياء اللي مختار. |

### Admin Monetization / إعدادات المسؤول

| Contexte | Français (FR) | العربية (AR) |
|----------|--------------|--------------|
| Banner ON | Monétisation activée | تحقيق الدخل مفعّل |
| Banner OFF | Monétisation désactivée | تحقيق الدخل موقّف |
| Master toggle | Activer la monétisation | تفعيل النظام |
| Pay-per-contact | Paiement pour afficher le numéro | الدفع مقابل كشف الرقم |
| Boost toggle | Boost de visibilité | الدفع مقابل الظهور (Boost) |
| Contact fee | Prix affichage numéro (MAD) | ثمن كشف الرقم (درهم) |
| Min wallet | Solde minimum prestataire (MAD) | الحد الأدنى لمحفظة الحرفي (درهم) |
| Duration | Durée d'accès (heures) | مدة الولوج (بالساعات) |

---

## 🚀 Comportement par Défaut

### ⚠️ IMPORTANT - Sécurité / السلامة

```
Par défaut : TOUT EST DÉSACTIVÉ
افتراضيًا: كل شيء معطّل

monetization_enabled = FALSE
  ↓
✅ Téléphones visibles gratuitement
✅ Pas de paywalls
✅ Pas de boutons de paiement
✅ Portefeuille caché
✅ Boost caché
```

### ✅ Activation Manuelle Admin

```
Admin active : monetization_enabled = TRUE
المسؤول يفعّل: monetization_enabled = TRUE
  ↓
✅ Boutons "Afficher le numéro" apparaissent
✅ Portefeuille visible
✅ Boost disponible (si activé)
✅ Système de passes actif
```

---

## 📌 Points Clés / النقاط الرئيسية

1. **Migration Safe / الهجرة الآمنة:**
   - Pas de recréation de tables / لا إعادة إنشاء الجداول
   - ALTER TABLE seulement / ALTER TABLE فقط
   - Migration des données anciennes / ترحيل البيانات القديمة

2. **RLS Strict / RLS صارم:**
   - Artisan ne peut pas se vérifier / الحرفي لا يمكنه التحقق من نفسه
   - Admin seulement / المسؤول فقط

3. **Atomicité Wallet / ذرية المحفظة:**
   - Solde ne peut JAMAIS être négatif / الرصيد لا يمكن أن يكون سالبًا أبدًا
   - Transactions FOR UPDATE / المعاملات FOR UPDATE
   - Audit complet / تدقيق كامل

4. **Scope Quartiers / نطاق الأحياء:**
   - NULL = ville entière / NULL = المدينة بأكملها
   - Array = quartiers spécifiques / Array = أحياء محددة

5. **Multilangue / متعدد اللغات:**
   - AR pour Darija marocaine / AR للدارجة المغربية
   - FR pour français / FR للفرنسية

---

## 📞 Support Technique / الدعم الفني

Pour toute question : contact@topaffaireimmo.ma
لأي استفسار: contact@topaffaireimmo.ma

---

**Dernière mise à jour / آخر تحديث:** 2024-02-11
**Version:** 1.0
**Migration:** 091_fix_artisan_location_model.sql
