/**
 * Home Page Component
 * 
 * This file implements the main landing page of the application with internationalization support.
 * It demonstrates the use of i18next for multi-language content, React Router's data API for
 * server-side rendering, and responsive design with Tailwind CSS.
 * 
 * Key features:
 * - Server-side translation with i18next
 * - Client-side translation with useTranslation hook
 * - SEO-friendly metadata using React Router's meta export
 * - Responsive typography with Tailwind CSS
 */

import type { Route } from "./+types/home";

import { redirect } from "react-router";
import { useTranslation } from "react-i18next";

import i18next from "~/core/lib/i18next.server";

/**
 * Loader function for server-side data fetching
 * 
 * This function redirects all home page requests to the login page.
 * 
 * @param request - The incoming HTTP request
 * @returns Redirect to login page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Redirect to login page
  return redirect("/login");
}

/**
 * Home page component
 * 
 * This is the main landing page component of the application. It displays a simple,
 * centered layout with a headline and subtitle, both internationalized using i18next.
 * 
 * Features:
 * - Uses the useTranslation hook for client-side translation
 * - Implements responsive design with Tailwind CSS
 * - Maintains consistent translations between server and client
 * 
 * The component is intentionally simple to serve as a starting point for customization.
 * It demonstrates the core patterns used throughout the application:
 * - Internationalization
 * - Responsive design
 * - Clean, semantic HTML structure
 * 
 * @returns JSX element representing the home page
 */
export default function Home() {
  // Get the translation function for the current locale
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* Main headline with responsive typography */}
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
        {t("home.title")}
      </h1>
      
      {/* Subtitle */}
      <h2 className="text-2xl">{t("home.subtitle")}</h2>
    </div>
  );
}
