import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
export function QuickStats() {
    const { filtered } = useStore();
    const stats = useMemo(() => {
        let countries = filtered.length;
        let mandated = 0, permitted = 0, planned = 0, none = 0;
        for (const c of filtered) {
            const statuses = [c.eInvoicing.b2g.status, c.eInvoicing.b2b.status, c.eInvoicing.b2c.status];
            if (statuses.includes('mandated'))
                mandated++;
            else if (statuses.includes('planned'))
                planned++;
            else if (statuses.includes('permitted'))
                permitted++;
            else
                none++;
        }
        return { countries, mandated, planned, permitted, none };
    }, [filtered]);
    return (_jsxs("div", { className: "kpi", children: [_jsxs("div", { className: "item", children: [_jsx("div", { className: "value", children: stats.countries }), _jsx("div", { className: "label", children: "Countries" })] }), _jsxs("div", { className: "item", children: [_jsx("div", { className: "value", children: stats.mandated }), _jsx("div", { className: "label", children: "Any Mandate" })] }), _jsxs("div", { className: "item", children: [_jsx("div", { className: "value", children: stats.planned }), _jsx("div", { className: "label", children: "Planned" })] }), _jsxs("div", { className: "item", children: [_jsx("div", { className: "value", children: stats.permitted }), _jsx("div", { className: "label", children: "Permitted Only" })] })] }));
}
