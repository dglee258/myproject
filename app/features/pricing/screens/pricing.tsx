import type { Route } from "./+types/pricing";

import { Check, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "가격 안내 - Synchro AI" },
    {
      name: "description",
      content: "AI 업무 프로세스 분석 서비스의 요금제를 확인하세요",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Hardcoded pricing plans
  const plans = [
    {
      plan_id: 1,
      name: "Free",
      description: "개인 및 소규모 팀을 위한 기본 플랜",
      price_monthly: 0,
      price_yearly: 0,
      is_popular: false,
      features: [
        { feature_id: 1, feature_name: "월 5개 영상 분석", feature_value: "" },
        { feature_id: 2, feature_name: "기본 문서 내보내기 (PDF)", feature_value: "" },
        { feature_id: 3, feature_name: "이메일 지원", feature_value: "" },
      ],
    },
    {
      plan_id: 2,
      name: "Pro",
      description: "성장하는 팀을 위한 고급 기능",
      price_monthly: 29000,
      price_yearly: 290000,
      is_popular: true,
      is_coming_soon: true,
      features: [
        { feature_id: 4, feature_name: "무제한 영상 분석", feature_value: "" },
        { feature_id: 5, feature_name: "고급 문서 내보내기 (Notion, HTML)", feature_value: "" },
        { feature_id: 6, feature_name: "우선 기술 지원", feature_value: "" },
        { feature_id: 7, feature_name: "팀 공유 및 협업", feature_value: "" },
      ],
    },
    {
      plan_id: 3,
      name: "Enterprise",
      description: "대규모 조직을 위한 맞춤형 솔루션",
      price_monthly: 99000,
      price_yearly: 990000,
      is_popular: false,
      is_coming_soon: true,
      features: [
        { feature_id: 8, feature_name: "전담 매니저 배정", feature_value: "" },
        { feature_id: 9, feature_name: "SSO 및 보안 강화", feature_value: "" },
        { feature_id: 10, feature_name: "API 액세스", feature_value: "" },
        { feature_id: 11, feature_name: "맞춤형 온보딩", feature_value: "" },
      ],
    },
  ];
  
  // Hardcoded feature flags
  const flags = {
    signup: { isEnabled: true, disabledMessage: "" },
    contact: { isEnabled: true, disabledMessage: "" },
  };
  
  return { plans, flags };
}

export default function Pricing({ loaderData }: Route.ComponentProps) {
  const { plans, flags } = loaderData;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            간단하고 투명한
          </span>
          <br />
          요금제
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          팀의 규모와 필요에 맞는 플랜을 선택하세요
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan: any) => (
          <Card
            key={plan.plan_id}
            className={`relative overflow-hidden p-8 ${
              plan.is_popular
                ? "border-primary shadow-primary/20 border-2 shadow-xl"
                : ""
            } ${plan.is_coming_soon ? "opacity-80" : ""}`}
          >
            {plan.is_popular && (
              <div className="absolute right-4 top-4">
                 <Badge variant="secondary" className="gap-1">
                  준비 중
                </Badge>
              </div>
            )}
            {plan.is_coming_soon && !plan.is_popular && (
               <div className="absolute right-4 top-4">
                <Badge variant="secondary" className="gap-1">
                  준비 중
                </Badge>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground text-sm">
                {plan.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold">
                  {plan.price_monthly === 0
                    ? "무료"
                    : `₩${formatPrice(plan.price_monthly)}`}
                </span>
                {plan.price_monthly > 0 && (
                  <span className="text-muted-foreground text-lg">/월</span>
                )}
              </div>
              {plan.price_yearly && plan.price_yearly > 0 && (
                <p className="text-muted-foreground mt-2 text-sm">
                  연간 결제 시 ₩{formatPrice(plan.price_yearly)}
                  <span className="text-primary ml-1 font-medium">
                    (
                    {Math.round(
                      ((plan.price_monthly * 12 - plan.price_yearly) /
                        (plan.price_monthly * 12)) *
                        100,
                    )}
                    % 절감)
                  </span>
                </p>
              )}
            </div>

            <div className="mb-8">
              {plan.is_coming_soon ? (
                <Button
                  size="lg"
                  className="w-full"
                  variant="outline"
                  disabled
                >
                  추후 공개 예정
                </Button>
              ) : plan.name === "Free" ? (
                // 무료 플랜 - 회원가입
                flags.signup?.isEnabled ? (
                  <Link to="/join">
                    <Button
                      size="lg"
                      className="w-full"
                      variant={plan.is_popular ? "default" : "outline"}
                    >
                      무료로 시작하기
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    variant={plan.is_popular ? "default" : "outline"}
                    disabled
                    title={flags.signup?.disabledMessage}
                  >
                    {flags.signup?.disabledMessage || "추후 공개 예정"}
                  </Button>
                )
              ) : (
                // Fallback for other active plans
                 <Button
                    size="lg"
                    className="w-full"
                    variant={plan.is_popular ? "default" : "outline"}
                    disabled
                  >
                    준비 중
                  </Button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">포함 기능:</p>
              {plan.features.map((feature: any) => (
                <div key={feature.feature_id} className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 size-5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm">{feature.feature_name}</span>
                    {feature.feature_value && (
                      <span className="text-muted-foreground ml-1 text-sm">
                        - {feature.feature_value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">더 궁금한 점이 있으신가요?</h2>
        <p className="text-muted-foreground mb-6">
          맞춤형 Enterprise 플랜이 필요하거나 질문이 있으시면 문의해주세요
        </p>
        {flags.contact?.isEnabled ? (
          <Link to="/contact">
            <Button variant="outline" size="lg" disabled>
              추후 공개
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            size="lg" 
            disabled
            title={flags.contact?.disabledMessage}
          >
            {flags.contact?.disabledMessage || "추후 공개 예정"}
          </Button>
        )}
      </div>

      {/* Features Comparison (Optional) */}
      <div className="mt-16 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-start gap-4">
          <Zap className="mt-1 size-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="mb-2 text-xl font-bold">
              모든 플랜에서 AI 분석 기능을 사용할 수 있습니다
            </h3>
            <p className="text-muted-foreground">
              동영상 업로드, AI 자동 분석, 프로세스 문서화, 팀 공유 등 핵심
              기능은 모든 플랜에 포함되어 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
