---
title: "Export & File Format Guide"
category: "export"
tags: ["export", "GLB", "GLTF", "FBX", "OBJ", "STL", "file format", "3D printing", "game engine", "web", "export_object"]
triggered_by: ["export_object"]
description: "Domain knowledge for 3D model export, file format selection, pre-export preparation, and format-specific considerations."
blender_version: "4.0+"
---

# Export & File Format Guide

## FORMAT SELECTION

| Format | Extension | Best For | Materials | Animation | Notes |
|---|---|---|---|---|---|
| **GLB** | `.glb` | Web, AR/VR, Three.js | ✅ PBR | ✅ | **Default choice** — single binary file, widely supported |
| GLTF | `.gltf` | Web (separate files) | ✅ PBR | ✅ | Same as GLB but textures as separate files |
| FBX | `.fbx` | Game engines (Unity, Unreal) | ✅ | ✅ | Industry standard for game dev |
| OBJ | `.obj` | Legacy compatibility | ⚠️ Basic | ❌ | Oldest format, universally supported |
| STL | `.stl` | 3D printing | ❌ No | ❌ | Mesh-only, no colors or materials |

### Quick Decision Guide
- **Web/online viewer?** → GLB
- **Unity/Unreal?** → FBX
- **3D printing?** → STL
- **Simple mesh exchange?** → OBJ
- **Not sure?** → GLB (most versatile)

## PRE-EXPORT CHECKLIST

### Always Do Before Export
1. **Apply transforms** (`apply_transforms`) — Resets scale/rotation to identity, prevents distorted models
2. **Apply all modifiers** (if you want clean geometry) — SubSurf, mirrors, booleans become permanent
3. **Set correct origin** — Usually center of geometry or bottom center for grounding
4. **Clean up** — Remove unused objects, helper empties, construction geometry

### Format-Specific Prep
- **GLB/GLTF:** Ensure materials use Principled BSDF (auto-converts to PBR)
- **FBX:** Apply scale — FBX uses centimeters by default, Blender uses meters
- **STL:** Make sure mesh is watertight (no holes) for 3D printing
- **OBJ:** Materials export as separate .mtl file — keep files together

## SCALE CONSIDERATIONS

| Scenario | Scale Factor | Notes |
|---|---|---|
| Blender → Web (Three.js) | 1.0 (no change) | GLB preserves Blender units |
| Blender → Unity | 1.0 | Unity reads FBX scale correctly |
| Blender → Unreal | 100× | Unreal uses centimeters |
| Blender → 3D Print (mm) | 1000× | Blender meters → millimeters |

## PATH HANDLING

- Use **absolute paths**: `/tmp/model.glb`, `C:/tmp/export.fbx`
- Include the file extension in the path — it determines the format
- The tool creates parent directories if needed
- Existing files at the same path are overwritten

## MATERIAL COMPATIBILITY

| Material Feature | GLB | FBX | OBJ | STL |
|---|---|---|---|---|
| Base Color | ✅ | ✅ | ✅ | ❌ |
| Metallic/Roughness | ✅ | ✅ | ❌ | ❌ |
| Normal Maps | ✅ | ✅ | ⚠️ | ❌ |
| Emission | ✅ | ✅ | ❌ | ❌ |
| Transparency | ✅ | ✅ | ⚠️ | ❌ |

## COMMON MISTAKES TO AVOID

1. ❌ Exporting without applying transforms — causes scale/rotation issues in target application
2. ❌ Using STL when materials are needed — STL is mesh-only
3. ❌ Forgetting file extension in path — the tool uses file_format param or extension to determine format
4. ❌ Exporting unapplied modifiers — geometry won't match what you see in viewport
5. ❌ Using OBJ for PBR materials — OBJ only supports basic diffuse/specular, use GLB instead
