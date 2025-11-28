import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { GithubLogo } from "~/features/auth/components/logos/github";
import { KakaoLogo } from "~/features/auth/components/logos/kakao";

import {
  ConnectProviderButton,
  DisconnectProviderButton,
} from "../connect-provider-buttons";

const enabledProviders = [
  {
    name: "Github",
    key: "github",
    logo: <GithubLogo />,
  },
  {
    name: "Kakao",
    key: "kakao",
    logo: <KakaoLogo />,
  },
];

export default function ConnectSocialAccountsForm({
  providers,
}: {
  providers: string[];
}) {
  return (
    <Card className="w-full max-w-screen-md overflow-hidden rounded-2xl border border-white/20 bg-white/40 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40">
      <CardHeader>
        <CardTitle>소셜 계정 연동</CardTitle>
        <CardDescription>
          계정에 추가 인증 방법을 추가하거나 제거합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {enabledProviders.map((provider) => {
          if (providers.includes(provider.key)) {
            return (
              <DisconnectProviderButton
                key={provider.key}
                provider={provider.name}
                logo={provider.logo}
                providerKey={provider.key}
              />
            );
          } else {
            return (
              <ConnectProviderButton
                key={provider.key}
                provider={provider.name}
                logo={provider.logo}
                providerKey={provider.key}
              />
            );
          }
        })}
      </CardContent>
    </Card>
  );
}
