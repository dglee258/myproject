/**
 * User Registration Screen Component
 *
 * This component handles new user registration with:
 * - Email and password registration
 * - Form validation for all fields
 * - Terms of service and marketing consent options
 * - Social authentication providers
 * - Success confirmation with email verification instructions
 *
 * The registration flow includes validation, duplicate email checking,
 * and Supabase authentication integration.
 */
import type { Route } from "./+types/join";

import { Form, Link, data, redirect } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import resendClient from "~/core/lib/resend-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { SignUpButtons } from "../components/auth-login-buttons";
import { doesUserExist } from "../lib/queries.server";

/**
 * Meta function for the registration page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Create an account | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for user registration
 *
 * Uses Zod to validate:
 * - Name: Required field
 * - Email: Must be a valid email format
 * - Password: Must be at least 8 characters long
 * - Confirm Password: Must match the password field
 * - Marketing: Boolean for marketing consent (defaults to false)
 * - Terms: Boolean for terms acceptance
 *
 * The schema includes a custom refinement to ensure passwords match
 */
const joinSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    marketing: z.coerce.boolean().default(false),
    terms: z.coerce.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * Server action for handling user registration form submission
 *
 * This function processes the registration form data and attempts to create a new user.
 * The flow is:
 * 1. Parse and validate form data using the join schema
 * 2. Return validation errors if the data is invalid
 * 3. Verify terms of service acceptance
 * 4. Check if a user with the provided email already exists
 * 5. Create a new user with Supabase auth
 * 6. Return success or error response
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or success confirmation
 */
export async function action({ request }: Route.ActionArgs) {
  // Parse form data from the request
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = joinSchema.safeParse(Object.fromEntries(formData));

  // Return validation errors if form data is invalid
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  // Verify terms of service acceptance
  if (!validData.terms) {
    return data(
      { error: "You must agree to the terms of service" },
      { status: 400 },
    );
  }

  // Check if a user with the provided email already exists
  const userExists = await doesUserExist(validData.email);

  if (userExists) {
    return data(
      { error: "There is an account with this email already." },
      { status: 400 },
    );
  }

  // Create Supabase client and attempt to sign up the user
  const [client] = makeServerClient(request);
  const { error: signInError } = await client.auth.signUp({
    ...validData,
    options: {
      // Store additional user metadata in Supabase auth
      data: {
        name: validData.name,
        display_name: validData.name,
        marketing_consent: validData.marketing,
      },
    },
  });

  // Return error if user creation fails
  if (signInError) {
    return data({ error: signInError.message }, { status: 400 });
  }

  // Send welcome email directly via Resend using Korean template
  try {
    await resendClient.emails.send({
      from:
        process.env.NODE_ENV === "development"
          ? "Test <test@resend.dev>"
          : "싱크로 <onboarding@yourdomain.com>",
      to: validData.email,
      subject:
        "싱크로에 오신 것을 환영합니다! 동영상 업로드하고 AI 업무프로세스를 바로 확인하세요",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
          <h2 style="text-align: center; color: #333;">싱크로에 오신 것을 환영합니다</h2>
          <p style="color: #666; line-height: 1.6;">
            안녕하세요, ${validData.name}님!<br><br>
            싱크로 가입을 진심으로 환영합니다. 이제 동영상을 업로드하면 AI가 자동으로 업무프로세스를 분석해주는 현대적인 웹 애플리케이션을 경험할 수 있게 되었어요.<br><br>
            가입을 완료하시면 동영상 업로드, AI 분석, 자동 카드 생성, 팀원 공유 등의 기능을 바로 사용하실 수 있습니다. 첫 동영상을 업로드하고 AI가 생성한 업무프로세스를 확인해보세요.<br><br>
            궁금한 점이 있으시면 언제든지 문의해주세요. 싱크로와 함께 스마트한 업무 관리를 시작해보세요!<br><br>
            지금 바로 이메일 인증을 완료하고 첫 번째 업무프로세스를 생성해보세요!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.SITE_URL}/auth/verify" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              이메일 인증하기
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            감사합니다,<br>
            싱크로 팀 드림
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    // Log error but don't fail the signup process
    console.error("Failed to send welcome email:", emailError);
  }

  // Return success response - redirect to login page with success message
  return redirect("/login?message=signup_success");
}

/**
 * Registration Component
 *
 * This component renders the registration form and handles user interactions.
 * It includes:
 * - Personal information fields (name, email)
 * - Password creation with confirmation
 * - Terms of service and marketing consent checkboxes
 * - Error display for form validation and registration errors
 * - Success confirmation with email verification instructions
 * - Social registration options
 * - Sign in link for existing users
 *
 * @param actionData - Data returned from the form action, including errors or success status
 */
export default function Join({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold" role="heading">
            계정 생성
          </CardTitle>
          <CardDescription className="text-base">
            계정 생성을 위해 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form className="flex w-full flex-col gap-5" method="post">
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                이름
              </Label>
              <Input
                id="name"
                name="name"
                required
                type="text"
                placeholder="Name"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.name ? (
                <FormErrors errors={actionData.fieldErrors.name} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="email"
                className="flex flex-col items-start gap-1"
              >
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                required
                type="email"
                placeholder="test@test.com"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="password"
                className="flex flex-col items-start gap-1"
              >
                비밀번호
                <small className="text-muted-foreground">
                  최소 8자 이상이어야 합니다.
                </small>
              </Label>
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="비밀번호를 입력해주세요"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="flex flex-col items-start gap-1"
              >
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.confirmPassword ? (
                <FormErrors errors={actionData.fieldErrors.confirmPassword} />
              ) : null}
            </div>
            <FormButton label="계정 생성" className="w-full" />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox id="marketing" name="marketing" />
              <Label htmlFor="marketing" className="text-muted-foreground">
                마케팅 이메일 수신에 동의합니다.
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" name="terms" checked />
              <Label htmlFor="terms" className="text-muted-foreground">
                <span>
                  {" "}
                  <Link
                    to="/legal/terms-of-service"
                    viewTransition
                    className="text-muted-foreground text-underline hover:text-foreground underline transition-colors"
                  >
                    이용약관
                  </Link>
                  과{" "}
                  <Link
                    to="/legal/privacy-policy"
                    viewTransition
                    className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
                  >
                    개인정보처리방침
                  </Link>
                  을 읽었으며 동의합니다.
                </span>
              </Label>
            </div>
          </Form>
          <SignUpButtons />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center text-sm">
        <p className="text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            data-testid="form-signin-link"
            className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
