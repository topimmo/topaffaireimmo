import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// موجود مسبقًا
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -------------------------------
// إضافة useAuth
export interface UserProfile {
  user_role?: string;
  // أضف خصائص أخرى إذا احتجت
}

export interface AuthContext {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth(): AuthContext {
  // مؤقتًا: نعيد قيم فارغة حتى يعمل build
  return {
    user: null,
    profile: null,
    loading: false,
  };
}
