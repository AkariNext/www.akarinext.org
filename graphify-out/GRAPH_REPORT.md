# Graph Report - www.akarinext.org  (2026-08-28)

## Corpus Check
- Corpus is ~36,931 words - fits in a single context window. You may not need a graph.

## Summary
- 474 nodes · 788 edges · 35 communities (31 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.87)
- Token cost: 11,362 input · 8,350 output

## Community Hubs (Navigation)
- Dashboard Data Flow
- Runtime Dependencies
- Project Documentation
- Authentication Types
- Link Metadata
- Development Tooling
- Biome Configuration
- Site Layout
- Content Editors
- Package Scripts
- Post Index
- CMS Query API
- Server Monitoring
- Content Migration
- Markdown Editor
- CMS Data Shaping
- TypeScript Configuration
- Status API
- Member Profiles
- Renovate Configuration
- Traefik Watchdog
- Sitemap Generation
- Post Cards
- Native Dependencies
- Crawler Policy

## God Nodes (most connected - your core abstractions)
1. `DashboardError` - 21 edges
2. `getDashboardToken()` - 18 edges
3. `isSameOriginRequest()` - 18 edges
4. `cmsClient` - 17 edges
5. `scripts` - 13 edges
6. `getMediaUrl()` - 12 edges
7. `mutateSeries()` - 12 edges
8. `requestPocketBase()` - 11 edges
9. `mutateGameEntry()` - 11 edges
10. `AkariNext Community Site` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Cool Blue Geometric Identity` --semantically_similar_to--> `Cool Editorial Blue Theme`  [INFERRED] [semantically similar]
  public/favicon.png → design.md
- `PocketBase CMS` --semantically_similar_to--> `PocketBase Backend`  [INFERRED] [semantically similar]
  README.md → backend/README.md
- `Persistence Diagnostics` --semantically_similar_to--> `Persistent PocketBase Data`  [INFERRED] [semantically similar]
  docs/TROUBLESHOOTING.md → backend/README.md
- `Astro PocketBase InfluxDB Stack` --conceptually_related_to--> `AkariNext Community Site`  [INFERRED]
  AGENTS.md → README.md
- `Index First Dashboard` --conceptually_related_to--> `Member Dashboard`  [INFERRED]
  design.md → docs/DASHBOARD.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AkariNext Runtime Architecture** — readme_astro_ssr_frontend, readme_pocketbase_cms, readme_server_monitoring, docker_compose_influxdb_service [INFERRED 0.95]
- **Member Publishing Workflow** — docs_dashboard_member_dashboard, docs_dashboard_owner_scoped_authorization, docs_dashboard_httponly_cookie_authentication, docs_discord_webhook_publication_transition_notification [INFERRED 0.85]
- **Same Origin Media Delivery Flow** — docs_media_proxy_same_origin_image_delivery, docs_media_proxy_browser_astro_pocketbase_flow, docs_media_proxy_dokploy_traefik_routing, docs_media_proxy_public_media_base [EXTRACTED 1.00]

## Communities (35 total, 4 thin omitted)

### Community 0 - "Dashboard Data Flow"
Cohesion: 0.08
Nodes (52): buildMediaUrl(), PbRecord, CmsGameEntry, authToken(), createRecord(), DashboardError, deleteRecord(), escapeFilter() (+44 more)

### Community 1 - "Runtime Dependencies"
Cohesion: 0.04
Nodes (49): astro, @astrojs/node, codemirror, @codemirror/commands, @codemirror/lang-markdown, @codemirror/language, @codemirror/state, @codemirror/view (+41 more)

### Community 2 - "Project Documentation"
Cohesion: 0.06
Nodes (42): Project Working Rules, PocketBase Schema Change Workflow, Astro PocketBase InfluxDB Stack, CMS Collection Schema, Persistent PocketBase Data, PocketBase Backend, Strapi Data Migration, AkariNext Design System (+34 more)

### Community 3 - "Authentication Types"
Cohesion: 0.10
Nodes (31): App, ImportMeta, ImportMetaEnv, Locals, AUTH_COOKIE, AuthResponse, AuthUser, authWithOAuth2() (+23 more)

### Community 4 - "Link Metadata"
Cohesion: 0.10
Nodes (24): youtubeEmbedUrl, CACHE_DIR, CACHE_FILE, fetchOgp(), getCache(), OgpData, saveCacheToDisk(), BETWEEN_CJK (+16 more)

### Community 5 - "Development Tooling"
Cohesion: 0.07
Nodes (27): @astrojs/check, @biomejs/biome, dotenv, esbuild, devDependencies, @astrojs/check, @biomejs/biome, dotenv (+19 more)

### Community 6 - "Biome Configuration"
Cohesion: 0.07
Nodes (26): source, assist, actions, enabled, files, includes, formatter, enabled (+18 more)

### Community 7 - "Site Layout"
Cohesion: 0.12
Nodes (12): canonicalUrl, currentUserAvatar, globalSettings, imageUrl, navItems, cmsClient, getMediaUrl(), prerender (+4 more)

### Community 8 - "Content Editors"
Cohesion: 0.16
Nodes (16): CmsAnnouncement, CmsGame, CmsGameServer, CmsMedia, CmsMember, CmsPost, CmsSeries, CmsSettings (+8 more)

### Community 9 - "Package Scripts"
Cohesion: 0.11
Nodes (18): engines, node, name, scripts, astro, build, build:monitor, check (+10 more)

### Community 10 - "Post Index"
Cohesion: 0.13
Nodes (8): date(), legacyTag, page, result, page, prerender, result, slug

### Community 11 - "CMS Query API"
Cohesion: 0.17
Nodes (12): buildFilter(), CmsPage, CmsPageQuery, CmsQuery, collectionConfig, mapSortField(), MEDIA_BASE, pbFetchList() (+4 more)

### Community 12 - "Server Monitoring"
Cohesion: 0.21
Nodes (12): ALERT_AFTER, checkOne(), HTTP_INTERVAL_MS, HTTP_TARGETS, httpState, MonitoredServer, monitorHttp(), monitorServers() (+4 more)

### Community 13 - "Content Migration"
Cohesion: 0.30
Nodes (10): appendMedia(), idMap, migrateAnnouncements(), migratePosts(), PB_URL, pbFindFirst(), pbRequest(), sniffImageType() (+2 more)

### Community 14 - "Markdown Editor"
Cohesion: 0.21
Nodes (10): createMarkdownEditor(), editorCommands, EditorOptions, fence(), highlight, SURROUND, surroundSelection, theme (+2 more)

### Community 15 - "CMS Data Shaping"
Cohesion: 0.31
Nodes (11): fetchMembers(), shapeAnnouncement(), shapeGame(), shapeGameServer(), shapeMember(), shapePost(), shapeSeries(), shapeSettings() (+3 more)

### Community 16 - "TypeScript Configuration"
Cohesion: 0.22
Nodes (8): astro/tsconfigs/strict, .astro/types.d.ts, backend, exclude, extends, include, **/*, dist

### Community 17 - "Status API"
Cohesion: 0.52
Nodes (5): getServerAvailability(), getServerPingHistory(), PingData, GET(), prerender

### Community 19 - "Renovate Configuration"
Cohesion: 0.50
Nodes (3): config:recommended, extends, $schema

### Community 20 - "Traefik Watchdog"
Cohesion: 1.00
Nodes (3): log(), notify(), traefik-watchdog.sh script

### Community 21 - "Sitemap Generation"
Cohesion: 0.67
Nodes (3): escapeXml(), GET(), prerender

## Knowledge Gaps
- **181 isolated node(s):** `STRAPI_URL`, `PB_URL`, `idMap`, `$schema`, `enabled` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Tooling` to `Package Scripts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `isSameOriginRequest()` connect `Dashboard Data Flow` to `Authentication Types`, `Link Metadata`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `STRAPI_URL`, `PB_URL`, `idMap` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Data Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.08243727598566308 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `Project Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.05807200929152149 - nodes in this community are weakly interconnected._