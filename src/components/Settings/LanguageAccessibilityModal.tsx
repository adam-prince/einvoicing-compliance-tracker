import React, { useState, useEffect } from 'react';
import { Button } from 'carbon-react';
import { useStore } from '../../store/useStore';
import { useI18n } from '../../i18n';
import { announcer } from '../../utils/accessibility';
import { DraggableModal } from '../common/DraggableModal';

interface LanguageAccessibilityModalProps {
	onClose: () => void;
}

export const LanguageAccessibilityModal: React.FC<LanguageAccessibilityModalProps> = ({
	onClose
}) => {
	const { t } = useI18n();
	const { language, setLanguage } = useStore();
	const [highContrastMode, setHighContrastMode] = useState<boolean>(false);

	// Load high contrast setting from localStorage
	useEffect(() => {
		const savedHighContrast = localStorage.getItem('high-contrast-mode') === 'true';
		setHighContrastMode(savedHighContrast);
		
		if (savedHighContrast) {
			document.body.classList.add('high-contrast');
		}
	}, []);

	// Handle high contrast mode toggle
	const handleHighContrastToggle = (enabled: boolean) => {
		setHighContrastMode(enabled);
		localStorage.setItem('high-contrast-mode', enabled.toString());
		
		if (enabled) {
			document.body.classList.add('high-contrast');
			announcer.announce('High contrast mode enabled', 'polite');
		} else {
			document.body.classList.remove('high-contrast');
			announcer.announce('High contrast mode disabled', 'polite');
		}
	};

	// Handle language change
	const handleLanguageChange = (newLanguage: string) => {
		setLanguage(newLanguage);
		announcer.announce(`Language changed to ${getLanguageDisplayName(newLanguage)}`, 'polite');
	};

	// Get display name for language
	const getLanguageDisplayName = (lang: string): string => {
		const names: Record<string, string> = {
			'en-US': 'English (US)',
			'en-UK': 'English (UK)',
			'fr': 'Français',
			'de': 'Deutsch',
			'es': 'Español'
		};
		return names[lang] || lang;
	};


	return (
		<DraggableModal
			isOpen={true}
			onClose={onClose}
			title="Language & Accessibility"
			subtitle="Configure display language and accessibility features"
			size="medium"
			aria-describedby="language-accessibility-description"
		>
			<div id="language-accessibility-description" className="sr-only">
				Settings dialog for configuring display language and accessibility options including high contrast mode.
			</div>

				<div className="language-accessibility-content">
					{/* Language Selection Section */}
					<div className="settings-section">
						<h3>Interface Language</h3>
						<p>Choose your preferred display language for the interface.</p>
						
						<div className="language-selection">
							<label htmlFor="language-preference">
								Language:
							</label>
							<select
								id="language-preference"
								value={language}
								onChange={(e) => handleLanguageChange(e.target.value)}
								aria-describedby="language-help"
								className="language-select"
							>
								<option value="en-US">English (US)</option>
								<option value="en-UK">English (UK)</option>
								<option value="fr">Français</option>
								<option value="de">Deutsch</option>
								<option value="es">Español</option>
							</select>
							<div id="language-help" className="help-text">
								Select your preferred language for the user interface.
							</div>
						</div>
					</div>

					{/* Accessibility Section */}
					<div className="settings-section">
						<h3>Accessibility Features</h3>
						<p>Configure accessibility options to improve your experience.</p>
						
						<div className="accessibility-controls">
							<div className="accessibility-option">
								<label className="checkbox-label">
									<input
										type="checkbox"
										checked={highContrastMode}
										onChange={(e) => handleHighContrastToggle(e.target.checked)}
										aria-describedby="contrast-help"
										className="accessibility-checkbox"
									/>
									<span className="checkbox-text">Enable High Contrast Mode</span>
								</label>
								<div id="contrast-help" className="help-text">
									Increases color contrast for better visibility and accessibility compliance.
								</div>
							</div>

							{/* Additional accessibility information */}
							<div className="accessibility-info">
								<h4>Built-in Accessibility Features</h4>
								<ul>
									<li>Full keyboard navigation support</li>
									<li>Screen reader compatibility</li>
									<li>WCAG 2.1 Level AA compliance</li>
									<li>Reduced motion support (respects system preferences)</li>
									<li>Focus indicators for all interactive elements</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

			<div className="modal-actions">
				<Button
					onClick={onClose}
					size="medium"
					variant="primary"
				>
					Done
				</Button>
			</div>
		</DraggableModal>
	);
};