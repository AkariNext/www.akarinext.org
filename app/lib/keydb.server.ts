import { Redis } from 'ioredis';
import { singleton } from './singleton.server';
import { env } from './env.server';

export const keyDb = singleton('keyDb', () => new Redis(
{host: env.KEYDB_HOST, port: parseInt(env.KEYDB_PORT), password: env.KEYDB_PASSWORD}
));
