# Frontend Example - OTP Authentication

Simple React component demonstrating Phone OTP authentication with TopAffaireImmo backend.

## 📁 Files

- `OTPAuth.tsx` - Main authentication component
- `OTPAuth.css` - Styling

## 🚀 Integration

### Option 1: Standalone Component

Copy `OTPAuth.tsx` and `OTPAuth.css` into your React project:

```tsx
import { OTPAuth } from './components/OTPAuth';

function App() {
  return <OTPAuth />;
}
```

### Option 2: Integration with Existing Auth

```tsx
import { useState } from 'react';

function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <OTPAuth onSuccess={() => setIsAuthenticated(true)} />;
}
```

## 🎨 Features

- **Step-by-step flow**: Phone input → OTP verification → Success
- **Validation**: Morocco phone number format (+212)
- **Error handling**: User-friendly error messages
- **Loading states**: Disabled buttons during API calls
- **Auto-format**: Phone number formatting
- **Responsive**: Mobile-friendly design
- **Bilingual**: French UI (easily adaptable to Arabic)

## 🔧 Customization

### Change API URL

Edit line 4 in `OTPAuth.tsx`:

```tsx
const API_URL = 'https://your-api-domain.com';
```

### Add Arabic Support

```tsx
const translations = {
  fr: {
    title: 'Connexion par téléphone',
    enterPhone: 'Entrez votre numéro de téléphone marocain',
    // ...
  },
  ar: {
    title: 'تسجيل الدخول عبر الهاتف',
    enterPhone: 'أدخل رقم هاتفك المغربي',
    // ...
  },
};
```

## 🔐 Security Notes

- Token is stored in `localStorage` (consider `httpOnly` cookies for production)
- No sensitive data is logged to console
- Phone number format is validated before submission
- OTP input only accepts numeric values

## 🚀 Production Checklist

- [ ] Use HTTPS for all API calls
- [ ] Implement proper token refresh logic
- [ ] Add logout functionality
- [ ] Store token securely (consider httpOnly cookies)
- [ ] Add analytics tracking
- [ ] Implement proper error boundary
- [ ] Add accessibility attributes (ARIA labels)
- [ ] Test on various devices and browsers

## 📖 Usage Example

```tsx
// After successful authentication, the token is available:
const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Use in API calls:
const response = await fetch('https://api.topaffaireimmo.com/properties', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```
