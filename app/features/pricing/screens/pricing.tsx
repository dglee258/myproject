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
  // DB에서 가격 플랜 로드
  const { getPricingPlans } = await import("../queries.server");
  const plans = await getPricingPlans();
  
  // Feature flags 조회
  const { getFeatureFlags } = await import("~/core/features/queries.server");
  const flags = await getFeatureFlags(["signup", "contact"]);
  
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
            }`}
          >
            {plan.is_popular && (
              <div className="absolute right-4 top-4">
                <Badge className="gap-1">
                  <Sparkles className="size-3" />
                  인기
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
              {plan.name === "Free" ? (
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
                // Pro/Enterprise 플랜 - 문의하기
                flags.contact?.isEnabled ? (
                  <Link to="/contact">
                    <Button
                      size="lg"
                      className="w-full"
                      variant={plan.is_popular ? "default" : "outline"}
                    >
                      문의하기
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    variant={plan.is_popular ? "default" : "outline"}
                    disabled
                    title={flags.contact?.disabledMessage}
                  >
                    {flags.contact?.disabledMessage || "추후 공개 예정"}
                  </Button>
                )
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
            <Button variant="outline" size="lg">
              문의하기
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
