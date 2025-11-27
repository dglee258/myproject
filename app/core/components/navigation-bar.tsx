/**
 * Navigation Bar Component
 *
 * A responsive navigation header that adapts to different screen sizes and user authentication states.
 * This component provides the main navigation interface for the application, including:
 *
 * - Responsive design with desktop and mobile layouts
 * - User authentication state awareness (logged in vs. logged out)
 * - User profile menu with avatar and dropdown options
 * - Theme switching functionality
 * - Language switching functionality
 * - Mobile-friendly navigation drawer
 *
 * The component handles different states:
 * - Loading state with skeleton placeholders
 * - Authenticated state with user profile information
 * - Unauthenticated state with sign in/sign up buttons
 */
import { CogIcon, HomeIcon, LogOutIcon, MenuIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import LangSwitcher from "./lang-switcher";
import ThemeSwitcher from "./theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import {
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";

/**
 * UserMenu Component
 *
 * Displays the authenticated user's profile menu with avatar and dropdown options.
 * This component is shown in the navigation bar when a user is logged in and provides
 * quick access to user-specific actions and information.
 *
 * Features:
 * - Avatar display with image or fallback initials
 * - User name and email display
 * - Quick navigation to dashboard
 * - Logout functionality
 *
 * @param name - The user's display name
 * @param email - The user's email address (optional)
 * @param avatarUrl - URL to the user's avatar image (optional)
 * @returns A dropdown menu component with user information and actions
 */
function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}) {
  return (
    <DropdownMenu>
      {/* Avatar as the dropdown trigger */}
      <DropdownMenuTrigger asChild>
        <Avatar className="size-10 cursor-pointer rounded-full border-2 border-white shadow-sm transition-transform hover:scale-105 dark:border-slate-700">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* Dropdown content with user info and actions */}
      <DropdownMenuContent className="w-60 rounded-2xl border-slate-200/60 bg-white/90 p-2 shadow-xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/90" align="end">
        {/* User information display */}
        <DropdownMenuLabel className="grid flex-1 px-3 py-2 text-left text-sm leading-tight">
          <span className="truncate font-bold text-slate-900 dark:text-slate-100">{name}</span>
          <span className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-slate-200 dark:bg-slate-700" />

        {/* Dashboard link */}
        <DropdownMenuItem asChild className="rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800">
          <SheetClose asChild>
            <Link to="/work/business-logic" viewTransition className="cursor-pointer">
              <Button variant="ghost" size="sm" className="h-auto w-full justify-start px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300">
                Dashboard
              </Button>
            </Link>
          </SheetClose>
        </DropdownMenuItem>

        {/* Logout link */}
        <DropdownMenuItem asChild className="rounded-xl focus:bg-red-50 dark:focus:bg-red-950/30">
          <SheetClose asChild>
            <Link to="/logout" viewTransition className="cursor-pointer px-3 py-2 text-base font-medium text-red-600 dark:text-red-400">
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </Link>
          </SheetClose>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * AuthButtons Component
 *
 * Displays authentication buttons (Sign in and Sign up) for unauthenticated users.
 * This component is shown in the navigation bar when no user is logged in and provides
 * quick access to authentication screens.
 *
 * Features:
 * - Sign in button with ghost styling (less prominent)
 * - Sign up button with default styling (more prominent)
 * - View transitions for smooth navigation to auth screens
 * - Compatible with mobile navigation drawer (SheetClose integration)
 *
 * @returns Fragment containing sign in and sign up buttons
 */
function AuthButtons() {
  return (
    <>
      {/* Sign in button (less prominent) */}
      <Button variant="ghost" asChild className="rounded-full px-6 text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
        <SheetClose asChild>
          <Link to="/login" viewTransition>
            Login
          </Link>
        </SheetClose>
      </Button>

      {/* Sign up button (more prominent) */}
      <Button className="rounded-full bg-indigo-600 px-7 py-5 text-base font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 dark:bg-indigo-500 dark:hover:bg-indigo-400" asChild>
        <SheetClose asChild>
          <Link to="/join" viewTransition>
            Join
          </Link>
        </SheetClose>
      </Button>
    </>
  );
}

/**
 * Actions Component
 *
 * Displays utility actions and settings in the navigation bar, including:
 * - Debug/settings dropdown menu with links to monitoring tools
 * - Theme switcher for toggling between light and dark mode
 * - Language switcher for changing the application language
 *
 * This component is shown in the navigation bar for all users regardless of
 * authentication state and provides access to application-wide settings and tools.
 *
 * @returns Fragment containing settings dropdown, theme switcher, and language switcher
 */
function Actions() {
  return (
    <>
      {/* Settings/debug dropdown menu */}

      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild className="cursor-pointer">
          <Button variant="ghost" size="icon">
            <CogIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <SheetClose asChild>
              <Link to="/debug/sentry" viewTransition>
                Sentry
              </Link>
            </SheetClose>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <SheetClose asChild>
              <Link to="/debug/analytics" viewTransition>
                Google Tag
              </Link>
            </SheetClose>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}

      {/* Theme switcher component (light/dark mode) */}
      {/* <ThemeSwitcher /> */}

      {/* Language switcher component */}
      {/* <LangSwitcher /> */}
    </>
  );
}

/**
 * NavigationBar Component
 *
 * The main navigation header for the application that adapts to different screen sizes
 * and user authentication states. This component serves as the primary navigation
 * interface and combines several sub-components to create a complete navigation experience.
 *
 * Features:
 * - Responsive design with desktop navigation and mobile drawer
 * - Application branding with localized title
 * - Main navigation links (Blog, Contact, Payments)
 * - User authentication state handling (loading, authenticated, unauthenticated)
 * - User profile menu with avatar for authenticated users
 * - Sign in/sign up buttons for unauthenticated users
 * - Theme and language switching options
 *
 * @param name - The authenticated user's name (if available)
 * @param email - The authenticated user's email (if available)
 * @param avatarUrl - The authenticated user's avatar URL (if available)
 * @param loading - Boolean indicating if the auth state is still loading
 * @returns The complete navigation bar component
 */
export function NavigationBar({
  name,
  email,
  avatarUrl,
  loading,
}: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  loading: boolean;
}) {
  // Get translation function for internationalization
  const { t } = useTranslation();

  return (
    <nav
      className={
        "sticky top-0 z-50 mx-auto flex h-24 w-full items-center justify-between px-6 transition-all md:px-12"
      }
    >
      {/* Glassmorphism Background Container */}
      <div className="absolute inset-x-6 top-6 bottom-0 -z-10 rounded-3xl border border-white/40 bg-white/70 shadow-xl shadow-slate-200/20 backdrop-blur-2xl dark:border-slate-800/40 dark:bg-slate-900/70 dark:shadow-slate-900/20" />

      <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between">
        {/* Left: Application logo/title with link to home */}
        <div className="flex-1 pl-4">
          <Link to="/" className="group flex items-center gap-2">
            {/* UI 개선: 로고 이미지 블렌딩 모드 적용 및 크기 조정 */}
            <div className="mb-10 flex justify-center pt-6">
  <img 
    src="/logo.png" 
    alt="Synchro" 
    className="h-16 w-auto object-contain"
    style={{
      filter: 'brightness(1.1) contrast(1.1)',
      mixBlendMode: 'darken'
    }}
  />
</div>
          </Link>
        </div>

        {/* Center: Main navigation links (hidden on mobile) */}
        <div className="hidden h-full flex-1 items-center justify-center gap-12 md:flex">
          <Link
            to="/service"
            viewTransition
            className="text-base font-semibold text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            서비스
          </Link>
          <Link
            to="/pricing"
            viewTransition
            className="text-base font-semibold text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            가격
          </Link>
          <Link
            to="/demo"
            viewTransition
            className="text-base font-semibold text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            체험하기
          </Link>
        </div>

        {/* Right: Settings, theme, language, and user menu (hidden on mobile) */}
        <div className="hidden h-full flex-1 items-center justify-end gap-6 pr-4 md:flex">
          {/* Settings, theme switcher, and language switcher */}
          <Actions />
          
          {/* Conditional rendering based on authentication state */}
          {loading ? (
            // Loading state with skeleton placeholder
            <div className="flex items-center">
              <div className="bg-slate-200 dark:bg-slate-800 size-10 animate-pulse rounded-full" />
            </div>
          ) : (
            <>
              {name ? (
                // Authenticated state with user menu
                <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
              ) : (
                // Unauthenticated state with auth buttons
                <AuthButtons />
              )}
            </>
          )}
        </div>

        {/* Mobile menu trigger (hidden on desktop) */}
        <SheetTrigger className="pr-4 text-slate-600 md:hidden dark:text-slate-400">
          <MenuIcon className="size-7" />
        </SheetTrigger>
        <SheetContent className="border-l border-white/20 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
          <SheetHeader>
             <div className="mb-10 flex justify-center pt-6">
                <img src="/logo.png" alt="Synchro" className="h-12 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
             </div>
            <SheetClose asChild>
              <Link to="/service" className="block rounded-xl px-6 py-4 text-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400">서비스</Link>
            </SheetClose>
            <SheetClose asChild>
              <Link to="/pricing" className="block rounded-xl px-6 py-4 text-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400">가격</Link>
            </SheetClose>
            <SheetClose asChild>
              <Link to="/demo" className="block rounded-xl px-6 py-4 text-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400">체험하기</Link>
            </SheetClose>
          </SheetHeader>
          {loading ? (
            <div className="flex items-center justify-center mt-10">
              <div className="bg-slate-200 dark:bg-slate-800 h-5 w-32 animate-pulse rounded-full" />
            </div>
          ) : (
            <SheetFooter className="mt-auto pb-10 sm:justify-center">
              {name ? (
                <div className="w-full">
                  <div className="mb-8 flex justify-center">
                    <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
                  </div>
                  <div className="flex justify-center">
                    <Actions />
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-5 px-4">
                  <div className="grid grid-cols-1 gap-4">
                    <AuthButtons />
                  </div>
                  <div className="flex justify-center mt-6">
                    <Actions />
                  </div>
                </div>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </div>
    </nav>
  );
}
