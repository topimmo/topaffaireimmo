import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { FontBoldIcon, FontItalicIcon, UnderlineIcon, AlignLeftIcon, AlignCenterHorizontallyIcon, AlignRightIcon, } from "@radix-ui/react-icons";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
const meta = {
    title: "ui/ToggleGroup",
    component: ToggleGroup,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsxs(ToggleGroup, { type: "multiple", children: [_jsx(ToggleGroupItem, { value: "bold", "aria-label": "Toggle bold", children: _jsx(FontBoldIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "italic", "aria-label": "Toggle italic", children: _jsx(FontItalicIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "underline", "aria-label": "Toggle underline", children: _jsx(UnderlineIcon, { className: "h-4 w-4" }) })] })),
    args: {},
};
export const Single = {
    render: () => (_jsxs(ToggleGroup, { type: "single", defaultValue: "center", children: [_jsx(ToggleGroupItem, { value: "left", "aria-label": "Left aligned", children: _jsx(AlignLeftIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "center", "aria-label": "Center aligned", children: _jsx(AlignCenterHorizontallyIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "right", "aria-label": "Right aligned", children: _jsx(AlignRightIcon, { className: "h-4 w-4" }) })] })),
    args: {},
};
export const Outline = {
    render: () => (_jsxs(ToggleGroup, { type: "multiple", variant: "outline", children: [_jsx(ToggleGroupItem, { value: "bold", "aria-label": "Toggle bold", children: _jsx(FontBoldIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "italic", "aria-label": "Toggle italic", children: _jsx(FontItalicIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "underline", "aria-label": "Toggle underline", children: _jsx(UnderlineIcon, { className: "h-4 w-4" }) })] })),
    args: {},
};
export const Small = {
    render: () => (_jsxs(ToggleGroup, { type: "multiple", size: "sm", children: [_jsx(ToggleGroupItem, { value: "bold", "aria-label": "Toggle bold", children: _jsx(FontBoldIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "italic", "aria-label": "Toggle italic", children: _jsx(FontItalicIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "underline", "aria-label": "Toggle underline", children: _jsx(UnderlineIcon, { className: "h-4 w-4" }) })] })),
    args: {},
};
export const Large = {
    render: () => (_jsxs(ToggleGroup, { type: "multiple", size: "lg", children: [_jsx(ToggleGroupItem, { value: "bold", "aria-label": "Toggle bold", children: _jsx(FontBoldIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "italic", "aria-label": "Toggle italic", children: _jsx(FontItalicIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "underline", "aria-label": "Toggle underline", children: _jsx(UnderlineIcon, { className: "h-4 w-4" }) })] })),
    args: {},
};
export const Disabled = {
    render: () => (_jsxs(ToggleGroup, { type: "multiple", disabled: true, children: [_jsx(ToggleGroupItem, { value: "bold", "aria-label": "Toggle bold", children: _jsx(FontBoldIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "italic", "aria-label": "Toggle italic", children: _jsx(FontItalicIcon, { className: "h-4 w-4" }) }), _jsx(ToggleGroupItem, { value: "underline", "aria-label": "Toggle underline", children: _jsx(UnderlineIcon, { className: "h-4 w-4" }) })] })),
    args: {},
};
