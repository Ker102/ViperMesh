"""
{
  "title": "Automated Rigify Rigging Pipeline",
  "category": "rigging",
  "tags": ["rigify", "rig", "metarig", "auto-rig", "weight-paint", "skeleton", "armature", "animation-ready"],
  "description": "Automated character rigging using Blender's Rigify addon. Covers metarig creation from templates, alignment to mesh, rig generation, automatic weight painting, and Blender 4.x/5.0 compatibility.",
  "blender_version": "4.0+"
}
"""
import bpy
import math


def ensure_rigify_enabled() -> bool:
    """
    Ensure the Rigify addon is enabled. Rigify ships with Blender but
    must be explicitly enabled before use.

    Returns:
        True if Rigify is available

    Example:
        >>> ensure_rigify_enabled()
        True
    """
    import addon_utils
    loaded_default, loaded_state = addon_utils.check('rigify')
    if not loaded_state:
        bpy.ops.preferences.addon_enable(module='rigify')
    return True


def prepare_mesh_for_rigging(
    mesh: bpy.types.Object,
    subdivisions: int = 2,
    merge_threshold: float = 0.0001
) -> None:
    """
    Prepare a mesh for rigging by adding geometry and cleaning topology.
    MUST be called before rigging — raw primitives deform poorly.

    Steps:
    1. Subdivide to add edge loops at joints
    2. Merge overlapping vertices
    3. Fix normals
    4. Apply all transforms

    Args:
        mesh: The mesh object to prepare
        subdivisions: Number of subdivision cuts (2 minimum for joint geometry)
        merge_threshold: Distance threshold for merging duplicate vertices

    Example:
        >>> prepare_mesh_for_rigging(character_mesh)
    """
    import bpy
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.mode_set(mode='EDIT')

    # Add geometry for joint deformation
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.subdivide(number_cuts=subdivisions)

    # Clean topology
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=merge_threshold)
    bpy.ops.mesh.normals_make_consistent(inside=False)

    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


# --- Metarig Templates ---
METARIG_TEMPLATES = {
    'human':          'bpy.ops.object.armature_human_metarig_add',
    'basic_human':    'bpy.ops.object.armature_basic_human_metarig_add',
    'basic_quadruped':'bpy.ops.object.armature_basic_quadruped_metarig_add',
    'bird':           'bpy.ops.object.armature_bird_metarig_add',
    'cat':            'bpy.ops.object.armature_cat_metarig_add',
    'horse':          'bpy.ops.object.armature_horse_metarig_add',
    'shark':          'bpy.ops.object.armature_shark_metarig_add',
    'wolf':           'bpy.ops.object.armature_wolf_metarig_add',
}


def create_metarig(
    template: str = 'human',
    location: tuple = (0, 0, 0),
    name: str = 'metarig'
) -> bpy.types.Object:
    """
    Create a Rigify metarig from a built-in template.

    The metarig is a structural blueprint — it defines bone placement and
    rig types. After positioning, call generate_rig() to produce the final rig.

    Args:
        template: Template name. Options: 'human', 'basic_human', 'basic_quadruped',
                  'bird', 'cat', 'horse', 'shark', 'wolf'
        location: World-space position for the metarig
        name: Name for the metarig object

    Returns:
        The created metarig armature object

    Example:
        >>> metarig = create_metarig('human', location=(0, 0, 0))
        >>> metarig = create_metarig('basic_quadruped', name='dog_metarig')
    """
    ensure_rigify_enabled()

    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    template_lower = template.lower()
    if template_lower not in METARIG_TEMPLATES:
        raise ValueError(
            f"Unknown template '{template}'. "
            f"Available: {', '.join(METARIG_TEMPLATES.keys())}"
        )

    # Call the operator via eval (Rigify registers dynamic operators)
    op_path = METARIG_TEMPLATES[template_lower]
    eval(op_path + "()")

    metarig = bpy.context.active_object
    metarig.name = name
    metarig.location = location

    return metarig


def align_metarig_to_mesh(
    metarig: bpy.types.Object,
    target_mesh: bpy.types.Object,
    align_feet_to_ground: bool = True
) -> None:
    """
    Scale and position a metarig to match the bounding box of a target mesh.
    This is the critical step before generating the rig — bones must be
    inside the mesh for automatic weights to work.

    WARNING: This does a UNIFORM bounding-box scale, which is a rough
    approximation. For best results, bones should be individually aligned
    inside each limb of the mesh. See rigging-guide.md Section 2.4 for
    the correct per-bone alignment approach.

    Args:
        metarig: The metarig armature to align
        target_mesh: The mesh to align to
        align_feet_to_ground: Move metarig so feet bones sit at mesh's lowest point

    Example:
        >>> align_metarig_to_mesh(metarig, character_mesh)
    """
    # Get mesh bounding box in world space
    mesh_bbox = [target_mesh.matrix_world @ bpy.mathutils.Vector(corner)
                 for corner in target_mesh.bound_box]
    import mathutils
    mesh_bbox = [target_mesh.matrix_world @ mathutils.Vector(corner)
                 for corner in target_mesh.bound_box]

    mesh_min = mathutils.Vector((
        min(v.x for v in mesh_bbox),
        min(v.y for v in mesh_bbox),
        min(v.z for v in mesh_bbox)
    ))
    mesh_max = mathutils.Vector((
        max(v.x for v in mesh_bbox),
        max(v.y for v in mesh_bbox),
        max(v.z for v in mesh_bbox)
    ))

    mesh_height = mesh_max.z - mesh_min.z
    mesh_center_xy = ((mesh_min.x + mesh_max.x) / 2, (mesh_min.y + mesh_max.y) / 2)

    # Get metarig height
    meta_bbox = [metarig.matrix_world @ mathutils.Vector(corner)
                 for corner in metarig.bound_box]
    meta_height = max(v.z for v in meta_bbox) - min(v.z for v in meta_bbox)

    if meta_height > 0:
        scale_factor = mesh_height / meta_height
        metarig.scale = (scale_factor, scale_factor, scale_factor)

    # Center metarig on mesh XY
    metarig.location.x = mesh_center_xy[0]
    metarig.location.y = mesh_center_xy[1]

    if align_feet_to_ground:
        metarig.location.z = mesh_min.z

    # Apply scale so rig generation uses correct dimensions
    bpy.context.view_layer.objects.active = metarig
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def generate_rig(
    metarig: bpy.types.Object,
    rig_name: str = None
) -> bpy.types.Object:
    """
    Generate the final control rig from a positioned metarig.
    This calls Rigify's core generation which creates the full rig with:
    - DEF- bones (deformation — bind mesh to these)
    - MCH- bones (mechanism — intermediate helpers)
    - ORG- bones (original positions)
    - Control bones (what animators manipulate)

    Args:
        metarig: The aligned metarig armature
        rig_name: Optional name for the generated rig (default: 'rig')

    Returns:
        The generated rig armature object

    Example:
        >>> rig = generate_rig(metarig, rig_name='Character_Rig')
    """
    ensure_rigify_enabled()
    import rigify.generate

    bpy.context.view_layer.objects.active = metarig
    metarig.select_set(True)

    # Generate the rig
    rigify.generate.generate_rig(bpy.context, metarig)

    # The generated rig becomes the active object
    rig = bpy.context.active_object

    if rig_name:
        rig.name = rig_name

    return rig


def bind_mesh_to_rig(
    mesh: bpy.types.Object,
    rig: bpy.types.Object,
    method: str = 'AUTO',
    heat_diffusion: bool = True
) -> None:
    """
    Bind a mesh to a rig using automatic weight painting.

    Args:
        mesh: The mesh object to bind
        rig: The armature/rig object
        method: Binding method:
            - 'AUTO': Automatic weights (best for organic characters)
            - 'ENVELOPE': Envelope-based weights (rough, fast)
            - 'EMPTY': Create empty vertex groups (for manual weight painting)
            - 'NAME': Match vertex groups to bones by name (for pre-weighted meshes)
        heat_diffusion: Use heat diffusion for AUTO method (better quality, slower)

    Example:
        >>> bind_mesh_to_rig(character_mesh, rig, method='AUTO')
    """
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    # Select mesh first, then rig (order matters!)
    mesh.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig

    method_map = {
        'AUTO': 'ARMATURE_AUTO',
        'ENVELOPE': 'ARMATURE_ENVELOPE',
        'EMPTY': 'ARMATURE',
        'NAME': 'ARMATURE_NAME'
    }

    parent_type = method_map.get(method.upper(), 'ARMATURE_AUTO')
    bpy.ops.object.parent_set(type=parent_type)


def set_bone_rigify_type(
    metarig: bpy.types.Object,
    bone_name: str,
    rigify_type: str
) -> None:
    """
    Set the Rigify rig type for a specific bone in the metarig.

    Common rig types:
        - 'spines.basic_spine': Spine chain
        - 'spines.basic_tail': Tail chain
        - 'limbs.arm': Arm with IK/FK
        - 'limbs.leg': Leg with IK/FK
        - 'limbs.paw': Animal paw
        - 'faces.super_face': Full facial rig
        - 'basic.super_copy': Simple copy transforms

    Args:
        metarig: The metarig armature
        bone_name: Name of the bone to configure
        rigify_type: Rigify rig type identifier

    Example:
        >>> set_bone_rigify_type(metarig, 'spine.003', 'spines.basic_tail')
    """
    bpy.context.view_layer.objects.active = metarig
    bpy.ops.object.mode_set(mode='POSE')

    pose_bone = metarig.pose.bones.get(bone_name)
    if not pose_bone:
        raise ValueError(f"Bone '{bone_name}' not found in metarig")

    pose_bone.rigify_type = rigify_type

    bpy.ops.object.mode_set(mode='OBJECT')


def post_rigging_weight_cleanup(
    mesh: bpy.types.Object,
    limit: int = 4,
    smooth_iterations: int = 3,
    smooth_factor: float = 0.5,
    clean_threshold: float = 0.01
) -> None:
    """
    Post-rigging weight cleanup. MUST be called after binding mesh to rig.
    Raw auto-weights are never production-quality without cleanup.

    Steps:
    1. Limit total influences per vertex (standard: 4 for game engines)
    2. Smooth weights to reduce jagged deformations
    3. Normalize all weights (every vertex sums to 1.0)
    4. Clean tiny weights below threshold

    Args:
        mesh: The rigged mesh object
        limit: Max bone influences per vertex (4 = game standard)
        smooth_iterations: Number of smoothing passes
        smooth_factor: Smoothing strength (0.0-1.0)
        clean_threshold: Remove weights below this value

    Example:
        >>> post_rigging_weight_cleanup(character_mesh)
    """
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT')

    bpy.ops.object.vertex_group_limit_total(limit=limit)

    for _ in range(smooth_iterations):
        bpy.ops.object.vertex_group_smooth(
            group_select_mode='ALL',
            factor=smooth_factor,
            repeat=1
        )

    bpy.ops.object.vertex_group_normalize_all(
        group_select_mode='ALL',
        lock_active=False
    )

    bpy.ops.object.vertex_group_clean(
        group_select_mode='ALL',
        limit=clean_threshold
    )

    bpy.ops.object.mode_set(mode='OBJECT')


def rigify_pipeline(
    target_mesh: bpy.types.Object,
    template: str = 'human',
    rig_name: str = 'Character_Rig',
    auto_align: bool = True
) -> dict:
    """
    Full automated Rigify rigging pipeline.
    Creates metarig → aligns to mesh → generates rig → binds mesh.

    This is the recommended high-level function for automatic rigging.

    Args:
        target_mesh: The mesh to rig
        template: Metarig template (see create_metarig for options)
        rig_name: Name for the final rig
        auto_align: Automatically scale/position metarig to mesh

    Returns:
        Dict with 'metarig', 'rig', and 'mesh' object references

    Example:
        >>> result = rigify_pipeline(character_mesh, template='human')
        >>> rig = result['rig']
    """
    ensure_rigify_enabled()

    result = {}

    # Step 1: Create metarig
    metarig = create_metarig(
        template=template,
        location=target_mesh.location,
        name=f'{rig_name}_metarig'
    )
    result['metarig'] = metarig

    # Step 2: Align to target mesh
    if auto_align:
        align_metarig_to_mesh(metarig, target_mesh)

    # Step 3: Generate the rig
    rig = generate_rig(metarig, rig_name=rig_name)
    result['rig'] = rig

    # Step 4: Bind mesh to rig
    bind_mesh_to_rig(target_mesh, rig, method='AUTO')
    result['mesh'] = target_mesh

    # Step 5: Hide metarig (no longer needed for animation)
    metarig.hide_set(True)

    return result


def assign_bone_weight(
    mesh: bpy.types.Object,
    bone_name: str,
    vertex_indices: list,
    weight: float = 1.0,
    mode: str = 'REPLACE'
) -> None:
    """
    Manually assign vertex weights to a bone's vertex group.
    Useful for rigid parts (helmets, armor, accessories) that need
    100% weight to a single bone.

    Args:
        mesh: The mesh object
        bone_name: Name of the bone (vertex group)
        vertex_indices: List of vertex indices to assign
        weight: Weight value (0.0 to 1.0)
        mode: 'REPLACE', 'ADD', or 'SUBTRACT'

    Example:
        >>> # Assign helmet vertices fully to head bone
        >>> assign_bone_weight(character, 'DEF-spine.006', [100, 101, 102], weight=1.0)
    """
    vgroup = mesh.vertex_groups.get(bone_name)
    if not vgroup:
        vgroup = mesh.vertex_groups.new(name=bone_name)

    vgroup.add(vertex_indices, weight, mode)
