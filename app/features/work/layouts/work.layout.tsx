import type { Route } from "./+types/work.layout";

import { eq } from "drizzle-orm";
import { Outlet } from "react-router";
import { redirect } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import { profiles } from "~/features/users/schema";

import WorkSidebar from "../components/work-sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const [{ default: db }, { default: makeServerClient }] = await Promise.all([
    import("~/core/db/drizzle-client.server"),
    import("~/core/lib/supa-client.server"),
  ]);
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    // 현재 URL을 redirect 파라미터로 포함하여 로그인 페이지로 리디렉션
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  let isSuperAdmin = false;

  if (user) {
    const [profile] = await db
      .select({ is_super_admin: profiles.is_super_admin })
      .from(profiles)
      .where(eq(profiles.profile_id, user.id as any))
      .limit(1);

    isSuperAdmin = !!profile?.is_super_admin;
  }

  return {
    user,
    isSuperAdmin,
  };
}

export default function WorkLayout({ loaderData }: Route.ComponentProps) {
  const { user, isSuperAdmin } = loaderData as any;
  return (
    <SidebarProvider>
      <WorkSidebar
        user={{
          name: user?.user_metadata.name ?? "",
          avatarUrl: user?.user_metadata.avatar_url ?? "",
          email: user?.email ?? "",
        }}
        isSuperAdmin={isSuperAdmin}
      />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold">업무 관리</h1>
        </header>
        <div className="flex h-full flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
