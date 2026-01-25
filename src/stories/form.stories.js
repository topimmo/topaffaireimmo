import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, } from "../components/ui/form";
const meta = {
    title: "ui/Form",
    component: Form,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
function FormExample() {
    const form = useForm({
        defaultValues: {
            username: "",
        },
    });
    function onSubmit(values) {
        console.log(values);
    }
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-8", children: [_jsx(FormField, { control: form.control, name: "username", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Username" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "shadcn", ...field }) }), _jsx(FormDescription, { children: "This is your public display name." }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", children: "Submit" })] }) }));
}
export const Default = {
    render: () => _jsx(FormExample, {}),
    args: {},
};
function FormWithValidation() {
    const form = useForm({
        defaultValues: {
            email: "",
        },
    });
    function onSubmit(values) {
        console.log(values);
    }
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-8", children: [_jsx(FormField, { control: form.control, name: "email", rules: {
                        required: "Email is required",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                        },
                    }, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: "email@example.com", ...field }) }), _jsx(FormDescription, { children: "Enter your email address." }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", children: "Submit" })] }) }));
}
export const WithValidation = {
    render: () => _jsx(FormWithValidation, {}),
    args: {},
};
