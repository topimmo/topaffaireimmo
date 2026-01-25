import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { MoreHorizontal, FileText, Star, Trash } from "lucide-react";
import { Button } from "../components/ui/button";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemGroup, ItemSeparator, ItemHeader, ItemFooter, } from "../components/ui/item";
const meta = {
    title: "ui/Item",
    component: Item,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsx(Item, { children: _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Item Title" }), _jsx(ItemDescription, { children: "This is a description of the item." })] }) })),
    args: {},
};
export const WithIcon = {
    render: () => (_jsxs(Item, { children: [_jsx(ItemMedia, { variant: "icon", children: _jsx(FileText, {}) }), _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Document" }), _jsx(ItemDescription, { children: "A sample document item." })] })] })),
    args: {},
};
export const WithImage = {
    render: () => (_jsxs(Item, { children: [_jsx(ItemMedia, { variant: "image", children: _jsx("img", { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", alt: "User" }) }), _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "John Doe" }), _jsx(ItemDescription, { children: "Software Developer" })] })] })),
    args: {},
};
export const WithActions = {
    render: () => (_jsxs(Item, { children: [_jsx(ItemMedia, { variant: "icon", children: _jsx(FileText, {}) }), _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Project Report" }), _jsx(ItemDescription, { children: "Last updated 2 hours ago" })] }), _jsxs(ItemActions, { children: [_jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Star, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) })] })] })),
    args: {},
};
export const OutlineVariant = {
    render: () => (_jsx(Item, { variant: "outline", children: _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Outlined Item" }), _jsx(ItemDescription, { children: "This item has a border." })] }) })),
    args: {},
};
export const MutedVariant = {
    render: () => (_jsx(Item, { variant: "muted", children: _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Muted Item" }), _jsx(ItemDescription, { children: "This item has a muted background." })] }) })),
    args: {},
};
export const ItemGroupExample = {
    render: () => (_jsxs(ItemGroup, { children: [_jsxs(Item, { children: [_jsx(ItemMedia, { variant: "icon", children: _jsx(FileText, {}) }), _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "First Item" }), _jsx(ItemDescription, { children: "Description for first item" })] })] }), _jsx(ItemSeparator, {}), _jsxs(Item, { children: [_jsx(ItemMedia, { variant: "icon", children: _jsx(FileText, {}) }), _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Second Item" }), _jsx(ItemDescription, { children: "Description for second item" })] })] }), _jsx(ItemSeparator, {}), _jsxs(Item, { children: [_jsx(ItemMedia, { variant: "icon", children: _jsx(FileText, {}) }), _jsxs(ItemContent, { children: [_jsx(ItemTitle, { children: "Third Item" }), _jsx(ItemDescription, { children: "Description for third item" })] })] })] })),
    args: {},
};
export const WithHeaderAndFooter = {
    render: () => (_jsxs(Item, { variant: "outline", children: [_jsxs(ItemHeader, { children: [_jsx(ItemTitle, { children: "Task Title" }), _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) })] }), _jsx(ItemDescription, { children: "This is a detailed description of the task that spans the full width." }), _jsxs(ItemFooter, { children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "Created yesterday" }), _jsxs(Button, { variant: "ghost", size: "sm", children: [_jsx(Trash, { className: "h-4 w-4 mr-2" }), "Delete"] })] })] })),
    args: {},
};
