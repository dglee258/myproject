import type { Route } from "./+types/account.layout";

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
    <div className="flex min-h-screen flex-col">
      {/* Simple header with back button */}
      <header className="mx-auto flex h-16 w-full items-center border-b px-5 shadow-xs backdrop-blur-lg transition-opacity md:px-10">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center py-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/work/business-logic")}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            뒤로가기
          </Button>
        </div>
      </header>

      {/* Content area */}
      <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
        <Outlet />
      </div>
    </div>
  );
}
