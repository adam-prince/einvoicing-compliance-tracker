import React, { useState, useEffect } from 'react';
import { Button } from 'carbon-react';
import { customLinkService } from '../../services/customLinkService';
import { CustomLinkModal } from './CustomLinkModal';

interface EnhancedLinkProps {
  url: string;
  title: string;
  countryCode: string;
  linkType: 'legislation' | 'specification' | 'news' | 'standard';
  lastUpdated?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
}

export function EnhancedLink({ 
  url: originalUrl, 
  title, 
  countryCode, 
  linkType, 
  lastUpdated,
  children,
  className,
  style,
  target = '_blank',
  rel = 'noopener noreferrer'
}: EnhancedLinkProps) {
  const [actualUrl, setActualUrl] = useState(originalUrl);
  const [hasCustomLink, setHasCustomLink] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkForCustomLink();
  }, [originalUrl, countryCode, linkType, lastUpdated]);

  const checkForCustomLink = async () => {
    setIsLoading(true);
    try {
      const bestUrl = await customLinkService.getBestUrl(countryCode, originalUrl, linkType, lastUpdated);
      const resolution = await customLinkService.resolveUrl(countryCode, originalUrl, linkType, lastUpdated);
      
      setActualUrl(bestUrl);
      setHasCustomLink(resolution.hasCustomLink);
    } catch (error) {
      console.error('Failed to check for custom link:', error);
      setActualUrl(originalUrl);
      setHasCustomLink(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomLinkSuccess = (customUrl: string) => {
    setActualUrl(customUrl);
    setHasCustomLink(true);
  };

  const linkContent = children || title;

  return (
    <>
      <a
        href={actualUrl}
        title={hasCustomLink ? `Custom link: ${title}` : title}
        className={className}
        style={{
          ...style,
          position: 'relative',
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          flex: 1
        }}
        target={target}
        rel={rel}
      >
        {linkContent}
        {hasCustomLink && (
          <span
            style={{
              marginLeft: '4px',
              color: 'var(--green)',
              verticalAlign: 'middle',
              fontSize: '14px'
            }}
            title="Using custom link"
          >
            ✓
          </span>
        )}
      </a>
      
      <Button
        variant="tertiary"
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        style={{
          minHeight: '20px',
          padding: '2px 6px',
          color: hasCustomLink ? 'var(--primary)' : 'var(--muted)',
          fontSize: '12px',
          marginLeft: '8px'
        }}
        disabled={isLoading}
        title={hasCustomLink ? "Edit custom link" : "Provide better link"}
      >
        ✏️
      </Button>

      {showModal && (
        <CustomLinkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          countryCode={countryCode}
          originalUrl={originalUrl}
          linkType={linkType}
          title={title}
          onSuccess={handleCustomLinkSuccess}
        />
      )}
    </>
  );
}