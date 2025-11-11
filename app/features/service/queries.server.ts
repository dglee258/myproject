/**
 * Service Page Content Queries
 */

import { eq, and } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import { serviceSections, serviceItems } from "./schema";

/**
 * Get a service section by key
 */
export async function getServiceSection(sectionKey: string) {
  const section = await db.query.serviceSections.findFirst({
    where: eq(serviceSections.section_key, sectionKey),
  });

  return section;
}

/**
 * Get items for a specific section
 */
export async function getServiceItems(sectionKey: string) {
  const items = await db.query.serviceItems.findMany({
    where: and(
      eq(serviceItems.section_key, sectionKey),
      eq(serviceItems.is_active, true),
    ),
    orderBy: (serviceItems, { asc }) => [asc(serviceItems.display_order)],
  });

  return items;
}

/**
 * Get all service page content
 */
export async function getServicePageContent() {
  // Get all active sections
  const sections = await db.query.serviceSections.findMany({
    where: eq(serviceSections.is_active, true),
    orderBy: (serviceSections, { asc }) => [asc(serviceSections.display_order)],
  });

  // Get all active items
  const items = await db.query.serviceItems.findMany({
    where: eq(serviceItems.is_active, true),
    orderBy: (serviceItems, { asc }) => [asc(serviceItems.display_order)],
  });

  // Group items by section
  const sectionsWithItems = sections.map((section) => ({
    ...section,
    items: items.filter((item) => item.section_key === section.section_key),
  }));

  // Convert to object for easy access
  const content: Record<string, any> = {};
  sectionsWithItems.forEach((section) => {
    content[section.section_key] = section;
  });

  return content;
}
