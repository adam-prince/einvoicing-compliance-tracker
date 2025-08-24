import React, { useState, useRef } from 'react';
import { Button } from 'carbon-react';
import { useI18n } from '../../i18n';

export interface ColumnConfig {
	id: string;
	label: string;
	visible: boolean;
	order: number;
}

interface ColumnManagerProps {
	columns: ColumnConfig[];
	onColumnsChange: (columns: ColumnConfig[]) => void;
	onClose: () => void;
}

export function ColumnManager({ columns, onColumnsChange, onClose }: ColumnManagerProps) {
	const { t } = useI18n();
	const [localColumns, setLocalColumns] = useState(columns);
	const draggedItemRef = useRef<number | null>(null);

	const handleVisibilityToggle = (columnId: string) => {
		const updated = localColumns.map(col => 
			col.id === columnId ? { ...col, visible: !col.visible } : col
		);
		setLocalColumns(updated);
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		draggedItemRef.current = index;
		e.dataTransfer.effectAllowed = 'move';
		
		// Add visual feedback
		if (e.currentTarget instanceof HTMLElement) {
			e.currentTarget.style.opacity = '0.5';
		}
	};

	const handleDragEnd = (e: React.DragEvent) => {
		// Reset visual feedback
		if (e.currentTarget instanceof HTMLElement) {
			e.currentTarget.style.opacity = '1';
		}
		draggedItemRef.current = null;
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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

	return (
		<div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="column-manager-title">
			<div className="modal" style={{ maxWidth: 500 }}>
				<header style={{ 
					padding: 16, 
					borderBottom: '1px solid var(--border)', 
					display: 'flex', 
					justifyContent: 'space-between', 
					alignItems: 'center' 
				}}>
					<h2 id="column-manager-title" style={{ margin: 0, fontSize: '18px' }}>
						{t('column_manager_title') || 'Manage Columns'}
					</h2>
					<Button 
						onClick={onClose}
						aria-label={t('button_close') || 'Close'}
						size="small"
						variant="tertiary"
					>
						×
					</Button>
				</header>
				
				<div style={{ padding: 16 }}>
					<p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: 16 }}>
						{t('column_manager_help') || 'Drag columns to reorder, toggle visibility with checkboxes.'}
					</p>
					
					<div style={{ marginBottom: 16 }}>
						<div style={{ 
							display: 'grid', 
							gap: 8, 
							maxHeight: '300px', 
							overflowY: 'auto',
							border: '1px solid var(--border)',
							borderRadius: '6px',
							padding: '8px'
						}}>
							{localColumns.map((column, index) => (
								<div
									key={column.id}
									draggable
									onDragStart={(e) => handleDragStart(e, index)}
									onDragEnd={handleDragEnd}
									onDragOver={handleDragOver}
									onDrop={(e) => handleDrop(e, index)}
									style={{
										display: 'flex',
										alignItems: 'center',
										padding: '8px 12px',
										border: '1px solid var(--border)',
										borderRadius: '4px',
										background: 'var(--panel-bg, white)',
										cursor: 'grab'
									}}
									className="column-drag-item"
								>
									<span 
										style={{ 
											marginRight: 8, 
											color: 'var(--muted)', 
											fontSize: '14px',
											cursor: 'grab'
										}}
										aria-label={t('drag_handle') || 'Drag to reorder'}
									>
										⋮⋮
									</span>
									
									<input
										type="checkbox"
										id={`col-${column.id}`}
										checked={column.visible}
										onChange={() => handleVisibilityToggle(column.id)}
										style={{ marginRight: 12 }}
										aria-describedby={`col-${column.id}-desc`}
									/>
									
									<label 
										htmlFor={`col-${column.id}`}
										style={{ 
											flex: 1, 
											cursor: 'pointer',
											fontSize: '14px'
										}}
									>
										{column.label}
									</label>
									
									<span 
										id={`col-${column.id}-desc`}
										style={{ 
											fontSize: '12px', 
											color: 'var(--muted)',
											marginLeft: 'auto'
										}}
									>
										{t('order_position', { position: index + 1 }) || `Position ${index + 1}`}
									</span>
								</div>
							))}
						</div>
					</div>
					
					<div style={{ 
						display: 'flex', 
						gap: 12, 
						justifyContent: 'space-between',
						alignItems: 'center'
					}}>
						<Button
							onClick={handleReset}
							variant="secondary"
						>
							{t('button_reset_columns') || 'Reset to Default'}
						</Button>
						
						<div style={{ display: 'flex', gap: 8 }}>
							<Button
								onClick={onClose}
								variant="secondary"
							>
								{t('button_cancel') || 'Cancel'}
							</Button>
							<Button
								onClick={handleApply}
								variant="primary"
							>
								{t('button_apply') || 'Apply'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}