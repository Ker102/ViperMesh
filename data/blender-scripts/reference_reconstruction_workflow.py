"""
{
  "title": "Reference Reconstruction Workflow",
  "category": "scene",
  "tags": ["reference image", "reconstruction", "blockout", "refinement", "silhouette", "camera", "workflow", "prominence", "execute_code"],
  "description": "Generalized workflow helpers for rebuilding scenes from image references in staged passes. Encodes anchor-first blockout, camera-visible prop prioritization, and refinement batching without scene-specific recipes.",
  "blender_version": "5.0+"
}
"""
import bpy
from mathutils import Vector


def world_bbox_corners(obj: bpy.types.Object) -> list[Vector]:
    """Return the object's bounding-box corners in world space."""
    return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]


def world_bbox_center(obj: bpy.types.Object) -> Vector:
    """Return the center of the world-space bounding box."""
    corners = world_bbox_corners(obj)
    center = Vector((0.0, 0.0, 0.0))
    for corner in corners:
        center += corner
    return center / len(corners)


def world_bbox_diagonal(obj: bpy.types.Object) -> float:
    """Approximate visible size from the world-space bounding-box diagonal."""
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
    return (max_corner - min_corner).length


def camera_forward(camera_obj: bpy.types.Object) -> Vector:
    """Blender cameras look down local -Z in world space."""
    return (camera_obj.matrix_world.to_quaternion() @ Vector((0.0, 0.0, -1.0))).normalized()


def screen_importance(obj: bpy.types.Object, camera_obj: bpy.types.Object) -> dict:
    """
    Estimate how much refinement attention an object deserves.

    The score rewards objects that are:
    - close to the camera
    - large in world-space extent
    - roughly inside the camera's forward cone
    """
    center = world_bbox_center(obj)
    to_object = center - camera_obj.matrix_world.translation
    distance = max(to_object.length, 1e-6)
    facing = max(0.0, camera_forward(camera_obj).dot(to_object.normalized()))
    size_proxy = world_bbox_diagonal(obj) / distance
    score = size_proxy * (0.5 + 0.5 * facing)

    return {
        "name": obj.name,
        "distance": distance,
        "facing": facing,
        "size_proxy": size_proxy,
        "score": score,
    }


def rank_objects_for_refinement(
    objects: list[bpy.types.Object],
    camera_obj: bpy.types.Object,
) -> list[dict]:
    """
    Sort objects by refinement priority.

    Use this after a coarse blockout and screenshot review:
    stable scene anchors stay put, but high-score objects get their own
    focused refinement pass instead of forcing a full-scene rebuild.
    """
    scored = [screen_importance(obj, camera_obj) for obj in objects]
    return sorted(scored, key=lambda item: item["score"], reverse=True)


def split_refinement_batches(
    objects: list[bpy.types.Object],
    camera_obj: bpy.types.Object,
    max_batch_size: int = 3,
) -> list[list[str]]:
    """
    Create small refinement batches for execute_code follow-up passes.

    Expert reconstruction rarely improves the whole scene at once.
    It fixes the most visible failures in small groups.
    """
    ranked = rank_objects_for_refinement(objects, camera_obj)
    names = [entry["name"] for entry in ranked]

    return [
        names[index:index + max_batch_size]
        for index in range(0, len(names), max_batch_size)
    ]


def build_reference_reconstruction_plan(
    anchor_objects: list[bpy.types.Object],
    prop_objects: list[bpy.types.Object],
    camera_obj: bpy.types.Object | None = None,
    max_batch_size: int = 3,
) -> dict:
    """
    Build a staged reconstruction plan.

    Phase 1: block out anchors and composition.
    Phase 2: inspect viewport screenshot.
    Phase 3+: refine only the props with the highest camera-visible impact.
    """
    if camera_obj is None:
        camera_obj = bpy.context.scene.camera
    if camera_obj is None:
        raise ValueError("A camera is required to compute refinement priority.")

    ranked_props = rank_objects_for_refinement(prop_objects, camera_obj)
    batches = split_refinement_batches(prop_objects, camera_obj, max_batch_size=max_batch_size)

    return {
        "blockout_phase": [obj.name for obj in anchor_objects],
        "refinement_priority": ranked_props,
        "refinement_batches": batches,
        "notes": [
            "Block out anchors first and keep them stable once composition is approved.",
            "Run screenshot review before investing in secondary prop detail.",
            "Refine only the props whose silhouette still reads poorly from the active camera.",
        ],
    }

