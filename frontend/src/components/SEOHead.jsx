import { useEffect } from 'react';

const DEFAULT_SEO = {
  siteName: 'Swap My Face Tees',
  baseUrl: 'https://www.swapmyface.co.uk',
  defaultImage: 'https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/logos/Swap%20My%20Face%20Logo%20Text%20Transparent.png',
  twitterHandle: '@swapmyfaceuk',
};

export default function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
}) {
  const fullTitle = title
    ? `${title} | ${DEFAULT_SEO.siteName}`
    : `${DEFAULT_SEO.siteName} — Custom Face T-Shirts for Stag & Hen Parties`;

  const metaDesc = description ||
    'Create custom face t-shirts for stag dos, hen parties and birthdays. Upload your photo, choose a template and we print & deliver free across the UK. From £11.99.';

  const metaImage = image || DEFAULT_SEO.defaultImage;
  const metaUrl = url ? `${DEFAULT_SEO.baseUrl}${url}` : DEFAULT_SEO.baseUrl;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('description', metaDesc);
    if (keywords) setMeta('keywords', keywords);
    if (noIndex) setMeta('robots', 'noindex,nofollow');

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', metaDesc, true);
    setMeta('og:image', metaImage, true);
    setMeta('og:url', metaUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', DEFAULT_SEO.siteName, true);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', metaDesc);
    setMeta('twitter:image', metaImage);
    setMeta('twitter:site', DEFAULT_SEO.twitterHandle);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', metaUrl);
  }, [fullTitle, metaDesc, metaImage, metaUrl]);

  return null;
}
