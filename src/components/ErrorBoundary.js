import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background p-4", children: _jsxs("div", { className: "max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg", children: [_jsxs("div", { className: "flex items-center gap-2 text-destructive mb-4", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), _jsx("h1", { className: "text-xl font-semibold", children: "Something went wrong" })] }), _jsx("p", { className: "text-muted-foreground mb-4", children: "We're sorry, but something unexpected happened. Please try refreshing the page." }), this.state.error && import.meta.env.DEV && (_jsxs("details", { className: "mb-4", children: [_jsx("summary", { className: "cursor-pointer text-sm text-muted-foreground hover:text-foreground", children: "Error details (dev only)" }), _jsx("pre", { className: "mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40", children: this.state.error.toString() })] })), _jsx("button", { onClick: () => window.location.reload(), className: "w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors", children: "Refresh Page" })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
