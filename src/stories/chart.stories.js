import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// [build] library: 'shadcn'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, } from "../components/ui/chart";
const meta = {
    title: "ui/Chart",
    component: ChartContainer,
    tags: ["autodocs"],
    argTypes: {},
};
export default meta;
const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
];
const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
    mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
    },
};
export const BarChartExample = {
    render: () => (_jsx(ChartContainer, { config: chartConfig, className: "min-h-[200px] w-full", children: _jsxs(BarChart, { data: chartData, children: [_jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, {}), _jsx(ChartTooltip, { content: _jsx(ChartTooltipContent, {}) }), _jsx(ChartLegend, { content: _jsx(ChartLegendContent, {}) }), _jsx(Bar, { dataKey: "desktop", fill: "var(--color-desktop)", radius: 4 }), _jsx(Bar, { dataKey: "mobile", fill: "var(--color-mobile)", radius: 4 })] }) })),
    args: {},
};
export const LineChartExample = {
    render: () => (_jsx(ChartContainer, { config: chartConfig, className: "min-h-[200px] w-full", children: _jsxs(LineChart, { data: chartData, children: [_jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, {}), _jsx(ChartTooltip, { content: _jsx(ChartTooltipContent, {}) }), _jsx(ChartLegend, { content: _jsx(ChartLegendContent, {}) }), _jsx(Line, { type: "monotone", dataKey: "desktop", stroke: "var(--color-desktop)", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "mobile", stroke: "var(--color-mobile)", strokeWidth: 2 })] }) })),
    args: {},
};
