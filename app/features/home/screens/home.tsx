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

import { ArrowRight, LogIn, Play, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, redirect } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";

/**
 * Loader function for server-side data fetching
 *
 * This function redirects all home page requests to the login page.
 *
 * @param request - The incoming HTTP request
 * @returns Redirect to login page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Check if user is authenticated
  const [{ default: makeServerClient }, i18next] = await Promise.all([
    import("~/core/lib/supa-client.server"),
    import("~/core/lib/i18next.server"),
  ]);
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  // If user is logged in, redirect to work page
  if (user) {
    return redirect("/work");
  }

  // Load translations for server-side rendering
  const t = await i18next.default.getFixedT(request);
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
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50/50 p-6 dark:bg-slate-950/50">
      <div className="container mx-auto max-w-5xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center gap-8 py-12 text-center sm:py-20">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/30">
            <Sparkles className="size-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-400">
                AI가 분석하는
              </span>
              <br />
              업무 프로세스 자동화
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 sm:text-xl dark:text-slate-400">
              동영상을 업로드하면 AI가 자동으로 업무 단계를 분석하고
              <br className="hidden sm:block" />
              팀원들과 공유할 수 있는 프로세스 문서를 만들어드려요
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link to="/service">
              <Button 
                size="lg" 
                className="group w-full gap-2 rounded-xl bg-indigo-600 px-8 text-base font-medium hover:bg-indigo-700 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Sparkles className="size-5" />
                서비스 알아보기
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button
                size="lg"
                variant="outline"
                className="group w-full gap-2 rounded-xl border-slate-200 px-8 text-base font-medium hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Play className="size-5 transition-transform group-hover:scale-110" />
                무료 체험하기
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-indigo-400/50">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-500">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">AI 자동 분석</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              동영상에서 업무 단계를 자동으로 추출하고 분석합니다
            </p>
          </Card>

          <Card className="group overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-purple-400/50">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-400 dark:group-hover:bg-purple-500">
              <span className="text-xl">📝</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">프로세스 문서화</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              단계별로 정리된 업무 프로세스를 팀원들과 공유하세요
            </p>
          </Card>

          <Card className="group overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-green-400/50">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white dark:bg-green-900/30 dark:text-green-400 dark:group-hover:bg-green-500">
              <span className="text-xl">👥</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">팀 협업</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              팀원들과 함께 업무 프로세스를 관리하고 개선하세요
            </p>
          </Card>
        </div>

        {/* Demo CTA Section */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white/50 p-8 text-center backdrop-blur-sm dark:border-indigo-900/30 dark:from-indigo-950/30 dark:to-slate-900/50">
          <p className="mb-6 text-lg font-medium text-slate-700 dark:text-slate-300">
            💡 <strong>로그인 없이</strong> 바로 체험해보세요
          </p>
          <Link to="/demo">
            <Button variant="outline" size="lg" className="gap-2 rounded-xl border-indigo-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 dark:border-indigo-800 dark:bg-slate-900 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400">
              <Play className="size-4" />
              샘플 데이터로 체험하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
