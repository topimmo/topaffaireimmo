/**
 * Platform Settings Loader
 * 
 * Loads and caches monetization settings from Supabase.
 * Provides helper functions to check if monetization features are enabled.
 * 
 * Settings are cached in memory with a TTL to reduce database calls.
 * If settings fail to load, defaults to OFF (safe fallback).
 */

import { supabase } from './supabase';

interface MonetizationSettings {
  monetization_enabled: boolean;
  pay_per_contact_enabled: boolean;
  pay_to_be_visible_enabled: boolean;
  contact_reveal_fee_mad: number;
  artisan_min_wallet_mad: number;
  contact_pass_duration_hours: number;
}

interface CachedSettings {
  settings: MonetizationSettings;
  timestamp: number;
}

// Cache settings for 60 seconds
const CACHE_TTL_MS = 60 * 1000;

// In-memory cache
let cachedSettings: CachedSettings | null = null;

// Default settings (monetization OFF)
const DEFAULT_SETTINGS: MonetizationSettings = {
  monetization_enabled: false,
  pay_per_contact_enabled: false,
  pay_to_be_visible_enabled: false,
  contact_reveal_fee_mad: 5,
  artisan_min_wallet_mad: 50,
  contact_pass_duration_hours: 12,
};

/**
 * Load monetization settings from Supabase
 * Uses cache if available and fresh, otherwise fetches from database
 */
export async function getMonetizationSettings(): Promise<MonetizationSettings> {
  // Check cache
  if (cachedSettings) {
    const age = Date.now() - cachedSettings.timestamp;
    if (age < CACHE_TTL_MS) {
      return cachedSettings.settings;
    }
  }

  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'monetization')
      .single();

    if (error) {
      console.warn('Failed to load monetization settings, using defaults:', error);
      return DEFAULT_SETTINGS;
    }

    if (!data || !data.value) {
      console.warn('No monetization settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    const settings = data.value as MonetizationSettings;

    // Update cache
    cachedSettings = {
      settings,
      timestamp: Date.now(),
    };

    return settings;
  } catch (err) {
    console.error('Error loading monetization settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Check if monetization is enabled globally
 */
export async function isMonetizationEnabled(): Promise<boolean> {
  const settings = await getMonetizationSettings();
  return settings.monetization_enabled;
}

/**
 * Check if pay-per-contact feature is enabled
 */
export async function isPayPerContactEnabled(): Promise<boolean> {
  const settings = await getMonetizationSettings();
  return settings.monetization_enabled && settings.pay_per_contact_enabled;
}

/**
 * Check if pay-to-be-visible (boost) feature is enabled
 */
export async function isPayToBeVisibleEnabled(): Promise<boolean> {
  const settings = await getMonetizationSettings();
  return settings.monetization_enabled && settings.pay_to_be_visible_enabled;
}

/**
 * Clear settings cache (useful for admin after updating settings)
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
}

/**
 * Get the contact reveal fee in MAD
 */
export async function getContactRevealFee(): Promise<number> {
  const settings = await getMonetizationSettings();
  return settings.contact_reveal_fee_mad;
}

/**
 * Get the minimum wallet balance required for artisan boost
 */
export async function getArtisanMinWallet(): Promise<number> {
  const settings = await getMonetizationSettings();
  return settings.artisan_min_wallet_mad;
}

/**
 * Get the duration of contact access pass in hours
 */
export async function getContactPassDuration(): Promise<number> {
  const settings = await getMonetizationSettings();
  return settings.contact_pass_duration_hours;
}
