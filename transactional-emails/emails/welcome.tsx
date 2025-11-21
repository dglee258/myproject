import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function Welcome({ profile }: { profile: string }) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Synchro에 오신 것을 환영합니다</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              Synchro에 오신 것을 환영합니다
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Synchro에 가입한 모든 사용자에게 자동으로 발송되는 이메일입니다.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                이 이메일은 Supabase Queues, Supabase CRON Jobs 및 Resend를
                사용하여 발송되었습니다.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                가입한 사용자의 프로필 정보입니다:
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                <code className="py-2font-mono mx-auto inline-block rounded bg-[#dfe1e4] px-1 font-bold tracking-[-0.3px] text-black">
                  {profile}
                </code>
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Synchro와 함께하게 되어 기쁩니다!
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

Welcome.PreviewProps = {
  profile: JSON.stringify({
    email: "test@test.com",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.png",
  }),
};
