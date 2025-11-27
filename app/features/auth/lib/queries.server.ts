/**
 * Authentication Database Queries
 *
 * This file contains server-side database queries related to user authentication.
 * It provides utility functions to check user existence and other auth-related operations.
 */
import { count, eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import db from "~/core/db/drizzle-client.server";

/**
 * Check if a user with the given email already exists in the database
 *
 * This function is used during registration to prevent duplicate accounts.
 *
 * @param email - The email address to check
 * @returns A boolean indicating whether the user exists (true) or not (false)
 */
export async function doesUserExist(email: string) {
  const totalUsers = await db
    .select({
      count: count(),
    })
    .from(authUsers)
    .where(eq(authUsers.email, email));

  return totalUsers[0].count > 0;
}

/**
 * Check user status including email confirmation
 *
 * @param email - The email address to check
 * @returns Object containing existence and confirmation status
 */
export async function getUserStatus(email: string) {
  const users = await db
    .select({
      emailConfirmedAt: authUsers.emailConfirmedAt,
    })
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (users.length === 0) {
    return { exists: false, confirmed: false };
  }

  return {
    exists: true,
    confirmed: !!users[0].emailConfirmedAt,
  };
}
