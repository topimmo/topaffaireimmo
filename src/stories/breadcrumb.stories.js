import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Slash } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, } from "../components/ui/breadcrumb";
const meta = {
    title: "ui/Breadcrumb",
    component: Breadcrumb,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsx(Breadcrumb, { children: _jsxs(BreadcrumbList, { children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/", children: "Home" }) }), _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/components", children: "Components" }) }), _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: "Breadcrumb" }) })] }) })),
    args: {},
};
export const WithCustomSeparator = {
    render: () => (_jsx(Breadcrumb, { children: _jsxs(BreadcrumbList, { children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/", children: "Home" }) }), _jsx(BreadcrumbSeparator, { children: _jsx(Slash, {}) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/components", children: "Components" }) }), _jsx(BreadcrumbSeparator, { children: _jsx(Slash, {}) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: "Breadcrumb" }) })] }) })),
    args: {},
};
export const WithEllipsis = {
    render: () => (_jsx(Breadcrumb, { children: _jsxs(BreadcrumbList, { children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/", children: "Home" }) }), _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbEllipsis, {}) }), _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/components", children: "Components" }) }), _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: "Breadcrumb" }) })] }) })),
    args: {},
};
