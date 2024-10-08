import { PrismaClient } from '@prisma/client';

import { singleton } from '~/lib/singleton.server';

// hard-code a unique key so we can look up the client when this module gets re-imported
export const db = singleton('prisma', () => new PrismaClient());
