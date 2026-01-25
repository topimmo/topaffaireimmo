import { jsx as _jsx } from "react/jsx-runtime";
// [build] library: 'shadcn'
import DatePickerWithRange from "../components/ui/date-picker-with-range";
const meta = {
    title: "ui/DatePickerWithRange",
    component: DatePickerWithRange,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
export const Default = {
    render: () => _jsx(DatePickerWithRange, {}),
    args: {},
};
export const WithClassName = {
    render: () => _jsx(DatePickerWithRange, { className: "w-[400px]" }),
    args: {},
};
