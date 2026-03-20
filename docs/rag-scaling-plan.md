# RAG Scaling Plan: Tiered Tool Knowledge

> **Status:** Future — implement when per-tool documents exceed 1 guide.

## Current Architecture (v1)

Each tool has **one curated guide** bound to its description via `TOOL_GUIDE_MAP` in `agents.ts`. Guides are loaded from `data/tool-guides/*.md` at module init and mapped to tools via `triggered_by` YAML frontmatter. Vector search handles only `blender-scripts` code examples.

## Scaling Architecture (v2) — When Documents Grow

### Tier 1 — Rules (in tool description, always visible)

- One **curated cheat-sheet** per tool (~2-4KB)
- Critical rules, reference tables, common mistakes
- Bound to `tool.description` via `withGuide()`
- **Never grows** — updated/curated, not appended to

### Tier 2 — Examples (in vectorstore, retrieved on demand)

- Additional docs: tutorials, edge cases, advanced techniques
- Stored in vectorstore tagged by tool name (e.g., `tool:set_camera_properties`)
- Retrieved via semantic search filtered by tool tag
- Scales to any number of documents

### Implementation Steps

1. **Tag ingestion:** Update ingestion scripts to tag documents with `source = "tool:{tool_name}"` instead of generic `blender-scripts`
2. **Per-tool search:** In the tool execution wrapper (`agents.ts`), before executing a tool, run `similaritySearch(query, { source: "tool:{tool_name}", limit: 3 })`
3. **Context injection:** Inject top-N vectorstore results as supplemental context alongside the tool result
4. **Tier 1 unchanged:** The core guide in the description stays as-is

### Example

```
set_camera_properties:
  Tier 1 (description): camera-guide.md (distance tables, rules, patterns)
  Tier 2 (vectorstore):
    - "Advanced portrait lighting with camera setup" (tool:set_camera_properties)
    - "Product photography camera rigs" (tool:set_camera_properties)
    - "Architectural visualization angles" (tool:set_camera_properties)
```
