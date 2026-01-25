import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet, FieldLegend, FieldContent, } from "../components/ui/field";
const meta = {
    title: "ui/Field",
    component: Field,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsxs(Field, { children: [_jsx(FieldLabel, { children: "Email" }), _jsx(Input, { type: "email", placeholder: "Enter your email" })] })),
    args: {},
};
export const WithDescription = {
    render: () => (_jsxs(Field, { children: [_jsx(FieldLabel, { children: "Email" }), _jsx(Input, { type: "email", placeholder: "Enter your email" }), _jsx(FieldDescription, { children: "We'll never share your email." })] })),
    args: {},
};
export const WithError = {
    render: () => (_jsxs(Field, { "data-invalid": "true", children: [_jsx(FieldLabel, { children: "Email" }), _jsx(Input, { type: "email", placeholder: "Enter your email", "aria-invalid": "true" }), _jsx(FieldError, { children: "Please enter a valid email address." })] })),
    args: {},
};
export const Horizontal = {
    render: () => (_jsxs(Field, { orientation: "horizontal", children: [_jsx(Checkbox, { id: "terms" }), _jsxs(FieldContent, { children: [_jsx(FieldLabel, { htmlFor: "terms", children: "Accept terms and conditions" }), _jsx(FieldDescription, { children: "You agree to our Terms of Service and Privacy Policy." })] })] })),
    args: {},
};
export const FieldGroupExample = {
    render: () => (_jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: "First Name" }), _jsx(Input, { placeholder: "John" })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: "Last Name" }), _jsx(Input, { placeholder: "Doe" })] })] })),
    args: {},
};
export const FieldSetExample = {
    render: () => (_jsxs(FieldSet, { children: [_jsx(FieldLegend, { children: "Contact Information" }), _jsx(FieldDescription, { children: "Enter your contact details below." }), _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: "Email" }), _jsx(Input, { type: "email", placeholder: "john@example.com" })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: "Phone" }), _jsx(Input, { type: "tel", placeholder: "+1 (555) 000-0000" })] })] })] })),
    args: {},
};
