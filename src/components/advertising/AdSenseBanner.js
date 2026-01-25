import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function AdSenseBanner({ slot, format = 'auto', className = '' }) {
    // This is a placeholder for Google AdSense
    // In production, replace with actual AdSense code
    return (_jsx("div", { className: `adsense-banner bg-muted/30 rounded-lg flex items-center justify-center min-h-[90px] border border-dashed border-muted ${className}`, children: _jsxs("div", { className: "text-center text-sm text-muted-foreground", children: [_jsx("p", { children: "Google AdSense" }), _jsxs("p", { className: "text-xs", children: ["Slot: ", slot] })] }) }));
}
