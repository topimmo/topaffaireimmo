#!/usr/bin/env node

/**
 * Generate VAPID Keys for Web Push Notifications
 * 
 * This script generates a pair of VAPID keys required for web push notifications.
 * Run this once and add the keys to your .env file and Supabase secrets.
 * 
 * Usage:
 *   node scripts/generate-vapid-keys.js
 *   # or
 *   npx tsx scripts/generate-vapid-keys.ts
 */

import { webcrypto } from 'crypto';

// Base64 URL-safe encoding
function base64UrlEncode(buffer: ArrayBuffer): string {
  const base64 = Buffer.from(buffer).toString('base64');
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateVapidKeys() {
  console.log('🔐 Generating VAPID Keys for Web Push Notifications...\n');

  try {
    // Generate ECDSA key pair using P-256 curve (required for VAPID)
    const keyPair = await webcrypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export public key
    const publicKeyRaw = await webcrypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKey = base64UrlEncode(publicKeyRaw);

    // Export private key  
    const privateKeyJwk = await webcrypto.subtle.exportKey('jwk', keyPair.privateKey);
    
    // Convert JWK 'd' value to base64url (this is the private key)
    if (!privateKeyJwk.d) {
      throw new Error('Failed to extract private key');
    }
    
    // The 'd' parameter is already base64url encoded in JWK format
    const privateKey = privateKeyJwk.d;

    console.log('✅ VAPID Keys Generated Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Public Key (use in frontend):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(publicKey);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Private Key (use in backend - KEEP SECRET):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(privateKey);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Add to .env.local (for local development):');
    console.log('   VITE_VAPID_PUBLIC_KEY=' + publicKey);
    console.log('');
    console.log('2. Add to Vercel environment variables:');
    console.log('   VITE_VAPID_PUBLIC_KEY=' + publicKey);
    console.log('');
    console.log('3. Add to Supabase Edge Function secrets:');
    console.log('   supabase secrets set VAPID_PUBLIC_KEY="' + publicKey + '"');
    console.log('   supabase secrets set VAPID_PRIVATE_KEY="' + privateKey + '"');
    console.log('   supabase secrets set VAPID_SUBJECT="mailto:contact@topaffaireimmo.com"');
    console.log('');
    console.log('⚠️  IMPORTANT: Keep the private key secret! Never commit it to git.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error generating VAPID keys:', error);
    process.exit(1);
  }
}

generateVapidKeys();
