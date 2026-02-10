# Monetization System Guide

This document explains how to use and configure the monetization system for the Home Services / Artisans category.

## Overview

The monetization system provides optional paid features for the Services/Artisans section of the platform. It is **OFF by default** and can be toggled by admins without requiring a deployment.

## Key Features

### 1. Master Switch (Admin Control)
- **Location**: Admin Dashboard → Monetization
- **Default State**: OFF
- **Behavior**: When OFF, all features are 100% free (no paywalls, phones visible normally)

### 2. Pay-per-Contact (Customer Side)
When enabled:
- Customers must pay a small fee (default: 5 MAD) to reveal artisan phone numbers
- Payment grants access for 12 hours (configurable)
- Access is scoped to: same city + same service category
- During the pass window, customer can view ALL matching artisan phones for free

### 3. Pay-to-be-Visible (Artisan Side)
When enabled:
- Artisans with wallet balance ≥ minimum (default: 50 MAD) can enable "Boost"
- Boosted artisans rank higher in search results (within same city/service category)
- Boost is optional - non-boosted artisans still appear normally

## Admin Configuration

### Accessing Monetization Settings

1. Log in as admin
2. Navigate to: **Admin Dashboard** → **Monetization**
3. You will see:
   - Master switch (Enable/Disable entire system)
   - Feature toggles (Pay-per-Contact, Pay-to-be-Visible)
   - Pricing configuration

### Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| **monetization_enabled** | false | Master switch - turns entire system on/off |
| **pay_per_contact_enabled** | false | Enable pay-per-contact for customers |
| **pay_to_be_visible_enabled** | false | Enable boost feature for artisans |
| **contact_reveal_fee_mad** | 5 | Price to reveal phone number (in MAD) |
| **artisan_min_wallet_mad** | 50 | Minimum wallet balance required for boost |
| **contact_pass_duration_hours** | 12 | How long contact access lasts |

### Saving Changes

1. Adjust settings as needed
2. Click **Save Changes**
3. Changes apply immediately (no deployment required)
4. All active users will see updated behavior within 60 seconds (cache TTL)

## Wallet Management

### Viewing User Wallets

Currently, wallet balances are tracked in the `wallets` table. You can view them using Supabase dashboard or admin tools.

### Topping Up Wallets (Admin Only)

**Method 1: Via AdminUsers Page**
1. Go to Admin Dashboard → Users
2. Find the user
3. Click **Recharge** button next to their name
4. Enter amount and reason
5. Click **Confirm**

**Method 2: Via Supabase SQL**
```sql
SELECT * FROM admin_topup_wallet(
  'user-uuid-here',  -- Target user ID
  100,               -- Amount in MAD
  'manual_topup'     -- Reason
);
```

## Database Schema

### Tables Created

1. **platform_settings** - Stores monetization configuration
2. **artisan_profiles** - Service provider profiles
3. **wallets** - User wallet balances
4. **wallet_transactions** - Audit trail of all wallet operations
5. **contact_access_passes** - Time-limited contact reveal passes

### RPC Functions

Secure server-side functions (SECURITY DEFINER):

- `ensure_wallet_exists(user_id)` - Creates wallet if needed
- `debit_wallet_for_contact(city_id, service_category_id)` - Purchase contact access
- `check_contact_access(user_id, city_id, service_category_id)` - Check existing pass
- `toggle_artisan_boost(profile_id, enable)` - Enable/disable boost
- `admin_topup_wallet(user_id, amount, reason)` - Admin top-up (admin only)
- `get_my_wallet_balance()` - Get current user balance

## Security

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

- **Wallets**: Users can only view their own, no direct updates
- **Transactions**: Users can only view their own, no direct inserts
- **Passes**: Users can only view their own
- **Settings**: Public can read, only admins can update

### Secure Operations

- All wallet debits happen server-side via RPC functions
- Balance cannot go negative (enforced at SQL level)
- No client-side wallet updates possible
- Admin actions are logged to audit trail

## Testing Checklist

### Monetization OFF (Default)
- [ ] Phones visible normally without payment
- [ ] No "Reveal phone" buttons shown
- [ ] No wallet UI for visitors
- [ ] Artisans can create profiles freely

### Monetization ON
- [ ] "Reveal phone" button appears with correct fee
- [ ] Purchase flow works correctly
- [ ] Pass lasts 12 hours for same city + service category
- [ ] Wallet balance cannot go negative
- [ ] Non-admin cannot change settings
- [ ] Boosted artisans rank higher in results

### Admin Features
- [ ] Admin can toggle monetization on/off
- [ ] Admin can change pricing settings
- [ ] Admin can top up user wallets
- [ ] Changes apply immediately
- [ ] Admin actions logged to audit trail

## Troubleshooting

### Users Can't See Phones After Payment

1. Check if monetization is still enabled
2. Verify pass exists in `contact_access_passes` table
3. Check pass expiry time
4. Ensure city_id and service_category_id match

### Boost Not Working

1. Verify `pay_to_be_visible_enabled` is true
2. Check artisan wallet balance ≥ minimum
3. Ensure `is_boosted` flag is true in `artisan_profiles`
4. Verify listing query includes boost ordering

### Wallet Balance Incorrect

1. Check `wallet_transactions` table for audit trail
2. Verify no direct database updates bypassed RPC
3. Recalculate from transactions if needed

## Future Enhancements

- Stripe/payment gateway integration for self-service top-ups
- Subscription plans for artisans
- Dynamic pricing based on demand
- Analytics dashboard for monetization metrics

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Review `admin_audit_logs` for admin actions
3. Contact development team
