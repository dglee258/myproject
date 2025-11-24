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

interface ConfirmEmailProps {
  userName?: string;
  confirmationUrl?: string;
}

export default function ConfirmEmail({
  userName = "사용자",
  confirmationUrl,
}: ConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>싱크로 이메일 확인</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>이메일 확인</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              {userName}님, 싱크로에 가입해주셔서 감사합니다.
            </Text>
            <Text style={text}>
              이메일 주소를 확인하시려면 아래 버튼을 클릭해주세요.
            </Text>

            {confirmationUrl && (
              <Button style={button} href={confirmationUrl}>
                이메일 확인하기
              </Button>
            )}

            <Text style={smallText}>
              이메일 확인 후 모든 기능을 정상적으로 이용할 수 있습니다.
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
