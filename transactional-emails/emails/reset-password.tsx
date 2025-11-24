import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  userName?: string;
  resetUrl?: string;
}

export default function ResetPasswordEmail({
  userName = "사용자",
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>싱크로 비밀번호 재설정</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>비밀번호 재설정</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              {userName}님, 비밀번호 재설정을 요청하셨습니다.
            </Text>
            <Text style={text}>
              아래 버튼을 클릭하여 비밀번호를 재설정해주세요.
            </Text>

            {resetUrl && (
              <Button style={button} href={resetUrl}>
                비밀번호 재설정
              </Button>
            )}

            <Text style={smallText}>
              이 링크는 24시간 동안 유효합니다. 만약 요청하지 않으셨다면 이
              이메일을 무시해주세요.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

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

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1e293b",
};

const content = {
  padding: "20px 0",
};

const text = {
  fontSize: "16px",
  color: "#64748b",
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none" as const,
  fontWeight: "600",
  display: "inline-block",
};

const smallText = {
  fontSize: "14px",
  color: "#94a3b8",
  marginTop: "24px",
};
