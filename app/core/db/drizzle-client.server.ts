import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as featureFlagsSchema from "~/core/features/schema";
import * as paymentsSchema from "~/features/payments/schema";
import * as pricingSchema from "~/features/pricing/schema";
import * as serviceSchema from "~/features/service/schema";
// Other feature schemas
import * as usersSchema from "~/features/users/schema";
import * as businessLogicSchema from "~/features/work/business-logic/schema";
import * as rateLimitSchema from "~/features/work/rate-limiting/schema";
import * as shareSchema from "~/features/work/share/schema";
import * as teamManagementSchema from "~/features/work/team-management/schema";
// Work feature schemas
import * as uploadSchema from "~/features/work/upload/schema";

import * as teamSchema from "~/features/work/team-management/team-schema";
import * as teamSharesSchema from "~/features/work/team-management/team-shares-schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client, {
  schema: {
    ...uploadSchema,
    ...businessLogicSchema,
    ...teamManagementSchema,
    ...teamSchema,
    ...teamSharesSchema,
    ...shareSchema,
    ...rateLimitSchema,
    ...usersSchema,
    ...paymentsSchema,
    ...pricingSchema,
    ...serviceSchema,
    ...featureFlagsSchema,
  },
});

export default db;
