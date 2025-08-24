import { useEffect } from 'react';
import { generateCSPHeader } from '../../utils/security';

/**
 * Component that adds security headers to the page
 * This should be included in the root App component
 */
export function SecurityHeaders() {
  useEffect(() => {
    // Add Content Security Policy via meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = generateCSPHeader();
    document.head.appendChild(cspMeta);

    // Add X-Frame-Options to prevent clickjacking
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'DENY';
    document.head.appendChild(frameMeta);

    // Add X-Content-Type-Options to prevent MIME type sniffing
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    document.head.appendChild(contentTypeMeta);

    // Add Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerMeta);

    // Add Permissions Policy
    const permissionsMeta = document.createElement('meta');
    permissionsMeta.httpEquiv = 'Permissions-Policy';
    permissionsMeta.content = 'camera=(), microphone=(), geolocation=(), payment=()';
    document.head.appendChild(permissionsMeta);

    // Cleanup function to remove meta tags on unmount
    return () => {
      document.head.removeChild(cspMeta);
      document.head.removeChild(frameMeta);
      document.head.removeChild(contentTypeMeta);
      document.head.removeChild(referrerMeta);
      document.head.removeChild(permissionsMeta);
    };
  }, []);

  // This component doesn't render anything
  return null;
}