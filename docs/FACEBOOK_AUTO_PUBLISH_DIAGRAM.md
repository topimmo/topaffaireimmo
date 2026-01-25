# Facebook Auto-Publish Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FACEBOOK AUTO-PUBLISH FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

ACTORS:
  👤 Regular User    👨‍💼 Admin    🔧 System    📘 Database    🌐 Make    📱 Facebook


FLOW 1: LISTING CREATION
─────────────────────────

👤 User                         📘 Database
  │                               │
  │ Create Listing                │
  ├──────────────────────────────>│
  │                               │ INSERT properties
  │                               │ status = 'pending'
  │                               │ facebook_posted = false
  │                               │
  │ Listing Created               │
  │<──────────────────────────────┤
  │                               │


FLOW 2: ADMIN APPROVAL & FACEBOOK POSTING
──────────────────────────────────────────

👨‍💼 Admin          🔧 Frontend         🔧 Edge Function      🌐 Make         📱 Facebook
  │                   │                     │                   │                 │
  │ Click Approve     │                     │                   │                 │
  ├──────────────────>│                     │                   │                 │
  │                   │                     │                   │                 │
  │                   │ UPDATE properties   │                   │                 │
  │                   │ status='approved'   │                   │                 │
  │                   │ approved_at=NOW()   │                   │                 │
  │                   │ approved_by=admin   │                   │                 │
  │                   ├────────────────────>│                   │                 │
  │                   │                     │ 📘 Database       │                 │
  │                   │                     │ UPDATE successful │                 │
  │                   │                     │                   │                 │
  │                   │ Call Edge Function  │                   │                 │
  │                   │ sendFacebookWebhook │                   │                 │
  │                   ├────────────────────>│                   │                 │
  │                   │                     │                   │                 │
  │                   │                     │ Check Idempotency │                 │
  │                   │                     │ facebook_posted?  │                 │
  │                   │                     ├──────────────────>│                 │
  │                   │                     │ 📘 false          │                 │
  │                   │                     │                   │                 │
  │                   │                     │ Fetch Listing     │                 │
  │                   │                     │ (with city, img)  │                 │
  │                   │                     ├──────────────────>│                 │
  │                   │                     │ 📘 listing data   │                 │
  │                   │                     │                   │                 │
  │                   │                     │ POST Webhook      │                 │
  │                   │                     ├──────────────────>│                 │
  │                   │                     │                   │ Process Webhook │
  │                   │                     │                   │                 │
  │                   │                     │                   │ Create Post     │
  │                   │                     │                   ├────────────────>│
  │                   │                     │                   │                 │
  │                   │                     │                   │ ✅ Post Created │
  │                   │                     │                   │ post_id: 12345  │
  │                   │                     │                   │<────────────────┤
  │                   │                     │                   │                 │
  │                   │                     │ ✅ Success        │                 │
  │                   │                     │<──────────────────┤                 │
  │                   │                     │                   │                 │
  │                   │                     │ UPDATE properties │                 │
  │                   │                     │ facebook_posted=T │                 │
  │                   │                     │ facebook_post_id  │                 │
  │                   │                     ├──────────────────>│                 │
  │                   │                     │ 📘 Updated        │                 │
  │                   │                     │                   │                 │
  │                   │ ✅ Success          │                   │                 │
  │                   │<────────────────────┤                   │                 │
  │                   │                     │                   │                 │
  │ Toast: Posted!    │                     │                   │                 │
  │<──────────────────┤                     │                   │                 │
  │                   │                     │                   │                 │


FLOW 3: IDEMPOTENCY CHECK (Prevent Duplicate Posts)
────────────────────────────────────────────────────

👨‍💼 Admin          🔧 Edge Function      📘 Database
  │                   │                     │
  │ Approve Again     │                     │
  ├──────────────────>│                     │
  │                   │                     │
  │                   │ Check facebook_posted
  │                   ├────────────────────>│
  │                   │                     │
  │                   │ 📘 facebook_posted=true
  │                   │<────────────────────┤
  │                   │                     │
  │                   │ ⚠️ Already Posted   │
  │                   │ (Skip Webhook)      │
  │                   │                     │
  │ Already Posted    │                     │
  │<──────────────────┤                     │
  │                   │                     │


FLOW 4: ERROR HANDLING & RETRY
───────────────────────────────

👨‍💼 Admin          🔧 Edge Function      🌐 Make         📘 Database
  │                   │                     │                 │
  │ Approve           │                     │                 │
  ├──────────────────>│                     │                 │
  │                   │                     │                 │
  │                   │ POST Webhook        │                 │
  │                   ├────────────────────>│                 │
  │                   │                     │                 │
  │                   │ ❌ Error 500        │                 │
  │                   │<────────────────────┤                 │
  │                   │                     │                 │
  │                   │ Store Error         │                 │
  │                   │ facebook_post_error │                 │
  │                   │ facebook_posted=F   │                 │
  │                   ├────────────────────────────────────>  │
  │                   │                     │ 📘 Saved        │
  │                   │                     │                 │
  │ ⚠️ Failed          │                     │                 │
  │<──────────────────┤                     │                 │
  │                   │                     │                 │
  │ View Detail       │                     │                 │
  │ Click Retry       │                     │                 │
  ├──────────────────>│                     │                 │
  │                   │                     │                 │
  │                   │ Reset Flag          │                 │
  │                   │ facebook_posted=F   │                 │
  │                   ├────────────────────────────────────>  │
  │                   │                     │                 │
  │                   │ POST Webhook        │                 │
  │                   ├────────────────────>│                 │
  │                   │                     │                 │
  │                   │ ✅ Success          │                 │
  │                   │<────────────────────┤                 │
  │                   │                     │                 │
  │                   │ UPDATE posted=true  │                 │
  │                   ├────────────────────────────────────>  │
  │                   │                     │                 │
  │ ✅ Posted!         │                     │                 │
  │<──────────────────┤                     │                 │
  │                   │                     │                 │


DATABASE STATE TRANSITIONS
──────────────────────────

┌────────────┐  User Creates  ┌────────────┐  Admin Approves  ┌────────────┐
│   DRAFT    │───────────────>│  PENDING   │─────────────────>│  APPROVED  │
│            │                │            │                  │            │
│ posted=F   │                │ posted=F   │                  │ posted=F   │
└────────────┘                └────────────┘                  └────────────┘
                                                                     │
                                                                     │ Webhook Success
                                                                     ▼
                                                              ┌────────────┐
                                                              │  APPROVED  │
                                                              │            │
                                                              │ posted=T ✅│
                                                              └────────────┘


KEY POINTS
──────────

✅ IDEMPOTENCY: facebook_posted flag prevents duplicate posts
✅ SECURITY: Only admins can approve, webhook URL is secret
✅ RELIABILITY: Errors stored, retry available
✅ VISIBILITY: Admin UI shows status at all times
✅ ATOMICITY: Database updates happen in transactions
```
