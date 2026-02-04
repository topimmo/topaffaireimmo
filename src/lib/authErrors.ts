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
  // Signup errors - Email conflicts
  'already registered': {
    fr: 'Cet email est déjà enregistré',
    ar: 'هذا البريد الإلكتروني مسجل مسبقًا'
  },
  'user already registered': {
    fr: 'Cet email est déjà enregistré',
    ar: 'هذا البريد الإلكتروني مسجل مسبقًا'
  },
  'email_exists': {
    fr: 'Cet email est déjà enregistré',
    ar: 'هذا البريد الإلكتروني مسجل مسبقًا'
  },
  'email exists': {
    fr: 'Cet email est déjà enregistré',
    ar: 'هذا البريد الإلكتروني مسجل مسبقًا'
  },
  
  // Email validation errors
  'invalid email': {
    fr: 'Email invalide',
    ar: 'البريد الإلكتروني غير صالح'
  },
  'invalid_email': {
    fr: 'Email invalide',
    ar: 'البريد الإلكتروني غير صالح'
  },
  
  // Password validation errors
  'weak password': {
    fr: 'Mot de passe trop faible (6 caractères minimum)',
    ar: 'كلمة المرور ضعيفة (6 أحرف على الأقل)'
  },
  'password should be at least': {
    fr: 'Le mot de passe doit contenir au moins 6 caractères',
    ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
  },
  'invalid_password': {
    fr: 'Mot de passe trop faible (6 caractères minimum)',
    ar: 'كلمة المرور ضعيفة (6 أحرف على الأقل)'
  },
  'password is too short': {
    fr: 'Le mot de passe doit contenir au moins 6 caractères',
    ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
  },
  
  // Email/SMTP errors
  'email provider': {
    fr: 'Erreur d\'envoi d\'email. Vérifiez votre adresse email.',
    ar: 'خطأ في إرسال البريد الإلكتروني. تحقق من عنوان بريدك الإلكتروني.'
  },
  'email_provider_disabled': {
    fr: 'L\'inscription par email est désactivée',
    ar: 'التسجيل عبر البريد الإلكتروني معطل'
  },
  'smtp': {
    fr: 'Erreur du serveur d\'email. Veuillez réessayer dans quelques instants.',
    ar: 'خطأ في خادم البريد الإلكتروني. يرجى المحاولة مرة أخرى بعد قليل.'
  },
  'email rate limit': {
    fr: 'Trop de demandes. Veuillez patienter avant de réessayer.',
    ar: 'طلبات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.'
  },
  'rate_limit_exceeded': {
    fr: 'Trop de demandes. Veuillez patienter avant de réessayer.',
    ar: 'طلبات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.'
  },
  '429': {
    fr: 'Trop de demandes. Veuillez patienter avant de réessayer.',
    ar: 'طلبات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.'
  },
  'email delivery': {
    fr: 'Impossible d\'envoyer l\'email de confirmation. Vérifiez votre adresse.',
    ar: 'تعذر إرسال بريد التأكيد الإلكتروني. تحقق من عنوانك.'
  },
  'email_address_not_authorized': {
    fr: 'Cette adresse email n\'est pas autorisée',
    ar: 'عنوان البريد الإلكتروني هذا غير مصرح به'
  },
  
  // Redirect/URL errors
  'redirect': {
    fr: 'URL de redirection non autorisée. Contactez le support.',
    ar: 'عنوان URL لإعادة التوجيه غير مصرح به. اتصل بالدعم.'
  },
  'redirect_not_allowed': {
    fr: 'URL de redirection non autorisée. Contactez le support.',
    ar: 'عنوان URL لإعادة التوجيه غير مصرح به. اتصل بالدعم.'
  },
  'invalid_redirect_url': {
    fr: 'URL de redirection non autorisée. Contactez le support.',
    ar: 'عنوان URL لإعادة التوجيه غير مصرح به. اتصل بالدعم.'
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
    fr: 'Problème de connexion, vérifiez votre internet',
    ar: 'مشكل في الاتصال، تحقق من الإنترنت'
  },
  'Failed to fetch': {
    fr: 'Problème de connexion, vérifiez votre internet',
    ar: 'مشكل في الاتصال، تحقق من الإنترنت'
  },
  'network_error': {
    fr: 'Problème de connexion, vérifiez votre internet',
    ar: 'مشكل في الاتصال، تحقق من الإنترنت'
  },
  'timeout': {
    fr: 'Problème de connexion, vérifiez votre internet',
    ar: 'مشكل في الاتصال، تحقق من الإنترنت'
  },
  'connection refused': {
    fr: 'Problème de connexion, vérifiez votre internet',
    ar: 'مشكل في الاتصال، تحقق من الإنترنت'
  },
  
  // Database errors
  'Database error': {
    fr: 'Erreur de base de données. Veuillez réessayer.',
    ar: 'خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى.'
  },
  'unexpected_failure': {
    fr: 'Erreur inattendue. Veuillez réessayer.',
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
  },
  'permission denied': {
    fr: 'Accès refusé. Veuillez contacter le support.',
    ar: 'تم رفض الوصول. يرجى الاتصال بالدعم.'
  },
  'row level security': {
    fr: 'Erreur de sécurité. Veuillez contacter le support.',
    ar: 'خطأ أمني. يرجى الاتصال بالدعم.'
  },
  'constraint': {
    fr: 'Données invalides. Vérifiez les informations saisies.',
    ar: 'بيانات غير صالحة. تحقق من المعلومات المدخلة.'
  },
  'duplicate': {
    fr: 'Cet enregistrement existe déjà.',
    ar: 'هذا السجل موجود بالفعل.'
  },
  'conflict': {
    fr: 'Conflit de données. Veuillez réessayer.',
    ar: 'تعارض في البيانات. يرجى المحاولة مرة أخرى.'
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
  
  // Log error details only in development for debugging
  // In production, only log minimal info to avoid exposing system details
  if (import.meta.env.DEV) {
    console.error('🔍 Translating auth error:', {
      message: error.message,
      errorType: error.constructor.name,
      status: (error as any).status,
      code: (error as any).code,
    });
  } else {
    // Production: Log only error type, not full message
    console.error('Auth error occurred:', error.constructor.name);
  }
  
  // Find matching error pattern
  for (const [pattern, translation] of Object.entries(ERROR_MAPPINGS)) {
    if (errorMessage.includes(pattern.toLowerCase())) {
      if (import.meta.env.DEV) {
        console.log('✅ Matched error pattern:', pattern);
      }
      return translation[isRTL ? 'ar' : 'fr'];
    }
  }
  
  // If no pattern matched, log for future improvement (dev only)
  if (import.meta.env.DEV) {
    console.warn('⚠️ No error pattern matched. Using default message.');
    console.warn('   Original error message:', error.message);
    console.warn('   Consider adding this pattern to ERROR_MAPPINGS');
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
