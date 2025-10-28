/**
 * Set Locale API Endpoint
 *
 * This file implements an API endpoint for changing the user's language preference.
 * It handles locale validation, cookie setting, and integration with the i18next
 * internationalization system.
 *
 * Key features:
 * - Locale validation against supported languages
 * - Cookie-based persistence of language preference
 * - Integration with i18next internationalization system
 * - Type-safe implementation with Zod schema
 */
import { type LoaderFunctionArgs, data } from "react-router";
import { z } from "zod";

import { localeCookie } from "~/core/lib/i18next.server";
import i18n from "~/i18n";

/**
 * Validation schema for locale parameter
 *
 * This schema ensures that only supported languages can be set as the locale.
 * It uses the supported languages list from the i18next configuration to
 * create a type-safe enum validation.
 */
const localeSchema = z.enum(i18n.supportedLngs);

/**

 * @param request - The incoming HTTP request with locale parameter
 * @returns Response with Set-Cookie header for the new locale
 */
export async function action({ request }: LoaderFunctionArgs) {
  // Extract locale from URL parameters
  const url = new URL(request.url);

  // Validate locale against supported languages
  // This will throw an error if the locale is not supported
  const locale = localeSchema.parse(url.searchParams.get("locale"));

  // Return response with cookie header to set the new locale
  return data(null, {
    headers: {
      "Set-Cookie": await localeCookie.serialize(locale),
    },
  });
}
