import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  AlertTriangle, 
  Database, 
  Zap, 
  TrendingUp, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import logger from '@/lib/logger';

interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  metadata: any;
  user_id: string | null;
  correlation_id: string | null;
  created_at: string;
}

interface PerformanceMetric {
  id: string;
  metric_type: 'query' | 'api' | 'page_load' | 'image_load';
  metric_name: string;
  duration_ms: number;
  metadata: any;
  created_at: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: string;
  storage: string;
  rls: string;
  tables: string;
  recent_errors: number;
  slow_queries: number;
  checked_at: string;
}

export default function AdminMonitoring() {
  const { language, isRTL } = useLanguage();
  
  // State
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [logLevel, setLogLevel] = useState<string>('all');
  const [metricType, setMetricType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<string>('1h');
  
  // Pagination
  const [logsPage, setLogsPage] = useState(0);
  const [metricsPage, setMetricsPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [logLevel, metricType, timeRange, logsPage, metricsPage]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      await Promise.all([
        fetchLogs(),
        fetchMetrics(),
        fetchHealth(),
      ]);
    } catch (error) {
      logger.error('AdminMonitoring', 'Failed to fetch monitoring data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLogs = async () => {
    if (!supabase) return;

    try {
      // Build time filter
      const timeFilter = getTimeFilter();
      
      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false })
        .range(logsPage * pageSize, (logsPage + 1) * pageSize - 1);

      // Apply level filter
      if (logLevel !== 'all') {
        query = query.eq('level', logLevel);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`message.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      logger.error('AdminMonitoring', 'Failed to fetch logs', error);
    }
  };

  const fetchMetrics = async () => {
    if (!supabase) return;

    try {
      const timeFilter = getTimeFilter();
      
      let query = supabase
        .from('performance_metrics')
        .select('*', { count: 'exact' })
        .gte('created_at', timeFilter)
        .order('duration_ms', { ascending: false })
        .range(metricsPage * pageSize, (metricsPage + 1) * pageSize - 1);

      // Apply type filter
      if (metricType !== 'all') {
        query = query.eq('metric_type', metricType);
      }

      // Only show slow metrics (>500ms)
      query = query.gte('duration_ms', 500);

      const { data, error } = await query;

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      logger.error('AdminMonitoring', 'Failed to fetch metrics', error);
    }
  };

  const fetchHealth = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.rpc('check_system_health');

      if (error) throw error;
      setHealth(data);
    } catch (error) {
      logger.error('AdminMonitoring', 'Failed to fetch health status', error);
    }
  };

  const getTimeFilter = (): string => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '6h':
        return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive" className="font-mono">{level}</Badge>;
      case 'warn':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 font-mono">{level}</Badge>;
      case 'info':
        return <Badge variant="secondary" className="font-mono">{level}</Badge>;
      case 'debug':
        return <Badge variant="outline" className="font-mono">{level}</Badge>;
      default:
        return <Badge className="font-mono">{level}</Badge>;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Healthy</span>
          </div>
        );
      case 'degraded':
      case 'warning':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Degraded</span>
          </div>
        );
      case 'unhealthy':
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="font-medium">Unhealthy</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{status}</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === 'ar' ? 'مراقبة النظام' : 'System Monitoring'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'مراقبة الأداء والأخطاء والصحة العامة للنظام'
                : 'Monitor performance, errors, and system health'}
            </p>
          </div>
          <Button
            onClick={() => fetchData()}
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {/* System Health Overview */}
        {health && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'حالة النظام' : 'System Status'}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {getHealthBadge(health.status)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {getHealthBadge(health.database)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'الأخطاء الأخيرة' : 'Recent Errors'}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health.recent_errors}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'في آخر 5 دقائق' : 'Last 5 minutes'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'الاستعلامات البطيئة' : 'Slow Queries'}
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health.slow_queries}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? '>500 ميلي ثانية' : '>500ms'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {language === 'ar' ? 'الفلاتر' : 'Filters'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'الفترة الزمنية' : 'Time Range'}
                </label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">{language === 'ar' ? 'آخر ساعة' : 'Last hour'}</SelectItem>
                    <SelectItem value="6h">{language === 'ar' ? 'آخر 6 ساعات' : 'Last 6 hours'}</SelectItem>
                    <SelectItem value="24h">{language === 'ar' ? 'آخر 24 ساعة' : 'Last 24 hours'}</SelectItem>
                    <SelectItem value="7d">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'مستوى السجل' : 'Log Level'}
                </label>
                <Select value={logLevel} onValueChange={setLogLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="error">{language === 'ar' ? 'خطأ' : 'Error'}</SelectItem>
                    <SelectItem value="warn">{language === 'ar' ? 'تحذير' : 'Warning'}</SelectItem>
                    <SelectItem value="info">{language === 'ar' ? 'معلومات' : 'Info'}</SelectItem>
                    <SelectItem value="debug">{language === 'ar' ? 'تصحيح' : 'Debug'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'نوع المقياس' : 'Metric Type'}
                </label>
                <Select value={metricType} onValueChange={setMetricType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="query">{language === 'ar' ? 'استعلام' : 'Query'}</SelectItem>
                    <SelectItem value="api">{language === 'ar' ? 'API' : 'API'}</SelectItem>
                    <SelectItem value="page_load">{language === 'ar' ? 'تحميل الصفحة' : 'Page Load'}</SelectItem>
                    <SelectItem value="image_load">{language === 'ar' ? 'تحميل الصورة' : 'Image Load'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'بحث' : 'Search'}
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث في السجلات...' : 'Search logs...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {language === 'ar' ? 'سجلات النظام' : 'System Logs'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? `عرض ${logs.length} سجل`
                : `Showing ${logs.length} logs`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'المستوى' : 'Level'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الرسالة' : 'Message'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الوقت' : 'Time'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد سجلات' : 'No logs found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getLevelBadge(log.level)}</TableCell>
                        <TableCell className="font-mono text-sm">{log.category}</TableCell>
                        <TableCell className="max-w-md truncate">{log.message}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {logs.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsPage(Math.max(0, logsPage - 1))}
                  disabled={logsPage === 0}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? `صفحة ${logsPage + 1}` : `Page ${logsPage + 1}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsPage(logsPage + 1)}
                  disabled={logs.length < pageSize}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slow Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === 'ar' ? 'الاستعلامات البطيئة' : 'Slow Queries'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? `عرض ${metrics.length} مقياس بطيء (>500ms)`
                : `Showing ${metrics.length} slow metrics (>500ms)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المدة' : 'Duration'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الوقت' : 'Time'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد مقاييس بطيئة' : 'No slow metrics found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {metric.metric_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{metric.metric_name}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${metric.duration_ms > 1000 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {metric.duration_ms}ms
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(metric.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {metrics.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMetricsPage(Math.max(0, metricsPage - 1))}
                  disabled={metricsPage === 0}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? `صفحة ${metricsPage + 1}` : `Page ${metricsPage + 1}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMetricsPage(metricsPage + 1)}
                  disabled={metrics.length < pageSize}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
