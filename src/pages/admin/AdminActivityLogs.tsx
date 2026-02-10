import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Clock,
  User,
  Building2,
  Settings,
  Shield,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  metadata: any;
  created_at: string;
  admin?: {
    full_name: string;
    email: string;
  };
}

const actionColors: Record<string, string> = {
  approve: "bg-green-100 text-green-700",
  reject: "bg-red-100 text-red-700",
  create: "bg-blue-100 text-blue-700",
  update: "bg-yellow-100 text-yellow-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-purple-100 text-purple-700",
};

const actionIcons: Record<string, any> = {
  property: Building2,
  user: User,
  settings: Settings,
  admin: Shield,
};

export default function AdminActivityLogs() {
  const { isRTL } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    
    let query = supabase
      .from("admin_audit_logs")
      .select("*, admin:admins(id)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (actionFilter !== "all") {
      query = query.eq("action", actionFilter);
    }
    if (entityFilter !== "all") {
      query = query.eq("entity_type", entityFilter);
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setLogs(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) =>
    searchQuery
      ? log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(isRTL ? "ar-MA" : "fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isRTL ? "سجل النشاط" : "Activity Logs"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? "عرض جميع الإجراءات الإدارية"
                : "View all administrative actions"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchLogs} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {isRTL ? "تحديث" : "Refresh"}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {isRTL ? "تصدير" : "Export"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? "بحث..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={isRTL ? "الإجراء" : "Action"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="approve">{isRTL ? "موافقة" : "Approve"}</SelectItem>
                  <SelectItem value="reject">{isRTL ? "رفض" : "Reject"}</SelectItem>
                  <SelectItem value="create">{isRTL ? "إنشاء" : "Create"}</SelectItem>
                  <SelectItem value="update">{isRTL ? "تحديث" : "Update"}</SelectItem>
                  <SelectItem value="delete">{isRTL ? "حذف" : "Delete"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={isRTL ? "النوع" : "Entity"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="property">{isRTL ? "إعلان" : "Property"}</SelectItem>
                  <SelectItem value="user">{isRTL ? "مستخدم" : "User"}</SelectItem>
                  <SelectItem value="settings">{isRTL ? "إعدادات" : "Settings"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isRTL ? "الإجراء" : "Action"}</TableHead>
                  <TableHead>{isRTL ? "النوع" : "Entity"}</TableHead>
                  <TableHead>{isRTL ? "المعرف" : "ID"}</TableHead>
                  <TableHead>{isRTL ? "التفاصيل" : "Details"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {isRTL ? "جاري التحميل..." : "Loading..."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {isRTL ? "لا توجد سجلات" : "No logs found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const Icon = actionIcons[log.entity_type] || Clock;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-700"}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {log.entity_type}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.entity_id?.slice(0, 8) || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata).slice(0, 50) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? `عرض ${(page - 1) * perPage + 1} - ${Math.min(page * perPage, totalCount)} من ${totalCount}`
                : `Showing ${(page - 1) * perPage + 1} - ${Math.min(page * perPage, totalCount)} of ${totalCount}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
