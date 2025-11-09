/**
 * Home Page Component
 * 
 * This file implements the main landing page of the application with internationalization support.
 * It demonstrates the use of i18next for multi-language content, React Router's data API for
 * server-side rendering, and responsive design with Tailwind CSS.
 * 
 * Key features:
 * - Server-side translation with i18next
 * - Client-side translation with useTranslation hook
 * - SEO-friendly metadata using React Router's meta export
 * - Responsive typography with Tailwind CSS
 */

import type { Route } from "./+types/home";

import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, LogIn, Play } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";
import i18next from "~/core/lib/i18next.server";

/**
 * Loader function for server-side data fetching
 * 
 * This function redirects all home page requests to the login page.
 * 
 * @param request - The incoming HTTP request
 * @returns Redirect to login page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Load translations for server-side rendering
  const t = await i18next.getFixedT(request);
  return { title: t("home.title") };
}

/**
 * Home page component
 * 
 * This is the main landing page component of the application. It displays a simple,
 * centered layout with a headline and subtitle, both internationalized using i18next.
 * 
 * Features:
 * - Uses the useTranslation hook for client-side translation
 * - Implements responsive design with Tailwind CSS
 * - Maintains consistent translations between server and client
 * 
 * The component is intentionally simple to serve as a starting point for customization.
 * It demonstrates the core patterns used throughout the application:
 * - Internationalization
 * - Responsive design
 * - Clean, semantic HTML structure
 * 
 * @returns JSX element representing the home page
 */
export default function Home() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <div className="flex flex-col items-center justify-center gap-8 text-center">
        {/* Main headline */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              AI가 분석하는
            </span>
            <br />
            업무 프로세스 자동화
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">
            동영상을 업로드하면 AI가 자동으로 업무 단계를 분석하고
            <br className="hidden sm:block" />
            팀원들과 공유할 수 있는 프로세스 문서를 만들어드려요
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link to="/service">
            <Button size="lg" className="group w-full gap-2 sm:w-auto">
              <Sparkles className="size-5" />
              서비스 알아보기
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/demo">
            <Button size="lg" variant="outline" className="group w-full gap-2 sm:w-auto">
              <Play className="size-5 transition-transform group-hover:scale-110" />
              무료 체험하기
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-blue-950 dark:to-indigo-950">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold">AI 자동 분석</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              동영상에서 업무 단계를 자동으로 추출하고 분석합니다
            </p>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 dark:from-purple-950 dark:to-pink-950">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">📝</span>
              <h3 className="font-semibold">프로세스 문서화</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              단계별로 정리된 업무 프로세스를 팀원들과 공유하세요
            </p>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 dark:from-green-950 dark:to-emerald-950">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">👥</span>
              <h3 className="font-semibold">팀 협업</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              팀원들과 함께 업무 프로세스를 관리하고 개선하세요
            </p>
          </Card>
        </div>

        {/* Demo CTA */}
        <div className="mt-8 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-muted-foreground mb-4 text-sm">
            💡 <strong>로그인 없이</strong> 바로 체험해보세요
          </p>
          <Link to="/demo">
            <Button variant="outline" className="gap-2">
              <Play className="size-4" />
              샘플 데이터로 체험하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
