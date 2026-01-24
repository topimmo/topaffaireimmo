import { AuthError } from '@supabase/supabase-js';

/**
 * Centralized error message mapping for Supabase auth errors
 * Maps error messages to user-friendly bilingual messages
 */

interface ErrorMessage {
  fr: string;
  ar: string;
}

// Error code/message patterns and their user-friendly translations
const ERROR_MAPPINGS: Record<string, ErrorMessage> = {
  // Signup errors
  'already registered': {
    fr: 'Cet email est déjà enregistré',
    ar: 'هذا البريد الإلكتروني مسجل بالفعل'
  },
  'invalid email': {
    fr: 'Email invalide',
    ar: 'البريد الإلكتروني غير صالح'
  },
  'weak password': {
    fr: 'Mot de passe trop faible',
    ar: 'كلمة المرور ضعيفة جداً'
  },
  'password should be at least': {
    fr: 'Le mot de passe doit contenir au moins 6 caractères',
    ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
  },
  
  // Login errors
  'Invalid login credentials': {
    fr: 'Email ou mot de passe incorrect',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  },
  'Email not confirmed': {
    fr: 'Veuillez confirmer votre email d\'abord',
    ar: 'يرجى تأكيد بريدك الإلكتروني أولاً'
  },
  
  // Network errors
  'network': {
    fr: 'Erreur de connexion réseau',
    ar: 'خطأ في الاتصال بالشبكة'
  },
  'Failed to fetch': {
    fr: 'Erreur de connexion réseau',
    ar: 'خطأ في الاتصال بالشبكة'
  },
  
  // Database errors
  'Database error': {
    fr: 'Erreur de base de données. Veuillez réessayer.',
    ar: 'خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى.'
  },
  
  // Generic fallback
  'default': {
    fr: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
  }
};

/**
 * Translates Supabase auth errors to user-friendly messages
 * @param error - Supabase AuthError or Error object
 * @param isRTL - Whether to use Arabic (RTL) or French (LTR) messages
 * @returns User-friendly error message
 */
export function translateAuthError(
  error: AuthError | Error | null | undefined,
  isRTL: boolean = false
): string {
  if (!error) return ERROR_MAPPINGS.default[isRTL ? 'ar' : 'fr'];
  
  const errorMessage = error.message.toLowerCase();
  
  // Find matching error pattern
  for (const [pattern, translation] of Object.entries(ERROR_MAPPINGS)) {
    if (errorMessage.includes(pattern.toLowerCase())) {
      return translation[isRTL ? 'ar' : 'fr'];
    }
  }
  
  // Fallback to default message
  return ERROR_MAPPINGS.default[isRTL ? 'ar' : 'fr'];
}

/**
 * Logs authentication error details to console
 * @param context - Context where error occurred (e.g., 'signup', 'login')
 * @param error - Error object
 */
export function logAuthError(
  context: 'signup' | 'login' | 'reset-password' | 'update-profile',
  error: AuthError | Error
): void {
  console.error(`❌ ${context} error:`, error);
  console.error('Error message:', error.message);
  
  // Log additional details if available
  if ('status' in error) {
    console.error('Status:', (error as any).status);
  }
  
  if ('__isAuthError' in error) {
    console.error('Auth error type:', 'Supabase AuthError');
  }
}

/**
 * Logs successful authentication to console
 * @param context - Context of success (e.g., 'signup', 'login')
 * @param userId - User ID
 * @param additionalInfo - Optional additional information
 */
export function logAuthSuccess(
  context: 'signup' | 'login',
  userId: string | undefined,
  additionalInfo?: Record<string, any>
): void {
  console.log(`✅ ${context} successful!`);
  console.log('User ID:', userId);
  
  if (additionalInfo) {
    Object.entries(additionalInfo).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
  }
}
