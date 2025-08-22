import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useI18n } from '../../i18n';
export function ColumnManager({ columns, onColumnsChange, onClose }) {
    const { t } = useI18n();
    const [localColumns, setLocalColumns] = useState(columns);
    const draggedItemRef = useRef(null);
    const handleVisibilityToggle = (columnId) => {
        const updated = localColumns.map(col => col.id === columnId ? { ...col, visible: !col.visible } : col);
        setLocalColumns(updated);
    };
    const handleDragStart = (e, index) => {
        draggedItemRef.current = index;
        e.dataTransfer.effectAllowed = 'move';
        // Add visual feedback
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };
    const handleDragEnd = (e) => {
        // Reset visual feedback
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        draggedItemRef.current = null;
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedItemRef.current === null || draggedItemRef.current === dropIndex) {
            return;
        }
        const updated = [...localColumns];
        const draggedItem = updated[draggedItemRef.current];
        // Remove dragged item and insert at new position
        updated.splice(draggedItemRef.current, 1);
        updated.splice(dropIndex, 0, draggedItem);
        // Update order numbers
        const reordered = updated.map((col, index) => ({
            ...col,
            order: index
        }));
        setLocalColumns(reordered);
    };
    const handleApply = () => {
        onColumnsChange(localColumns);
        onClose();
    };
    const handleReset = () => {
        // Reset to default order: continent, country, b2g, b2b, b2c, periodic
        const defaultOrder = ['continent', 'name', 'b2g', 'b2b', 'b2c', 'periodic'];
        const reset = localColumns
            .sort((a, b) => {
            const aIndex = defaultOrder.indexOf(a.id);
            const bIndex = defaultOrder.indexOf(b.id);
            return aIndex - bIndex;
        })
            .map((col, index) => ({
            ...col,
            visible: true,
            order: index
        }));
        setLocalColumns(reset);
    };
    return (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-labelledby": "column-manager-title", children: _jsxs("div", { className: "modal", style: { maxWidth: 500 }, children: [_jsxs("header", { style: {
                        padding: 16,
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }, children: [_jsx("h2", { id: "column-manager-title", style: { margin: 0, fontSize: '18px' }, children: t('column_manager_title') || 'Manage Columns' }), _jsx("button", { onClick: onClose, "aria-label": t('button_close') || 'Close', style: {
                                background: 'var(--button-bg, #f3f4f6)',
                                border: '1px solid var(--border, #d1d5db)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }, children: "\u00D7" })] }), _jsxs("div", { style: { padding: 16 }, children: [_jsx("p", { style: { color: 'var(--muted)', fontSize: '14px', marginBottom: 16 }, children: t('column_manager_help') || 'Drag columns to reorder, toggle visibility with checkboxes.' }), _jsx("div", { style: { marginBottom: 16 }, children: _jsx("div", { style: {
                                    display: 'grid',
                                    gap: 8,
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '8px'
                                }, children: localColumns.map((column, index) => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, index), onDragEnd: handleDragEnd, onDragOver: handleDragOver, onDrop: (e) => handleDrop(e, index), style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        background: 'var(--panel-bg, white)',
                                        cursor: 'grab'
                                    }, className: "column-drag-item", children: [_jsx("span", { style: {
                                                marginRight: 8,
                                                color: 'var(--muted)',
                                                fontSize: '14px',
                                                cursor: 'grab'
                                            }, "aria-label": t('drag_handle') || 'Drag to reorder', children: "\u22EE\u22EE" }), _jsx("input", { type: "checkbox", id: `col-${column.id}`, checked: column.visible, onChange: () => handleVisibilityToggle(column.id), style: { marginRight: 12 }, "aria-describedby": `col-${column.id}-desc` }), _jsx("label", { htmlFor: `col-${column.id}`, style: {
                                                flex: 1,
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }, children: column.label }), _jsx("span", { id: `col-${column.id}-desc`, style: {
                                                fontSize: '12px',
                                                color: 'var(--muted)',
                                                marginLeft: 'auto'
                                            }, children: t('order_position', { position: index + 1 }) || `Position ${index + 1}` })] }, column.id))) }) }), _jsxs("div", { style: {
                                display: 'flex',
                                gap: 12,
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }, children: [_jsx("button", { onClick: handleReset, style: {
                                        background: 'var(--secondary-bg, #6b7280)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }, children: t('button_reset_columns') || 'Reset to Default' }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: onClose, style: {
                                                background: 'var(--button-bg, #f3f4f6)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '4px',
                                                padding: '8px 16px',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }, children: t('button_cancel') || 'Cancel' }), _jsx("button", { onClick: handleApply, style: {
                                                background: 'var(--primary, #3b82f6)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '8px 16px',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }, children: t('button_apply') || 'Apply' })] })] })] })] }) }));
}
