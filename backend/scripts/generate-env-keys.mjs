#!/usr/bin/env node
/**
 * Strapi 用の秘密鍵をランダム生成し、.env 形式で出力する
 * 実行: node scripts/generate-env-keys.mjs
 * 出力を .env に追記するか、Dokploy の Environment Variables にコピペする
 */

import crypto from 'crypto';

const random = (bytes = 16) => crypto.randomBytes(bytes).toString('base64');

const keys = [
  random(),
  random(),
  random(),
  random(),
];

console.log('# 以下を .env または Dokploy の Environment Variables に設定');
console.log('# 生成日時:', new Date().toISOString());
console.log('');
console.log('APP_KEYS=' + keys.join(','));
console.log('API_TOKEN_SALT=' + random());
console.log('ADMIN_JWT_SECRET=' + random());
console.log('TRANSFER_TOKEN_SALT=' + random());
console.log('JWT_SECRET=' + random());
console.log('ENCRYPTION_KEY=' + random());
