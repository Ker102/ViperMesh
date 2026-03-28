"""
Professional Render Settings — Blender 4.0/5.0
===============================================
Category: utility
Blender: 4.0+ / 5.0
Source: NotebookLM (89-source Blender knowledge base)

Configuration recipes for Cycles and EEVEE, including:
- Color management (AgX vs Filmic)
- Sample settings for quality vs speed
- Shadow catchers for compositing
- EEVEE 5.0 property changes

BLENDER 5.0 BREAKING CHANGES:
- EEVEE engine: 'BLENDER_EEVEE_NEXT' → 'BLENDER_EEVEE'
- scene.eevee.taa_render_samples remains valid for final renders
- scene.eevee.taa_samples controls viewport sampling
- scene.eevee.gtao_distance / scene.eevee.use_gtao → view_layer.eevee.ambient_occlusion_distance
- scene.eevee.use_bloom → compositor bloom/glare workflow
- SceneEEVEE.gtao_quality → REMOVED
- Render passes renamed: DiffCol→Diffuse Color, IndexMA→Material Index, Z→Depth
- render.render() now accepts frame_start and frame_end
"""

import bpy


# =============================================================================
# CYCLES RENDER SETUP
# =============================================================================

def setup_cycles_production(samples=256, preview_samples=64):
    """Production-quality Cycles render settings with AgX color management."""
    scene = bpy.context.scene

    # Engine
    scene.render.engine = 'CYCLES'

    # Sampling
    scene.cycles.samples = samples
    scene.cycles.preview_samples = preview_samples

    # Denoising (Cycles)
    scene.cycles.use_denoising = True

    # Color Management — AgX is the standard in Blender 4.0+
    # AgX provides better highlight rolloff than Filmic
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - High Contrast'

    # Film
    scene.render.film_transparent = False

    return scene

def setup_cycles_fast(samples=64, preview_samples=16):
    """Fast preview Cycles settings for iteration."""
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
    scene.cycles.preview_samples = preview_samples
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'None'
    return scene


# =============================================================================
# EEVEE RENDER SETUP — Blender 5.0 Compatible
# =============================================================================
# CRITICAL: Engine enum changed in 5.0
# - Pre-5.0: 'BLENDER_EEVEE_NEXT'
# - 5.0+:    'BLENDER_EEVEE'

def setup_eevee_production():
    """Production EEVEE settings for Blender 5.x."""
    scene = bpy.context.scene
    view_layer = bpy.context.view_layer

    # Engine — use 'BLENDER_EEVEE' (renamed in 5.0)
    scene.render.engine = 'BLENDER_EEVEE'

    # EEVEE settings — use current 5.x sampling and shadow controls.
    scene.eevee.taa_render_samples = 128
    scene.eevee.taa_samples = 32
    scene.eevee.shadow_resolution_scale = 1.0
    scene.eevee.use_volumetric_shadows = True
    view_layer.eevee.ambient_occlusion_distance = 1.0

    # Color Management
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - High Contrast'

    return scene


# =============================================================================
# SHADOW CATCHER — For Compositing Objects onto Backgrounds
# =============================================================================

def setup_shadow_catcher(floor_obj):
    """Make an object a shadow catcher (Cycles only).
    Shadow catchers capture shadows from other objects while being
    transparent themselves — ideal for product visualization.
    """
    floor_obj.is_shadow_catcher = True
    return floor_obj

def create_shadow_catcher_plane(size=10):
    """Create a floor plane as shadow catcher for product shots."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "ShadowCatcher_Floor"
    plane.is_shadow_catcher = True
    return plane


# =============================================================================
# COLOR MANAGEMENT PRESETS
# =============================================================================
# AgX: Better highlight handling, more accurate color reproduction (4.0+ default)
# Filmic: Legacy, good for photorealistic scenes (3.x default)
# Standard: Linear, no tone mapping (for compositing/data passes)

def set_color_management_agx(look='AgX - High Contrast'):
    """Set AgX color management with specified look.
    
    Valid looks: 'None', 'AgX - Very Low Contrast', 'AgX - Low Contrast',
    'AgX - Medium Low Contrast', 'AgX - Base Contrast', 'AgX - Medium High Contrast',
    'AgX - High Contrast', 'AgX - Very High Contrast'
    """
    scene = bpy.context.scene
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = look
    scene.display_settings.display_device = 'sRGB'

def set_color_management_filmic():
    """Set Filmic color management (legacy, still useful)."""
    scene = bpy.context.scene
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'None'  # Filmic doesn't use AgX looks

def set_color_management_standard():
    """Set Standard (linear) — for compositing and data passes."""
    scene = bpy.context.scene
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'


# =============================================================================
# RENDER RESOLUTION PRESETS
# =============================================================================

RESOLUTION_PRESETS = {
    "1080p":  {"x": 1920, "y": 1080},
    "720p":   {"x": 1280, "y": 720},
    "4K":     {"x": 3840, "y": 2160},
    "Square": {"x": 1080, "y": 1080},
    "IG":     {"x": 1080, "y": 1350},  # Instagram portrait
}

def set_render_resolution(preset="1080p", percentage=100):
    """Set render resolution from preset."""
    scene = bpy.context.scene
    res = RESOLUTION_PRESETS.get(preset, RESOLUTION_PRESETS["1080p"])
    scene.render.resolution_x = res["x"]
    scene.render.resolution_y = res["y"]
    scene.render.resolution_percentage = percentage


# =============================================================================
# VIEWPORT MATERIAL PREVIEW
# =============================================================================

def set_viewport_material_preview():
    """Switch 3D viewport to Material Preview mode so materials are visible."""
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'MATERIAL'
                    break

def set_viewport_rendered():
    """Switch 3D viewport to Rendered mode for real-time render preview."""
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'RENDERED'
                    break


# =============================================================================
# COMPLETE PRODUCTION SETUP
# =============================================================================

def setup_production_scene(
    engine='CYCLES',
    resolution='1080p',
    samples=128,
    shadow_catcher=True
):
    """One-call production setup: engine + resolution + color management."""
    scene = bpy.context.scene

    if engine == 'CYCLES':
        setup_cycles_production(samples=samples)
    else:
        setup_eevee_production()

    set_render_resolution(resolution)

    if shadow_catcher:
        create_shadow_catcher_plane()

    set_viewport_material_preview()

    return scene
