import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
} from "~/core/components/ui/sidebar";

import WorkSidebar from "../components/work-sidebar";

export default function WorkLayout() {
  return (
    <SidebarProvider>
      <WorkSidebar />
      <SidebarInset>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
