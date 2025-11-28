import type { Route } from "./+types/profile.layout";

import { ArrowLeftIcon } from "lucide-react";
import { Outlet, useNavigate } from "react-router";

import { Button } from "../components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  const [{ default: makeServerClient }, { requireAuthentication }] =
    await Promise.all([
      import("../lib/supa-client.server"),
      import("../lib/guards.server"),
    ]);
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  return {};
}

export default function AccountLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950/50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center border-b border-white/20 bg-white/40 px-5 shadow-sm backdrop-blur-xl transition-all md:px-10 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="mb-10 flex justify-center pt-6">
              <img
                src="/logo.svg"
                alt="Synchro"
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
          >
            <ArrowLeftIcon className="size-4" />
            <span className="hidden sm:inline">뒤로가기</span>
          </Button>
        </div>
      </header>

      {/* Content area */}
      <div className="mx-auto w-full max-w-7xl p-4 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
}
