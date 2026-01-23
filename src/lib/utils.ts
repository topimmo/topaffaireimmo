import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface UserProfile {
  user_role?: string;
  is_admin?: boolean;
  // أضف خصائص أخرى إذا احتجت
}
