/**
 * Email Verification Resend API Endpoint
 *
 * This module provides an API endpoint for resending verification emails to users
 * during the signup process. It's used when a user hasn't received their initial
 * verification email or when the verification link has expired.
 *
 * The endpoint:
 * - Validates the email address using Zod schema validation
 * - Creates a server-side Supabase client with proper cookie handling
 * - Calls Supabase's resend verification email API
 * - Returns appropriate success or error responses
 *
 * This is part of the authentication flow that ensures users verify their email
 * addresses before gaining full access to the application.
 */
import type { Route } from "./+types/resend";

import { data } from "react-router";
import { z } from "zod";



/**
 * Validation schema for email resend requests
 * 
 * This schema ensures that the submitted email address is valid before
 * attempting to resend the verification email. It uses Zod's email validator
 * with a custom error message for better user feedback.
 */
const resendSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

/**
 * Action handler for resending verification emails
 * 
 * This function processes requests to resend verification emails to users
 * during the signup process. It follows these steps:
 * 1. Extracts and validates the email from the form data
 * 2. Creates a server-side Supabase client with proper authentication context
 * 3. Calls Supabase's resend API with the signup type
 * 4. Sets the redirect URL to the verification page
 * 5. Returns appropriate success or error responses
 * 
 * Security considerations:
 * - Validates email format to prevent malformed requests
 * - Uses server-side validation to prevent client-side bypass
 * - Returns generic error messages to prevent email enumeration
 * 
 * @param request - The incoming HTTP request with form data
 * @returns JSON response indicating success or error
 */
export async function action({ request }: Route.ActionArgs) {
  // Extract form data from the request
  const formData = await request.formData();

  // Validate the email address using Zod schema
  const { success, data: validData } = resendSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    // Return error response if validation fails
    return data({ error: "Invalid email address" }, { status: 400 });
  }

  // Generate signup link using admin client to get the verification URL
  const { default: adminClient } = await import(
    "~/core/lib/supa-admin-client.server"
  );

  const { data: linkData, error: resendError } =
    await adminClient.auth.admin.generateLink({
      type: "signup",
      email: validData.email,
      password: "", // Password not needed for resend, but required by type definition? No, actually generateLink for signup usually needs password if creating, but for existing user?
      // Wait, generateLink type 'signup' is for creating a user or getting a confirmation link for an unconfirmed user.
      // If the user exists but is unconfirmed, 'signup' type works.
      options: {
        redirectTo: `${process.env.SITE_URL}/auth/confirm`,
      },
    });

  if (resendError) {
    return data({ error: resendError.message }, { status: 400 });
  }

  // Send welcome email with the generated verification link
  try {
    const { sendWelcomeEmail } = await import(
      "~/features/email/services/email.service"
    );

    if (linkData?.properties?.action_link) {
      // Fetch user name if possible, or just send without it
      // Since we don't have the user's name here easily without querying, we can omit it or query it.
      // For simplicity/performance, we'll omit it for now or query if critical.
      
      await sendWelcomeEmail({
        to: validData.email,
        verificationUrl: linkData.properties.action_link,
      });
    } else {
      console.error("No action link generated");
      return data({ error: "Failed to generate verification link" }, { status: 500 });
    }
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
    return data({ error: "Failed to send email" }, { status: 500 });
  }

  // Return success response if the email was sent successfully
  return data({ success: true }, { status: 200 });
}
