import * as migration_20260219_170516 from './20260219_170516';
import * as migration_20260219_182901 from './20260219_182901';

export const migrations = [
  {
    up: migration_20260219_170516.up,
    down: migration_20260219_170516.down,
    name: '20260219_170516',
  },
  {
    up: migration_20260219_182901.up,
    down: migration_20260219_182901.down,
    name: '20260219_182901'
  },
];
