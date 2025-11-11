import type { Route } from "./+types/service";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileVideo,
  Lightbulb,
  Play,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "서비스 소개 - Synchro AI" },
    {
      name: "description",
      content: "AI가 동영상을 분석하여 업무 프로세스를 자동으로 문서화합니다",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Feature flags 조회
  const { getFeatureFlags } = await import("~/core/features/queries.server");
  const flags = await getFeatureFlags([
    "signup",
    "service_demo_cta",
    "service_pricing_cta",
  ]);

  // 서비스 페이지 콘텐츠 조회
  const { getServicePageContent } = await import("../queries.server");
  const content = await getServicePageContent();

  return { flags, content };
}

export default function Service({ loaderData }: Route.ComponentProps) {
  const { flags, content } = loaderData;
  
  // DB 콘텐츠 또는 기본값 사용
  const hero = content.hero || {};
  const howItWorks = content.how_it_works || {};
  const keyFeatures = content.key_features || {};
  const useCases = content.use_cases || {};
  const cta = content.cta || {};

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-20">
      {/* Hero Section */}
      <div className="mb-20 text-center">
        <Badge className="mb-4 gap-2" variant="outline">
          <Sparkles className="size-4" />
          {hero.badge_text || "AI 업무 프로세스 자동화"}
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {hero.title || "동영상 하나로"}
          </span>
          <br />
          {hero.subtitle || "업무 프로세스가 완성됩니다"}
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg sm:text-xl">
          {hero.description || "업무 화면을 녹화만 하세요. AI가 자동으로 분석하여 단계별 프로세스 문서를 만들어드립니다"}
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {/* 데모 체험 버튼 */}
          {flags.service_demo_cta?.isEnabled ? (
            <Link to="/demo">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                <Play className="size-5" />
                무료로 체험하기
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="w-full gap-2 sm:w-auto"
              disabled
              title={flags.service_demo_cta?.disabledMessage}
            >
              <Play className="size-5" />
              {flags.service_demo_cta?.disabledMessage || "준비 중입니다"}
            </Button>
          )}

          {/* 요금제 버튼 */}
          {flags.service_pricing_cta?.isEnabled ? (
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                요금제 보기
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              disabled
              title={flags.service_pricing_cta?.disabledMessage}
            >
              {flags.service_pricing_cta?.disabledMessage || "준비 중입니다"}
            </Button>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            {howItWorks.title || "어떻게 작동하나요?"}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            {howItWorks.description || "3단계로 업무 프로세스 문서화가 완성됩니다"}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {(howItWorks.items || []).map((step: any, index: number) => {
            const IconComponent = 
              step.icon === 'FileVideo' ? FileVideo :
              step.icon === 'Bot' ? Bot :
              step.icon === 'CheckCircle2' ? CheckCircle2 : FileVideo;
            
            return (
              <Card key={step.item_id} className="relative overflow-hidden p-8">
                <div className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-lg">
                  <IconComponent className="size-6" />
                </div>
                <div className="absolute right-4 top-4 text-6xl font-bold opacity-5">
                  {index + 1}
                </div>
                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            {keyFeatures.title || "핵심 기능"}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            {keyFeatures.description || "업무 프로세스 관리에 필요한 모든 기능을 제공합니다"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(keyFeatures.items || []).map((feature: any) => {
            // 아이콘이 emoji인 경우와 컴포넌트인 경우 구분
            const isEmoji = feature.icon && !['Sparkles', 'Users', 'Lightbulb'].includes(feature.icon);
            const IconComponent = 
              feature.icon === 'Sparkles' ? Sparkles :
              feature.icon === 'Users' ? Users :
              feature.icon === 'Lightbulb' ? Lightbulb : null;
            
            return (
              <Card key={feature.item_id} className="p-6">
                {isEmoji ? (
                  <span className="mb-4 text-4xl">{feature.icon}</span>
                ) : IconComponent ? (
                  <IconComponent className="text-primary mb-4 size-8" />
                ) : null}
                <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Use Cases */}
      <div className="mb-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            {useCases.title || "이런 업무에 활용하세요"}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            {useCases.description || "다양한 업무 프로세스를 빠르게 문서화할 수 있습니다"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {(useCases.items || []).map((useCase: any) => (
            <Card key={useCase.item_id} className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span className="text-2xl">{useCase.icon}</span>
                {useCase.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {useCase.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950 sm:p-12">
        <h2 className="mb-4 text-3xl font-bold">
          {cta.title || "지금 바로 시작해보세요"}
        </h2>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
          {cta.description || "로그인 없이 데모로 먼저 체험해보거나, 무료 플랜으로 시작할 수 있습니다"}
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {/* 데모 체험 버튼 */}
          {flags.service_demo_cta?.isEnabled ? (
            <Link to="/demo">
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                <Play className="size-5" />
                데모 체험하기
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              disabled
              title={flags.service_demo_cta?.disabledMessage}
            >
              <Play className="size-5" />
              {flags.service_demo_cta?.disabledMessage || "준비 중입니다"}
            </Button>
          )}

          {/* 무료로 시작하기 버튼 - 회원가입 */}
          {flags.signup?.isEnabled ? (
            <Link to="/join">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                무료로 시작하기
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="w-full gap-2 sm:w-auto"
              disabled
              title={flags.signup?.disabledMessage}
            >
              {flags.signup?.disabledMessage || "준비 중입니다"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
