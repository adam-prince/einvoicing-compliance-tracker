import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "handleRetry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null
                });
            }
        });
        Object.defineProperty(this, "handleReload", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                window.location.reload();
            }
        });
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            // Example: reportError(error, errorInfo);
        }
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx("div", { className: "error-boundary", role: "alert", "aria-live": "assertive", children: _jsxs("div", { className: "error-container", children: [_jsxs("div", { className: "error-header", children: [_jsx("h2", { children: "Something went wrong" }), _jsx("p", { children: "We're sorry, but something unexpected happened." })] }), _jsx("div", { className: "error-details", children: _jsxs("details", { children: [_jsx("summary", { children: "Error Details" }), _jsxs("div", { className: "error-stack", children: [_jsx("h4", { children: "Error Message:" }), _jsx("pre", { children: this.state.error?.message }), this.state.error?.stack && (_jsxs(_Fragment, { children: [_jsx("h4", { children: "Stack Trace:" }), _jsx("pre", { children: this.state.error.stack })] })), this.state.errorInfo?.componentStack && (_jsxs(_Fragment, { children: [_jsx("h4", { children: "Component Stack:" }), _jsx("pre", { children: this.state.errorInfo.componentStack })] }))] })] }) }), _jsxs("div", { className: "error-actions", children: [_jsx("button", { onClick: this.handleRetry, className: "retry-button", "aria-label": "Try to recover from error", children: "Try Again" }), _jsx("button", { onClick: this.handleReload, className: "reload-button", "aria-label": "Reload the page", children: "Reload Page" })] }), _jsx("div", { className: "error-help", children: _jsx("p", { children: "If this problem persists, please contact support with the error details above." }) })] }) }));
        }
        return this.props.children;
    }
}
export function ErrorMessage({ message, onRetry, onReload }) {
    return (_jsx("div", { className: "error-message", role: "alert", "aria-live": "assertive", children: _jsxs("div", { className: "error-container", children: [_jsxs("div", { className: "error-header", children: [_jsx("h3", { children: "Error" }), _jsx("p", { children: message })] }), _jsxs("div", { className: "error-actions", children: [onRetry && (_jsx("button", { onClick: onRetry, className: "retry-button", "aria-label": "Retry the failed operation", children: "Retry" })), onReload && (_jsx("button", { onClick: onReload, className: "reload-button", "aria-label": "Reload the page", children: "Reload" }))] })] }) }));
}
