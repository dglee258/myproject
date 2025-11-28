/**
 * Server-side Utility Functions
 *
 * This module provides utility functions that are intended to be used
 * only on the server side.
 */

/**
 * Retrieves the site URL from environment variables and ensures it has a protocol.
 *
 * If the SITE_URL environment variable is set without a protocol (e.g., "example.com"),
 * this function prepends "https://" to it.
 * If the URL starts with "http://" or "https://", it is returned as is.
 * Trailing slashes are removed.
 *
 * @returns The normalized site URL
 */
export function getSiteUrl() {
  let url = process.env.SITE_URL || "";

  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  return url.replace(/\/$/, "");
}
