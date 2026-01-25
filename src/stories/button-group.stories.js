import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "../components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, } from "../components/ui/button-group";
const meta = {
    title: "ui/ButtonGroup",
    component: ButtonGroup,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsxs(ButtonGroup, { children: [_jsx(Button, { variant: "outline", children: "Left" }), _jsx(Button, { variant: "outline", children: "Middle" }), _jsx(Button, { variant: "outline", children: "Right" })] })),
    args: {},
};
export const WithIcons = {
    render: () => (_jsxs(ButtonGroup, { children: [_jsx(Button, { variant: "outline", size: "icon", children: _jsx(Bold, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", children: _jsx(Italic, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", children: _jsx(Underline, { className: "h-4 w-4" }) })] })),
    args: {},
};
export const Vertical = {
    render: () => (_jsxs(ButtonGroup, { orientation: "vertical", children: [_jsx(Button, { variant: "outline", children: "Top" }), _jsx(Button, { variant: "outline", children: "Middle" }), _jsx(Button, { variant: "outline", children: "Bottom" })] })),
    args: {},
};
export const WithSeparator = {
    render: () => (_jsxs(ButtonGroup, { children: [_jsx(Button, { variant: "outline", children: "Save" }), _jsx(ButtonGroupSeparator, {}), _jsx(Button, { variant: "outline", children: "Cancel" })] })),
    args: {},
};
export const WithText = {
    render: () => (_jsxs(ButtonGroup, { children: [_jsx(ButtonGroupText, { children: "Label" }), _jsx(Button, { variant: "outline", children: "Action" })] })),
    args: {},
};
