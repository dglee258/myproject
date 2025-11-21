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

export default function ResetPassword() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>비밀번호 재설정</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              비밀번호 재설정
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                아래 버튼을 클릭하여 비밀번호를 재설정하세요:
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/forgot-password/create`}
              >
                비밀번호 재설정
              </Button>
            </Section>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                위 버튼이 작동하지 않는 경우, 아래 URL을 복사하여 브라우저에
                붙여넣으세요:
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-blue-500">
                {`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/forgot-password/create`}
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도
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
