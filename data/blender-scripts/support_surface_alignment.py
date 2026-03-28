"""
{
  "title": "Support Surface Alignment Patterns",
  "category": "transform",
  "tags": ["support surface", "bounding box", "alignment", "raycast", "matrix", "world space", "local space", "contact", "placement"],
  "description": "World-space placement helpers for stacking, face alignment, local-to-world attachment, and raycast-assisted drop placement. Encodes expert spatial math instead of guessed offsets.",
  "blender_version": "5.0+"
}
"""
import bpy
from mathutils import Vector


AXIS_INDEX = {"X": 0, "Y": 1, "Z": 2}


def world_bbox_corners(obj: bpy.types.Object) -> list[Vector]:
    """Return all bound-box corners in world space."""
    return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]


def world_bbox_min_max(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    """Return world-space min and max corners."""
    corners = world_bbox_corners(obj)
    min_corner = Vector((
        min(c.x for c in corners),
        min(c.y for c in corners),
        min(c.z for c in corners),
    ))
    max_corner = Vector((
        max(c.x for c in corners),
        max(c.y for c in corners),
        max(c.z for c in corners),
    ))
    return min_corner, max_corner


def world_bbox_center(obj: bpy.types.Object) -> Vector:
    """Return the world-space center of the bounding box."""
    min_corner, max_corner = world_bbox_min_max(obj)
    return (min_corner + max_corner) * 0.5


def translate_world(obj: bpy.types.Object, delta: Vector) -> bpy.types.Object:
    """Move an object in world space without guessing local-axis offsets."""
    matrix = obj.matrix_world.copy()
    matrix.translation += delta
    obj.matrix_world = matrix
    return obj


def place_on_top(
    obj: bpy.types.Object,
    support_obj: bpy.types.Object,
    margin: float = 0.002,
) -> bpy.types.Object:
    """
    Place obj so its bottom sits on support_obj's world-space top surface.
    """
    obj_min, _ = world_bbox_min_max(obj)
    _, support_max = world_bbox_min_max(support_obj)
    delta_z = (support_max.z + margin) - obj_min.z
    return translate_world(obj, Vector((0.0, 0.0, delta_z)))


def align_face_to_face(
    obj: bpy.types.Object,
    reference_obj: bpy.types.Object,
    axis: str = "X",
    positive: bool = True,
    margin: float = 0.002,
) -> bpy.types.Object:
    """
    Align one face of obj to the matching face of reference_obj in world space.

    positive=True places obj on the positive side of the reference.
    """
    axis_name = axis.upper()
    axis_index = AXIS_INDEX[axis_name]

    obj_min, obj_max = world_bbox_min_max(obj)
    ref_min, ref_max = world_bbox_min_max(reference_obj)

    delta = Vector((0.0, 0.0, 0.0))
    if positive:
        delta[axis_index] = (ref_max[axis_index] + margin) - obj_min[axis_index]
    else:
        delta[axis_index] = (ref_min[axis_index] - margin) - obj_max[axis_index]

    return translate_world(obj, delta)


def local_point_to_world(obj: bpy.types.Object, local_point: tuple[float, float, float]) -> Vector:
    """Convert a local-space attachment point to world space."""
    return obj.matrix_world @ Vector(local_point)


def align_local_points(
    obj: bpy.types.Object,
    obj_local_point: tuple[float, float, float],
    reference_obj: bpy.types.Object,
    reference_local_point: tuple[float, float, float],
) -> bpy.types.Object:
    """
    Align a local attachment point on obj to a local attachment point on reference_obj.

    This is the expert pattern for rotated assemblies: compute both points in
    world space first, then translate by the difference.
    """
    obj_world_point = local_point_to_world(obj, obj_local_point)
    reference_world_point = local_point_to_world(reference_obj, reference_local_point)
    return translate_world(obj, reference_world_point - obj_world_point)


def drop_to_surface(
    obj: bpy.types.Object,
    scene: bpy.types.Scene | None = None,
    margin: float = 0.002,
    max_distance: float = 100.0,
) -> dict | None:
    """
    Drop an object straight down onto evaluated geometry using a world-space ray cast.

    Useful for irregular or sloped support surfaces where AABB stacking is not enough.
    """
    scene = scene or bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()

    center = world_bbox_center(obj)
    obj_min, _ = world_bbox_min_max(obj)
    origin = Vector((center.x, center.y, center.z + max_distance))
    direction = Vector((0.0, 0.0, -1.0))

    hit, location, normal, face_index, hit_obj, _ = scene.ray_cast(
        depsgraph,
        origin,
        direction,
        distance=max_distance * 2.0,
    )
    if not hit:
        return None

    delta_z = (location.z + margin) - obj_min.z
    translate_world(obj, Vector((0.0, 0.0, delta_z)))

    return {
        "hit_object": hit_obj.name if hit_obj else None,
        "location": tuple(location),
        "normal": tuple(normal),
        "face_index": face_index,
    }

