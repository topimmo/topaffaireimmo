# Production Monitoring & Observability System

This document describes the comprehensive monitoring, logging, and observability system implemented for TopAffaireImmo.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Frontend Integration](#frontend-integration)
- [Admin Dashboard](#admin-dashboard)
- [Usage Guide](#usage-guide)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The monitoring system provides:

1. **Error Tracking** - Capture frontend and backend errors with Sentry
2. **Performance Monitoring** - Track slow queries, API latency, page loads
3. **System Health** - Monitor database, storage, and RLS status
4. **Analytics** - Privacy-safe tracking of user behavior
5. **Alerts** - Email notifications for critical issues
6. **Admin Dashboard** - Centralized view of all monitoring data

---

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Sentry  │  │  Logger  │  │Performance│ │Analytics││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘│
│       │             │              │              │      │
└───────┼─────────────┼──────────────┼──────────────┼─────┘
        │             │              │              │
        v             v              v              v
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐│
│  │ system_logs  │  │ performance_ │  │ analytics_     ││
│  │              │  │ metrics      │  │ events         ││
│  └──────────────┘  └──────────────┘  └────────────────┘│
│                                                          │
│  RPC Functions:                                          │
│  - log_system_event()                                    │
│  - track_performance_metric()                            │
│  - track_analytics_event()                               │
│  - check_system_health()                                 │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│              Admin Monitoring Dashboard                  │
│  - System Health Status                                  │
│  - Error Logs                                            │
│  - Slow Query Analysis                                   │
│  - Analytics Reports                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. system_logs

Stores all system logs (errors, warnings, info).

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY,
  level TEXT NOT NULL,              -- 'debug', 'info', 'warn', 'error'
  category TEXT NOT NULL,            -- e.g., 'Auth', 'Database', 'API'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  correlation_id TEXT,               -- For request tracing
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_system_logs_level` - Filter by log level
- `idx_system_logs_created_at` - Time-based queries
- `idx_system_logs_level_created` - Combined filtering
- `idx_system_logs_category` - Filter by category

**RLS:** Only admins can read. Inserts via RPC only.

### 2. performance_metrics

Tracks performance data for queries, APIs, and page loads.

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  metric_type TEXT NOT NULL,         -- 'query', 'api', 'page_load', 'image_load'
  metric_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_performance_metrics_type` - Filter by type
- `idx_performance_metrics_duration` - Find slow metrics
- `idx_performance_metrics_slow` - Partial index for >500ms

**RLS:** Only admins can read. Inserts via RPC only.

### 3. analytics_events

Privacy-safe analytics (no personal data).

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,          -- 'listing_view', 'profile_view', etc.
  entity_id UUID,                    -- ID of viewed entity (not user)
  metadata JSONB DEFAULT '{}',
  session_id TEXT,                   -- Anonymous session
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Privacy:** No user_id stored. Session IDs are anonymous.

**RLS:** Only admins can read. Public can insert.

### 4. alert_configurations

Configure alert thresholds and recipients.

```sql
CREATE TABLE alert_configurations (
  id UUID PRIMARY KEY,
  alert_type TEXT NOT NULL,          -- 'error_spike', 'db_latency', etc.
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER DEFAULT 5,
  notification_emails TEXT[],
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. alert_history

Track when alerts were triggered.

```sql
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  alert_config_id UUID,
  alert_type TEXT NOT NULL,
  trigger_count INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## RPC Functions

### log_system_event()

```sql
SELECT log_system_event(
  p_level := 'error',
  p_category := 'Authentication',
  p_message := 'User login failed',
  p_metadata := '{"email": "user@example.com"}'::jsonb,
  p_correlation_id := 'req-123-456',
  p_url := 'https://example.com/login'
);
```

**Features:**
- Rate limiting: 100 logs/user/minute
- Automatic user_id attachment
- Sanitizes sensitive data

### track_performance_metric()

```sql
SELECT track_performance_metric(
  p_metric_type := 'query',
  p_metric_name := 'fetch_properties',
  p_duration_ms := 750,
  p_metadata := '{"count": 50}'::jsonb
);
```

### track_analytics_event()

```sql
SELECT track_analytics_event(
  p_event_type := 'listing_view',
  p_entity_id := 'uuid-of-listing',
  p_metadata := '{"source": "search"}'::jsonb,
  p_session_id := 'session-123'
);
```

**Privacy:** Never stores user_id or personal data.

### check_system_health()

```sql
SELECT check_system_health();
-- Returns:
{
  "status": "healthy",
  "database": "ok",
  "storage": "ok",
  "rls": "ok",
  "tables": "ok",
  "recent_errors": 2,
  "slow_queries": 5,
  "checked_at": "2024-01-15T10:30:00Z"
}
```

---

## 💻 Frontend Integration

### 1. Logger Usage

```typescript
import logger from '@/lib/logger';

// Log an error
logger.error('UserProfile', 'Failed to load profile', error);

// Log a warning
logger.warn('Payment', 'Approaching rate limit', { remaining: 5 });

// Log info (production only)
logger.info('Auth', 'User logged in', { userId });

// Use correlated logger for request tracking
import { createCorrelatedLogger } from '@/lib/logger';
const log = createCorrelatedLogger('CheckoutFlow');
log.info('Starting checkout');
// ... later in the flow ...
log.error('Payment failed', error);
```

### 2. Performance Tracking

```typescript
import { trackQuery, trackPerformance } from '@/lib/performance';

// Track a Supabase query
const properties = await trackQuery(
  'fetch_properties',
  async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .limit(50);
    return data;
  },
  { limit: 50 }
);

// Manual performance tracking
import { createTimer } from '@/lib/performance';
const timer = createTimer('query', 'complex_aggregation');
// ... do work ...
timer.end({ rowCount: 100 });
```

### 3. Analytics Tracking

```typescript
import { trackListingView, trackPhoneReveal } from '@/lib/analytics';

// Track listing view (privacy-safe)
trackListingView(listingId, { source: 'search' });

// Track phone reveal
trackPhoneReveal(listingId, 'listing');
```

### 4. Sentry Error Tracking

```typescript
import { captureException, setUserContext } from '@/lib/sentry';

// Set user context (on login)
setUserContext({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Capture exception manually
try {
  // ... code ...
} catch (error) {
  captureException(error, { 
    extra: { listingId, action: 'publish' } 
  });
}
```

---

## 📊 Admin Dashboard

Access at `/admin/monitoring`

### Features

1. **System Health Overview**
   - Overall system status (healthy/degraded/unhealthy)
   - Database status
   - Recent error count (last 5 minutes)
   - Slow query count (>500ms)

2. **Error Logs**
   - Filter by level (error, warn, info, debug)
   - Search by message/category
   - Time range filtering (1h, 6h, 24h, 7d)
   - Pagination

3. **Performance Metrics**
   - Slow queries (>500ms)
   - Filter by type (query, api, page_load, image_load)
   - Duration sorting
   - Metadata inspection

4. **Auto-Refresh**
   - Dashboard refreshes every 30 seconds
   - Manual refresh button available

### Screenshots

*(Screenshots would be added here after implementation)*

---

## ⚙️ Configuration

### Environment Variables

```bash
# Sentry Configuration (optional)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_SENTRY_RELEASE=v1.0.0         # Auto-set during build

# For CI/CD (DO NOT commit these)
# SENTRY_AUTH_TOKEN=xxx
# SENTRY_ORG=topaffaireimmo
# SENTRY_PROJECT=topaffaireimmo-web
```

### Alert Configuration

Default alerts are created automatically:

1. **Error Spike** - >50 errors in 5 minutes
2. **DB Latency** - >10 slow queries in 5 minutes
3. **Storage Failure** - >5 storage errors in 5 minutes

To modify alerts:

```sql
UPDATE alert_configurations
SET threshold = 100,
    notification_emails = ARRAY['admin@example.com']
WHERE alert_type = 'error_spike';
```

---

## 🔍 Usage Guide

### For Developers

1. **Always use the logger for errors:**
   ```typescript
   logger.error('ComponentName', 'Description', error);
   ```

2. **Track slow operations:**
   ```typescript
   const timer = createTimer('query', 'operation_name');
   // ... operation ...
   timer.end();
   ```

3. **Privacy-first analytics:**
   ```typescript
   trackListingView(listingId);  // ✅ Good - no personal data
   // ❌ Don't track user_id or email
   ```

### For Admins

1. **Access Monitoring Dashboard:**
   - Navigate to `/admin/monitoring`
   - View system health at a glance
   - Filter and search logs

2. **Investigate Errors:**
   - Check "Recent Errors" count
   - Filter logs by level="error"
   - Review error messages and metadata
   - Check correlation_id to trace requests

3. **Optimize Performance:**
   - Review "Slow Queries" section
   - Identify frequently slow operations
   - Add indexes if needed
   - Optimize query patterns

4. **Clean Up Old Data:**
   ```sql
   SELECT cleanup_old_monitoring_data();
   -- Returns: { deleted_logs, deleted_metrics, deleted_events, ... }
   ```

   **Retention:**
   - System logs: 90 days
   - Performance metrics: 30 days
   - Analytics events: 180 days
   - Alert history: 90 days

---

## 🐛 Troubleshooting

### Logs not appearing in dashboard

**Problem:** Logs are in console but not in database.

**Solution:**
1. Check if you're in production mode (`import.meta.env.PROD`)
2. Verify Supabase connection
3. Check RLS policies (admins table)
4. Check rate limiting (100 logs/user/minute)

### Performance metrics not tracked

**Problem:** Slow queries not showing up.

**Solution:**
1. Ensure `trackQuery()` or `trackPerformance()` is used
2. Only queries >500ms are indexed (check duration threshold)
3. Verify `track_performance_metric` RPC exists

### Sentry not capturing errors

**Problem:** Errors not appearing in Sentry.

**Solution:**
1. Check `VITE_SENTRY_DSN` is set correctly
2. Verify production environment (`import.meta.env.PROD`)
3. Check DSN format (should not contain "YOUR_SENTRY_DSN")
4. Review Sentry project settings

### Health check returns "unhealthy"

**Problem:** System health shows as unhealthy.

**Solution:**
1. Check error details in health response
2. Verify storage buckets exist
3. Ensure RLS is enabled on critical tables
4. Check database connection

---

## 📈 Performance Impact

The monitoring system is designed for minimal performance impact:

1. **Database Logging:**
   - Only warn/error logs persisted (not debug/info)
   - Async fire-and-forget (never blocks main thread)
   - Rate limiting prevents abuse

2. **Performance Tracking:**
   - Negligible overhead (~1-2ms)
   - Indexed queries for fast retrieval
   - Partial indexes for slow queries only

3. **Analytics:**
   - Lightweight event tracking
   - No complex aggregations on insert
   - Privacy-safe (no joins with user data)

4. **Sentry:**
   - 10% transaction sampling
   - Data sanitization before send
   - Error filtering (ignores benign errors)

---

## 🔒 Security & Privacy

### Data Sanitization

All logging utilities automatically sanitize:
- Passwords
- Tokens (access, refresh, API keys)
- Session IDs
- Email addresses (partial masking)

### RLS Policies

- ✅ Only admins can read monitoring data
- ✅ Inserts only via RPC functions
- ✅ Rate limiting on log inserts
- ✅ User context automatically attached

### Privacy-Safe Analytics

- ❌ No user_id stored
- ❌ No personal data (email, phone, name)
- ✅ Only aggregated, anonymous data
- ✅ Session IDs are ephemeral

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Web Vitals](https://web.dev/vitals/)

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `/admin/monitoring`
3. Contact the development team

---

**Last Updated:** 2024-02-14
**Version:** 1.0.0
