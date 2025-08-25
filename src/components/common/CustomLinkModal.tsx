import React, { useState } from 'react';
import { Button } from 'carbon-react';
import { DraggableModal } from './DraggableModal';
import { customLinkService, CustomLinkRequest } from '../../services/customLinkService';

interface CustomLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryCode: string;
  originalUrl: string;
  linkType: 'legislation' | 'specification' | 'news' | 'standard';
  title: string;
  onSuccess: (customUrl: string) => void;
}

export function CustomLinkModal({ 
  isOpen, 
  onClose, 
  countryCode, 
  originalUrl, 
  linkType, 
  title: originalTitle,
  onSuccess 
}: CustomLinkModalProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [title, setTitle] = useState(originalTitle);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!customUrl.trim()) {
      setError('Please provide a custom URL');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    // Basic URL validation
    try {
      new URL(customUrl);
    } catch {
      setError('Please provide a valid URL');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const request: CustomLinkRequest = {
        countryCode,
        linkType,
        originalUrl,
        customUrl: customUrl.trim(),
        title: title.trim(),
        notes: notes.trim() || undefined,
      };

      const result = await customLinkService.createOrUpdateLink(request);
      
      if (result) {
        onSuccess(customUrl);
        handleClose();
      } else {
        setError('Failed to save custom link. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving the custom link.');
      console.error('Custom link save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCustomUrl('');
    setTitle(originalTitle);
    setNotes('');
    setError('');
    onClose();
  };

  const linkTypeOptions = [
    { id: 'legislation', text: 'Legislation' },
    { id: 'specification', text: 'Specification' },
    { id: 'news', text: 'News' },
    { id: 'standard', text: 'Standard' },
  ];

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Provide Better Link"
      subtitle={`${countryCode} - Link Override`}
      size="medium"
    >
      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '14px' }}>
          The current link may be incorrect or outdated. You can provide a better link that will be stored and used instead.
        </p>
        
        <div style={{ background: 'var(--panel-2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Original URL:</div>
          <div style={{ fontSize: '13px', color: 'var(--text)', wordBreak: 'break-all' }}>{originalUrl}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="link-type" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Link Type
          </label>
          <select
            id="link-type"
            value={linkType}
            disabled
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--panel-2)',
              color: 'var(--muted)'
            }}
          >
            {linkTypeOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.text}</option>
            ))}
          </select>
          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
            The type of content this link points to
          </small>
        </div>

        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title for this link"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--panel)',
              color: 'var(--text)'
            }}
          />
          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
            A clear title describing what this link contains
          </small>
        </div>

        <div>
          <label htmlFor="custom-url" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Better URL *
          </label>
          <input
            id="custom-url"
            type="url"
            value={customUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUrl(e.target.value)}
            placeholder="https://example.com/better-link"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--panel)',
              color: 'var(--text)'
            }}
          />
          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
            The improved URL that should be used instead
          </small>
        </div>

        <div>
          <label htmlFor="notes" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Additional notes about this link override..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--panel)',
              color: 'var(--text)',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
            Optional notes explaining why this link is better
          </small>
        </div>

        {error && (
          <div style={{ 
            color: 'var(--red)', 
            fontSize: '14px', 
            background: 'rgba(220, 38, 38, 0.1)', 
            padding: '8px 12px', 
            borderRadius: '4px',
            border: '1px solid rgba(220, 38, 38, 0.2)'
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          fontSize: '12px', 
          color: 'var(--muted)', 
          background: 'var(--panel-2)', 
          padding: '8px 12px', 
          borderRadius: '4px' 
        }}>
          <strong>Note:</strong> Your custom link will be stored securely and used instead of the original URL. 
          It will persist across data refreshes unless a newer official link is found.
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--border)' 
        }}>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Custom Link'}
          </Button>
        </div>
      </div>
    </DraggableModal>
  );
}