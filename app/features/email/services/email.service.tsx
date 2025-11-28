import { render } from "@react-email/render";
import { Resend } from "resend";

import ResetPasswordEmail from "~/transactional-emails/emails/reset-password";
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
      from: "Synchro <onboarding@mail.synchro.it.com>",
      to: [to],
      subject:
        "싱크로에 오신 것을 환영합니다! AI 기반 업무프로세스 자동화를 시작해보세요",
      html: emailHtml,
      replyTo: "support@mail.synchro.it.com",
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

interface SendPasswordResetEmailParams {
  to: string;
  userName?: string;
  resetUrl?: string;
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetUrl,
}: SendPasswordResetEmailParams) {
  try {
    // Generate email HTML using React Email
    const emailHtml = await render(
      <ResetPasswordEmail userName={userName} resetUrl={resetUrl} />,
    );

    const { data, error } = await resend.emails.send({
      from: "Synchro <support@mail.synchro.it.com>",
      to: [to],
      subject: "비밀번호 재설정 요청",
      html: emailHtml,
      replyTo: "support@mail.synchro.it.com",
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    console.log("Password reset email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Password reset email service error:", error);
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
