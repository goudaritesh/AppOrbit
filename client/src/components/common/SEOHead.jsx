import { useEffect } from 'react';

/**
 * SEOHead Component (Phase 9 SEO)
 * Dynamically updates document head metadata, Open Graph cards, canonical tags,
 * and JSON-LD structured data without external heavy dependencies.
 */
export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  structuredData = null,
}) => {
  useEffect(() => {
    // 1. Dynamic Title
    const formattedTitle = title
      ? `${title} | AppOrbit`
      : 'AppOrbit – Secure Android App Marketplace';
    document.title = formattedTitle;

    // Helper for meta tags
    const updateMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Meta Description
    const metaDesc =
      description ||
      'AppOrbit is the next-generation secure Android app marketplace. Discover verified APKs, read community ratings, and download safely.';
    updateMetaTag('name', 'description', metaDesc);

    // 3. Open Graph Tags
    const fullUrl = canonicalUrl || window.location.href;
    updateMetaTag('property', 'og:title', formattedTitle);
    updateMetaTag('property', 'og:description', metaDesc);
    updateMetaTag('property', 'og:url', fullUrl);
    updateMetaTag('property', 'og:type', ogType);
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage);
    }

    // 4. Twitter Cards
    updateMetaTag('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    updateMetaTag('name', 'twitter:title', formattedTitle);
    updateMetaTag('name', 'twitter:description', metaDesc);
    if (ogImage) {
      updateMetaTag('name', 'twitter:image', ogImage);
    }

    // 5. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // 6. JSON-LD Structured Data
    const scriptId = 'apporbit-jsonld-schema';
    let scriptEl = document.getElementById(scriptId);

    if (structuredData) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(structuredData);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Clean up JSON-LD on unmount if needed
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [title, description, canonicalUrl, ogImage, ogType, structuredData]);

  return null;
};

export default SEOHead;
