# Studio Neural Viewer Design

## Goal

Embed neural generation results directly into the existing Studio workspace so users can prompt, generate, preview, and iterate on 3D outputs without leaving the project page or opening a separate viewer page.

## Status

This is a working design note for the current Studio branch. It defines the intended desktop and mobile interaction model for neural tools such as Hunyuan3D and TRELLIS, but it is not a final product architecture commitment.

## Problem

The current Studio tool detail view gives a neural tool the entire workspace. That works for configuration, but it breaks down once generation starts:

- the prompt/config panel continues to occupy the whole workspace
- there is no in-project place for a model viewer to appear at useful scale
- the user loses the sense of a persistent generation workspace
- the current desktop shell still reflects a configuration-first layout rather than a results-first layout

The new model viewer MVP on `/generate` proves the viewer itself works, but the actual product flow should stay inside Studio.

## Design Summary

Neural tools in Studio should transition into a split workspace after `Run Now`.

- Before generation:
  - the selected neural tool uses the full Studio workspace
  - the user can edit prompt and settings normally
- After `Run Now`:
  - the tool panel docks to the left side as a narrower run panel
  - the right side becomes a persistent model viewer stage
  - the prompt and generation settings become read-only while generation is active
  - the left dock exposes a `Stop` action but not live prompt editing
- If the user collapses the left dock:
  - the panel collapses into a slim vertical handle attached near the left toolbar/sidebar
  - the viewer expands to use the released space
  - the user can restore the dock from the handle

This should apply to neural tools generally, not just one provider.

## Primary Interaction Model

### Desktop

Desktop is the primary target for the first implementation.

The Studio workspace becomes a two-pane layout for active neural runs:

- `Left Docked Neural Panel`
  - width target: roughly `360px` to `420px`
  - shows tool name, provider badge, prompt summary, generation settings, status, and action buttons
  - remains read-only while generation is active
  - supports `Stop`, `Collapse`, and after completion `New Run`
- `Right Viewer Stage`
  - stays visible immediately after the transition
  - does not swap to a separate loading screen
  - may show lightweight loading chrome inside the viewer frame
  - automatically loads the first successful result when a model becomes available

### Mobile / Narrow Tablet

The split view should not be forced on smaller screens.

- mobile keeps a stacked flow
- viewer sits below the neural run panel
- collapse behavior can be skipped or reduced on small screens

## Viewer Behavior

The viewer stage should exist before the model is ready.

- The model viewer shell appears immediately after `Run Now`
- While generation is in progress:
  - the viewer area remains present
  - lightweight loading indication appears in the viewer frame header or overlay
  - the main progress/status messaging remains in the left neural panel
- When the model is ready:
  - the first result auto-opens in the viewer
  - the user should not need to click an asset first for the initial result

## Result Selection Model

For the first version:

- auto-open the first generated result
- do not require a manual asset click for the initial result

For future multi-result support:

- add a result strip below or near the viewer
- allow the user to click between retries, variants, or follow-up outputs
- keep the currently viewed model selected visibly

## Prompt Editing Rules

Users should not be able to edit a neural prompt mid-generation.

Reason:

- these provider jobs are not interactive in the same way as the Blender agent
- partial prompt edits during an active remote job create a misleading UI
- `Stop` + `New Run` is clearer than pretending the run can be edited live

Therefore:

- active neural runs are read-only
- the left panel exposes `Stop`
- after stop or completion, the user can start a fresh run

## Collapse / Restore Model

When the neural dock collapses:

- it should not disappear completely
- it should leave a slim handle anchored to the left side near the Studio sidebar
- the handle acts as the restore control

This keeps the user aware that a neural run context still exists and prevents the workspace from feeling like the panel vanished unexpectedly.

## Layout Proportions

The Studio shell should remain landscape-oriented, not square.

For model viewing, a wider canvas is better than a literal cube, but the workspace should still be somewhat taller than the current desktop ratio. The preferred target is a generous landscape work surface, closer to a `16:10` feel than a short banner.

That implies:

- keep the wider desktop project shell
- increase Studio workspace height slightly on desktop
- allocate most extra space to the viewer stage rather than to the tool form alone

## Initial Scope

The first implementation batch should focus only on the neural-tool split-view transition, not the full neural generation backend.

In scope:

- detect when the active selected Studio tool is a neural tool
- transition that tool detail view into a docked-left + viewer-right layout
- support dock collapse and restore
- mount the existing `ModelViewer` component into the right stage
- provide a placeholder/sample-backed viewer result while full Studio neural result wiring is still being completed

Out of scope for the first batch:

- variant gallery
- side-by-side comparisons
- texture brush or in-browser editing
- autopilot integration
- full multi-provider orchestration polish

## Components Likely Affected

- `components/projects/studio-workspace.tsx`
- `components/projects/studio-layout.tsx`
- `components/generation/ModelViewer.tsx`
- `lib/orchestration/tool-catalog.ts`

Potential support files:

- a new neural result panel/view model helper
- a new workspace state type for `idle | running | completed | collapsed`

## Acceptance Criteria

The first delivery should satisfy:

- selecting a neural tool still opens its full detail view
- clicking `Run Now` transitions to a split workspace
- the left panel becomes a narrower read-only run panel
- the right side shows the viewer stage immediately
- collapsing the left panel leaves a slim restore handle near the sidebar
- the first result auto-opens in the viewer when present
- desktop gets the split experience; mobile remains usable without forcing the same proportions
