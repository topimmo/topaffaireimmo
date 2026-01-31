import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
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
import { Loader2, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_role: string;
  advertiser_type: string | null;
  agency_name: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  created_at: string | null;
}

export default function AdminUsers() {
  const { language, isRTL } = useLanguage();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (roleFilter !== 'all') {
        query = query.eq('user_role', roleFilter);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        toast.error(isRTL ? 'خطأ في جلب المستخدمين' : 'Error fetching users');
        setUsers([]);
        setTotalCount(0);
        return;
      }

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error(isRTL ? 'خطأ غير متوقع' : 'Unexpected error');
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, page, isRTL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Utility function to escape CSV cell values
  const escapeCSVCell = (value: string | number | boolean): string => {
    const str = String(value);
    // If the value contains comma, newline, carriage return, or double quote, wrap it in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Utility function to generate CSV content
  const generateCSV = (users: Profile[]) => {
    const headers = [
      'ID',
      'Email',
      'Full Name',
      'Phone',
      'Role',
      'Advertiser Type',
      'Agency Name',
      'Active',
      'Verified',
      'Created At',
    ];

    const rows = users.map((user) => [
      user.id,
      user.email,
      user.full_name || '',
      user.phone || '',
      user.user_role,
      user.advertiser_type || '',
      user.agency_name || '',
      user.is_active ? 'Yes' : 'No',
      user.is_verified ? 'Yes' : 'No',
      user.created_at ? new Date(user.created_at).toISOString() : '',
    ]);

    return [
      headers.map(escapeCSVCell).join(','),
      ...rows.map((row) => row.map(escapeCSVCell).join(',')),
    ].join('\n');
  };

  const handleExportCSV = () => {
    try {
      const csvContent = generateCSV(filteredUsers);

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isRTL ? 'تم تصدير البيانات' : 'Data exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isRTL ? 'خطأ في التصدير' : 'Export error');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      agent: 'bg-purple-100 text-purple-800',
      merchant: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, { fr: string; ar: string }> = {
      user: { fr: 'Utilisateur', ar: 'مستخدم' },
      agent: { fr: 'Agent', ar: 'وكيل' },
      merchant: { fr: 'Commerçant', ar: 'تاجر' },
      admin: { fr: 'Admin', ar: 'مدير' },
    };

    const label = language === 'ar' ? labels[role]?.ar : labels[role]?.fr;

    return (
      <Badge className={cn('font-medium', variants[role] || '')}>
        {label || role}
      </Badge>
    );
  };

  const getAdvertiserTypeBadge = (advertiserType?: string | null) => {
    if (!advertiserType) return null;

    const variants: Record<string, string> = {
      owner: 'bg-blue-100 text-blue-800',
      broker: 'bg-purple-100 text-purple-800',
      agency: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<string, { fr: string; ar: string }> = {
      owner: { fr: 'Propriétaire', ar: 'مالك' },
      broker: { fr: 'Courtier', ar: 'سمسار' },
      agency: { fr: 'Agence', ar: 'وكالة' },
    };

    const label = language === 'ar' ? labels[advertiserType]?.ar : labels[advertiserType]?.fr;

    return (
      <Badge className={cn('font-medium text-xs', variants[advertiserType] || '')}>
        {label || advertiserType}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
  };

  // Memoize filtered users to avoid recomputation on every render
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter((user) => 
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.agency_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Memoize statistics calculations to avoid recomputation on every render
  const userStats = useMemo(() => ({
    activeUsers: users.filter((u) => u.is_active).length,
    agents: users.filter((u) => u.user_role === 'agent').length,
    agencies: users.filter((u) => u.advertiser_type === 'agency').length,
  }), [users]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'إدارة المستخدمين' : 'User Management'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRTL
                ? 'عرض وإدارة حسابات المستخدمين'
                : 'View and manage user accounts'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={filteredUsers.length === 0}
            >
              <Download className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
              {isRTL ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isRTL ? 'البحث بالاسم، البريد الإلكتروني، الهاتف...' : 'Search by name, email, phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={isRTL ? 'اختر الدور' : 'Select role'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="user">{isRTL ? 'مستخدم' : 'User'}</SelectItem>
              <SelectItem value="agent">{isRTL ? 'وكيل' : 'Agent'}</SelectItem>
              <SelectItem value="merchant">{isRTL ? 'تاجر' : 'Merchant'}</SelectItem>
              <SelectItem value="admin">{isRTL ? 'مدير' : 'Admin'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isRTL ? 'لا يوجد مستخدمون' : 'No users found'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                      <TableHead>{isRTL ? 'الهاتف' : 'Phone'}</TableHead>
                      <TableHead>{isRTL ? 'الدور' : 'Role'}</TableHead>
                      <TableHead>{isRTL ? 'نوع المعلن' : 'Advertiser Type'}</TableHead>
                      <TableHead>{isRTL ? 'الوكالة' : 'Agency'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'تاريخ التسجيل' : 'Registered'}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {user.full_name || '-'}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {user.email}
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.user_role)}</TableCell>
                        <TableCell>{getAdvertiserTypeBadge(user.advertiser_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {user.agency_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.is_active ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {isRTL ? 'نشط' : 'Active'}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 text-xs">
                                {isRTL ? 'غير نشط' : 'Inactive'}
                              </Badge>
                            )}
                            {user.is_verified && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {isRTL ? 'موثق' : 'Verified'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalCount > pageSize && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    {isRTL
                      ? `عرض ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} من ${totalCount}`
                      : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {isRTL ? 'السابق' : 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= totalCount}
                    >
                      {isRTL ? 'التالي' : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'إجمالي المستخدمين' : 'Total Users'}
            </p>
            <p className="text-2xl font-bold mt-1">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'المستخدمون النشطون' : 'Active Users'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {userStats.activeUsers}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'الوكلاء' : 'Agents'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {userStats.agents}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'الوكالات' : 'Agencies'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {userStats.agencies}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
