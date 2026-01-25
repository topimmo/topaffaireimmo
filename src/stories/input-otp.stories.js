import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator, } from "../components/ui/input-otp";
const meta = {
    title: "ui/InputOTP",
    component: InputOTP,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => (_jsx(InputOTP, { maxLength: 6, children: _jsxs(InputOTPGroup, { children: [_jsx(InputOTPSlot, { index: 0 }), _jsx(InputOTPSlot, { index: 1 }), _jsx(InputOTPSlot, { index: 2 }), _jsx(InputOTPSlot, { index: 3 }), _jsx(InputOTPSlot, { index: 4 }), _jsx(InputOTPSlot, { index: 5 })] }) })),
    args: {},
};
export const WithSeparator = {
    render: () => (_jsxs(InputOTP, { maxLength: 6, children: [_jsxs(InputOTPGroup, { children: [_jsx(InputOTPSlot, { index: 0 }), _jsx(InputOTPSlot, { index: 1 }), _jsx(InputOTPSlot, { index: 2 })] }), _jsx(InputOTPSeparator, {}), _jsxs(InputOTPGroup, { children: [_jsx(InputOTPSlot, { index: 3 }), _jsx(InputOTPSlot, { index: 4 }), _jsx(InputOTPSlot, { index: 5 })] })] })),
    args: {},
};
export const FourDigits = {
    render: () => (_jsx(InputOTP, { maxLength: 4, children: _jsxs(InputOTPGroup, { children: [_jsx(InputOTPSlot, { index: 0 }), _jsx(InputOTPSlot, { index: 1 }), _jsx(InputOTPSlot, { index: 2 }), _jsx(InputOTPSlot, { index: 3 })] }) })),
    args: {},
};
export const Disabled = {
    render: () => (_jsx(InputOTP, { maxLength: 6, disabled: true, children: _jsxs(InputOTPGroup, { children: [_jsx(InputOTPSlot, { index: 0 }), _jsx(InputOTPSlot, { index: 1 }), _jsx(InputOTPSlot, { index: 2 }), _jsx(InputOTPSlot, { index: 3 }), _jsx(InputOTPSlot, { index: 4 }), _jsx(InputOTPSlot, { index: 5 })] }) })),
    args: {},
};
