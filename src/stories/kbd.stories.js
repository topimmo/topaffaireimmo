import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Command } from "lucide-react";
import { Kbd, KbdGroup } from "../components/ui/kbd";
const meta = {
    title: "ui/Kbd",
    component: Kbd,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => _jsx(Kbd, { children: "K" }),
    args: {},
};
export const WithModifier = {
    render: () => (_jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u2318" }), _jsx(Kbd, { children: "K" })] })),
    args: {},
};
export const WithIcon = {
    render: () => (_jsx(Kbd, { children: _jsx(Command, { className: "h-3 w-3" }) })),
    args: {},
};
export const CommonShortcuts = {
    render: () => (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-sm text-muted-foreground w-20", children: "Copy" }), _jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u2318" }), _jsx(Kbd, { children: "C" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-sm text-muted-foreground w-20", children: "Paste" }), _jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u2318" }), _jsx(Kbd, { children: "V" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-sm text-muted-foreground w-20", children: "Save" }), _jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u2318" }), _jsx(Kbd, { children: "S" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-sm text-muted-foreground w-20", children: "Undo" }), _jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u2318" }), _jsx(Kbd, { children: "Z" })] })] })] })),
    args: {},
};
export const Escape = {
    render: () => _jsx(Kbd, { children: "Esc" }),
    args: {},
};
export const Enter = {
    render: () => _jsx(Kbd, { children: "\u21B5" }),
    args: {},
};
