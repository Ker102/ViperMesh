"""
{
  "title": "Blender Python API Version Compatibility Guide",
  "category": "utility",
  "tags": ["API", "compatibility", "migration", "version", "Blender 4.0", "Blender 5.0", "breaking changes", "deprecated"],
  "description": "Critical API compatibility reference for Blender 4.0 and 5.0. Documents all breaking changes, renamed APIs, deprecated functions, and their modern replacements. Essential knowledge for generating code that works with current Blender versions. Sourced from official Blender developer release notes.",
  "blender_version": "4.0-5.0+"
}
"""
import bpy

# =============================================================================
# BLENDER PYTHON API — VERSION COMPATIBILITY GUIDE
# =============================================================================
#
# This file documents critical breaking changes between Blender versions.
# Code generated for ModelForge MUST follow these rules to avoid errors.
#
# Sources:
#   - https://developer.blender.org/docs/release_notes/5.0/python_api/
#   - https://developer.blender.org/docs/release_notes/4.0/python_api/
#   - https://docs.blender.org/api/current/info_best_practice.html
# =============================================================================


# =============================================================================
# BLENDER 5.0 BREAKING CHANGES (CRITICAL)
# =============================================================================

# --- 1. material.use_nodes is DEPRECATED ---
# In Blender 5.0+, materials ALWAYS have node trees.
# `material.use_nodes = True` has NO EFFECT and will be removed in 6.0.
#
# OLD (pre-5.0):
#   mat = bpy.data.materials.new("MyMat")
#   mat.use_nodes = True  # Was required to create node tree
#
# NEW (5.0+):
#   mat = bpy.data.materials.new("MyMat")  # Node tree created automatically
#   # mat.use_nodes = True  # DEPRECATED — has no effect
#
# SAFE for BOTH versions (works 4.x and 5.0):
#   mat = bpy.data.materials.new("MyMat")
#   mat.use_nodes = True  # Harmless in 5.0, required in 4.x


# --- 2. world.use_nodes is DEPRECATED ---
# Same as materials — worlds always have node trees in 5.0.
#
# SAFE:
#   world = bpy.data.worlds.new("MyWorld")
#   world.use_nodes = True  # Harmless in 5.0

# --- 3. Boolean solver "FAST" renamed to "FLOAT" ---
# The FAST boolean solver was renamed to FLOAT in Blender 5.0.
# Valid solvers in 5.0: 'EXACT', 'FLOAT', 'MANIFOLD'
# Invalid in 5.0:       'FAST' (will raise error)
# 
# ALWAYS use 'EXACT' for best results:
#   modifier.solver = 'EXACT'
#   modifier.use_self = True
#   modifier.use_hole_tolerant = True


# --- 4. EEVEE Engine Identifier Changed ---
# OLD: scene.render.engine = 'BLENDER_EEVEE_NEXT'
# NEW: scene.render.engine = 'BLENDER_EEVEE'
#
# 'BLENDER_EEVEE_NEXT' was the temporary name during EEVEE Next development.
# In 5.0, it's now simply 'BLENDER_EEVEE'.


# --- 5. Compositor Node Tree Access Changed ---
# OLD (pre-5.0): scene.node_tree
# NEW (5.0+):    scene.compositing_node_group
#
# SAFE cross-version pattern:
#   tree = getattr(scene, "compositing_node_group", None)
#   if tree is None:
#       tree = scene.node_tree
#
# scene.use_nodes is deprecated in 5.0, always returns True,
# and setting it has no effect. Use scene.render.use_compositing
# to enable or disable compositor processing.


# --- 6. Grease Pencil / Annotations Renamed ---
# OLD: bpy.types.GreasePencil      → NEW: bpy.types.Annotation
# OLD: bpy.data.grease_pencils     → NEW: bpy.types.annotations
# OLD: bpy.types.GreasePencilv3    → NEW: bpy.types.GreasePencil
# OLD: bpy.data.grease_pencils_v3  → NEW: bpy.data.grease_pencils


# --- 7. Many Compositor Nodes Replaced ---
# Compositor-specific nodes like CompositorNodeGamma are replaced by
# their ShaderNode equivalents:
#   OLD: nodes.new("CompositorNodeGamma")
#   NEW: nodes.new("ShaderNodeGamma")


# --- 8. mathutils Vector now float32 ---
# In 5.0, mathutils types use float32 (was float64).
# This shouldn't affect most code, but be aware of precision differences.


# --- 9. Render Passes Renamed (5.0) ---
# OLD: 'DiffCol'  → NEW: 'Diffuse Color'
# OLD: 'IndexMA'  → NEW: 'Material Index'
# OLD: 'Z'        → NEW: 'Depth'
# render.render() now accepts frame_start and frame_end arguments.


# --- 10. BGL Module REMOVED (5.0) ---
# The deprecated bgl module is FULLY REMOVED in 5.0.
# Image.bindcode is removed. Use gpu.texture.from_image(image) instead.
# Creating shaders from GLSL source strings is removed.
# Use the gpu module for all GPU operations.


# --- 11. Action / Animation API Changes (5.0) — CRITICAL ---
#
# The ENTIRE legacy Action API was REMOVED in Blender 5.0.
# This is the most impactful breaking change for animation scripts.
#
# REMOVED properties (will raise AttributeError):
#   action.fcurves  → use channelbag.fcurves
#   action.groups   → use channelbag.groups
#   action.id_root  → use action_slot.target_id_type
#
# NEW architecture: "Slotted Actions"
#   Action → Layers → Strips → Channelbag(per slot) → FCurves
#
# Each ActionSlot identifies which data-block the animation targets.
# Each Channelbag contains the FCurves and Groups for that slot.
#
# MIGRATION PATTERN — Finding FCurves:
#
#   # OLD (REMOVED in 5.0):
#   for fcurve in action.fcurves:
#       for kf in fcurve.keyframe_points:
#           kf.interpolation = 'BEZIER'
#
#   # NEW (5.0+):
#   from bpy_extras import anim_utils
#   action = obj.animation_data.action
#   slot = obj.animation_data.action_slot
#   channelbag = anim_utils.action_get_channelbag_for_slot(action, slot)
#   for fcurve in channelbag.fcurves:
#       for kf in fcurve.keyframe_points:
#           kf.interpolation = 'BEZIER'
#
# MIGRATION PATTERN — Creating FCurves:
#
#   # OLD (REMOVED):
#   fcurve = action.fcurves.new("location", index=2, action_group="Position")
#
#   # NEW (5.0+):
#   channelbag = anim_utils.action_ensure_channelbag_for_slot(action, slot)
#   fcurve = channelbag.fcurves.new("location", index=2, group_name="Position")
#   # NOTE: parameter renamed from 'action_group' to 'group_name'
#
# MIGRATION PATTERN — Ensuring FCurve exists (find or create):
#
#   # OLD (REMOVED):
#   fcurve = action.fcurves.find("location", index=2)
#   if not fcurve:
#       fcurve = action.fcurves.new("location", index=2)
#
#   # NEW (5.0+):
#   channelbag = anim_utils.action_ensure_channelbag_for_slot(action, slot)
#   fcurve = channelbag.fcurves.ensure("location", index=2)
#
# IMPORTANT: keyframe_insert() is UNCHANGED in 5.0.
#   obj.keyframe_insert(data_path="location", frame=1)
#   This still works exactly as before — it auto-creates slots, layers,
#   strips, and channelbags as needed.
#
# HELPER FUNCTIONS (from bpy_extras.anim_utils):
#   action_get_channelbag_for_slot(action, slot)    → read existing data
#   action_ensure_channelbag_for_slot(action, slot)  → create if missing
#
# DIRECT STRIP KEYING (new in 5.0):
#   strip.key_insert(slot=slot, data_path="location", array_index=2,
#                    value=5.0, time=24.0)
#
# NLA CHANGES:
#   NlaStrip now has 'action_slot' property for slot binding.
#   Use strip.action_suitable_slots to find compatible slots.
#
# BONE SELECTION REFACTOR:
#   Bone.hide → now only affects Edit Mode visibility
#   PoseBone.hide → controls Pose/Object Mode visibility (NEW)
#   Bone.select, select_head, select_tail → REMOVED
#   Use EditBone.select (Edit Mode) or PoseBone.select (Pose Mode)
#
# REMOVED: INSERTKEY_XYZ_TO_RGB flag (auto-coloring is now built-in)


# --- 12. UV Selection Changes (5.0) ---
# UV selection is now shared between UV maps.
# REMOVED: MeshUVLoopLayer.vertex_selection, edge_selection
# REMOVED: bmesh.types.BMLoopUV.select, select_edge
# ADDED:   uv_select_vert, uv_select_edge, uv_select_face attributes
# UV pin property no longer auto-creates attribute — use _ensure() functions.


# --- 13. Paint & Sculpt Property Renames (5.0) ---
# brush.sculpt_tool → brush.sculpt_brush_type
# curve_preset → curve_distance_falloff_preset
# unified_paint_settings moved from tool settings to mode-specific Paint structs.
# Radial symmetry moved from scene tool settings to mesh.radial_symmetry
# REMOVED: brush.use_custom_icon, brush.icon_filepath


# --- 14. File Output Node Changes (5.0) ---
# Compositor File Output node:
#   REMOVED: file_slots, layer_slots, base_path
#   ADDED:   directory, file_name, file_output_items


# --- 15. Import/Export Changes (5.0) ---
# Alembic: Scene.alembic_export REMOVED → use bpy.ops.wm.alembic_export
# USD Import: import_subdiv → import_subdivision
#             attr_import_mode → property_import_mode
# USD Export: export_textures REMOVED (use export_textures_mode)
#             visible_objects_only REMOVED


# --- 16. Dictionary Property Access REMOVED (5.0) ---
# Properties defined via bpy.props are NO LONGER accessible via dict syntax.
# OLD: bpy.context.scene['cycles']     → FAILS in 5.0
# NEW: bpy.context.scene.cycles        → Use attribute access
# del obj['prop'] → obj.property_unset('prop')


# --- 17. Sky Texture Changes (5.0) ---
# REMOVED inputs: sun_direction, turbidity, ground_albedo


# --- 18. UI/Theme Changes (5.0) ---
# RADIAL_MENU layout type → renamed to PIE_MENU
# RNA_ADD icon REMOVED
# Removed theme properties: navigation_bar, execution_buts, tab_active, etc.

# =============================================================================
# BLENDER 4.0 BREAKING CHANGES
# =============================================================================

# --- Principled BSDF Changes (4.0) ---
# CRITICAL: Input names changed on the Principled BSDF node.
#
# REMOVED inputs (4.0):
#   - "Subsurface"           → replaced by "Subsurface Weight"
#   - "Subsurface Color"     → replaced by "Subsurface Radius"
#   - "Specular"             → replaced by "Specular IOR Level"
#   - "Clearcoat"            → replaced by "Coat Weight"
#   - "Clearcoat Roughness"  → replaced by "Coat Roughness"
#   - "Sheen"                → replaced by "Sheen Weight"
#   - "Sheen Tint"           → replaced by "Sheen Roughness"
#   - "Transmission"         → replaced by "Transmission Weight"
#   - "IOR"                  → replaced by "IOR" (kept, no change)
#   - "Emission"             → split into "Emission Color" + "Emission Strength"
#
# SAFE CODE for Principled BSDF (4.0+):
#   bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
#   bsdf.inputs['Metallic'].default_value = 0.0
#   bsdf.inputs['Roughness'].default_value = 0.5
#   bsdf.inputs['Emission Color'].default_value = (r, g, b, 1.0)
#   bsdf.inputs['Emission Strength'].default_value = 5.0
#   bsdf.inputs['Coat Weight'].default_value = 0.0
#   bsdf.inputs['Sheen Weight'].default_value = 0.0
#   bsdf.inputs['Transmission Weight'].default_value = 0.0


# --- Color Ramp / Mix Node Changes (4.0) ---
# OLD: ShaderNodeMixRGB     → REMOVED in 4.0
# NEW: ShaderNodeMix         → Use this instead
#
# When using ShaderNodeMix for colors:
#   mix_node = nodes.new('ShaderNodeMix')
#   mix_node.data_type = 'RGBA'
#   mix_node.inputs[6].default_value = (r1, g1, b1, 1)  # Color A
#   mix_node.inputs[7].default_value = (r2, g2, b2, 1)  # Color B
#   # Output: mix_node.outputs[2]  (Result Color)


# =============================================================================
# SAFE PATTERNS — ALWAYS USE THESE
# =============================================================================

def create_material_safe(name, color=(0.8, 0.8, 0.8)):
    """
    Create a material that works across Blender 4.x and 5.x.
    
    Uses only current, non-deprecated API calls.
    """
    mat = bpy.data.materials.new(name=name)
    # use_nodes is deprecated in 5.0 but harmless; required in 4.x
    mat.use_nodes = True
    
    nodes = mat.node_tree.nodes
    # The default node tree already has a Principled BSDF
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    
    # Use 4.0+ input names
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    
    return mat, bsdf


def set_emission_safe(bsdf, color=(1, 1, 1), strength=5.0):
    """
    Set emission on a Principled BSDF using 4.0+ API.
    
    IMPORTANT: Always set BOTH Emission Color AND Emission Strength.
    In Blender 4.0+, these are separate inputs (was single 'Emission' before).
    """
    bsdf.inputs['Emission Color'].default_value = (*color, 1.0)
    bsdf.inputs['Emission Strength'].default_value = strength


def set_glass_safe(bsdf, color=(1, 1, 1), ior=1.45, roughness=0.0):
    """
    Configure glass material using 4.0+ API.
    
    Uses 'Transmission Weight' (not old 'Transmission').
    """
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Transmission Weight'].default_value = 1.0
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Roughness'].default_value = roughness


def set_coat_safe(bsdf, weight=1.0, roughness=0.1):
    """
    Add clearcoat using 4.0+ API.
    
    Uses 'Coat Weight' and 'Coat Roughness' (not old 'Clearcoat').
    """
    bsdf.inputs['Coat Weight'].default_value = weight
    bsdf.inputs['Coat Roughness'].default_value = roughness

# --- 19. Material blend_method / shadow_method Changes (5.0) ---
# REMOVED ATTRIBUTES (will crash if accessed):
#   - mat.shadow_method  → DOES NOT EXIST in 5.x
#   - mat.shadow_mode    → DOES NOT EXIST in 5.x
#
# VALID blend_method values (Blender 5.x):
#   'OPAQUE'  — Default, fully opaque
#   'CLIP'    — Binary alpha threshold
#   'HASHED'  — Dithered alpha (good for foliage)
#   'BLEND'   — True alpha blending (for glass, smoke, etc.)
#
# WRONG (will crash):  mat.blend_method = 'ALPHA_BLEND'
# CORRECT:             mat.blend_method = 'BLEND'
#
# For transparent materials:
#   mat.blend_method = 'BLEND'
#   # Do NOT set mat.shadow_method — it does not exist


# --- 20. Legacy EEVEE Properties Replaced or Removed (5.0+) ---
# Blender 5.x keeps the split between viewport samples and final render samples:
#   - eevee.taa_samples        → viewport sampling
#   - eevee.taa_render_samples → final render sampling
#
# The following legacy properties are removed or moved in Blender 5.x:
#   - eevee.use_ssr
#   - eevee.use_ssr_refraction
#   - eevee.use_screen_space_reflections
#   - eevee.use_gtao
#   - eevee.gtao_distance
#   - eevee.gtao_quality
#   - eevee.use_bloom
#   - eevee.shadow_cascade_size
#
# Current Blender 5.x guidance:
#   - Use scene.eevee.use_raytracing and scene.eevee.ray_tracing_options
#     for current EEVEE reflection / tracing configuration
#   - Use view_layer.eevee.ambient_occlusion_distance for AO distance
#   - Use compositor glare/bloom setup instead of scene.eevee.use_bloom
#   - Use scene.eevee.shadow_resolution_scale and current shadow ray/step
#     settings instead of cascade-specific controls


# --- 21. Correct Transparent Material Setup (5.0) ---
def create_transparent_material(name, color=(0.8, 0.8, 0.8, 0.3)):
    """
    Create a transparent material compatible with Blender 5.x.
    
    IMPORTANT:
    - Use 'BLEND' not 'ALPHA_BLEND' for blend_method
    - Do NOT set shadow_method or shadow_mode (removed in 5.x)
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.blend_method = 'BLEND'  # NOT 'ALPHA_BLEND'
    
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Alpha'].default_value = color[3]
    
    return mat


# =============================================================================
# STYLE CONVENTIONS (Official Blender Python Guidelines)
# =============================================================================
#
# - Use single quotes for enums:   file_format = 'PNG'
# - Use double quotes for strings: filepath = "//render_out"
# - Follow PEP 8 naming: CamelCase for classes, snake_case for functions
# - Explicit imports only — never use `from bpy import *`
# - Prefer `float()` over `eval()` for parsing numbers
# - Use `startswith()` / `endswith()` instead of string slicing
# - Prefer list comprehensions over manual loops
# - Use `if` over `try/except` in hot loops (try is slower)
# - Time your scripts with `time.time()` for performance awareness
# =============================================================================
