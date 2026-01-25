import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Home, Inbox, Calendar, Search, Settings, } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarInset, SidebarSeparator, } from "../components/ui/sidebar";
const meta = {
    title: "ui/Sidebar",
    component: Sidebar,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
const items = [
    { title: "Home", icon: Home },
    { title: "Inbox", icon: Inbox },
    { title: "Calendar", icon: Calendar },
    { title: "Search", icon: Search },
    { title: "Settings", icon: Settings },
];
export const Default = {
    render: () => (_jsxs(SidebarProvider, { children: [_jsxs(Sidebar, { children: [_jsx(SidebarHeader, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { size: "lg", children: [_jsx("div", { className: "flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: "A" }), _jsxs("div", { className: "flex flex-col gap-0.5 leading-none", children: [_jsx("span", { className: "font-semibold", children: "Acme Inc" }), _jsx("span", { className: "text-xs", children: "Enterprise" })] })] }) }) }) }), _jsx(SidebarContent, { children: _jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Application" }), _jsx(SidebarGroupContent, { children: _jsx(SidebarMenu, { children: items.map((item) => (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { children: [_jsx(item.icon, {}), _jsx("span", { children: item.title })] }) }, item.title))) }) })] }) }), _jsx(SidebarFooter, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { children: [_jsx(Settings, {}), _jsx("span", { children: "Settings" })] }) }) }) })] }), _jsxs(SidebarInset, { children: [_jsxs("header", { className: "flex h-16 items-center gap-4 border-b px-4", children: [_jsx(SidebarTrigger, {}), _jsx("h1", { className: "text-lg font-semibold", children: "Dashboard" })] }), _jsx("main", { className: "flex-1 p-4", children: _jsx("p", { children: "Main content area" }) })] })] })),
    args: {},
};
export const Collapsed = {
    render: () => (_jsxs(SidebarProvider, { defaultOpen: false, children: [_jsx(Sidebar, { collapsible: "icon", children: _jsx(SidebarContent, { children: _jsx(SidebarGroup, { children: _jsx(SidebarGroupContent, { children: _jsx(SidebarMenu, { children: items.map((item) => (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { tooltip: item.title, children: [_jsx(item.icon, {}), _jsx("span", { children: item.title })] }) }, item.title))) }) }) }) }) }), _jsx(SidebarInset, { children: _jsxs("header", { className: "flex h-16 items-center gap-4 border-b px-4", children: [_jsx(SidebarTrigger, {}), _jsx("h1", { className: "text-lg font-semibold", children: "Collapsed Sidebar" })] }) })] })),
    args: {},
};
export const WithSeparator = {
    render: () => (_jsxs(SidebarProvider, { children: [_jsx(Sidebar, { children: _jsxs(SidebarContent, { children: [_jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Main" }), _jsx(SidebarGroupContent, { children: _jsxs(SidebarMenu, { children: [_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { children: [_jsx(Home, {}), _jsx("span", { children: "Home" })] }) }), _jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { children: [_jsx(Inbox, {}), _jsx("span", { children: "Inbox" })] }) })] }) })] }), _jsx(SidebarSeparator, {}), _jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Other" }), _jsx(SidebarGroupContent, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { children: [_jsx(Settings, {}), _jsx("span", { children: "Settings" })] }) }) }) })] })] }) }), _jsx(SidebarInset, { children: _jsx("header", { className: "flex h-16 items-center gap-4 border-b px-4", children: _jsx(SidebarTrigger, {}) }) })] })),
    args: {},
};
