import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AdminLayout from '@/components/layout/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
export default function AdminUsers() {
    const { isRTL } = useLanguage();
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: isRTL ? 'إدارة المستخدمين' : 'User Management' }), _jsx("p", { className: "mt-2 text-muted-foreground", children: isRTL
                                ? 'صفحة إدارة المستخدمين (قيد التطوير)'
                                : 'User management page (under development)' })] }), _jsx("div", { className: "bg-white rounded-lg border p-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: isRTL
                            ? 'هذه الصفحة قيد التطوير. يمكنك استخدام الصفحة القديمة في /admin-panel للوصول إلى إدارة المستخدمين.'
                            : 'This page is under development. You can use the legacy page at /admin-panel to access user management.' }) })] }) }));
}
