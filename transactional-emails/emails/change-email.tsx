import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function ConfirmEmailChange() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>이메일 변경 확인</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              이메일 변경 확인
            </Heading>
            <Section>
              <Text className="mb-4 break-after-avoid-page text-[15px] leading-relaxed">
                아래 버튼을 클릭하여 이메일을 {`{{ .Email }}`}에서{" "}
                {`{{ .NewEmail }}`}로 변경해주세요:
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/auth/email-verified`}
              >
                이메일 변경 확인
              </Button>
            </Section>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                위 버튼이 작동하지 않는 경우, 아래 URL을 복사하여 브라우저에
                붙여넣으세요:
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-blue-500">
                {`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/auth/email-verified`}
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Synchro에서 계정을 생성하지 않으셨다면 이 이메일을 무시하셔도
                됩니다.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                감사합니다,
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Synchro 팀 드림
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
