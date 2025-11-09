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

  return { flags };
}

export default function Service({ loaderData }: Route.ComponentProps) {
  const { flags } = loaderData;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-20">
      {/* Hero Section */}
      <div className="mb-20 text-center">
        <Badge className="mb-4 gap-2" variant="outline">
          <Sparkles className="size-4" />
          AI 업무 프로세스 자동화
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            동영상 하나로
          </span>
          <br />
          업무 프로세스가 완성됩니다
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg sm:text-xl">
          업무 화면을 녹화만 하세요. AI가 자동으로 분석하여
          <br className="hidden sm:block" />
          단계별 프로세스 문서를 만들어드립니다
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
          <h2 className="mb-4 text-3xl font-bold">어떻게 작동하나요?</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            3단계로 업무 프로세스 문서화가 완성됩니다
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Step 1 */}
          <Card className="relative overflow-hidden p-8">
            <div className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-lg">
              <FileVideo className="size-6" />
            </div>
            <div className="absolute right-4 top-4 text-6xl font-bold opacity-5">
              1
            </div>
            <h3 className="mb-3 text-xl font-bold">동영상 업로드</h3>
            <p className="text-muted-foreground text-sm">
              업무 화면을 녹화한 동영상을 업로드하세요. 
            </p>
          </Card>

          {/* Step 2 */}
          <Card className="relative overflow-hidden p-8">
            <div className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-lg">
              <Bot className="size-6" />
            </div>
            <div className="absolute right-4 top-4 text-6xl font-bold opacity-5">
              2
            </div>
            <h3 className="mb-3 text-xl font-bold">AI 자동 분석</h3>
            <p className="text-muted-foreground text-sm">
              AI가 동영상을 분석하여 클릭, 입력, 이동 등의 작업을 자동으로
              인식합니다.
            </p>
          </Card>

          {/* Step 3 */}
          <Card className="relative overflow-hidden p-8">
            <div className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-lg">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="absolute right-4 top-4 text-6xl font-bold opacity-5">
              3
            </div>
            <h3 className="mb-3 text-xl font-bold">프로세스 문서 완성</h3>
            <p className="text-muted-foreground text-sm">
              단계별로 정리된 업무 프로세스가 완성됩니다. 팀원들과 공유하고
              메모를 추가하여 더욱 상세하게 만들 수 있습니다.
            </p>
          </Card>
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">핵심 기능</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            업무 프로세스 관리에 필요한 모든 기능을 제공합니다
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <Sparkles className="text-primary mb-4 size-8" />
            <h3 className="mb-2 text-lg font-bold">AI 자동 분석</h3>
            <p className="text-muted-foreground text-sm">
              동영상에서 업무 단계를 자동으로 추출하고 분류합니다
            </p>
          </Card>

          <Card className="p-6">
            <span className="mb-4 text-4xl">📝</span>
            <h3 className="mb-2 text-lg font-bold">단계별 문서화</h3>
            <p className="text-muted-foreground text-sm">
              클릭, 입력, 이동 등 각 단계를 시간순으로 정리합니다
            </p>
          </Card>

          <Card className="p-6">
            <Users className="text-primary mb-4 size-8" />
            <h3 className="mb-2 text-lg font-bold">팀 협업</h3>
            <p className="text-muted-foreground text-sm">
              팀원들과 프로세스를 공유하고 함께 수정할 수 있습니다
            </p>
          </Card>

          <Card className="p-6">
            <Lightbulb className="text-primary mb-4 size-8" />
            <h3 className="mb-2 text-lg font-bold">메모 추가</h3>
            <p className="text-muted-foreground text-sm">
              각 단계에 주의사항이나 팁을 메모로 남길 수 있습니다
            </p>
          </Card>

          
        </div>
      </div>

      {/* Use Cases */}
      <div className="mb-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">이런 업무에 활용하세요</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            다양한 업무 프로세스를 빠르게 문서화할 수 있습니다
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span className="text-2xl">📦</span>
              주문 처리 프로세스
            </h3>
            <p className="text-muted-foreground text-sm">
              고객 주문 접수부터 배송 완료까지의 전 과정을 단계별로 문서화하여
              신입 직원 교육에 활용
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span className="text-2xl">👥</span>
              회원 관리 절차
            </h3>
            <p className="text-muted-foreground text-sm">
              회원 가입 승인, 정보 수정, 탈퇴 처리 등 회원 관리 업무의 표준
              프로세스 수립
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span className="text-2xl">💰</span>
              정산 업무
            </h3>
            <p className="text-muted-foreground text-sm">
              매출 집계, 수수료 계산, 입금 처리 등 복잡한 정산 업무를 명확하게
              문서화
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span className="text-2xl">🎓</span>
              시스템 사용법
            </h3>
            <p className="text-muted-foreground text-sm">
              ERP, CRM 등 사내 시스템의 사용 방법을 단계별로 정리하여 매뉴얼
              제작
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950 sm:p-12">
        <h2 className="mb-4 text-3xl font-bold">
          지금 바로 시작해보세요
        </h2>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
          로그인 없이 데모로 먼저 체험해보거나,
          <br className="hidden sm:block" />
          무료 플랜으로 시작할 수 있습니다
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
