# TopAffaireImmo - Admin Access Guide

## 🔐 Admin Dashboard Access

### Access URLs
| Page | URL |
|------|-----|
| **Main Site** | https://a6982325-0dd2-474c-8264-fc57e47def16.canvases.tempo.build/ |
| **Admin Panel** | https://a6982325-0dd2-474c-8264-fc57e47def16.canvases.tempo.build/admin |
| **Login** | https://a6982325-0dd2-474c-8264-fc57e47def16.canvases.tempo.build/login |
| **Register** | https://a6982325-0dd2-474c-8264-fc57e47def16.canvases.tempo.build/register |

---

## 📋 Creating an Admin Account

### Step 1: Register a New Account
1. Go to the Register page
2. Select "Annonceur Immobilier" (Real Estate Advertiser) - we'll upgrade to admin later
3. Create account with:
   - Email: `admin@topaffaireimmo.ma` (or your preferred admin email)
   - Password: Choose a secure password (min 6 characters)
   - Full Name: Admin

### Step 2: Grant Admin Access via Supabase

**Option A: Via Supabase Dashboard**
1. Go to your **Supabase Dashboard** at https://app.supabase.com
2. Navigate to **Table Editor** > **profiles**
3. Find the user by email
4. Update these columns:
   - `user_role`: `admin`
   - `is_admin`: `true`
   - `is_verified`: `true`
   - `is_active`: `true`
5. Save changes

**Option B: Via SQL Editor**
Run this SQL in Supabase SQL Editor:
```sql
UPDATE public.profiles 
SET 
  user_role = 'admin',
  is_admin = true,
  is_verified = true,
  is_active = true
WHERE email = 'your-admin-email@example.com';
```

---

## 🔄 Role Separation (CRITICAL)

The platform enforces **strict role separation**:

| Role | Dashboard | Capabilities |
|------|-----------|--------------|
| `real_estate_advertiser` | `/dashboard` | Create property listings (FREE) |
| `commercial_advertiser` | `/commercial-dashboard` | Create banner ads (PAID) |
| `admin` | `/admin` + all others | Full platform access |

**Important**: Users are automatically redirected to their correct dashboard based on role.

---

## 👤 Admin Capabilities

### Properties Management
- ✅ View all property listings (pending, approved, rejected)
- ✅ Approve pending property listings
- ✅ Reject property listings with notes
- ✅ Delete any property
- ✅ View property details and images

### Banner Advertising Management
- ✅ View all banner ad requests
- ✅ Approve banner requests (auto-activates with dates)
- ✅ Reject banner requests
- ✅ Add admin notes to requests
- ✅ View payment proofs
- ✅ Track impressions and clicks

### User Management
- ✅ View all registered users
- ✅ Change user roles
- ✅ Activate/Deactivate accounts

---

## 🔑 Security Notes

1. **Never share admin credentials**
2. **Use strong passwords** (min 6 characters)
3. **Admin access is enforced at database level (RLS)**
4. Only users with `is_admin = true` can access `/admin`

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Admin can login at `/login`
- [ ] Admin can access `/admin` panel
- [ ] Admin can see Properties tab
- [ ] Admin can see Banner Ads tab  
- [ ] Admin can approve/reject listings
- [ ] Real estate users can create listings at `/add-listing`
- [ ] Commercial users can create ads at `/commercial-dashboard`

