import { render } from "@react-email/render";
import { Resend } from "resend";

import WelcomeEmail from "~/transactional-emails/emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendWelcomeEmailParams {
  to: string;
  userName?: string;
  verificationUrl?: string;
}

export async function sendWelcomeEmail({
  to,
  userName,
  verificationUrl,
}: SendWelcomeEmailParams) {
  try {
    // Generate email HTML using React Email
    const emailHtml = await render(
      <WelcomeEmail userName={userName} verificationUrl={verificationUrl} />,
    );

    const { data, error } = await resend.emails.send({
      from: "싱크로 <noreply@synchro.app>",
      to: [to],
      subject:
        "싱크로에 오신 것을 환영합니다! AI 기반 업무프로세스 자동화를 시작해보세요",
      html: emailHtml,
      replyTo: "support@synchro.app",
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log("Welcome email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Welcome email service error:", error);
    throw error;
  }
}

interface EmailTemplate {
  subject: string;
  html: string;
}

export async function generateWelcomeEmailTemplate(
  userName?: string,
  verificationUrl?: string,
): Promise<EmailTemplate> {
  const html = await render(
    <WelcomeEmail userName={userName} verificationUrl={verificationUrl} />,
  );

  return {
    subject:
      "싱크로에 오신 것을 환영합니다! AI 기반 업무프로세스 자동화를 시작해보세요",
    html,
  };
}
