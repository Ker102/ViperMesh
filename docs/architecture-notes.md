# ModelForge Project Notes

## Current Status (2026-02-16)

### System Architecture
- **Next.js 16**: App Router, Turbopack dev server on port 3000
- **Gemini 2.5 Pro**: LLM via `@langchain/google-genai`, model configurable via `GEMINI_MODEL` env var (defaults to `gemini-2.5-pro`), maxOutputTokens 65,536
- **Blender 5.x (5.0.1)**: Target version. MCP addon connects via TCP socket on port 9876 (`BLENDER_MCP_PORT`)
- **Together.ai Embeddings**: Model `Alibaba-NLP/gte-modernbert-base` (768 dims, 8192 token context)
- **Neon pgvector**: Vector store for RAG, 113 documents ingested from `data/blender-scripts/*.py` under source label **`blender-scripts`** (NOT `blender-docs`)
- **Supabase Auth**: Full auth flow (NextAuth completely removed)
- **Electron Desktop**: `desktop/` directory, launches via `cd desktop && MODELFORGE_DESKTOP_ENV=development ./node_modules/.bin/electron .`
- **Stripe**: Free / Starter ($12/mo) / Pro ($29/mo) tiers

### Two-Phase Orchestration Architecture
1. **Planning Phase**: Gemini generates a JSON plan with step descriptions (no code yet). RAG context from blender-scripts is included.
2. **Code Generation Phase**: For each step, Gemini generates Python code with full Blender API context + RAG reference scripts
3. **Execution**: Code sent to Blender via MCP `execute_code` tool (takes `{ code: string }` ONLY)
4. **Validation**: Auto-validate on MCP success for `execute_code` AND read-only commands (`get_scene_info`, `get_object_info`, etc.). Non-trivial steps use LLM validation as fallback.
5. **Scene Audit**: After all steps complete, structural audit checks mesh count + materials, then LLM completeness check compares final scene against original user request
6. **Recovery**: On failure, `normalizeParameters()` strips `description` when `code` exists to prevent addon rejection

### Key Files (Architecture Reference)
- `lib/ai/chains.ts` — LangChain chains for planning, validation, recovery, code generation. Has `extractContent()` helper for safe Gemini response parsing.
- `lib/ai/agents.ts` — `BlenderAgent` class with ReAct-style execution. Auto-validates read-only MCP commands. RAG source default: `blender-scripts`.
- `lib/ai/rag.ts` — RAG pipeline (`generateBlenderCode`, `formatContextFromSources`). Default source: `blender-scripts`.
- `lib/ai/vectorstore.ts` — `similaritySearch()` for pgvector queries
- `lib/orchestration/executor.ts` — `PlanExecutor.executePlan()` — runs steps via MCP. **Key features**: RAG retrieval before each code gen step, LLM scene completeness check in `auditScene()`.
- `lib/orchestration/planner.ts` — Entry point for orchestration. Uses `createBlenderAgent({ useRAG: true, ragSource: "blender-scripts" })`.
- `lib/orchestration/types.ts` — `ExecutionLogEntry`, `ExecutionPlan`, `PlanAnalysis`, etc.
- `lib/ai/prompts.ts` — `CODE_GENERATION_PROMPT` with Blender 5.x rules. Has `{context}` placeholder where RAG content is injected.
- `lib/orchestration/prompts/blender-agent-system.md` — Detailed Blender agent system prompt
- `lib/orchestration/prompts/index.ts` — Loads blender-agent-system.md (uses `process.cwd()`, not `__dirname`)
- `lib/orchestration/tool-registry.ts` — MCP tool definitions with parameter schemas + allow flags
- `lib/orchestration/plan-utils.ts` — `normalizeParameters()`, `isMcpSuccess()`
- `lib/generation/client.ts` — Replicate client (lazy init via `getReplicate()`, graceful when no API key)
- `app/api/ai/chat/route.ts` — Main chat API route (~742 lines)
- `scripts/ingest-blender-docs.ts` — RAG ingestion script
- `logs/orchestration.ndjson` — Full orchestration run history (NDJSON format)

### Blender 5.x API Notes (Critical for Code Generation)
- `material.use_nodes = True` — DEPRECATED, node trees created automatically
- `world.use_nodes` — DEPRECATED, same reason
- EEVEE engine ID is `BLENDER_EEVEE` (NOT `BLENDER_EEVEE_NEXT`)
- Principled BSDF inputs unchanged from 4.x naming (`Base Color`, `Metallic`, `Roughness`, etc.)
- All `data/blender-scripts/*.py` files + addon files already cleaned of deprecated calls

### Known Type Gotchas
- **Two `PlanStep` types exist**: `chains.ts` has `expected_outcome`, `orchestration/types.ts` has `expectedOutcome` + `stepNumber`. Route.ts uses `stepAny` cast pattern to bridge them.
- LangChain prompt templates use f-string parser: all literal `{` must be `{{`
- `__dirname` resolves wrong in Next.js builds — always use `process.cwd()` for file paths to source

### Environment Variables (Required)
```
DATABASE_URL          — Neon PostgreSQL connection (pooled)
DIRECT_URL            — Neon direct connection (for migrations)
GEMINI_API_KEY        — Google AI API key for Gemini
TOGETHER_API_KEY      — Together.ai API key for embeddings
BLENDER_MCP_HOST      — 127.0.0.1
BLENDER_MCP_PORT      — 9876
STRIPE_SECRET_KEY     — Stripe secret key
STRIPE_WEBHOOK_SECRET — Stripe webhook secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe publishable key
STRIPE_*_PRICE_ID     — 4 Stripe price IDs (starter/pro × monthly/yearly)
NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key
```
Optional: `GEMINI_MODEL` (defaults to `gemini-2.5-pro`), `REPLICATE_API_TOKEN` (for 3D gen, gracefully absent), `FIRECRAWL_API_KEY` (web research)

## Completed Milestones
- [x] Supabase Auth migration (removed NextAuth, @auth/prisma-adapter, bcryptjs)
- [x] Auto-provisioning of Prisma user records on first Supabase login
- [x] Stripe customer sync on auth (idempotent background task)
- [x] Electron app loads correctly from Next.js dev server (port 3000)
- [x] Middleware cleaned up (protects /dashboard and /generate)
- [x] Two-phase orchestration (planning JSON → per-step Python code gen)
- [x] MCP connection indicator probes actual addon (not just TCP)
- [x] Addon UI sync on File → New with `@persistent` load_post handler
- [x] Tool filtering — disabled tools (Sketchfab, PolyHaven) excluded from planner
- [x] Parameter schemas added to tool registry
- [x] 3 critical bugs fixed: recovery param leak, Blender API compat, code gen scope
- [x] All code/prompts updated 4.x → Blender 5.x
- [x] RAG re-ingested with new embedding model (113 docs)
- [x] Full TypeScript build passes clean (12 files fixed)
- [x] System prompts audited and improved
- [x] **RAG integrated into code generation phase** (executor.ts retrieves reference scripts before each `generateCode()` call)
- [x] **RAG source filter fixed** (`"blender-docs"` → `"blender-scripts"` — RAG was returning 0 results everywhere before this fix)
- [x] **LLM scene completeness check** added to `auditScene()` — verifies final scene against user request via Gemini
- [x] **Auto-validation expanded** to cover all read-only MCP commands (get_scene_info, get_object_info, etc.) — no longer waste LLM calls on info queries
- [x] **Gemini response content parsing hardened** — `extractContent()` helper handles string, array, and undefined formats across all chain functions
- [x] **Orchestration logging improved** — RAG retrieval and LLM completeness check results now logged in executionLog

## Test Results (2026-02-16 Session)
| Test | Result | Notes |
|------|--------|-------|
| Red metallic sphere + green pedestal | ✅ Pass | 4 steps, 0 retries, correct materials & placement |
| Edit scene: add floor + orbiting spheres + area light | ✅ Pass | 4 steps, 0 retries, preserved existing objects, RAG returned 5 sources per step |
| Medieval castle (complex multi-object) | ❌ Fail | `get_scene_info` validation parse error caused cascade failure. **Fixed** by expanding auto-validation to read-only commands |
| Castle retry after fix | ⏳ Not yet tested | Fix is deployed (hot-reload), needs re-test |

## Recent Bugs Fixed (2026-02-16 Session)
1. **RAG source mismatch** — Vector store data was ingested under `"blender-scripts"` but all queries used `"blender-docs"`. Fixed in: `executor.ts`, `planner.ts`, `agents.ts`, `rag.ts`
2. **Gemini array content crash** — `response.content` from Gemini can be an array of content parts, not always a string. `(response.content as string).trim()` crashed. Fixed with `extractContent()` helper in `chains.ts` and defensive handling in `executor.ts`.
3. **Validation cascade failure** — `get_scene_info` step was sent to LLM validation (unnecessary for read-only queries). LLM returned unparseable response → "Failed to parse validation response" → all subsequent steps skipped. Fixed by auto-validating read-only commands.

## Recent Git History (as of 2026-02-16)
```
[pending] fix: RAG source filter, Gemini content parsing, validation cascade
1185eb5 docs: update NOTES.md and SETUP.md with full project state for session continuity
b40c6c7 Fix TypeScript build errors across 12 files
e977261 Switch embedding model to gte-modernbert-base, fix ingestion script
4b17f6f Update all Blender API references to 5.x
4be553b fix: 3 critical bugs - recovery description leak, Blender 4.x API, code gen scope
```

## Outstanding Work
1. **Re-test castle prompt** — The validation cascade fix is deployed but not yet tested. Clear Blender scene and retry: "Create a low-poly medieval castle on a grassy hilltop. The castle should have a main cylindrical tower with a cone roof, a rectangular wall section, and a small arched doorway. Use stone-gray material for the walls, dark brown for the roof, and green for the grass hill. Add a warm sunset directional light."
2. **Stress test more prompts** — Try spiral staircase (procedural math), three-point lighting (selective deletion), and car scene (triggers car-specific audit)
3. **Iterate on orchestration quality** — Tune code gen prompts, test edge cases
4. **Viewport screenshots** — Integrate MCP viewport capture results into chat UI
5. **Deploy to production** — Vercel/DigitalOcean with production database
6. **Package Electron** — Auto-update, installers for Linux/Mac/Windows
7. **Add monitoring/tests** — MCP connection health, integration tests

## How to Start Development
```bash
# Terminal 1: Next.js dev server
cd /media/krist/CrucialX9/cursor-projects/projects/project02/BlenderAI
npm run dev

# Terminal 2: Electron app
cd desktop
MODELFORGE_DESKTOP_ENV=development ./node_modules/.bin/electron .

# Blender: Must be running with ModelForge addon enabled and connected (port 9876)
```

## How to Re-ingest RAG Embeddings
If `data/blender-scripts/*.py` files change:
```bash
npx tsx scripts/ingest-blender-docs.ts
```
Requires `TOGETHER_API_KEY` and `DATABASE_URL` in `.env`.

Refer to `blendermcpreadme.md` and `/docs` quick start for installation reminders.
