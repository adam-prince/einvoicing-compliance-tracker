import React, { useState, useCallback } from 'react';
import { DraggableModal } from './DraggableModal';
import type { FormatSpecification } from '../../data/formatSpecifications';
import { apiService } from '../../services/api';

interface FormatManagementModalProps {
	isOpen: boolean;
	onClose: () => void;
	countryCode: string;
	countryName: string;
	onFormatAdded: (format: FormatSpecification) => void;
}

export function FormatManagementModal({ 
	isOpen, 
	onClose, 
	countryCode, 
	countryName,
	onFormatAdded 
}: FormatManagementModalProps) {
	const [formData, setFormData] = useState<Partial<FormatSpecification>>({
		name: '',
		version: '',
		url: '',
		description: '',
		authority: '',
		type: 'specification'
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = useCallback(() => {
		const newErrors: Record<string, string> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Format name is required';
		}

		if (!formData.url?.trim()) {
			newErrors.url = 'URL is required';
		} else {
			try {
				new URL(formData.url);
			} catch {
				newErrors.url = 'Please enter a valid URL';
			}
		}

		if (!formData.authority?.trim()) {
			newErrors.authority = 'Authority is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [formData]);

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		const newFormatRequest = {
			countryCode,
			name: formData.name!,
			version: formData.version || undefined,
			url: formData.url!,
			description: formData.description || undefined,
			authority: formData.authority!,
			type: formData.type as FormatSpecification['type']
		};

		// Save to backend
		try {
			const response = await apiService.createCustomFormat(newFormatRequest);
			
			if (response.success) {
				// Convert backend format to frontend format for callback
				const newFormat: FormatSpecification = {
					name: response.data.name,
					version: response.data.version,
					url: response.data.url,
					description: response.data.description,
					authority: response.data.authority,
					type: response.data.type
				};
				
				onFormatAdded(newFormat);
				
				// Reset form
				setFormData({
					name: '',
					version: '',
					url: '',
					description: '',
					authority: '',
					type: 'specification'
				});
				
				onClose();
			} else {
				setErrors({ submit: 'Failed to save format. Please try again.' });
			}
		} catch (error) {
			console.error('Failed to save custom format:', error);
			setErrors({ submit: 'Failed to save format. Please try again.' });
		}
	}, [formData, validateForm, onFormatAdded, countryCode, countryName, onClose]);

	const handleInputChange = useCallback((field: keyof FormatSpecification, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }));
		}
	}, [errors]);

	return (
		<DraggableModal
			isOpen={isOpen}
			onClose={onClose}
			title="Add Format"
			subtitle={`${countryName} • ${countryCode}`}
			size="medium"
		>
			<div className="format-management-modal">
				<p style={{ marginBottom: '20px', color: 'var(--muted)' }}>
					Add a new format specification for {countryName}. This will be saved locally and persist across sessions.
				</p>

				<form onSubmit={handleSubmit}>
					<div className="form-grid">
						<div className="form-field">
							<label htmlFor="format-name">
								Format Name *
							</label>
							<input
								id="format-name"
								type="text"
								value={formData.name || ''}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="e.g., UBL 2.1, Factur-X"
								className={errors.name ? 'error' : ''}
							/>
							{errors.name && <span className="error-text">{errors.name}</span>}
						</div>

						<div className="form-field">
							<label htmlFor="format-version">
								Version
							</label>
							<input
								id="format-version"
								type="text"
								value={formData.version || ''}
								onChange={(e) => handleInputChange('version', e.target.value)}
								placeholder="e.g., 2.1, 1.0.3"
							/>
						</div>

						<div className="form-field full-width">
							<label htmlFor="format-url">
								URL *
							</label>
							<input
								id="format-url"
								type="url"
								value={formData.url || ''}
								onChange={(e) => handleInputChange('url', e.target.value)}
								placeholder="https://example.com/specification"
								className={errors.url ? 'error' : ''}
							/>
							{errors.url && <span className="error-text">{errors.url}</span>}
						</div>

						<div className="form-field">
							<label htmlFor="format-authority">
								Authority *
							</label>
							<input
								id="format-authority"
								type="text"
								value={formData.authority || ''}
								onChange={(e) => handleInputChange('authority', e.target.value)}
								placeholder="e.g., OASIS, UN/CEFACT"
								className={errors.authority ? 'error' : ''}
							/>
							{errors.authority && <span className="error-text">{errors.authority}</span>}
						</div>

						<div className="form-field">
							<label htmlFor="format-type">
								Type
							</label>
							<select
								id="format-type"
								value={formData.type || 'specification'}
								onChange={(e) => handleInputChange('type', e.target.value)}
							>
								<option value="specification">Specification</option>
								<option value="standard">Standard</option>
								<option value="schema">Schema</option>
							</select>
						</div>

						<div className="form-field full-width">
							<label htmlFor="format-description">
								Description
							</label>
							<textarea
								id="format-description"
								value={formData.description || ''}
								onChange={(e) => handleInputChange('description', e.target.value)}
								placeholder="Brief description of the format..."
								rows={3}
							/>
						</div>
					</div>

					{errors.submit && (
						<div className="error-text" style={{ marginBottom: '16px' }}>
							{errors.submit}
						</div>
					)}

					<div className="form-actions">
						<button type="button" onClick={onClose} className="btn-secondary">
							Cancel
						</button>
						<button type="submit" className="btn-primary">
							Add Format
						</button>
					</div>
				</form>
			</div>
		</DraggableModal>
	);
}