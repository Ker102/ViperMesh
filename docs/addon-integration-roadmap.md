# Blender Addon Integration Roadmap

> **Last Updated:** 2026-02-17
> **Source:** BlenderHub.net (top 50, free, geometry nodes, animation, rendering pages)
> **Purpose:** Track addons ViperMesh could integrate via MCP `execute_code`

---

## How Integration Works

Our MCP server executes arbitrary Python inside Blender, so we can:
- Call any installed addon's operators: `bpy.ops.addon_name.function()`
- Import addon modules: `import addon_module`
- Access built-in addons (Rigify, Node Wrangler, etc.) — no install needed

---

## 🟢 Priority 1 — Built-in Addons (Zero Install)

These ship with Blender and just need enabling via `bpy.ops.preferences.addon_enable()`.

| Addon | Category | Integration Value | Python API |
|-------|----------|-------------------|------------|
| **Node Wrangler** | Shading | Auto-connect texture nodes (Ctrl+T equivalent) | `bpy.ops.node.nw_*` |
| **Rigify** | Rigging | One-click character rigs from meta-rigs | `bpy.ops.pose.rigify_*` |
| **Import Images as Planes** | Import | Quick image/texture plane creation | `bpy.ops.import_image.to_plane()` |
| **Cell Fracture** | Effects | Shatter objects for destruction effects | `bpy.ops.object.add_fracture_cell_objects()` |
| **BoltFactory** | Modeling | Procedural nuts, bolts, screws | `bpy.ops.mesh.bolt_add()` |
| **Archimesh** | Architecture | Doors, walls, windows, furniture | `bpy.ops.mesh.archimesh_*` |
| **Extra Mesh Objects** | Modeling | Gears, gems, pipes, torii, etc. | `bpy.ops.mesh.primitive_*` |
| **Extra Curve Objects** | Modeling | Spirals, knots, profiles | `bpy.ops.curve.spirals_add()` |
| **A.N.T. Landscape** | Terrain | Procedural terrains and landscapes | `bpy.ops.mesh.landscape_add()` |
| **Sapling Tree Gen** | Nature | Procedural trees | `bpy.ops.curve.tree_add()` |
| **IvyGen** | Nature | Procedural ivy growth on surfaces | `bpy.ops.curve.ivy_add()` |

---

## 🟡 Priority 2 — Free Addons (High Value)

| Addon | Category | Price | What It Does | URL |
|-------|----------|-------|-------------|-----|
| **EasyBPY** | API | Free | Simplifies bpy into readable functions | [Gumroad](https://curtisjamesholt.gumroad.com/l/easybpy) |
| **ND (Non-Destructive)** | Hard Surface | Free | Non-destructive hard surface modeling | [Gumroad](https://hugemenace.gumroad.com/l/nd-blender-addon) |
| **Realtime Materials** | Materials | Free | Huge procedural material library (Cycles+EEVEE) | [BlenderMarket](https://blendermarket.com/products/realtime-materials-for-blender) |
| **BY-GEN** | Procedural | Free | Procedural generative structures | [Gumroad](https://curtisjamesholt.gumroad.com/l/BY-GEN) |
| **Nature Clicker** | Scattering | Free | Click-to-place objects with instancing | [Gumroad](https://oliverjpost.gumroad.com/l/QfghQ) |
| **Kit Ops 3 Free** | Kitbashing | Free | Insert objects with booleans | [Gumroad](https://chippwalters.gumroad.com/l/kitops3free) |
| **Geo Cables** | Cables | Free | Draw/click cables on surfaces | [Gumroad](https://amanbairwal.gumroad.com/l/GeoCables) |
| **Lightning Bolts** | Effects | Free | Procedural lightning via geometry nodes | [Gumroad](https://bbbn19.gumroad.com/l/jCoDy) |
| **Lego Assembly** | Fun | Free | Dynamic Lego assembly via geo nodes | [Gumroad](https://bbbn19.gumroad.com/l/dIQLD) |
| **Holt Tools** | Utility | Free | .blend cleanup, mesh optimization | [Gumroad](https://curtisjamesholt.gumroad.com/l/holt-tools) |
| **BlenderKit** | Assets | Free+ | Cloud asset library inside Blender | [Website](https://www.blenderkit.com/get-blenderkit/) |
| **Blender GIS** | Mapping | Free | Import satellite terrain + buildings | [GitHub](https://github.com/domlysz/BlenderGIS) |
| **BagaPie** | Geo Nodes | Free | Modifier presets for scattering, arrays | [Gumroad](https://abaga.gumroad.com/l/BbGVh) |
| **Camera Shakify** | Animation | Free | Realistic camera shake from tracking data | [GitHub](https://github.com/EatTheFuture/camera_shakify) |
| **Wiggle Bones** | Animation | Free | Follow-through physics on bones | [BlenderArtists](https://blenderartists.org/t/wiggle-2/1454788) |
| **BoneDynamics** | Animation | Free+ | Physics simulation on bones | [BlenderMarket](https://blendermarket.com/products/bonedynamics) |
| **Dynamic Parent** | Animation | Free | Switch bone parents via keyframes | [GitHub](https://github.com/romanvolodin/dynamic_parent) |
| **Pidgeon Toolbag** | Rendering | Free | Super denoiser + fast render + AI upscale | [Gumroad](https://pidgeontools.gumroad.com/l/PidgeonToolBag) |
| **Post FX** | Compositing | Free+ | Advanced compositing nodes (flares, distortion) | [BlenderMarket](https://blendermarket.com/products/post-fx) |
| **Alt Tab Easy Fog** | Effects | Free | 50+ volume presets for fog scenes | [BlenderMarket](https://blendermarket.com/products/alt-tab-easy-fog2) |
| **Alt Tab Ocean** | Effects | Free | Ocean generator with caustics | [BlenderMarket](https://blendermarket.com/products/alt-tab-water) |
| **Import As Decal** | Texturing | Free | Convert images to decals/stickers | [Gumroad](https://amanbairwal.gumroad.com/l/ImportAsDecal) |
| **Erode It** | Effects | Free+ | Procedural damage with one button | [BlenderMarket](https://blendermarket.com/products/erode-it) |
| **Malt Render** | Rendering | Free | Customizable realtime NPR render engine | [Website](https://malt3d.com/) |
| **Ragdoll Dynamics** | Physics | Free | Easy ragdoll rigs combined with animations | [BlenderMarket](https://blendermarket.com/products/ragdoll-dynamics) |

---

## 🔴 Priority 3 — Paid Addons (Future Consideration)

### Animation & Rigging
| Addon | Price | Integration Value |
|-------|-------|-------------------|
| **Auto-Rig Pro** | $25+ | Automatic full-body rigging with IK |
| **Faceit** | $78+ | Face rigging, animation, motion capture |
| **X-Muscle System** | $35+ | Realistic muscle/skin deformation |
| **Animation Layers** | $28 | Layer-based NLA workflow |
| **Animax** | $35 | Procedural multi-object animation |

### Modeling & Hard Surface
| Addon | Price | Integration Value |
|-------|-------|-------------------|
| **Hard Ops + Boxcutter** | $38 | Fast boolean hard-surface modeling |
| **MESHmachine** | $45 | Chamfer/bevel manipulation |
| **Fluent: Power Trip** | $30 | Non-destructive boolean workflow |
| **Cablerator** | $14+ | Auto-generate cables between surfaces |
| **Mechanical Creature Kit** | Free+ | Procedural bolts, cogs, mechanisms |

### Materials & Texturing
| Addon | Price | Integration Value |
|-------|-------|-------------------|
| **Extreme PBR Nexus** | $39+ | 1800+ materials, PBR texture paint |
| **SimpleBake** | $20 | One-click PBR texture baking |

### Rendering & Compositing
| Addon | Price | Integration Value |
|-------|-------|-------------------|
| **K-Cycles** | $54+ | Faster Cycles with bloom + lens flares |
| **Physical Starlight** | $70+ | Procedural atmosphere, stars, clouds |
| **Cam-FX** | $30 | Anamorphic lens dirt and bokeh |
| **Light Wrangler** | $14+ | Quick professional lighting setups |

### Procedural & Geometry Nodes
| Addon | Price | Integration Value |
|-------|-------|-------------------|
| **Flip Fluids** | $76 | High-quality liquid simulation |
| **Procedural Crowds** | $18+ | Photo-scanned animated characters |
| **Procedural Alleys** | $18+ | Alley scenes via geometry nodes |
| **Curves to Roads** | $5 | Geometry nodes road generation |
| **Realtime Flame** | $10 | Real-time fire for Cycles/EEVEE |
| **Droplet Generator** | $15 | Procedural condensation |
| **Pipe Systems** | $6+ | Auto-generate piping around meshes |
| **botaniq** | $2+ | Massive nature asset library |

---

## 🏗️ Integration Strategy

### Phase 1: Built-in Addons (No dependencies)
1. Enable addons via `bpy.ops.preferences.addon_enable(module="addon_name")`
2. Create RAG scripts for each built-in addon's API
3. Update CODE_GENERATION_PROMPT with built-in addon guidance
4. Test: "Create a landscape with trees" → A.N.T. Landscape + Sapling

### Phase 2: Free Community Addons
1. Document installation requirements in user setup guide
2. Create detection scripts: check if addon is installed before using
3. Fallback: if addon not installed, use vanilla bpy equivalent
4. Priority targets: Realtime Materials, BY-GEN, Nature Clicker, Geo Cables

### Phase 3: Paid Addons (Premium feature)
1. Detect installed paid addons and expose their capabilities
2. Update planner to suggest addon-powered approaches when available
3. Create addon-specific RAG scripts for popular paid addons

---

## 📚 Sources

- [Top 50 Blender Addons (BlenderHub)](https://blenderhub.net/top-free-and-paid-blender-addons/)
- [Top 20 Free Addons (BlenderHub)](https://blenderhub.net/free-blender-addons/)
- [Top 35 Geometry Node Addons (BlenderHub)](https://blenderhub.net/geometry-node-addons/)
- [Top 15 Animation Addons (BlenderHub)](https://blenderhub.net/top-15-animation-addons-for-blender/)
- [Top 20 Rendering Addons (BlenderHub)](https://blenderhub.net/top-10-rendering-addons-for-blender/)
- [Duet PBR (CC0 textures)](https://www.duetpbr.com/)
