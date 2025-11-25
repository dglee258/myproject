import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";

import { sendWelcomeEmail } from "~/features/email/services/email.service";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { to, userName, verificationUrl } = await request.json();

    if (!to || !to.includes("@")) {
      return data(
        { error: "Valid email address is required" },
        { status: 400 },
      );
    }

    const result = await sendWelcomeEmail({
      to,
      userName,
      verificationUrl,
    });

    return data({
      success: true,
      message: "Welcome email sent successfully",
      data: result.data,
    });
  } catch (error: any) {
    console.error("Send welcome email API error:", error);
    return data(
      {
        error: "Failed to send welcome email",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
