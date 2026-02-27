/**
 * Utility for working with blob storage URLs in MangaKu
 */

import { ExternalBlob } from "../backend";

/**
 * Get direct URL for a stored blob by its blobId/hash
 */
export function getBlobUrl(blobId: string): string {
  if (!blobId) return "";
  return ExternalBlob.fromURL(blobId).getDirectURL();
}

/**
 * Placeholder cover image (dark manga-style SVG)
 */
export const PLACEHOLDER_COVER = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
  <rect width="200" height="280" fill="#1a1a2e"/>
  <rect x="0" y="0" width="200" height="4" fill="#e86100"/>
  <text x="100" y="140" font-family="sans-serif" font-size="14" fill="#444466" text-anchor="middle" dominant-baseline="middle">No Cover</text>
  <rect x="70" y="100" width="60" height="80" rx="2" fill="none" stroke="#333355" stroke-width="2"/>
  <line x1="70" y1="140" x2="130" y2="140" stroke="#333355" stroke-width="1"/>
</svg>
`)}`;
