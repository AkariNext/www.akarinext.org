## ルール

- PocketBase（backend）のコレクションや API を変更した場合は、必要に応じて docs およびフロント（Astro）の `src/lib/cms.ts` / `src/lib/cms-types.ts` を確認・更新すること。
- スキーマ変更は `backend/pb_migrations/` にマイグレーションとしてコミットすること（管理画面で変更すると自動生成される）。

## 使用技術

- Astro（フロント、SSR）
- PocketBase（CMS・backend、Dokploy 等で Self-host）
- InfluxDB + `scripts/monitor.ts`（ゲームサーバー監視）
