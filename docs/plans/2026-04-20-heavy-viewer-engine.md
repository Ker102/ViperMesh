# Heavy Viewer Engine — Implementation Plan

## Goal
Add a Studio-only secondary viewer path built on Three.js / React Three Fiber for inspection modes that the current `<model-viewer>` stack cannot represent cleanly.

## Why
- The current viewer is good for fast result review and download.
- It is not the right substrate for true wireframe, normals-style geometry inspection, toon shading, or flat-vs-smooth shading comparisons.
- The heavier path should live beside the MVP viewer architecture, not replace every existing model surface in the app.

## First Slice
Implement a Studio-only `HeavyModelViewer` and wire it into the neural viewer stage.

### Viewer modes
- `Material`
- `Geometry` (normal-material style geometry preview)
- `Clay`
- `Toon`
- `Wireframe`
- `Stats`

### Shading controls
- `Smooth`
- `Flat`

### Core controls
- `Fit`
- `Reset`
- `Fullscreen`
- `Download`

## Technical decisions
- Keep the existing `components/generation/ModelViewer.tsx` intact for non-Studio usage.
- Add a new client component using:
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`
- Use `GLTFLoader` for `.glb` loading.
- Use `SkeletonUtils.clone` so skinned models remain safe to inspect in the heavier viewer path.
- Use material replacement on the loaded scene rather than mutating the stored asset itself.

## Integration point
- Replace the current Studio neural stage rendering with the new heavy viewer component.
- Keep the existing Studio overlay/header/metadata/suggestion structure.

## Validation
- `npx tsc --noEmit`
- `npm run lint`
- Manual Studio check:
  - Material / Geometry / Clay / Toon / Wireframe
  - Flat / Smooth shading toggle
  - Fit / Reset / Fullscreen / Download
  - Same generated asset restore flow still works
