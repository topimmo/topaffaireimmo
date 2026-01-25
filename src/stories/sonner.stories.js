import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
const meta = {
    title: "ui/Sonner",
    component: Toaster,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsxs("div", { children: [_jsx(Toaster, {}), _jsx(Button, { onClick: () => toast("Event has been created"), children: "Show Toast" })] })),
    args: {},
};
export const WithDescription = {
    render: () => (_jsxs("div", { children: [_jsx(Toaster, {}), _jsx(Button, { onClick: () => toast("Event has been created", {
                    description: "Sunday, December 03, 2023 at 9:00 AM",
                }), children: "Show Toast with Description" })] })),
    args: {},
};
export const Success = {
    render: () => (_jsxs("div", { children: [_jsx(Toaster, {}), _jsx(Button, { onClick: () => toast.success("Successfully saved!"), children: "Show Success Toast" })] })),
    args: {},
};
export const Error = {
    render: () => (_jsxs("div", { children: [_jsx(Toaster, {}), _jsx(Button, { variant: "destructive", onClick: () => toast.error("Something went wrong"), children: "Show Error Toast" })] })),
    args: {},
};
export const WithAction = {
    render: () => (_jsxs("div", { children: [_jsx(Toaster, {}), _jsx(Button, { onClick: () => toast("Event has been created", {
                    action: {
                        label: "Undo",
                        onClick: () => console.log("Undo"),
                    },
                }), children: "Show Toast with Action" })] })),
    args: {},
};
export const Promise = {
    render: () => (_jsxs("div", { children: [_jsx(Toaster, {}), _jsx(Button, { onClick: () => {
                    const promise = new window.Promise((resolve) => setTimeout(() => resolve({ name: "Sonner" }), 2000));
                    toast.promise(promise, {
                        loading: "Loading...",
                        success: "Data loaded successfully",
                        error: "Error loading data",
                    });
                }, children: "Show Promise Toast" })] })),
    args: {},
};
