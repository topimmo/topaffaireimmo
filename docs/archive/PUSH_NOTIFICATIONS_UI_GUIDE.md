# Web Push Notifications - Visual Implementation Guide

## User Interface Components

### 1. Dashboard - Notification Toggle

**Location**: `/dashboard` page, above the listings section

**Component**: `PushNotificationToggle`

**States**:

#### State 1: Disabled (Default)
```
┌─────────────────────────────────────────────────────────┐
│  🔕  Notifications                              [OFF]   │
│      Recevez des notifications pour les                 │
│      nouvelles propriétés et mises à jour               │
│      Désactivé                                          │
└─────────────────────────────────────────────────────────┘
```

#### State 2: Enabled
```
┌─────────────────────────────────────────────────────────┐
│  🔔  Notifications                              [ON]    │
│      Recevez des notifications pour les                 │
│      nouvelles propriétés et mises à jour               │
│      Activé                                             │
└─────────────────────────────────────────────────────────┘
```

#### State 3: Not Supported (iOS < 16.4)
```
┌─────────────────────────────────────────────────────────┐
│  🔕  Notifications                                       │
│      Notifications non supportées                       │
└─────────────────────────────────────────────────────────┘
```

#### State 4: Permission Denied
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Notifications                                       │
│      Permission refusée                                 │
└─────────────────────────────────────────────────────────┘
```

### 2. Permission Prompt Dialog

**Triggered**: When user clicks toggle to enable notifications (only if permission not yet granted)

```
┌──────────────────────────────────────────────────────────┐
│  Activer les notifications push                         │
│                                                          │
│  Restez informé des nouvelles propriétés qui            │
│  correspondent à vos critères de recherche              │
│                                                          │
│                                                          │
│                   [Pas maintenant]  [Autoriser]          │
└──────────────────────────────────────────────────────────┘
```

### 3. Browser Permission Dialog

**Triggered**: After user clicks "Autoriser" in our dialog

```
┌──────────────────────────────────────────────────────────┐
│  topaffaireimmo.com veut                                 │
│  Afficher des notifications                              │
│                                                          │
│                              [Bloquer]  [Autoriser]      │
└──────────────────────────────────────────────────────────┘
```

### 4. Success Toast Messages

**On Enable**:
```
✅ Notifications activées avec succès
```

**On Disable**:
```
✅ Notifications désactivées
```

**On Error**:
```
❌ Erreur lors de l'activation des notifications
   Permission refusée
```

## Push Notification Display

### Sample Notification

When a push notification is received:

```
┌──────────────────────────────────────────────────────────┐
│  [Icon]  TopAffaireImmo                            [×]   │
│                                                          │
│  Nouvelle propriété!                                     │
│  Une nouvelle propriété correspond à vos critères        │
│                                                          │
│  Il y a quelques instants                                │
└──────────────────────────────────────────────────────────┘
```

**Components**:
- **Icon**: App icon from `/icons/icon-192.png`
- **Title**: "Nouvelle propriété!" (customizable)
- **Body**: "Une nouvelle propriété..." (customizable)
- **Click Action**: Opens app at specific URL (e.g., `/property/123`)

## Bilingual Support (FR + AR)

### French Interface
```
┌─────────────────────────────────────────────────────────┐
│  🔔  Notifications                              [ON]    │
│      Recevez des notifications pour les                 │
│      nouvelles propriétés et mises à jour               │
│      Activé                                             │
└─────────────────────────────────────────────────────────┘
```

### Arabic Interface (RTL)
```
┌─────────────────────────────────────────────────────────┐
│   [ON]                              الإشعارات  🔔      │
│                 احصل على إشعارات للعقارات الجديدة       │
│                                      والتحديثات         │
│                                             مفعّل        │
└─────────────────────────────────────────────────────────┘
```

## Responsive Design

### Desktop View
- Toggle displayed as a full-width card
- Icon and text on left, switch on right
- Comfortable padding and spacing

### Mobile View
- Stacks vertically for narrow screens
- Touch-friendly toggle switch
- Maintains readability on small screens

## Visual Design Tokens

**Colors**:
- Primary (enabled): `text-primary` (#3b82f6)
- Muted (disabled): `text-muted-foreground`
- Success: `bg-green-100 text-green-800`
- Error: `bg-red-100 text-red-800`
- Warning: `bg-yellow-100 text-yellow-800`

**Icons**:
- Bell (enabled): `lucide-react` Bell icon
- Bell-off (disabled): `lucide-react` BellOff icon
- Alert (error): `lucide-react` AlertCircle icon

**Typography**:
- Title: `text-base font-medium`
- Description: `text-sm text-muted-foreground`
- Status: `text-xs text-muted-foreground`

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Opens Dashboard                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              See "Notifications" Toggle                  │
│                    (Disabled State)                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 User Clicks Toggle                       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Show Permission Prompt Dialog               │
│          "Activer les notifications push"                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              User Clicks "Autoriser"                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│          Browser Shows Native Permission                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              User Clicks "Autoriser"                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         Service Worker Creates Subscription              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│        Subscription Stored in Supabase                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Show Success Toast                          │
│     "Notifications activées avec succès"                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Toggle Shows "Enabled"                      │
│                 Icon Changes to 🔔                       │
└─────────────────────────────────────────────────────────┘
```

## Admin Sending Flow

```
┌─────────────────────────────────────────────────────────┐
│           Admin Triggers Notification                    │
│      (Via Edge Function or Admin Panel)                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      Edge Function Validates Admin Role                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      Fetch Active Subscriptions from Database            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│       Send Push to Each Subscription                     │
│         (Using Web Push Protocol)                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      Service Worker Receives Push                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│        Display Notification to User                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      User Clicks Notification                            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      App Opens at Specified URL                          │
│         (e.g., /property/123)                            │
└─────────────────────────────────────────────────────────┘
```

## Key Features Visualized

### ✅ Privacy-First Design
- Toggle is OFF by default
- Never auto-prompts
- Clear explanation before asking permission
- User must explicitly enable

### ✅ Clear Status Indicators
- Visual icons (bell, bell-off, alert)
- Text status (Enabled/Disabled)
- Color coding (primary, muted, error)

### ✅ Bilingual Support
- All text in French and Arabic
- RTL layout for Arabic
- Consistent with app's language system

### ✅ Graceful Degradation
- Shows "not supported" on old browsers
- Shows "permission denied" if blocked
- App continues to work normally

### ✅ Accessibility
- Proper ARIA labels
- Keyboard accessible
- Screen reader friendly
- Clear visual feedback

## Implementation Quality

**Code Quality**: ✅ TypeScript, proper types, documented  
**Security**: ✅ RLS policies, no token caching, admin-only sending  
**UX**: ✅ Clear, intuitive, respects user privacy  
**i18n**: ✅ Fully bilingual with RTL support  
**Testing**: ✅ Build verified, zero vulnerabilities  
**Documentation**: ✅ Comprehensive guides provided  

---

**Status**: Production-ready ✅  
**Last Updated**: February 2026  
