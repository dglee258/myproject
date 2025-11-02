import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";

import WorkSidebar from "../components/work-sidebar";

export default function WorkLayout() {
  return (
    <SidebarProvider>
      <WorkSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 lg:hidden">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold">업무 관리</h1>
        </header>
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
