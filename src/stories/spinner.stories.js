import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
const meta = {
    title: "ui/Spinner",
    component: Spinner,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => _jsx(Spinner, {}),
    args: {},
};
export const Small = {
    render: () => _jsx(Spinner, { className: "size-3" }),
    args: {},
};
export const Large = {
    render: () => _jsx(Spinner, { className: "size-8" }),
    args: {},
};
export const WithButton = {
    render: () => (_jsxs(Button, { disabled: true, children: [_jsx(Spinner, { className: "mr-2" }), "Loading..."] })),
    args: {},
};
export const CustomColor = {
    render: () => _jsx(Spinner, { className: "text-primary" }),
    args: {},
};
export const InCard = {
    render: () => (_jsx("div", { className: "flex h-32 w-32 items-center justify-center rounded-lg border", children: _jsx(Spinner, { className: "size-6" }) })),
    args: {},
};
