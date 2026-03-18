"""
{
  "title": "Camera Composition and Cinematography",
  "category": "camera",
  "tags": ["camera", "composition", "focal length", "depth of field", "DOF", "framing", "rule of thirds", "tracking", "cinematic"],
  "description": "Professional camera setup techniques for Blender scenes. Includes focal length presets, depth of field configuration, rule-of-thirds positioning, look-at tracking, and cinematic camera rigs. Essential for creating polished, film-quality renders.",
  "blender_version": "4.0+"
}
"""
import bpy
import math
from mathutils import Vector


# =============================================================================
# CAMERA COMPOSITION & CINEMATOGRAPHY
# =============================================================================
#
# PROFESSIONAL CAMERA PRINCIPLES:
# 1. Focal length sets the "mood":
#    - 24mm = dramatic, exaggerated perspective (action, interiors)
#    - 35mm = natural, documentary feel
#    - 50mm = closest to human eye, portraits
#    - 85mm = portrait lens, flattering compression
#    - 135mm+ = telephoto, compressed perspective (product shots)
#
# 2. Rule of thirds: place subjects at 1/3 or 2/3 of frame
# 3. Camera height: eye level for neutral, low angle for power, high for overview
# 4. DOF (Depth of Field): blurred background isolates the subject
# 5. Always use a Track To constraint instead of manually computing rotations
#
# SENSOR SIZE (affects field of view):
#   Default Blender sensor: 36mm (full-frame equivalent)
#   For matching real cameras: set sensor_width accordingly
# =============================================================================


# --- FOCAL LENGTH PRESETS ---
FOCAL_LENGTHS = {
    'WIDE':       24,   # Wide angle — interiors, landscapes, dramatic
    'NORMAL':     35,   # Standard — documentary, natural
    'PORTRAIT':   50,   # Human eye equivalent
    'TELEPHOTO':  85,   # Portrait, product, compressed perspective
    'LONG':       135,  # Product close-ups, extreme compression
}


def setup_camera(
    location=(7, -7, 5),
    target=(0, 0, 0),
    focal_length=50,
    name="Camera",
    clip_start=0.1,
    clip_end=1000,
    sensor_width=36
):
    """
    Create and configure a camera aimed at a target point.
    
    Uses a Track To constraint for automatic aiming (never manually
    compute rotation_euler for cameras — it's fragile and error-prone).
    
    Args:
        location: Camera position in world space
        target: Point the camera aims at (creates an Empty target)
        focal_length: Lens focal length in mm (see FOCAL_LENGTHS presets)
        name: Camera object name
        clip_start: Near clipping distance
        clip_end: Far clipping distance
        sensor_width: Sensor width in mm (36 = full-frame)
    
    Example:
        # Standard product shot
        cam = setup_camera(location=(5, -5, 3), target=(0, 0, 1), focal_length=85)
        
        # Dramatic wide interior
        cam = setup_camera(location=(3, -2, 1.6), target=(0, 3, 1), focal_length=24)
    """
    # Create camera
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = focal_length
    cam_data.clip_start = clip_start
    cam_data.clip_end = clip_end
    cam_data.sensor_width = sensor_width
    
    cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = location
    
    # Create target empty
    target_empty = bpy.data.objects.new(f"{name}_Target", None)
    bpy.context.collection.objects.link(target_empty)
    target_empty.location = target
    target_empty.empty_display_size = 0.2
    target_empty.empty_display_type = 'SPHERE'
    
    # Track To constraint — automatic aiming
    track = cam_obj.constraints.new(type='TRACK_TO')
    track.target = target_empty
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    # Set as active camera
    bpy.context.scene.camera = cam_obj
    
    return cam_obj, target_empty


def setup_depth_of_field(
    camera_obj,
    focus_target=None,
    focus_distance=5.0,
    f_stop=2.8,
    aperture_blades=6
):
    """
    Configure depth of field for cinematic bokeh effect.
    
    Args:
        camera_obj: Camera object to configure
        focus_target: Object to focus on (overrides focus_distance if set)
        focus_distance: Manual focus distance in meters
        f_stop: Aperture f-stop (lower = more blur)
                1.4 = extreme blur, 2.8 = moderate, 5.6 = slight, 16 = sharp
        aperture_blades: Number of blades for bokeh shape (0 = circle, 6 = hexagonal)
    
    Example:
        cam, target = setup_camera(location=(5, -5, 3), target=(0, 0, 1))
        setup_depth_of_field(cam, focus_distance=7.0, f_stop=2.0)
    """
    cam_data = camera_obj.data
    cam_data.dof.use_dof = True
    
    if focus_target:
        cam_data.dof.focus_object = focus_target
    else:
        cam_data.dof.focus_distance = focus_distance
    
    cam_data.dof.aperture_fstop = f_stop
    cam_data.dof.aperture_blades = aperture_blades
    
    return cam_data


def position_camera_for_object(
    obj,
    distance=8.0,
    angle_degrees=30.0,
    height_offset=2.0,
    focal_length=50,
    camera_name="Camera"
):
    """
    Automatically position a camera to frame a specific object.
    
    Places the camera at an orbit distance from the object, angled
    slightly above, with proper aiming via Track To constraint.
    
    Args:
        obj: Target object to frame
        distance: Distance from object center
        angle_degrees: Horizontal angle around the object (0 = front, 90 = side)
        height_offset: Camera height above object center
        focal_length: Lens focal length
        camera_name: Camera name
    
    Example:
        # Frame a table from 45° angle
        position_camera_for_object(bpy.data.objects["Table"], distance=6, angle_degrees=45)
    """
    angle_rad = math.radians(angle_degrees)
    obj_center = obj.location
    
    cam_x = obj_center.x + distance * math.sin(angle_rad)
    cam_y = obj_center.y - distance * math.cos(angle_rad)
    cam_z = obj_center.z + height_offset
    
    cam, target = setup_camera(
        location=(cam_x, cam_y, cam_z),
        target=tuple(obj_center),
        focal_length=focal_length,
        name=camera_name
    )
    
    return cam, target


def setup_turntable_camera(
    target=(0, 0, 0),
    radius=8.0,
    height=4.0,
    frames=120,
    focal_length=85,
    name="TurntableCamera"
):
    """
    Create a camera that orbits around a target for turntable animations.
    
    The camera follows a circular path around the target at a fixed
    height and distance. Ideal for product showcase renders.
    
    Args:
        target: Center point to orbit around
        radius: Orbit radius
        height: Camera height above target
        frames: Number of frames for full rotation
        focal_length: Lens focal length (85mm recommended for products)
    """
    tx, ty, tz = target
    
    # Create circular path
    bpy.ops.curve.primitive_bezier_circle_add(radius=radius, location=(tx, ty, tz + height))
    path = bpy.context.active_object
    path.name = f"{name}_Path"
    
    # Create camera
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = focal_length
    cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    
    # Follow path constraint
    follow = cam_obj.constraints.new(type='FOLLOW_PATH')
    follow.target = path
    follow.use_curve_follow = True
    
    # Track To target
    target_empty = bpy.data.objects.new(f"{name}_Target", None)
    bpy.context.collection.objects.link(target_empty)
    target_empty.location = target
    
    track = cam_obj.constraints.new(type='TRACK_TO')
    track.target = target_empty
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    # Animate the path
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = frames
    path.data.path_duration = frames
    
    # Set as active camera
    bpy.context.scene.camera = cam_obj
    
    return cam_obj, path, target_empty


# =============================================================================
# RENDER SETTINGS PRESETS
# =============================================================================

def setup_render_settings(
    resolution_x=1920,
    resolution_y=1080,
    engine='BLENDER_EEVEE',
    samples=64,
    transparent_background=False
):
    """
    Configure render settings for the scene.
    
    Args:
        resolution_x: Output width in pixels
        resolution_y: Output height in pixels
        engine: 'BLENDER_EEVEE' or 'CYCLES'
        samples: Number of render samples (higher = cleaner but slower)
        transparent_background: If True, renders with alpha transparent background
    
    Common resolutions:
        1080p:  1920 x 1080  (standard HD)
        1440p:  2560 x 1440  (QHD)
        4K:     3840 x 2160  (Ultra HD)
        Square: 1080 x 1080  (Instagram)
    """
    scene = bpy.context.scene
    scene.render.engine = engine
    scene.render.resolution_x = resolution_x
    scene.render.resolution_y = resolution_y
    scene.render.resolution_percentage = 100
    
    if engine == 'CYCLES':
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
    elif engine == 'BLENDER_EEVEE':
        scene.eevee.taa_render_samples = samples
    
    if transparent_background:
        scene.render.film_transparent = True
    
    return scene


# =============================================================================
# USAGE EXAMPLES
# =============================================================================

# --- Example: Product visualization setup ---
# cam, target = setup_camera(
#     location=(5, -5, 3),
#     target=(0, 0, 0.5),
#     focal_length=85
# )
# setup_depth_of_field(cam, focus_distance=7.0, f_stop=2.0)
# setup_render_settings(resolution_x=2560, resolution_y=1440, engine='BLENDER_EEVEE')

# --- Example: Architectural interior ---
# cam, target = setup_camera(
#     location=(3, -1, 1.7),   # Eye-level height
#     target=(0, 5, 1.5),      # Looking into room
#     focal_length=24           # Wide angle for interiors
# )

# --- Example: Dramatic low-angle hero shot ---
# cam, target = setup_camera(
#     location=(4, -3, 0.5),   # Low angle
#     target=(0, 0, 2),        # Looking up at subject
#     focal_length=35
# )
