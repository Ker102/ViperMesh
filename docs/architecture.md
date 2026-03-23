# ViperMesh — Architecture Reference

> **Last Updated:** 2026-03-20  
> **Rule:** This is the canonical architecture doc. Update here when the architecture changes. `gemini.md` should just reference this file.

---

## Current Architecture (v2 — LangGraph Agent)

ViperMesh has **two fully decoupled execution modes**. They share the same LLM (Gemini), RAG pipeline, and MCP tools, but their execution flows are completely independent.

### Autopilot Mode (`workflowMode: "autopilot"`)

The default mode. User sends a chat message → agent autonomously builds the entire Blender scene.

```
User Message
    │
    ▼
┌──────────────────────────────────────────────┐
│  chat/route.ts (POST handler)                │
│                                              │
│  1. Auth + quota check                       │
│  2. Stream initial text response (LLM)       │
│  3. Fetch scene snapshot (MCP get_scene_info) │
│  4. Strategy router: procedural|neural|hybrid │
│  5. RAG: vectorstore search (blender-scripts) │
│  6. createBlenderAgentV2() ─────────────────►│───┐
│  7. Build prompt (scene + RAG + research)    │   │
│  8. agent.invoke() with ReAct loop           │   │
│  9. Post-execution follow-up text (LLM)      │   │
│ 10. Save to DB (message + commands + plan)    │   │
└──────────────────────────────────────────────┘   │
                                                   │
           ┌───────────────────────────────────────┘
           ▼
┌──────────────────────────────────────────────┐
│  createBlenderAgentV2() (lib/ai/agents.ts)   │
│                                              │
│  LangChain v1 createAgent + LangGraph        │
│  ├── System prompt (blender-agent-system.md) │
│  ├── 30+ MCP tool wrappers (Zod schemas)     │
│  ├── Tool-guide binding (data/tool-guides/)  │
│  └── Middleware stack:                       │
│       1. DedupMiddleware (prevents repeats)  │
│       2. StreamingMiddleware (UI events)      │
│       3. ViewportMiddleware (auto-screenshot) │
│       4. RAGMiddleware (optional, if useRAG)  │
│                                              │
│  ReAct loop runs autonomously (up to 50      │
│  iterations via recursionLimit)              │
└──────────────────────────────────────────────┘
```

**Key files:**

| File | Role |
|------|------|
| `app/api/ai/chat/route.ts` | Main entry point (1100 lines) — handles both modes |
| `lib/ai/agents.ts` | Agent factory + tool definitions (1241 lines) |
| `lib/orchestration/strategy-router.ts` | Classifies procedural/neural/hybrid |
| `lib/orchestration/prompts/blender-agent-system.md` | System prompt |
| `lib/ai/vectorstore.ts` | pgvector similarity search |
| `lib/ai/rag.ts` | RAG formatting (`formatContextFromSources`) |
| `lib/mcp/client.ts` | Blender MCP bridge (TCP socket on port 9876) |
| `data/tool-guides/*.md` | Domain guides bound to tool descriptions at module load |

---

### Studio Mode (`workflowMode: "studio"`)

User sends a message → advisor proposes a multi-step workflow → user clicks Execute/Skip/Manual Done on each step card.

```
User Message
    │
    ▼
┌────────────────────────────────────────┐
│  chat/route.ts                         │
│  (detects studio mode OR neural/hybrid │
│   strategy classification)             │
│                                        │
│  → workflow-advisor.ts                 │
│    generates a WorkflowProposal        │
│    (title, steps[], categories)        │
│                                        │
│  → Sends proposal to UI as            │
│    agent:workflow_proposal event       │
└────────────────────────────────────────┘
           │
           ▼  (UI renders step cards)
┌────────────────────────────────────────┐
│  User clicks: Execute | Skip | Done   │
│  per step card                        │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  workflow-step/route.ts (POST)         │
│                                        │
│  action = "execute"                    │
│  ├── recommendedTool = "blender_agent" │
│  │   → createBlenderAgentV2() fresh   │
│  │   → agent.invoke() for that step   │
│  │                                    │
│  ├── recommendedTool = "neural"       │
│  │   → lib/neural/registry            │
│  │   → provider client (fal/RunPod)   │
│  │   → import result into Blender     │
│  │                                    │
│  └── recommendedTool = "manual"       │
│      → No-op (user does it in Blender)│
└────────────────────────────────────────┘
```

**Key files:**

| File | Role |
|------|------|
| `lib/orchestration/workflow-advisor.ts` | Generates step-by-step workflow proposals |
| `lib/orchestration/workflow-types.ts` | `WorkflowStep`, `WorkflowProposal`, `WorkflowStepResult` types |
| `app/api/ai/workflow-step/route.ts` | Executes individual workflow steps |
| `lib/neural/registry.ts` | Neural provider registry (fal.ai, RunPod, YVO3D) |

---

### Shared Infrastructure

| Component | Location | Notes |
|-----------|----------|-------|
| LLM | `lib/ai/index.ts`, `lib/gemini.ts` | Gemini 2.5 Pro default; supports Anthropic, Ollama, LM Studio |
| RAG Pipeline | `lib/ai/vectorstore.ts`, `lib/ai/rag.ts` | pgvector, Together.ai GTE-ModernBERT embeddings |
| CRAG | `lib/ai/crag.ts` | Corrective RAG with Brave Search fallback |
| MCP Client | `lib/mcp/client.ts` | TCP socket to Blender addon on port 9876 |
| Vision | `lib/ai/vision.ts` | Gemini Vision for viewport screenshot analysis |
| Monitoring | `lib/monitoring/` | Per-session monitoring with real-time streaming |
| Auth | `lib/auth.ts`, `lib/supabase/` | Supabase Auth (NextAuth fully removed) |
| Billing | `lib/stripe.ts`, `lib/subscription.ts`, `lib/usage.ts` | Stripe with Free/Starter/Pro tiers |
| Neural 3D | `lib/neural/` | fal.ai (Hunyuan3D, TRELLIS), RunPod, YVO3D providers |

---

## Legacy Architecture (v1 — Planner + Executor)

> ⚠️ **DEAD CODE** — preserved in the codebase for reference and quick revert. NOT in the live execution path.

The old architecture used a **two-phase orchestration** pattern:

```
User Message
    │
    ▼
1. PLANNING PHASE (planner.ts)
   Gemini generates JSON plan → steps with descriptions
   ▼
2. CODE GENERATION PHASE (executor.legacy.ts)
   For each step: Gemini generates Python code with RAG context
   ▼
3. EXECUTION (executor.legacy.ts)
   Code sent to Blender via MCP execute_code
   ▼
4. VALIDATION
   Auto-validate read-only; LLM validation for others
   ▼
5. SCENE AUDIT
   Structural audit + LLM completeness check
```

### Legacy Files (preserved, NOT used)

| File | Size | Why Kept |
|------|------|----------|
| `lib/orchestration/planner.ts` | 4KB | Old planning prompt — reference for plan JSON structure |
| `lib/orchestration/executor.legacy.ts` | 37KB | Full step executor with per-step code gen, validation, scene audit |
| `lib/ai/agents.legacy.ts` | 19KB | Hand-rolled ReAct loop before LangChain v1 migration |
| `lib/orchestration/executor.ts` | 10KB | Thin wrapper that still wraps v2 agent but through the old `PlanExecutor` interface — also effectively dead since `chat/route.ts` invokes `createBlenderAgentV2()` directly |

### What Changed (v1 → v2)

| Aspect | v1 (Legacy) | v2 (Current) |
|--------|-------------|--------------|
| Planning | Separate `planner.ts` generates JSON plan | No planner — ReAct loop handles tool selection |
| Execution | `executor.legacy.ts` runs steps one by one | `createAgent` controls the entire loop |
| Code Gen | Per-step LLM call to generate Python | Agent decides: direct MCP tools OR execute_code |
| Validation | Per-step LLM validation | Middleware auto-captures viewport screenshots |
| RAG | Injected per code-gen step in executor | Injected at agent creation (middleware + route.ts) |
| Recovery | `normalizeParameters()` hack | Dedup middleware + agent error handling |
| Observability | Custom logs | LangSmith + streaming middleware |

---

## Related Documents

- [`future-plans.md`](./future-plans.md) — P0-P3 prioritized roadmap
- [`architecture-notes.md`](./architecture-notes.md) — **LEGACY** snapshot from Feb 2026 (describes old v1 architecture)
- [`orchestration-design.md`](./orchestration-design.md) — Detailed orchestration design doc
- [`3d-pipeline-integration.md`](./3d-pipeline-integration.md) — Provider API integration plan
- [`HANDOFF.md`](./HANDOFF.md) — Session handoff from Feb 2026 pipeline research
