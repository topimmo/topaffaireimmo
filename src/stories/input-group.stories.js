import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Search, Mail, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea, } from "../components/ui/input-group";
import { Kbd } from "../components/ui/kbd";
const meta = {
    title: "ui/InputGroup",
    component: InputGroup,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsxs(InputGroup, { children: [_jsx(InputGroupAddon, { children: _jsx(Mail, { className: "h-4 w-4" }) }), _jsx(InputGroupInput, { placeholder: "Enter your email" })] })),
    args: {},
};
export const WithButton = {
    render: () => (_jsxs(InputGroup, { children: [_jsx(InputGroupInput, { placeholder: "Search..." }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx(InputGroupButton, { children: _jsx(Search, { className: "h-4 w-4" }) }) })] })),
    args: {},
};
export const WithText = {
    render: () => (_jsxs(InputGroup, { children: [_jsx(InputGroupAddon, { children: _jsx(InputGroupText, { children: "https://" }) }), _jsx(InputGroupInput, { placeholder: "example.com" })] })),
    args: {},
};
export const WithKbd = {
    render: () => (_jsxs(InputGroup, { children: [_jsx(InputGroupInput, { placeholder: "Search..." }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx(Kbd, { children: "\u2318K" }) })] })),
    args: {},
};
function PasswordInputGroup() {
    const [showPassword, setShowPassword] = useState(false);
    return (_jsxs(InputGroup, { children: [_jsx(InputGroupInput, { type: showPassword ? "text" : "password", placeholder: "Enter password" }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx(InputGroupButton, { onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) }) })] }));
}
export const PasswordToggle = {
    render: () => _jsx(PasswordInputGroup, {}),
    args: {},
};
export const WithTextarea = {
    render: () => (_jsx(InputGroup, { children: _jsx(InputGroupTextarea, { placeholder: "Enter your message..." }) })),
    args: {},
};
