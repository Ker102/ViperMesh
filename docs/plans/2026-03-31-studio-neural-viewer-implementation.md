# Studio Neural Viewer Transition Implementation Plan

> **For Agent:** Use executing-plans skill to implement this plan task-by-task.

**Goal:** Add the first in-project Studio neural split-view workflow so a neural tool docks left and a persistent model viewer stage appears on the right after `Run Now`.

**Architecture:** Keep Studio as the single workspace and layer a neural-run presentation state into `StudioWorkspace` rather than creating a new page. Reuse the existing `ModelViewer` component from the `/generate` MVP, but mount it inside Studio with a placeholder/sample-backed result path first so the UI contract is stable before full backend wiring.

**Tech Stack:** Next.js App Router, React client components, Tailwind utility classes, existing Studio workspace components, existing `ModelViewer` component.

---

### Task 1: Add neural split-view state model

**Files:**
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\projects\studio-workspace.tsx`

**Step 1: Add a small workspace state model**

Create minimal state for:
- selected tool
- dock mode: `full | docked | collapsed`
- active neural run snapshot
- active viewer model URL / label

**Step 2: Implement neural tool detection**

Use existing `ToolEntry.type === "neural"` as the split-view trigger.

**Step 3: Keep non-neural tools unchanged**

Only neural tools enter the new layout path. Procedural tools should continue to use the current detail view.

**Step 4: Verify type safety**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add components/projects/studio-workspace.tsx gemini.md
git commit -m "feat: add studio neural workspace state"
```

### Task 2: Build the docked neural run panel

**Files:**
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\projects\studio-workspace.tsx`

**Step 1: Extract a dedicated neural panel view**

Add a focused render branch or small internal component for the docked neural panel.

**Step 2: Make the running panel read-only**

Show:
- tool title
- provider badge
- prompt summary
- selected options
- run status
- `Stop` button
- `Collapse` button

Do not allow prompt edits while in active run mode.

**Step 3: Add restore handle behavior**

When collapsed:
- hide the main dock body
- keep a slim restore handle near the Studio sidebar edge

**Step 4: Verify visual behavior manually**

Run the dev server and confirm:
- neural panel docks correctly
- collapse/restore changes width without breaking layout

**Step 5: Commit**

```bash
git add components/projects/studio-workspace.tsx gemini.md
git commit -m "feat: add docked neural run panel"
```

### Task 3: Mount the persistent viewer stage in Studio

**Files:**
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\projects\studio-workspace.tsx`
- Reuse: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\generation\ModelViewer.tsx`

**Step 1: Add right-side viewer stage shell**

Render the viewer stage immediately after `Run Now`, even before a model is ready.

**Step 2: Show lightweight loading chrome**

Use a small loading indicator in the viewer frame instead of replacing the viewer area with a separate loading screen.

**Step 3: Feed an initial model source**

Use a sample/local model URL as the temporary first source so the viewer path can be validated before full Studio neural result plumbing lands.

**Step 4: Auto-open first available result**

When a result URL exists, render it immediately in the viewer stage.

**Step 5: Validate**

Run:
- `npx tsc --noEmit`
- `npm run lint`

Expected: PASS

**Step 6: Commit**

```bash
git add components/projects/studio-workspace.tsx gemini.md
git commit -m "feat: embed model viewer in studio neural workspace"
```

### Task 4: Adjust Studio shell proportions for the split view

**Files:**
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\projects\studio-layout.tsx`
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\app\dashboard\projects\[id]\page.tsx`

**Step 1: Increase desktop vertical space slightly**

Tune the Studio shell so the split view feels closer to a tall landscape work surface.

**Step 2: Preserve responsive behavior**

Ensure mobile and narrow tablet do not force the desktop split proportions.

**Step 3: Verify manually**

Check:
- desktop split view feels roomy
- no overflow regressions
- lower page sections still behave correctly

**Step 4: Commit**

```bash
git add app/dashboard/projects/[id]/page.tsx components/projects/studio-layout.tsx gemini.md
git commit -m "feat: tune studio shell for neural split view"
```

### Task 5: Connect the `Run Now` transition

**Files:**
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\projects\studio-layout.tsx`
- Modify: `C:\Users\krist\Desktop\Cursor-Projects\Projects\modelforge\ModelForge\components\projects\studio-workspace.tsx`

**Step 1: Thread a `run now` transition payload**

When a neural tool uses `Run Now`, send the selected tool + inputs into the workspace state that flips the layout into docked mode.

**Step 2: Keep existing timeline behavior intact**

The pipeline/timeline should still receive the step.

**Step 3: Validate end-to-end**

Manual checks:
- select Hunyuan or TRELLIS
- click `Run Now`
- workspace transitions into split mode
- left dock is read-only with `Stop`
- right viewer stage is visible immediately

**Step 4: Final verification**

Run:
- `npx tsc --noEmit`
- `npm run lint`

**Step 5: Commit**

```bash
git add components/projects/studio-layout.tsx components/projects/studio-workspace.tsx gemini.md
git commit -m "feat: transition studio neural tools into split view"
```

---

Plan complete and saved. Ready to execute with the first implementation batch in this session.
