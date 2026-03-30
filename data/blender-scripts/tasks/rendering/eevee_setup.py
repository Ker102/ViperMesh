"""
{
  "title": "Eevee Optimized Setup",
  "category": "rendering",
  "subcategory": "optimization",
  "tags": ["eevee", "realtime", "optimization", "performance", "rendering"],
  "difficulty": "intermediate",
  "description": "Optimized Eevee render settings for Blender 5.x fast previews and final renders.",
  "blender_version": "5.0+",
  "estimated_objects": 0
}
"""
import bpy


def setup_eevee_quality(quality: str = 'MEDIUM') -> dict:
    """
    Configure Eevee quality preset for Blender 5.x.
    
    NOTE: In Blender 5.x:
    - scene.eevee.taa_samples controls viewport sampling
    - scene.eevee.taa_render_samples controls final render sampling
    - legacy top-level toggles like use_ssr, use_gtao, use_bloom, and
      shadow_cascade_size were removed or replaced
    
    Args:
        quality: 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'
    
    Returns:
        Dictionary with applied settings
    """
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    
    presets = {
        'LOW': {
            'samples': 16,
        },
        'MEDIUM': {
            'samples': 64,
        },
        'HIGH': {
            'samples': 128,
        },
        'ULTRA': {
            'samples': 256,
        }
    }
    
    preset = presets.get(quality, presets['MEDIUM'])

    eevee = bpy.context.scene.eevee
    eevee.taa_render_samples = preset['samples']
    eevee.taa_samples = max(16, preset['samples'] // 2)
    
    return preset


def add_reflection_probe(
    location: tuple = (0, 0, 1),
    influence_distance: float = 2.5,
    probe_type: str = 'SPHERE',
    name: str = "ReflectionProbe"
) -> bpy.types.Object:
    """
    Add reflection/light probe for EEVEE.
    
    In Blender 5.x, reflections are handled automatically but probes
    can still improve quality for specific areas.
    
    Args:
        location: Probe position
        influence_distance: Influence radius
        probe_type: 'SPHERE' or 'BOX'
        name: Object name
    
    Returns:
        The probe object
    """
    bpy.ops.object.lightprobe_add(
        type='SPHERE' if probe_type == 'SPHERE' else 'BOX',
        location=location
    )
    probe = bpy.context.active_object
    probe.name = name
    probe.data.influence_distance = influence_distance
    
    return probe


def add_irradiance_volume(
    location: tuple = (0, 0, 1),
    size: tuple = (5, 5, 3),
    resolution: tuple = (4, 4, 2),
    name: str = "IrradianceVolume"
) -> bpy.types.Object:
    """
    Add irradiance volume for indirect lighting.
    
    Args:
        location: Volume center
        size: XYZ size
        resolution: XYZ probe count
        name: Object name
    
    Returns:
        The volume object
    """
    bpy.ops.object.lightprobe_add(type='VOLUME', location=location)
    volume = bpy.context.active_object
    volume.name = name
    volume.scale = (size[0]/2, size[1]/2, size[2]/2)
    volume.data.grid_resolution_x = resolution[0]
    volume.data.grid_resolution_y = resolution[1]
    volume.data.grid_resolution_z = resolution[2]
    
    return volume


def setup_bloom_compositor(
    threshold: float = 0.8,
    mix: float = 0.5,
    size: int = 8
) -> None:
    """
    Set up bloom/glow effect using the compositor (Blender 5.x).
    
    In Blender 5.x, eevee.use_bloom is removed. Use a compositor
    Glare node instead for bloom/glow effects.
    
    Args:
        threshold: Brightness threshold for bloom
        mix: Mix factor (0-1)
        size: Glare size (1-9)
    """
    scene = bpy.context.scene
    scene.use_nodes = True
    scene.render.use_compositing = True

    # Blender 5.x: use compositing_node_group; fallback to node_tree for older versions
    tree = getattr(scene, 'compositing_node_group', None) or scene.node_tree
    if tree is None:
        print("Warning: No compositor node tree available")
        return

    # Find existing render layers and composite nodes
    render_node = None
    composite_node = None
    for node in tree.nodes:
        if node.type == 'R_LAYERS':
            render_node = node
        elif node.type == 'COMPOSITE':
            composite_node = node

    if not render_node or not composite_node:
        print("Warning: Missing Render Layers or Composite node in compositor")
        return

    # Idempotency: remove existing Glare nodes to prevent duplicates
    for node in list(tree.nodes):
        if node.type == 'GLARE':
            tree.nodes.remove(node)

    # Add Glare node for bloom
    glare = tree.nodes.new('CompositorNodeGlare')
    glare.glare_type = 'BLOOM'
    glare.threshold = threshold
    glare.mix = mix
    glare.size = size
    glare.location = (render_node.location.x + 300, render_node.location.y)

    # Rewire: Render Layers -> Glare -> Composite
    # Remove existing link from render to composite
    for link in tree.links:
        if link.to_node == composite_node and link.to_socket.name == 'Image':
            tree.links.remove(link)
            break

    tree.links.new(render_node.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], composite_node.inputs['Image'])


def bake_lighting() -> None:
    """Bake indirect lighting for Eevee."""
    bpy.ops.scene.light_cache_bake()


if __name__ == "__main__":
    setup_eevee_quality('HIGH')
    setup_bloom_compositor()
    
    print("Configured Eevee for high quality rendering (Blender 5.x)")
