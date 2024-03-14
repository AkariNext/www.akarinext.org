import 'dotenv/config';

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { connection, db } from '~/lib/db.server';
import { initEnv } from '~/lib/env.server';

initEnv();

await migrate(db, { migrationsFolder: './drizzle' });

await connection.end();
