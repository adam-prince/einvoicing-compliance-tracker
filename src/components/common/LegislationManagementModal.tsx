import React, { useState, useCallback } from 'react';
import { DraggableModal } from './DraggableModal';
import type { LegislationDocument } from '../../data/formatSpecifications';
import { apiService } from '../../services/api';

interface LegislationManagementModalProps {
	isOpen: boolean;
	onClose: () => void;
	countryCode: string;
	countryName: string;
	onLegislationAdded: (legislation: LegislationDocument) => void;
}

export function LegislationManagementModal({ 
	isOpen, 
	onClose, 
	countryCode, 
	countryName,
	onLegislationAdded 
}: LegislationManagementModalProps) {
	const [formData, setFormData] = useState<Partial<LegislationDocument>>({
		name: '',
		url: '',
		language: '',
		jurisdiction: countryName,
		type: 'law',
		documentId: ''
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = useCallback(() => {
		const newErrors: Record<string, string> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Legislation name is required';
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

		if (!formData.jurisdiction?.trim()) {
			newErrors.jurisdiction = 'Jurisdiction is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [formData]);

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		const newLegislationRequest = {
			countryCode,
			name: formData.name!,
			url: formData.url!,
			language: formData.language || undefined,
			jurisdiction: formData.jurisdiction!,
			type: formData.type as LegislationDocument['type'],
			documentId: formData.documentId || undefined
		};

		// Save to backend
		try {
			const response = await apiService.createCustomLegislation(newLegislationRequest);
			
			if (response.success) {
				// Convert backend legislation to frontend format for callback
				const newLegislation: LegislationDocument = {
					name: response.data.name,
					url: response.data.url,
					language: response.data.language,
					jurisdiction: response.data.jurisdiction,
					type: response.data.type,
					documentId: response.data.documentId
				};
				
				onLegislationAdded(newLegislation);
				
				// Reset form
				setFormData({
					name: '',
					url: '',
					language: '',
					jurisdiction: countryName,
					type: 'law',
					documentId: ''
				});
				
				onClose();
			} else {
				setErrors({ submit: 'Failed to save legislation. Please try again.' });
			}
		} catch (error) {
			console.error('Failed to save custom legislation:', error);
			setErrors({ submit: 'Failed to save legislation. Please try again.' });
		}
	}, [formData, validateForm, onLegislationAdded, countryCode, countryName, onClose]);

	const handleInputChange = useCallback((field: keyof LegislationDocument, value: string) => {
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
			title="Add Legislation"
			subtitle={`${countryName} • ${countryCode}`}
			size="medium"
		>
			<div className="legislation-management-modal">
				<p style={{ marginBottom: '20px', color: 'var(--muted)' }}>
					Add new legislation documentation for {countryName}. This will be saved locally and persist across sessions.
				</p>

				<form onSubmit={handleSubmit}>
					<div className="form-grid">
						<div className="form-field full-width">
							<label htmlFor="legislation-name">
								Legislation Name *
							</label>
							<input
								id="legislation-name"
								type="text"
								value={formData.name || ''}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="e.g., Directive 2014/55/EU, Anti-Fraud Law 11/2021"
								className={errors.name ? 'error' : ''}
							/>
							{errors.name && <span className="error-text">{errors.name}</span>}
						</div>

						<div className="form-field full-width">
							<label htmlFor="legislation-url">
								URL *
							</label>
							<input
								id="legislation-url"
								type="url"
								value={formData.url || ''}
								onChange={(e) => handleInputChange('url', e.target.value)}
								placeholder="https://example.com/legislation"
								className={errors.url ? 'error' : ''}
							/>
							{errors.url && <span className="error-text">{errors.url}</span>}
						</div>

						<div className="form-field">
							<label htmlFor="legislation-jurisdiction">
								Jurisdiction *
							</label>
							<input
								id="legislation-jurisdiction"
								type="text"
								value={formData.jurisdiction || ''}
								onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
								placeholder="e.g., Spain, European Union"
								className={errors.jurisdiction ? 'error' : ''}
							/>
							{errors.jurisdiction && <span className="error-text">{errors.jurisdiction}</span>}
						</div>

						<div className="form-field">
							<label htmlFor="legislation-type">
								Type
							</label>
							<select
								id="legislation-type"
								value={formData.type || 'law'}
								onChange={(e) => handleInputChange('type', e.target.value)}
							>
								<option value="directive">Directive</option>
								<option value="regulation">Regulation</option>
								<option value="law">Law</option>
								<option value="decree">Decree</option>
								<option value="guideline">Guideline</option>
							</select>
						</div>

						<div className="form-field">
							<label htmlFor="legislation-language">
								Language
							</label>
							<input
								id="legislation-language"
								type="text"
								value={formData.language || ''}
								onChange={(e) => handleInputChange('language', e.target.value)}
								placeholder="e.g., Spanish, Multi-language"
							/>
						</div>

						<div className="form-field">
							<label htmlFor="legislation-document-id">
								Document ID
							</label>
							<input
								id="legislation-document-id"
								type="text"
								value={formData.documentId || ''}
								onChange={(e) => handleInputChange('documentId', e.target.value)}
								placeholder="e.g., 32014L0055, BOE-A-2013-12886"
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
							Add Legislation
						</button>
					</div>
				</form>
			</div>
		</DraggableModal>
	);
}