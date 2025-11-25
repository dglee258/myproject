import type { Route } from "./+types/public.layout";

import { Outlet, redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const { default: makeServerClient } = await import(
    "../lib/supa-client.server"
  );
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user) {
    throw redirect("/work/business-logic");
  }

  // Return an empty object to avoid the "Cannot read properties of undefined" error
  return {};
}

export default function PublicLayout() {
  return <Outlet />;
}
