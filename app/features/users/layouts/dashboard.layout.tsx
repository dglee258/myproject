import { eq } from "drizzle-orm";
import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import { profiles } from "~/features/users/schema";

import DashboardSidebar from "../components/dashboard-sidebar";

export async function loader({ request }: { request: Request }) {
  const [{ default: db }, { default: makeServerClient }] = await Promise.all([
    import("~/core/db/drizzle-client.server"),
    import("~/core/lib/supa-client.server"),
  ]);
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
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

export default function DashboardLayout({ loaderData }: { loaderData: any }) {
  const { user, isSuperAdmin } = loaderData as any;
  return (
    <SidebarProvider>
      <DashboardSidebar
        user={{
          name: user?.user_metadata.name ?? "",
          avatarUrl: user?.user_metadata.avatar_url ?? "",
          email: user?.email ?? "",
        }}
        isSuperAdmin={isSuperAdmin}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
