# Generated Assets Picker And Library Implementation Plan

> **For Agent:** Use executing-plans skill to implement this plan task-by-task.

**Goal:** Let every Studio tool with a `meshUrl` input attach a model from the current project's generated outputs, while laying out the later path to a real saved user library.

**Architecture:** Keep the current project-scoped generated shelf as the immediate source of truth for reusable outputs, because it already persists on `studio_sessions.steps`. Build a shared picker and visual attachment cards on top of that first. Only after the picker UX is validated should the app add a separate saved-user-library layer with its own DB model and quotas.

**Tech Stack:** Next.js App Router, React client components, existing Studio session persistence (`studio_sessions.steps` JSON), Prisma for future saved-library metadata, current local neural output storage under `tmp/neural-output`

---

### Task 1: Extract shared generated-asset domain helpers

**Files:**
- Create: `components/projects/generated-assets.ts`
- Modify: `components/projects/generated-assets-shelf.tsx`
- Modify: `components/projects/studio-layout.tsx`

**Step 1: Add shared types and extraction helpers**

Create a helper module that exports:
- `GeneratedAssetItem`
- `extractGeneratedAssets(steps: WorkflowTimelineStep[]): GeneratedAssetItem[]`
- small helpers for carried reference images and source-tool labeling

**Step 2: Replace inline extraction logic**

Move the current generated-assets derivation out of `StudioLayout` so the shelf and future picker share the same model.

**Step 3: Validate**

Run:
```bash
npx tsc --noEmit
npm run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add components/projects/generated-assets.ts components/projects/generated-assets-shelf.tsx components/projects/studio-layout.tsx
git commit -m "refactor: extract studio generated asset helpers"
```

---

### Task 2: Build a reusable Attach From Generated Assets picker

**Files:**
- Create: `components/projects/generated-assets-picker.tsx`
- Modify: `components/projects/generated-assets.ts`

**Step 1: Implement the picker UI**

Create a reusable picker panel/modal component that:
- lists project-scoped generated assets
- shows asset name, source tool, and ready state
- exposes `Open source step` and `Attach` actions
- supports an empty state

**Step 2: Keep it generic**

The picker must accept callbacks and selected asset ID rather than hardcoding Hunyuan Paint behavior.

**Step 3: Validate**

Run:
```bash
npx tsc --noEmit
npm run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add components/projects/generated-assets-picker.tsx components/projects/generated-assets.ts
git commit -m "feat: add reusable generated asset picker"
```

---

### Task 3: Wire the picker into full-detail mesh inputs

**Files:**
- Modify: `components/projects/studio-workspace.tsx`

**Step 1: Upgrade mesh input rendering in `ToolDetailView`**

For every `input.type === "mesh"`:
- keep the visual attached-model card
- add an `Attach from Generated Assets` button
- allow clearing/replacing the current mesh

**Step 2: Use the shared picker**

When the picker returns an asset:
- store `meshUrl`
- preserve carried reference image behavior when applicable
- update the visible attachment card immediately

**Step 3: Validate**

Run:
```bash
npx tsc --noEmit
npm run lint
```

Manual check:
1. Open `Hunyuan3D Paint`
2. Click `Attach from Generated Assets`
3. Pick a TRELLIS result
4. Confirm the mesh card updates before running

**Step 4: Commit**

```bash
git add components/projects/studio-workspace.tsx
git commit -m "feat: attach generated assets in studio tool forms"
```

---

### Task 4: Wire the picker into neural rerun panels

**Files:**
- Modify: `components/projects/studio-workspace.tsx`

**Step 1: Upgrade `NeuralRerunFields` mesh inputs**

Replace the current passive card-only mesh UI in rerun state with:
- current attached model preview card
- `Attach from Generated Assets`
- `Clear attachment`

**Step 2: Preserve the viewer during attachment changes**

Changing the mesh attachment should not blank the current viewer unless the user intentionally changes the selected result.

**Step 3: Validate**

Run:
```bash
npx tsc --noEmit
npm run lint
```

Manual check:
1. Open a completed or failed neural mesh tool
2. Use the picker to swap the attached mesh
3. Confirm the attachment card changes and the rerun action uses the new mesh

**Step 4: Commit**

```bash
git add components/projects/studio-workspace.tsx
git commit -m "feat: add generated asset picker to neural reruns"
```

---

### Task 5: Add richer visual attachment cards

**Files:**
- Modify: `components/projects/studio-workspace.tsx`
- Modify: `components/projects/generated-assets.ts`

**Step 1: Expand attachment metadata**

Make mesh cards show:
- asset label
- source tool name
- whether it came from generated output or manual handoff

**Step 2: Add quick actions**

Add lightweight buttons for:
- `Open source step`
- `Replace`
- `Clear`

**Step 3: Validate**

Run:
```bash
npx tsc --noEmit
npm run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add components/projects/studio-workspace.tsx components/projects/generated-assets.ts
git commit -m "feat: enrich studio mesh attachment cards"
```

---

### Task 6: Manual Studio QA sweep

**Files:**
- Modify: `gemini.md`

**Step 1: Run manual QA**

Check:
1. TRELLIS result appears in `Generated Assets`
2. Refresh keeps the neural tab and viewer result
3. `Hunyuan3D Paint` can attach from the picker without using only the inline suggestion
4. `MeshAnything V2`, `Hunyuan3D Part`, `YVO3D`, and `UniRig` also expose the picker on `meshUrl`

**Step 2: Record findings**

Update `gemini.md` with the outcome and any remaining UX gaps.

**Step 3: Commit**

```bash
git add gemini.md
git commit -m "docs: record generated asset picker validation"
```

---

### Task 7: Phase 2 saved user library design and DB work

**Files:**
- Modify later: `prisma/schema.prisma`
- Create later: `app/api/projects/generated-assets/route.ts`
- Create later: `lib/projects/saved-generated-assets.ts`
- Create later: `docs/generated-assets-library-draft.md`

**Step 1: Keep this out of the current picker batch**

Do not block the picker work on a DB migration.

**Step 2: When the picker UX is validated, add a real saved library layer**

Planned data model:
- `id`
- `userId`
- `projectId` (optional)
- `sourceStepId`
- `label`
- `storagePath`
- `previewPath` (optional)
- `sourceTool`
- `isPinned`
- `createdAt`

**Step 3: Define quota policy before migration**

Recommended default:
- active pipeline outputs: always retained
- unpinned generated cache: capped by count/storage and evictable
- saved/pinned library assets: explicit quota by plan

**Step 4: Execute only after product sign-off**

This phase needs:
- Prisma migration
- storage decision (local managed cache vs object storage)
- pin/save UX approval

---

### Recommended Execution Order

1. Tasks 1-5 now
2. Task 6 manual QA
3. Task 7 only after the picker flow feels right in Studio
