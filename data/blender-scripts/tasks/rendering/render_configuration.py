"""
{
  "title": "Render Configuration",
  "category": "rendering",
  "subcategory": "engine",
  "tags": ["render", "cycles", "eevee", "denoiser", "samples", "resolution", "output", "AOV", "passes", "render settings"],
  "difficulty": "intermediate",
  "description": "Configure Cycles and EEVEE render engines with denoising, render passes, resolution presets, and output settings via Python. Blender 5.x compatible.",
  "blender_version": "5.0+",
  "estimated_objects": 0
}
"""
import bpy
import os


# Resolution presets
RESOLUTION_PRESETS = {
    'preview': (960, 540, 50),
    'hd': (1920, 1080, 100),
    '2k': (2560, 1440, 100),
    '4k': (3840, 2160, 100),
    'square_1k': (1024, 1024, 100),
    'square_2k': (2048, 2048, 100),
    'instagram': (1080, 1080, 100),
    'portrait': (1080, 1920, 100),
}


def configure_cycles(
    scene: bpy.types.Scene = None,
    samples: int = 128,
    use_denoiser: bool = True,
    denoiser: str = 'OPENIMAGEDENOISE',
    use_adaptive_sampling: bool = True,
    adaptive_threshold: float = 0.01,
    max_bounces: int = 8,
    transparent_background: bool = False,
    device: str = 'GPU'
) -> None:
    """
    Configure Cycles render engine with optimal settings.

    Args:
        scene: Target scene
        samples: Render samples (higher=better quality, 64-4096)
        use_denoiser: Enable denoising
        denoiser: 'OPENIMAGEDENOISE' or 'OPTIX' (NVIDIA only)
        use_adaptive_sampling: Enable adaptive sampling (stops early on clean pixels)
        adaptive_threshold: Noise threshold for adaptive sampling
        max_bounces: Maximum light bounces
        transparent_background: Render with alpha background
        device: 'GPU' or 'CPU'

    Example:
        >>> configure_cycles(samples=256, use_denoiser=True, device='GPU')
    """
    if scene is None:
        scene = bpy.context.scene

    # Blender 5.0: EEVEE engine name is 'BLENDER_EEVEE'
    scene.render.engine = 'CYCLES'

    cycles = scene.cycles
    cycles.samples = samples
    cycles.use_adaptive_sampling = use_adaptive_sampling
    if use_adaptive_sampling:
        cycles.adaptive_threshold = adaptive_threshold

    # Light path bounces
    cycles.max_bounces = max_bounces
    cycles.diffuse_bounces = max_bounces
    cycles.glossy_bounces = max_bounces
    cycles.transmission_bounces = max_bounces
    cycles.transparent_max_bounces = max_bounces

    # Denoising
    cycles.use_denoising = use_denoiser
    if use_denoiser:
        cycles.denoiser = denoiser

    # Device
    cycles.device = device

    # Transparent background
    if transparent_background:
        scene.render.film_transparent = True

    # Performance — tile size
    scene.render.tile_x = 256 if device == 'GPU' else 32
    scene.render.tile_y = 256 if device == 'GPU' else 32


def configure_eevee(
    scene: bpy.types.Scene = None,
    samples: int = 64,
    use_bloom: bool = False,
    use_ambient_occlusion: bool = True,
    ao_distance: float = 1.0,
    transparent_background: bool = False
) -> None:
    """
    Configure EEVEE render engine for Blender 5.x.

    NOTE:
    - Blender 5.x uses 'BLENDER_EEVEE' as the engine enum
    - scene.eevee.taa_render_samples controls final render samples
    - scene.eevee.taa_samples controls viewport samples
    - Ambient occlusion distance now lives on the view layer
    - Bloom uses the compositor, not a scene.eevee.use_bloom toggle

    Args:
        scene: Target scene
        samples: Final render samples
        use_bloom: Add a compositor glare node for bloom-like glow
        use_ambient_occlusion: Configure ambient occlusion distance on the view layer
        ao_distance: Ambient occlusion distance
        transparent_background: Render with alpha background

    Example:
        >>> configure_eevee(samples=128, use_bloom=True)
    """
    if scene is None:
        scene = bpy.context.scene

    scene.render.engine = 'BLENDER_EEVEE'

    eevee = scene.eevee
    eevee.taa_render_samples = samples
    eevee.taa_samples = max(16, samples // 2)

    # Ambient occlusion now lives on the view layer in Blender 5.x.
    view_layer = scene.view_layers[0]
    if use_ambient_occlusion:
        view_layer.eevee.ambient_occlusion_distance = ao_distance
    else:
        view_layer.eevee.ambient_occlusion_distance = 0.0

    # Bloom now routes through the compositor.
    if use_bloom:
        scene.use_nodes = True
        scene.render.use_compositing = True
        tree = getattr(scene, 'compositing_node_group', None) or scene.node_tree

        if tree is not None:
            render_node = None
            composite_node = None
            for node in tree.nodes:
                if node.type == 'R_LAYERS':
                    render_node = node
                elif node.type == 'COMPOSITE':
                    composite_node = node

            if render_node and composite_node:
                for node in list(tree.nodes):
                    if node.type == 'GLARE':
                        tree.nodes.remove(node)

                glare = tree.nodes.new('CompositorNodeGlare')
                glare.glare_type = 'BLOOM'
                glare.threshold = 0.8
                glare.mix = 0.5
                glare.size = 6
                glare.location = (render_node.location.x + 300, render_node.location.y)

                for link in list(tree.links):
                    if link.to_node == composite_node and link.to_socket.name == 'Image':
                        tree.links.remove(link)

                tree.links.new(render_node.outputs['Image'], glare.inputs['Image'])
                tree.links.new(glare.outputs['Image'], composite_node.inputs['Image'])

    # Transparent background
    if transparent_background:
        scene.render.film_transparent = True


def set_resolution(
    scene: bpy.types.Scene = None,
    preset: str = 'hd',
    custom_width: int = None,
    custom_height: int = None,
    percentage: int = None
) -> tuple:
    """
    Set render resolution from preset or custom values.

    Args:
        scene: Target scene
        preset: 'preview', 'hd', '2k', '4k', 'square_1k', 'square_2k',
                'instagram', 'portrait'
        custom_width: Override with custom width
        custom_height: Override with custom height
        percentage: Resolution percentage (1-100)

    Returns:
        Tuple of (width, height, percentage)

    Example:
        >>> set_resolution(preset='4k')
        >>> set_resolution(custom_width=3000, custom_height=2000)
    """
    if scene is None:
        scene = bpy.context.scene

    if custom_width and custom_height:
        w, h, pct = custom_width, custom_height, percentage or 100
    else:
        w, h, pct = RESOLUTION_PRESETS.get(preset, RESOLUTION_PRESETS['hd'])
        if percentage is not None:
            pct = percentage

    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = pct

    return (w, h, pct)


def enable_render_passes(
    scene: bpy.types.Scene = None,
    passes: list = None
) -> None:
    """
    Enable render passes for compositing and AOV access.

    Args:
        scene: Target scene
        passes: List of pass names to enable. Available:
            'diffuse_color', 'diffuse_direct', 'diffuse_indirect',
            'glossy_color', 'glossy_direct', 'glossy_indirect',
            'emission', 'environment', 'ambient_occlusion',
            'shadow', 'normal', 'uv', 'mist', 'depth',
            'object_index', 'material_index', 'cryptomatte_object',
            'cryptomatte_material', 'cryptomatte_asset'

    Example:
        >>> enable_render_passes(passes=['ambient_occlusion', 'normal', 'mist', 'depth'])
    """
    if scene is None:
        scene = bpy.context.scene

    if passes is None:
        passes = ['ambient_occlusion', 'normal', 'mist']

    view_layer = scene.view_layers[0]

    pass_map = {
        'diffuse_color': 'use_pass_diffuse_color',
        'diffuse_direct': 'use_pass_diffuse_direct',
        'diffuse_indirect': 'use_pass_diffuse_indirect',
        'glossy_color': 'use_pass_glossy_color',
        'glossy_direct': 'use_pass_glossy_direct',
        'glossy_indirect': 'use_pass_glossy_indirect',
        'emission': 'use_pass_emit',
        'environment': 'use_pass_environment',
        'ambient_occlusion': 'use_pass_ambient_occlusion',
        'shadow': 'use_pass_shadow',
        'normal': 'use_pass_normal',
        'uv': 'use_pass_uv',
        'mist': 'use_pass_mist',
        'depth': 'use_pass_z',
        'object_index': 'use_pass_object_index',
        'material_index': 'use_pass_material_index',
        'cryptomatte_object': 'use_pass_cryptomatte_object',
        'cryptomatte_material': 'use_pass_cryptomatte_material',
        'cryptomatte_asset': 'use_pass_cryptomatte_asset',
    }

    for p in passes:
        attr = pass_map.get(p)
        if attr and hasattr(view_layer, attr):
            setattr(view_layer, attr, True)


def set_output_settings(
    scene: bpy.types.Scene = None,
    filepath: str = '//render/frame_',
    file_format: str = 'PNG',
    color_depth: str = '16',
    use_overwrite: bool = True,
    frame_start: int = 1,
    frame_end: int = 250,
    fps: int = 24,
    color_mode: str = 'RGBA'
) -> None:
    """
    Configure render output settings.

    Args:
        scene: Target scene
        filepath: Output file path (// = relative to .blend)
        file_format: 'PNG', 'JPEG', 'OPEN_EXR', 'OPEN_EXR_MULTILAYER', 'TIFF', 'BMP'
        color_depth: '8', '16', or '32' (for EXR)
        use_overwrite: Overwrite existing files
        frame_start: Animation start frame
        frame_end: Animation end frame
        fps: Frames per second
        color_mode: 'RGB' or 'RGBA' (with alpha)

    Example:
        >>> set_output_settings(filepath='//output/render_', file_format='OPEN_EXR', color_depth='32')
    """
    if scene is None:
        scene = bpy.context.scene

    scene.render.filepath = filepath
    scene.render.image_settings.file_format = file_format
    scene.render.image_settings.color_depth = color_depth
    scene.render.image_settings.color_mode = color_mode
    scene.render.use_overwrite = use_overwrite

    scene.frame_start = frame_start
    scene.frame_end = frame_end
    scene.render.fps = fps


def setup_production_render(
    scene: bpy.types.Scene = None,
    engine: str = 'CYCLES',
    resolution_preset: str = 'hd',
    samples: int = 256,
    denoiser: bool = True,
    output_path: str = '//render/frame_',
    output_format: str = 'PNG',
    passes: list = None
) -> dict:
    """
    One-call production render setup: engine, resolution, denoising, passes, and output.

    Args:
        scene: Target scene
        engine: 'CYCLES' or 'EEVEE'
        resolution_preset: Resolution preset name
        samples: Render samples
        denoiser: Enable denoising
        output_path: Render output path
        output_format: Output file format
        passes: List of render passes to enable

    Returns:
        Dict with applied settings

    Example:
        >>> setup_production_render(engine='CYCLES', resolution_preset='4k', samples=512)
    """
    if engine == 'CYCLES':
        configure_cycles(scene, samples=samples, use_denoiser=denoiser)
    else:
        configure_eevee(scene, samples=samples)

    w, h, pct = set_resolution(scene, preset=resolution_preset)

    if passes:
        enable_render_passes(scene, passes)

    set_output_settings(scene, filepath=output_path, file_format=output_format)

    return {
        'engine': engine,
        'resolution': (w, h),
        'samples': samples,
        'denoiser': denoiser,
        'output_path': output_path,
        'format': output_format,
    }


# Standalone execution
if __name__ == "__main__":
    result = setup_production_render(
        engine='CYCLES',
        resolution_preset='hd',
        samples=256,
        passes=['ambient_occlusion', 'normal', 'mist']
    )
    print(f"Configured production render: {result}")
