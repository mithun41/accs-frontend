/** Public URL of a landing page (absolute in the browser so it can be shared). */
export function landingUrl(slug) {
  return typeof window === 'undefined' ? `/offer/${slug}` : `${window.location.origin}/offer/${slug}`;
}
