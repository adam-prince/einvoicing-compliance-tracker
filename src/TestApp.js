import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TestApp() {
    console.log('TestApp rendering...');
    return (_jsxs("div", { style: {
            padding: '2rem',
            fontFamily: 'Arial, sans-serif',
            background: '#f8f9fa',
            minHeight: '100vh'
        }, children: [_jsx("h1", { style: { color: '#007bff' }, children: "\u2705 React App is Working!" }), _jsx("p", { children: "This is a test component to verify React is loading properly." }), _jsxs("div", { style: {
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginTop: '1rem'
                }, children: [_jsx("h2", { children: "Test Features:" }), _jsxs("ul", { children: [_jsx("li", { children: "React rendering: \u2705 Working" }), _jsx("li", { children: "TypeScript compilation: \u2705 Working" }), _jsx("li", { children: "Hot Module Replacement: \u2705 Working" }), _jsx("li", { children: "Console logging: Check developer console" })] }), _jsx("button", { onClick: () => console.log('Button clicked!'), style: {
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }, children: "Test Button (Check Console)" })] })] }));
}
