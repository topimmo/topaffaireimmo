/**
 * Platform Settings Loader - FULL FREE MODE
 * 
 * All monetization features are DISABLED.
 * Functions return false or safe defaults.
 * Database queries are skipped to avoid dependencies on Supabase schema.
 */

// FULL FREE MODE: All monetization disabled
const DEFAULT_SETTINGS = {
  monetization_enabled: false,
  pay_per_contact_enabled: false,
  pay_to_be_visible_enabled: false,
  contact_reveal_fee_mad: 0,
  artisan_min_wallet_mad: 0,
  contact_pass_duration_hours: 0,
};

interface MonetizationSettings {
  monetization_enabled: boolean;
  pay_per_contact_enabled: boolean;
  pay_to_be_visible_enabled: boolean;
  contact_reveal_fee_mad: number;
  artisan_min_wallet_mad: number;
  contact_pass_duration_hours: number;
}

/**
 * FULL FREE MODE: Always return disabled settings
 */
export async function getMonetizationSettings(): Promise<MonetizationSettings> {
  return DEFAULT_SETTINGS;
}

/**
 * FULL FREE MODE: Monetization is always disabled
 */
export async function isMonetizationEnabled(): Promise<boolean> {
  return false;
}

/**
 * FULL FREE MODE: Pay-per-contact is always disabled
 */
export async function isPayPerContactEnabled(): Promise<boolean> {
  return false;
}

/**
 * FULL FREE MODE: Pay-to-be-visible (boost) is always disabled
 */
export async function isPayToBeVisibleEnabled(): Promise<boolean> {
  return false;
}

/**
 * FULL FREE MODE: No-op cache clear
 */
export function clearSettingsCache(): void {
  // No-op in free mode
}

/**
 * FULL FREE MODE: Contact reveal is free (returns 0)
 */
export async function getContactRevealFee(): Promise<number> {
  return 0;
}

/**
 * FULL FREE MODE: No minimum wallet required (returns 0)
 */
export async function getArtisanMinWallet(): Promise<number> {
  return 0;
}

/**
 * FULL FREE MODE: No contact pass duration (returns 0)
 */
export async function getContactPassDuration(): Promise<number> {
  return 0;
}
