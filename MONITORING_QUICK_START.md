# Monitoring System - Admin Quick Start

This is a quick reference for administrators using the monitoring system.

## 🚀 Quick Access

**Admin Dashboard:** [/admin/monitoring](/admin/monitoring)

## 📊 Dashboard Overview

When you open the monitoring dashboard, you'll see:

### 1. System Health (Top Cards)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ System Status   │ Database        │ Recent Errors   │ Slow Queries    │
│ 🟢 Healthy      │ 🟢 OK           │ 2 (last 5 min) │ 5 (>500ms)      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Status Indicators:**
- 🟢 **Healthy** - All systems operational
- 🟡 **Degraded** - Some issues but functional
- 🔴 **Unhealthy** - Critical issues requiring attention

### 2. Filters

| Filter | Options | Purpose |
|--------|---------|---------|
| **Time Range** | Last hour, 6h, 24h, 7 days | Filter logs by time |
| **Log Level** | All, Error, Warning, Info, Debug | Filter by severity |
| **Metric Type** | All, Query, API, Page Load, Image | Filter performance data |
| **Search** | Text search | Search log messages |

### 3. System Logs Table

View all system logs with:
- **Level** - Severity badge (error, warn, info, debug)
- **Category** - Component name (e.g., "Auth", "Database")
- **Message** - Log description
- **Time** - When it occurred

### 4. Slow Queries Table

See performance issues:
- **Type** - query, api, page_load, image_load
- **Name** - Specific operation
- **Duration** - Time in milliseconds (red if >1000ms)
- **Time** - When it occurred

---

## 🔍 Common Tasks

### Check System Health

1. Go to `/admin/monitoring`
2. Look at the top 4 cards
3. If any show 🟡 or 🔴, investigate further

**Healthy System:**
- System Status: Healthy ✅
- Database: OK ✅
- Recent Errors: <10 ✅
- Slow Queries: <20 ✅

**Action Required:**
- System Status: Unhealthy ❌ → Check database connectivity
- Recent Errors: >50 ❌ → Review error logs immediately
- Slow Queries: >100 ❌ → Performance optimization needed

### Investigate Errors

**Steps:**
1. Set **Log Level** filter to "Error"
2. Set **Time Range** to "Last hour" (or wider if needed)
3. Review error messages in the table
4. Click to expand metadata for details
5. Note the correlation_id to trace related logs

**Common Error Categories:**
- `Auth` - Authentication issues
- `Database` - Query failures
- `Storage` - File upload/access issues
- `API` - External API failures

### Find Slow Operations

**Steps:**
1. Review **Slow Queries** count in health cards
2. Set **Metric Type** filter to narrow down (e.g., "Query")
3. Sort by duration (highest first)
4. Identify patterns (same operation appearing multiple times)

**Performance Thresholds:**
- 🟢 <500ms - Good
- 🟡 500-1000ms - Acceptable
- 🔴 >1000ms - Needs optimization

**Action Items:**
- If a query appears frequently >1000ms → Consider adding database index
- If page_load >3000ms → Investigate frontend performance
- If api >2000ms → Check external service health

### Search Logs

**Search Examples:**
- Search for user ID: `uuid-123-456`
- Search for feature: `payment`
- Search for error: `failed to fetch`

**Tips:**
- Search is case-insensitive
- Searches both message and category
- Combine with filters for best results

### Monitor Trends

**Daily Monitoring (5 minutes):**
1. Check system health cards
2. Review recent errors (should be <10)
3. Scan slow queries (should be <20)

**Weekly Review (15 minutes):**
1. Set time range to "Last 7 days"
2. Identify recurring errors
3. Review performance trends
4. Plan optimization tasks

---

## 🚨 Alert Thresholds

Default alerts (email notifications):

| Alert Type | Threshold | Time Window | Action |
|------------|-----------|-------------|--------|
| Error Spike | >50 errors | 5 minutes | Investigate immediately |
| DB Latency | >10 slow queries | 5 minutes | Check database health |
| Storage Failure | >5 errors | 5 minutes | Verify storage service |

**To modify alerts:**
```sql
-- Update error spike threshold
UPDATE alert_configurations
SET threshold = 100,
    notification_emails = ARRAY['admin@example.com', 'dev@example.com']
WHERE alert_type = 'error_spike';
```

---

## 🧹 Maintenance Tasks

### Clean Old Data

**Run monthly** to prevent database bloat:

```sql
SELECT cleanup_old_monitoring_data();
```

**Returns:**
```json
{
  "deleted_logs": 1234,
  "deleted_metrics": 567,
  "deleted_events": 890,
  "deleted_alerts": 45,
  "cleaned_at": "2024-02-14T10:30:00Z"
}
```

**Retention Periods:**
- System logs: 90 days
- Performance metrics: 30 days  
- Analytics events: 180 days
- Alert history: 90 days

### Export Logs (for analysis)

```sql
-- Export last 24 hours of errors
SELECT *
FROM system_logs
WHERE level = 'error'
  AND created_at > now() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 📈 Analytics Insights

While the monitoring dashboard focuses on errors and performance, you can query analytics directly:

```sql
-- Top viewed listings (last 7 days)
SELECT 
  entity_id,
  COUNT(*) as views
FROM analytics_events
WHERE event_type = 'listing_view'
  AND created_at > now() - INTERVAL '7 days'
GROUP BY entity_id
ORDER BY views DESC
LIMIT 10;

-- Phone reveals trend
SELECT 
  DATE(created_at) as date,
  COUNT(*) as phone_reveals
FROM analytics_events
WHERE event_type = 'phone_reveal'
  AND created_at > now() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

---

## ⚠️ Warning Signs

**Immediate Action Required:**

| Warning Sign | Severity | Action |
|--------------|----------|--------|
| System Status: Unhealthy | 🔴 Critical | Check database immediately |
| >100 errors in 5 minutes | 🔴 Critical | Review error logs, possible attack |
| >50 slow queries | 🟡 High | Database performance issue |
| Storage status: error | 🟡 High | Check Supabase storage service |

**Monitor Closely:**

| Warning Sign | Severity | Action |
|--------------|----------|--------|
| >20 errors in 5 minutes | 🟡 Medium | Review if errors are related |
| >20 slow queries | 🟡 Medium | Consider optimization |
| Database status: warning | 🟡 Medium | Monitor for degradation |

---

## 🔗 Quick Links

- **Main Dashboard:** [/admin](/admin)
- **Monitoring:** [/admin/monitoring](/admin/monitoring)
- **Users:** [/admin/users](/admin/users)
- **Listings:** [/admin/listings](/admin/listings)
- **Settings:** [/admin/settings](/admin/settings)

---

## 📞 Support

**For urgent issues:**
1. Check system health status
2. Review recent error logs
3. Contact development team with:
   - Screenshot of health status
   - Recent error messages
   - Correlation IDs if available

**For questions:**
- Refer to [MONITORING_SYSTEM_GUIDE.md](./MONITORING_SYSTEM_GUIDE.md)
- Contact: tech@topaffaireimmo.com

---

**Last Updated:** 2024-02-14
