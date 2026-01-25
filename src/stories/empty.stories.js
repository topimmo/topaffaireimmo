import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Inbox, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia, } from "../components/ui/empty";
const meta = {
    title: "ui/Empty",
    component: Empty,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsx(Empty, { children: _jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: _jsx(Inbox, {}) }), _jsx(EmptyTitle, { children: "No items found" }), _jsx(EmptyDescription, { children: "Get started by creating a new item." })] }) })),
    args: {},
};
export const WithAction = {
    render: () => (_jsxs(Empty, { children: [_jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: _jsx(Inbox, {}) }), _jsx(EmptyTitle, { children: "No projects yet" }), _jsx(EmptyDescription, { children: "Create your first project to get started." })] }), _jsx(EmptyContent, { children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Project"] }) })] })),
    args: {},
};
export const WithDefaultMedia = {
    render: () => (_jsx(Empty, { children: _jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { children: _jsx(Inbox, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx(EmptyTitle, { children: "Empty state" }), _jsx(EmptyDescription, { children: "This is an empty state with default media variant." })] }) })),
    args: {},
};
