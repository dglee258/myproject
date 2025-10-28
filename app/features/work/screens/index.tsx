import { redirect } from "react-router";

import type { Route } from "./+types/index";

export function loader({}: Route.LoaderArgs) {
  return redirect("/work/business-logic");
}
