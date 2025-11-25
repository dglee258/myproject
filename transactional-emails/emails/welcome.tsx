import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* Email templates require inline styles for cross-client compatibility */

interface WelcomeEmailProps {
  userName?: string;
  verificationUrl?: string;
  dashboardUrl?: string;
}

export default function WelcomeEmail({
  userName = "사용자",
  verificationUrl,
  dashboardUrl = "https://synchro.app/work/upload",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        싱크로에 오신 것을 환영합니다! AI 기반 업무프로세스 자동화를
        시작해보세요.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://synchro.app/logo.png"
              width="120"
              height="40"
              alt="싱크로 로고"
              style={logo}
            />
          </Section>

          {/* Hero Section */}
          <Section style={hero}>
            <Heading style={heroHeading}>
              {userName}님, 싱크로에 오신 것을 환영합니다! 🎉
            </Heading>
            <Text style={heroText}>
              동영상을 업로드하면 AI가 자동으로 업무프로세스를 분석해주는
              혁신적인 경험을 시작해보세요.
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={sectionTitle}>
              ✨ 싱크로에서 무엇을 할 수 있나요?
            </Heading>

            <Section style={feature}>
              <Text style={featureTitle}>🎥 동영상 업로드</Text>
              <Text style={featureText}>
                MP4, MOV, AVI 등 다양한 형식의 동영상을 쉽게 업로드할 수
                있습니다.
              </Text>
            </Section>

            <Section style={feature}>
              <Text style={featureTitle}>🤖 AI 자동 분석</Text>
              <Text style={featureText}>
                Google AI 기술로 동영상을 분석하여 업무 단계별로 자동
                정리해드립니다.
              </Text>
            </Section>

            <Section style={feature}>
              <Text style={featureTitle}>📋 업무프로세스 카드</Text>
              <Text style={featureText}>
                분석된 결과를 시각적인 카드 형태로 만들어 쉽게 공유하고 관리할
                수 있습니다.
              </Text>
            </Section>

            <Section style={feature}>
              <Text style={featureTitle}>👥 팀 관리</Text>
              <Text style={featureText}>
                팀원을 초대하고 함께 업무프로세스를 관리하며 협업 효율을
                높여보세요.
              </Text>
            </Section>
          </Section>

          {/* CTA Buttons */}
          <Section style={ctaSection}>
            {verificationUrl && (
              <div style={{ marginBottom: "16px" }}>
                <Button style={primaryButton} href={verificationUrl}>
                  이메일 인증 완료하기
                </Button>
                <Text style={buttonText}>
                  인증 후 모든 기능을 정상적으로 이용할 수 있습니다.
                </Text>
              </div>
            )}

            <Button style={secondaryButton} href={dashboardUrl}>
              첫 동영상 업로드하기 →
            </Button>
          </Section>

          {/* Tips */}
          <Section style={tipsSection}>
            <Heading style={sectionTitle}>💡 시작을 위한 팁</Heading>
            <Text style={tipsText}>
              • 5분 이내의 짧은 동영상으로 시작해보세요
              <br />
              • 화면 녹화 시 마우스 클릭과 키보드 입력을 명확히 보여주세요
              <br />• 하나의 완전한 업무 프로세스를 담은 영상이 가장 좋습니다
            </Text>
          </Section>

          {/* Support */}
          <Section style={supportSection}>
            <Text style={supportText}>
              궁금한 점이 있으신가요? 언제든지{" "}
              <Link href="mailto:support@synchro.app" style={supportLink}>
                support@synchro.app
              </Link>
              으로 문의해주세요.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              싱크로와 함께 스마트한 업무 관리를 시작해보세요!
            </Text>
            <Text style={footerSmall}>
              이 이메일은 싱크로 가입 시 자동으로 발송되었습니다.
              <br />더 이상 이메일을 받고 싶지 않으시다면{" "}
              <Link href="#" style={unsubscribeLink}>
                여기
              </Link>
              를 클릭해주세요.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
};

const header = {
  textAlign: "center" as const,
  padding: "40px 0 20px",
};

const logo = {
  borderRadius: "8px",
};

const hero = {
  textAlign: "center" as const,
  padding: "0 0 40px",
  borderBottom: "1px solid #e2e8f0",
};

const heroHeading = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#1e293b",
  margin: "0 0 16px",
  lineHeight: "1.2",
};

const heroText = {
  fontSize: "18px",
  color: "#64748b",
  margin: "0",
  lineHeight: "1.5",
};

const content = {
  padding: "40px 0",
};

const sectionTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 20px",
};

const feature = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
};

const featureTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 8px",
};

const featureText = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
  lineHeight: "1.5",
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "40px 0",
  backgroundColor: "#f1f5f9",
  margin: "0 -20px",
  borderRadius: "8px",
};

const primaryButton = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "16px 32px",
  borderRadius: "8px",
  textDecoration: "none" as const,
  fontWeight: "600",
  fontSize: "16px",
  display: "inline-block",
};

const secondaryButton = {
  backgroundColor: "#10b981",
  color: "#ffffff",
  padding: "16px 32px",
  borderRadius: "8px",
  textDecoration: "none" as const,
  fontWeight: "600",
  fontSize: "16px",
  display: "inline-block",
};

const buttonText = {
  fontSize: "12px",
  color: "#64748b",
  margin: "8px 0 0",
};

const tipsSection = {
  padding: "40px 0",
  backgroundColor: "#fef3c7",
  margin: "0 -20px",
  borderRadius: "8px",
};

const tipsText = {
  fontSize: "14px",
  color: "#92400e",
  lineHeight: "1.6",
};

const supportSection = {
  textAlign: "center" as const,
  padding: "40px 0",
  borderTop: "1px solid #e2e8f0",
};

const supportText = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
};

const supportLink = {
  color: "#3b82f6",
  textDecoration: "none" as const,
};

const footer = {
  textAlign: "center" as const,
  padding: "20px 0 0",
  borderTop: "1px solid #e2e8f0",
};

const footerText = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 8px",
};

const footerSmall = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0",
  lineHeight: "1.5",
};

const unsubscribeLink = {
  color: "#94a3b8",
  textDecoration: "none" as const,
};
