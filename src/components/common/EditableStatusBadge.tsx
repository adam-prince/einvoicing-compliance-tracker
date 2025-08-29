import React, { useState, useRef, useEffect } from 'react';

type ComplianceStatus = 'mandated' | 'permitted' | 'permitted-conditional' | 'none' | 'planned';

interface EditableStatusBadgeProps {
  status: ComplianceStatus;
  onStatusChange: (newStatus: ComplianceStatus) => void;
  disabled?: boolean;
  className?: string;
}

const statusOptions: { value: ComplianceStatus; label: string; description: string }[] = [
  { value: 'mandated', label: 'Mandated', description: 'Required by law' },
  { value: 'planned', label: 'Planned', description: 'Planned for future implementation' },
  { value: 'permitted', label: 'Permitted', description: 'Allowed but not required' },
  { value: 'permitted-conditional', label: 'Permitted (Conditional)', description: 'Allowed under certain conditions' },
  { value: 'none', label: 'None', description: 'No e-invoicing requirement' }
];

export function EditableStatusBadge({ 
  status, 
  onStatusChange, 
  disabled = false, 
  className = '' 
}: EditableStatusBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus>(status);
  const selectRef = useRef<HTMLSelectElement>(null);

  const getBadgeClass = (status: ComplianceStatus) => {
    switch (status) {
      case 'mandated': return 'green';
      case 'planned': return 'yellow';
      case 'permitted':
      case 'permitted-conditional': return 'yellow';
      case 'none':
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: ComplianceStatus) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleEdit = () => {
    if (disabled) return;
    setSelectedStatus(status);
    setIsEditing(true);
  };

  const handleSave = () => {
    onStatusChange(selectedStatus);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedStatus(status);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Auto-focus the select when editing starts
  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="editable-status-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <select
          ref={selectRef}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ComplianceStatus)}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          className="status-select"
          style={{
            padding: '4px 8px',
            border: '1px solid var(--primary)',
            borderRadius: '4px',
            background: 'var(--panel)',
            color: 'var(--text)',
            fontSize: '12px',
            minWidth: '120px'
          }}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value} title={option.description}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          className="status-save-btn"
          style={{
            padding: '2px 6px',
            border: '1px solid var(--primary)',
            borderRadius: '3px',
            background: 'var(--primary)',
            color: 'white',
            fontSize: '11px',
            cursor: 'pointer'
          }}
          title="Save changes"
        >
          ✓
        </button>
        <button
          onClick={handleCancel}
          className="status-cancel-btn"
          style={{
            padding: '2px 6px',
            border: '1px solid var(--muted)',
            borderRadius: '3px',
            background: 'var(--panel)',
            color: 'var(--muted)',
            fontSize: '11px',
            cursor: 'pointer'
          }}
          title="Cancel changes"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <span
      className={`badge ${getBadgeClass(status)} ${disabled ? 'disabled' : 'editable'} ${className}`}
      onClick={handleEdit}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
        ...(!disabled && {
          '::after': {
            content: '✏️',
            fontSize: '10px',
            marginLeft: '4px',
            opacity: 0.6
          }
        })
      }}
      title={disabled ? getStatusLabel(status) : `Click to edit status: ${getStatusLabel(status)}`}
    >
      {getStatusLabel(status)}
      {!disabled && <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.6 }}>✏️</span>}
    </span>
  );
}