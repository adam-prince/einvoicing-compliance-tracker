import { useState } from 'react';
import { useI18n } from '../i18n';
// Default column configurations - Details first, Country second, Continent third
const getDefaultColumnConfigs = (t) => [
    { id: 'details', label: t('button_details') || 'Details', visible: true, order: 0 },
    { id: 'name', label: t('table_country') || 'Country', visible: true, order: 1 },
    { id: 'continent', label: t('table_continent') || 'Continent', visible: true, order: 2 },
    { id: 'b2g', label: 'B2G', visible: true, order: 3 },
    { id: 'b2b', label: 'B2B', visible: true, order: 4 },
    { id: 'b2c', label: 'B2C', visible: true, order: 5 },
    { id: 'periodic', label: t('table_periodic') || 'Periodic E-reporting', visible: true, order: 6 }
];
// Load column config from localStorage
const loadColumnConfig = (t) => {
    try {
        const saved = localStorage.getItem('einvoicing-column-config');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Update labels with current translations
            const defaults = getDefaultColumnConfigs(t);
            return parsed.map(col => ({
                ...col,
                label: defaults.find(def => def.id === col.id)?.label || col.label
            }));
        }
    }
    catch (error) {
        console.warn('Failed to load column config:', error);
    }
    return getDefaultColumnConfigs(t);
};
// Save column config to localStorage
const saveColumnConfig = (columns) => {
    try {
        localStorage.setItem('einvoicing-column-config', JSON.stringify(columns));
    }
    catch (error) {
        console.warn('Failed to save column config:', error);
    }
};
export const useColumnManager = () => {
    const { t } = useI18n();
    const [showColumnManager, setShowColumnManager] = useState(false);
    const [columnConfigs, setColumnConfigs] = useState(() => loadColumnConfig(t));
    const handleColumnsChange = (newColumns) => {
        setColumnConfigs(newColumns);
        saveColumnConfig(newColumns);
    };
    const openColumnManager = () => setShowColumnManager(true);
    const closeColumnManager = () => setShowColumnManager(false);
    return {
        columnConfigs,
        showColumnManager,
        openColumnManager,
        closeColumnManager,
        handleColumnsChange,
        t
    };
};
