# HSMS Backend — Software Requirements Specification (Performance)

**System:** Housing Society Management System (HSMS)  
**Component:** Express TypeScript API  
**Date:** 2026-09-09  
**Status:** Active — local and production runtime

## 1. Purpose

This addendum records non-functional performance requirements and the techniques applied so the API stays usable on developer machines (≈16 GB RAM, 4 cores) without looking “degraded” because of the IDE, browser, or health-dashboard polling.

## 2. Observed problem

On a typical local boot the health dashboard showed:

| Signal | Observation | Root cause |
|---|---|---|
| Host RAM 11+ GB / 15.5 GB | Machine-wide, not the API | Cursor, Chrome, Next.js, MongoDB share the host |
| Node RSS ~370 MB, heap ~210 MB | High for a 1-minute-old process | Duplicate loggers, per-request Mongoose wrapping, health poll every 5s |
| Open handles ~92 vs 25 calls | Looked like a leak | Health poll + `_getActiveHandles()` + stacked `Query.exec` wrappers |
| HTTP API “degraded” | 8% error rate | Dashboard 404s (`/json/version`) counted as API errors |
| CPU load > cores | Laptop compile/restart load | Host load used as service health |

## 3. Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-P1 | Process RSS in local compiled `pnpm dev` after warmup | Prefer **< 250 MB**; alert if process heap **> 85% of 384 MB budget** |
| NFR-P2 | Health overview endpoint | p95 **< 80 ms** when cached |
| NFR-P3 | Dashboard refresh must not hammer Mongo or logs | Poll **≥ 30 s**; overview cache **≥ 4 s**; Mongo stats cache **≥ 15 s** |
| NFR-P4 | Service status must reflect the API, not the laptop | Host RAM / host load are **informational** only |
| NFR-P5 | Logging must not retain response bodies on every request | Log 4xx/5xx metadata only unless `LOG_DATABASE_QUERIES=true` |
| NFR-P6 | Mongo pool in development | `maxPoolSize ≤ 5` |
| NFR-P7 | Duplicate middleware (helmet, CORS, compression, Morgan) | Single instance per concern |

## 4. Techniques applied

1. **Fix Mongoose wrapper leak** — `databaseLogger` no longer replaces `Query.prototype.exec` on every HTTP request (that stacked closures and retained request context). Query logging is opt-in via `LOG_DATABASE_QUERIES=true` and patches once.
2. **Stop capturing response bodies** — request logger no longer overrides `res.send` / `res.json`.
3. **Reduce log I/O** — development: console + error file only (not four daily-rotate streams + combined.log + extra Morgan).
4. **Skip monitor paths** — `/`, `/health*`, `/public*`, `/ping` are excluded from traffic stats and access logs.
5. **Health payload cache** — in-memory TTL for overview and Mongo `db.stats()`.
6. **Dashboard poll 30s**.
7. **Do not call `_getActiveHandles()`** — private API inflates handle counts and can retain objects.
8. **Single compression / helmet / CORS stack** — removed duplicate middleware.
9. **Lazy Swagger spec** — JSDoc scan cached after first generation.
10. **Smaller Mongo pool in development**.
11. **Overall status** uses API, Mongo, process heap, disk, and event loop. Host RAM and CPU load stay visible but do not flip the page to “degraded”.
12. **Show host process groups** on the health dashboard so Chrome / Cursor / Next / Mongo are visible separately from API RSS.
13. **Compiled `node dist` for local `pnpm dev`** with V8 `--max-old-space-size=256 --max-semi-space-size=8 --optimize-for-size` so GC runs early. `pnpm run dev:watch` keeps `tsx` when you need hot reload.
14. **Frontend local default is `next start`** (production server, ~hundreds of MB). `pnpm run dev:watch` is webpack HMR. `preloadEntriesOnStart: false`, no source maps.
15. **MongoDB WiredTiger cache capped at 0.5 GB** for local `mongod` (`--wiredTigerCacheSizeGB 0.5`).
16. **TypeScript language server cap** — workspace `typescript.tsserver.maxTsServerMemory: 1024`.
17. **Skip seed on every boot** unless `SEED_ON_BOOT=true` (data already in Mongo).
18. **Swagger JSDoc scan is on first `/api-docs` hit**, not during `createApp`.
19. **Heap health uses a 384 MB budget**, not `heapUsed/heapTotal` (V8 committed heap is almost always “full”).
21. **Lite mode in development** — no Morgan/request loggers, no file log rotation, no Swagger/cron/web-push, Mongo pool 2, no `db.stats()` / `ps` on health poll.
22. **V8 heap cap 192 MB**, health dashboard poll **60s**.
23. **TypeScript language server cap 512 MB**; exclude `node_modules` / `.next` / `dist` from the workspace.
24. **Mongo WiredTiger cache 0.25 GB** (engine minimum).

## 5. How to read the dashboard

- **Process heap / RSS** = this Node API.
- **Host RAM / CPU load** = whole machine (IDE + frontend + Mongo + OS).
- **API cost** = latency of application routes, not health-page polling.

## 6. Remaining / out of scope

- Chrome (~10 GB) and Cursor (~6 GB) dominate host RAM; close unused tabs/windows. Enable Chrome Memory Saver (`chrome://settings/performance`).
- Full production APM (OpenTelemetry) is not required for this pass.
