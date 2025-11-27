import {
  BriefcaseIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";

const baseNavItems = [
  {
    title: "업무프로세스",
    url: "/work/business-logic",
    icon: BriefcaseIcon,
  },
  {
    title: "업로드",
    url: "/work/upload",
    icon: UploadIcon,
  },
  {
    title: "팀관리",
    url: "/work/team-management",
    icon: UsersIcon,
  },
];

export default function WorkSidebar(
  props: React.ComponentProps<typeof Sidebar> & {
    user?: {
      name: string;
      email: string;
      avatarUrl?: string;
    };
    isSuperAdmin?: boolean;
  },
) {
  const navigate = useNavigate();
  const { isSuperAdmin, ...sidebarProps } = props;

  const user = sidebarProps.user || {
    name: "홍길동",
    email: "hong@example.com",
    avatarUrl: "https://github.com/shadcn.png",
  };

  const navItems = [...baseNavItems];

  if (isSuperAdmin) {
    navItems.push({
      title: "관리자 대시보드",
      url: "/admin",
      icon: ShieldCheckIcon,
    });
  }
  return (
    <Sidebar collapsible="icon" variant="inset" {...sidebarProps}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <SidebarTrigger className="-ml-1 hidden lg:flex" />
          <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            워크스페이스
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>업무 메뉴</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => {
                      console.log("Navigating to:", item.url);
                      navigate(item.url);
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="rounded-lg">
                        {user.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account/edit">
                    <UserIcon className="size-4" />
                    프로필 설정
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/logout">
                    <LogOutIcon className="size-4" />
                    로그아웃
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
