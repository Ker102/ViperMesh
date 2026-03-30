# Studio Script Gap Analysis Workflow

Use this workflow after a **manual Studio-mode Blender agent test** when you want
to compare the agent's failed or weaker result against an expert-authored version.

## Required Inputs

- `[FAILED SCRIPT]`
- `[EXPERT SCRIPT]`
- `[CURRENT RAG GUIDANCE]`

## Analysis Instructions

1. Analyze the Gap:
   Compare the `[FAILED SCRIPT]` and the `[EXPERT SCRIPT]`. Identify exactly why
   the failed script struggled with spatial placement, alignment, or scaling.

2. Focus on the API & Math:
   Look specifically at how the expert script uses bounding boxes,
   `mathutils.Vector`, `mathutils.Matrix` (world vs. local space), raycasting, or
   origin points differently than the failed script.

3. Extract the Principle:
   Identify the fundamental rule of Blender spatial logic that the expert
   followed and the agent missed.

4. Generalize:
   Do **not** mention the specific objects from the scripts and do **not**
   include hardcoded coordinates. Translate the principle into a generalized
   algorithm or API strategy that applies to any mesh.

5. Cross-reference:
   Review the `[CURRENT RAG GUIDANCE]`.
   - If the extracted principle is already there, output how to rephrase it for
     better adherence.
   - If it is new, output it as a new rule.

## Constraints

- Keep the output generalized and reusable.
- Do not anchor the rule to the original scene or object types.
- Do not output one-off fixes; output reusable Blender spatial logic.
