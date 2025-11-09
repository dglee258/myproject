import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Work feature schemas
import * as uploadSchema from "~/features/work/upload/schema";
import * as businessLogicSchema from "~/features/work/business-logic/schema";
import * as teamManagementSchema from "~/features/work/team-management/schema";

// Other feature schemas
import * as usersSchema from "~/features/users/schema";
import * as paymentsSchema from "~/features/payments/schema";
import * as pricingSchema from "~/features/pricing/schema";
import * as featureFlagsSchema from "~/core/features/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client, {
  schema: {
    ...uploadSchema,
    ...businessLogicSchema,
    ...teamManagementSchema,
    ...usersSchema,
    ...paymentsSchema,
    ...pricingSchema,
    ...featureFlagsSchema,
  },
});

export default db;
