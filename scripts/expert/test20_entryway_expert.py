"""
Test 20 expert reference reconstruction for comparison only.

This file is intentionally kept OUTSIDE the RAG corpus. It is a scene-specific
expert artifact used to compare the agent's output against a stronger manual
implementation without polluting general retrieval guidance.
"""
import bpy
import bmesh
import math
import random
from mathutils import Matrix
from mathutils import Vector


random.seed(20)


def mark(label):
    print(f"[expert-test20] {label}", flush=True)


def ensure_object_mode():
    obj = bpy.context.active_object
    if obj and obj.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def clear_scene():
    ensure_object_mode()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablock in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(datablock):
            if block.users == 0:
                datablock.remove(block)


def set_active(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def deselect_all():
    bpy.ops.object.select_all(action="DESELECT")


def apply_modifier(obj, modifier_name):
    ensure_object_mode()
    deselect_all()
    set_active(obj)
    bpy.ops.object.modifier_apply(modifier=modifier_name)
    deselect_all()


def join_objects(objects, name):
    ensure_object_mode()
    deselect_all()
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    merged = bpy.context.active_object
    merged.name = name
    deselect_all()
    return merged


def shade_smooth(obj):
    set_active(obj)
    bpy.ops.object.shade_smooth()
    deselect_all()


def add_bevel(obj, width=0.008, segments=2):
    modifier = obj.modifiers.new(name="Bevel", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    modifier.angle_limit = math.radians(25.0)
    return modifier


def add_subsurf(obj, levels=1):
    modifier = obj.modifiers.new(name="Subdivision", type="SUBSURF")
    modifier.levels = levels
    modifier.render_levels = levels
    return modifier


def add_solidify(obj, thickness=0.001):
    modifier = obj.modifiers.new(name="Solidify", type="SOLIDIFY")
    modifier.thickness = thickness
    modifier.offset = 0.0
    return modifier


def make_principled_material(
    name,
    base_color,
    roughness=0.5,
    metallic=0.0,
    specular_ior_level=0.5,
):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = specular_ior_level
    return material


def make_glass_material(name):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    material.blend_method = "BLEND"
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.95, 0.97, 1.0, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.03
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = 1.0
    return material


def assign_material(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)


def make_world():
    scene = bpy.context.scene
    world = bpy.data.worlds.new("EntrywayWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.98, 0.965, 0.94, 1.0)
    bg.inputs["Strength"].default_value = 0.24


def build_leaf_template(material):
    mesh = bpy.data.meshes.new("OliveLeafMesh")
    bm = bmesh.new()
    verts = [
        bm.verts.new((0.0, -0.055, 0.0)),
        bm.verts.new((-0.014, -0.016, 0.0)),
        bm.verts.new((-0.010, 0.016, 0.001)),
        bm.verts.new((0.0, 0.062, 0.0)),
        bm.verts.new((0.010, 0.016, -0.001)),
        bm.verts.new((0.014, -0.016, 0.0)),
    ]
    bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("Leaf_Template", mesh)
    bpy.context.collection.objects.link(obj)
    assign_material(obj, material)
    add_solidify(obj, thickness=0.0008)
    shade_smooth(obj)
    obj.hide_render = True
    obj.hide_viewport = True
    return obj


def add_leaf_instance(template, location, direction, side, scale, roll):
    leaf = template.copy()
    leaf.data = template.data
    leaf.hide_render = False
    leaf.hide_viewport = False
    bpy.context.collection.objects.link(leaf)

    side_axis = direction.cross(Vector((0.0, 0.0, 1.0)))
    if side_axis.length < 0.0001:
        side_axis = Vector((1.0, 0.0, 0.0))
    side_axis.normalize()
    offset = side_axis * (0.017 * side)
    tilt_axis = direction.cross(side_axis)
    if tilt_axis.length < 0.0001:
        tilt_axis = Vector((0.0, 1.0, 0.0))
    tilt_axis.normalize()

    quat = direction.normalized().to_track_quat("Y", "Z")
    matrix = (
        Matrix.Translation(location + offset)
        @ quat.to_matrix().to_4x4()
        @ Matrix.Rotation(math.radians(58.0 * side), 4, "X")
        @ Matrix.Rotation(roll, 4, "Y")
        @ Matrix.Rotation(math.radians(14.0), 4, tilt_axis)
        @ Matrix.Diagonal((scale, scale, scale, 1.0))
    )
    leaf.matrix_world = matrix
    return leaf


def build_branch_curve(name, points, material):
    curve = bpy.data.curves.new(name=name, type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 16
    curve.bevel_depth = 0.0035
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    point_count = len(points)
    for index, point in enumerate(points):
        bp = spline.bezier_points[index]
        bp.co = point
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
        bp.radius = 1.0 - (index / max(point_count - 1, 1)) * 0.62

    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    assign_material(obj, material)
    return obj


def sample_polyline(points, fraction):
    segment_lengths = []
    total = 0.0
    for idx in range(len(points) - 1):
        length = (points[idx + 1] - points[idx]).length
        segment_lengths.append(length)
        total += length

    target = total * fraction
    walked = 0.0
    for idx, length in enumerate(segment_lengths):
        if walked + length >= target:
            local = (target - walked) / max(length, 1e-6)
            start = points[idx]
            end = points[idx + 1]
            pos = start.lerp(end, local)
            direction = (end - start).normalized()
            return pos, direction
        walked += length
    return points[-1], (points[-1] - points[-2]).normalized()


def create_olive_arrangement(base_location, branch_material, leaf_material):
    leaf_template = build_leaf_template(leaf_material)
    branch_specs = [
        [
            Vector((0.0, 0.0, 0.02)),
            Vector((0.03, 0.02, 0.14)),
            Vector((0.08, 0.05, 0.28)),
            Vector((0.13, 0.06, 0.40)),
        ],
        [
            Vector((0.0, 0.0, 0.03)),
            Vector((-0.03, 0.01, 0.16)),
            Vector((-0.08, -0.02, 0.30)),
            Vector((-0.10, -0.03, 0.44)),
        ],
        [
            Vector((0.0, 0.0, 0.02)),
            Vector((0.00, -0.02, 0.16)),
            Vector((0.02, -0.03, 0.30)),
            Vector((0.04, -0.02, 0.48)),
        ],
        [
            Vector((0.0, 0.0, 0.025)),
            Vector((-0.01, 0.03, 0.13)),
            Vector((-0.02, 0.08, 0.25)),
            Vector((-0.01, 0.13, 0.38)),
        ],
        [
            Vector((0.0, 0.0, 0.02)),
            Vector((0.04, -0.01, 0.13)),
            Vector((0.11, -0.04, 0.25)),
            Vector((0.16, -0.05, 0.34)),
        ],
        [
            Vector((0.0, 0.0, 0.018)),
            Vector((0.02, 0.00, 0.12)),
            Vector((0.08, 0.01, 0.24)),
            Vector((0.14, 0.01, 0.33)),
        ],
    ]

    for branch_index, points in enumerate(branch_specs):
        world_points = [base_location + point for point in points]
        build_branch_curve(f"OliveBranch_{branch_index}", world_points, branch_material)
        steps = 8 + branch_index
        for step in range(steps):
            fraction = 0.18 + step * (0.70 / max(steps - 1, 1))
            pos, direction = sample_polyline(world_points, fraction)
            side = -1.0 if step % 2 == 0 else 1.0
            roll = random.uniform(-0.35, 0.35)
            scale = random.uniform(0.90, 1.22)
            add_leaf_instance(leaf_template, pos, direction, side, scale, roll)
            if step >= 2:
                alt_side = -side
                alt_fraction = min(0.96, fraction + 0.035)
                alt_pos, alt_dir = sample_polyline(world_points, alt_fraction)
                add_leaf_instance(
                    leaf_template,
                    alt_pos + Vector((0.0, 0.0, 0.006)),
                    alt_dir,
                    alt_side,
                    random.uniform(0.82, 1.08),
                    random.uniform(-0.28, 0.28),
                )


def create_rounded_part(name, location, scale):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    add_bevel(obj, width=min(scale.x, scale.y, scale.z) * 0.18, segments=3)
    add_subsurf(obj, levels=1)
    shade_smooth(obj)
    return obj


def create_profile_prism(name, profile_points, width, location):
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    bm = bmesh.new()
    half_width = width * 0.5
    left = []
    right = []

    for y, z in profile_points:
        left.append(bm.verts.new((-half_width, y, z)))
        right.append(bm.verts.new((half_width, y, z)))

    bm.verts.ensure_lookup_table()

    for index in range(len(profile_points)):
        next_index = (index + 1) % len(profile_points)
        bm.faces.new((left[index], left[next_index], right[next_index], right[index]))

    bm.faces.new(left)
    bm.faces.new(list(reversed(right)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = Vector(location)
    add_bevel(obj, width=0.004, segments=3)
    add_subsurf(obj, levels=1)
    shade_smooth(obj)
    return obj


def create_boot(name, location, yaw_degrees, material, cuff_material):
    local = Vector(location)
    meta_data = bpy.data.metaballs.new(f"{name}Meta")
    meta_data.resolution = 0.045
    meta_data.render_resolution = 0.03
    meta_data.threshold = 0.18
    meta_obj = bpy.data.objects.new(f"{name}_Meta", meta_data)
    bpy.context.collection.objects.link(meta_obj)
    meta_obj.location = local

    def add_blob(co, size_x, size_y, size_z, radius=1.0):
        elem = meta_data.elements.new(type="ELLIPSOID")
        elem.co = co
        elem.radius = radius
        elem.size_x = size_x
        elem.size_y = size_y
        elem.size_z = size_z
        elem.use_scale_stiffness = True
        elem.stiffness = 2.0
        return elem

    add_blob((0.0, -0.020, 0.020), 0.060, 0.180, 0.020)
    add_blob((0.0, -0.110, 0.034), 0.055, 0.100, 0.024)
    add_blob((0.0, -0.138, 0.058), 0.050, 0.070, 0.034)
    add_blob((0.0, -0.070, 0.060), 0.054, 0.110, 0.038)
    add_blob((0.0, -0.010, 0.102), 0.050, 0.072, 0.046)
    add_blob((0.0, 0.034, 0.145), 0.048, 0.064, 0.065)
    add_blob((0.0, 0.062, 0.206), 0.044, 0.054, 0.070)
    add_blob((0.0, 0.112, 0.036), 0.032, 0.034, 0.042)

    deselect_all()
    set_active(meta_obj)
    bpy.ops.object.convert(target="MESH")
    boot_body = bpy.context.active_object
    boot_body.name = name
    add_bevel(boot_body, width=0.0025, segments=2)
    add_subsurf(boot_body, levels=1)
    assign_material(boot_body, material)
    shade_smooth(boot_body)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.036,
        depth=0.055,
        location=local + Vector((0.0, 0.070, 0.220)),
    )
    cuff_outer = bpy.context.active_object
    cuff_outer.name = f"{name}_CuffOuter"
    cuff_outer.scale.x = 0.86
    cuff_outer.scale.y = 1.04
    add_bevel(cuff_outer, width=0.0025, segments=2)
    assign_material(cuff_outer, cuff_material)
    shade_smooth(cuff_outer)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.028,
        depth=0.046,
        location=local + Vector((0.0, 0.070, 0.218)),
    )
    cuff_inner = bpy.context.active_object
    cuff_inner.name = f"{name}_CuffInner"
    cuff_inner.scale.x = 0.82
    cuff_inner.scale.y = 1.00
    add_bevel(cuff_inner, width=0.002, segments=2)
    assign_material(cuff_inner, cuff_material)
    shade_smooth(cuff_inner)

    pull_tab = create_rounded_part(
        f"{name}_PullTab",
        local + Vector((0.0, 0.115, 0.248)),
        Vector((0.008, 0.004, 0.024)),
    )
    assign_material(pull_tab, cuff_material)

    gusset_left = create_rounded_part(
        f"{name}_GussetLeft",
        local + Vector((-0.041, 0.026, 0.145)),
        Vector((0.003, 0.030, 0.042)),
    )
    assign_material(gusset_left, cuff_material)

    gusset_right = create_rounded_part(
        f"{name}_GussetRight",
        local + Vector((0.041, 0.026, 0.145)),
        Vector((0.003, 0.030, 0.042)),
    )
    assign_material(gusset_right, cuff_material)

    boot_parts = [boot_body, cuff_outer, cuff_inner, pull_tab, gusset_left, gusset_right]
    for obj in boot_parts:
        obj.rotation_euler.z = math.radians(yaw_degrees)

    return boot_parts


clear_scene()
mark("scene cleared")
make_world()
mark("world created")

scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.render.engine = "CYCLES"
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.render.resolution_x = 1080
scene.render.resolution_y = 1080
scene.render.film_transparent = False
scene.view_settings.exposure = -1.05

mat_wall = make_principled_material("Wall", (0.93, 0.90, 0.86, 1.0), roughness=0.96)
mat_floor = make_principled_material("Floor", (0.86, 0.74, 0.58, 1.0), roughness=0.55)
mat_baseboard = make_principled_material("Baseboard", (0.98, 0.98, 0.97, 1.0), roughness=0.42)
mat_wood = make_principled_material("LightWood", (0.73, 0.56, 0.35, 1.0), roughness=0.58)
mat_rug = make_principled_material("Rug", (0.67, 0.54, 0.37, 1.0), roughness=0.96)
mat_lamp_body = make_principled_material("LampCeramic", (0.92, 0.88, 0.83, 1.0), roughness=0.38)
mat_lamp_shade = make_principled_material("LampShade", (0.90, 0.84, 0.77, 1.0), roughness=0.94)
mat_book_a = make_principled_material("BookA", (0.73, 0.77, 0.75, 1.0), roughness=0.74)
mat_book_b = make_principled_material("BookB", (0.62, 0.69, 0.63, 1.0), roughness=0.74)
mat_vase = make_principled_material("Vase", (0.63, 0.58, 0.54, 1.0), roughness=0.36)
mat_basket = make_principled_material("Basket", (0.69, 0.54, 0.35, 1.0), roughness=0.92)
mat_boot = make_principled_material("Boot", (0.11, 0.095, 0.080, 1.0), roughness=0.68)
mat_boot_cuff = make_principled_material("BootCuff", (0.07, 0.060, 0.055, 1.0), roughness=0.84)
mat_branch = make_principled_material("OliveBranch", (0.43, 0.34, 0.23, 1.0), roughness=0.82)
mat_leaf = make_principled_material("OliveLeaf", (0.43, 0.49, 0.34, 1.0), roughness=0.72)
mat_mirror_frame = make_principled_material("MirrorFrame", (0.76, 0.61, 0.40, 1.0), roughness=0.42)
mat_mirror = make_principled_material("Mirror", (0.92, 0.92, 0.92, 1.0), roughness=0.02, metallic=1.0)
mat_glass = make_glass_material("WindowGlass")
mark("materials created")

# Floor
bpy.ops.mesh.primitive_plane_add(size=8, location=(0.0, 0.0, 0.0))
floor = bpy.context.active_object
floor.name = "Floor"
assign_material(floor, mat_floor)
mark("floor created")

# Walls
bpy.ops.mesh.primitive_cube_add(location=(0.0, 2.02, 1.55))
wall_back = bpy.context.active_object
wall_back.name = "BackWall"
wall_back.scale = (3.7, 0.08, 1.55)
assign_material(wall_back, mat_wall)

bpy.ops.mesh.primitive_cube_add(location=(-2.92, 0.1, 1.55))
wall_left = bpy.context.active_object
wall_left.name = "LeftWall"
wall_left.scale = (0.08, 2.6, 1.55)
assign_material(wall_left, mat_wall)

bpy.ops.mesh.primitive_cube_add(location=(-2.92, -0.75, 1.45))
window_cutter = bpy.context.active_object
window_cutter.scale = (0.20, 0.86, 1.18)

window_bool = wall_left.modifiers.new(name="WindowCut", type="BOOLEAN")
window_bool.operation = "DIFFERENCE"
window_bool.object = window_cutter
window_bool.solver = "EXACT"
apply_modifier(wall_left, window_bool.name)
bpy.data.objects.remove(window_cutter, do_unlink=True)

bpy.ops.mesh.primitive_cube_add(location=(-2.86, -0.75, 1.45))
window_glass = bpy.context.active_object
window_glass.name = "WindowGlass"
window_glass.scale = (0.01, 0.84, 1.16)
assign_material(window_glass, mat_glass)
mark("walls and window created")

# Baseboards
bpy.ops.mesh.primitive_cube_add(location=(0.0, 1.92, 0.06))
base_back = bpy.context.active_object
base_back.scale = (3.7, 0.03, 0.06)
assign_material(base_back, mat_baseboard)

bpy.ops.mesh.primitive_cube_add(location=(-2.84, 0.06, 0.06))
base_left = bpy.context.active_object
base_left.scale = (0.03, 2.55, 0.06)
assign_material(base_left, mat_baseboard)

# Rug
bpy.ops.mesh.primitive_plane_add(size=1, location=(0.05, 0.28, 0.004))
rug = bpy.context.active_object
rug.name = "RunnerRug"
rug.scale = (1.65, 0.46, 1.0)
solidify = add_solidify(rug, thickness=0.006)
apply_modifier(rug, solidify.name)
assign_material(rug, mat_rug)
mark("baseboards and rug created")

# Console table
table_width = 1.70
table_depth = 0.30
table_height = 0.82
top_thickness = 0.03
leg_width = 0.03

bpy.ops.mesh.primitive_cube_add(location=(0.0, 1.82, table_height - top_thickness * 0.5))
table_top = bpy.context.active_object
table_top.name = "ConsoleTop"
table_top.scale = (table_width * 0.5, table_depth * 0.5, top_thickness * 0.5)
add_bevel(table_top, width=0.008, segments=2)
assign_material(table_top, mat_wood)
shade_smooth(table_top)

leg_positions = [
    (-0.81, 1.94, 0.39),
    (0.81, 1.94, 0.39),
    (-0.81, 1.70, 0.39),
    (0.81, 1.70, 0.39),
]
for index, position in enumerate(leg_positions):
    bpy.ops.mesh.primitive_cube_add(location=position)
    leg = bpy.context.active_object
    leg.name = f"ConsoleLeg_{index}"
    leg.scale = (leg_width * 0.5, leg_width * 0.5, 0.39)
    add_bevel(leg, width=0.004, segments=2)
    assign_material(leg, mat_wood)
    shade_smooth(leg)
mark("table created")

# Mirror
mirror_center = Vector((0.10, 1.95, 1.55))
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.44,
    minor_radius=0.015,
    location=mirror_center,
    rotation=(math.radians(90.0), 0.0, 0.0),
    major_segments=80,
    minor_segments=28,
)
mirror_frame = bpy.context.active_object
mirror_frame.name = "MirrorFrame"
assign_material(mirror_frame, mat_mirror_frame)
shade_smooth(mirror_frame)

bpy.ops.mesh.primitive_circle_add(
    vertices=80,
    radius=0.423,
    fill_type="NGON",
    location=mirror_center + Vector((0.0, -0.009, 0.0)),
    rotation=(math.radians(90.0), 0.0, 0.0),
)
mirror_glass = bpy.context.active_object
mirror_glass.name = "MirrorGlass"
solidify = add_solidify(mirror_glass, thickness=0.008)
apply_modifier(mirror_glass, solidify.name)
assign_material(mirror_glass, mat_mirror)
shade_smooth(mirror_glass)
mark("mirror created")

# Lamp
bpy.ops.mesh.primitive_uv_sphere_add(location=(-0.66, 1.79, 0.88), radius=0.11, segments=48, ring_count=24)
lamp_body = bpy.context.active_object
lamp_body.scale = (0.75, 0.75, 1.05)
assign_material(lamp_body, mat_lamp_body)
shade_smooth(lamp_body)

bpy.ops.mesh.primitive_cylinder_add(location=(-0.66, 1.79, 1.00), radius=0.018, depth=0.06)
lamp_neck = bpy.context.active_object
assign_material(lamp_neck, mat_lamp_body)

bpy.ops.mesh.primitive_cone_add(
    vertices=48,
    radius1=0.14,
    radius2=0.10,
    depth=0.18,
    location=(-0.66, 1.79, 1.14),
)
lamp_shade = bpy.context.active_object
lamp_shade.name = "LampShade"
assign_material(lamp_shade, mat_lamp_shade)
shade_smooth(lamp_shade)
mark("lamp created")

# Books
book_specs = [
    ("Book01", (0.56, 1.80, 0.838), (0.24, 0.15, 0.018), mat_book_a, 0.02),
    ("Book02", (0.54, 1.80, 0.870), (0.22, 0.14, 0.016), mat_book_b, -0.03),
]
for name, location, scale, material, rot_z in book_specs:
    bpy.ops.mesh.primitive_cube_add(location=location)
    book = bpy.context.active_object
    book.name = name
    book.scale = scale
    book.rotation_euler.z = rot_z
    add_bevel(book, width=0.003, segments=2)
    assign_material(book, material)
    shade_smooth(book)
mark("books created")

# Vase
bpy.ops.mesh.primitive_uv_sphere_add(location=(0.54, 1.80, 0.975), radius=0.10, segments=56, ring_count=28)
vase = bpy.context.active_object
vase.scale = (0.82, 0.82, 1.08)
assign_material(vase, mat_vase)
shade_smooth(vase)

bpy.ops.mesh.primitive_cylinder_add(location=(0.54, 1.80, 1.07), radius=0.040, depth=0.08)
vase_neck = bpy.context.active_object
assign_material(vase_neck, mat_vase)
shade_smooth(vase_neck)

bpy.ops.mesh.primitive_torus_add(
    major_radius=0.038,
    minor_radius=0.008,
    location=(0.61, 1.80, 0.99),
    rotation=(math.radians(90.0), 0.0, 0.0),
    major_segments=32,
    minor_segments=18,
)
vase_handle = bpy.context.active_object
assign_material(vase_handle, mat_vase)
shade_smooth(vase_handle)

create_olive_arrangement(Vector((0.54, 1.80, 1.08)), mat_branch, mat_leaf)
mark("vase and olive arrangement created")

# Basket
bpy.ops.mesh.primitive_cone_add(
    vertices=40,
    radius1=0.23,
    radius2=0.17,
    depth=0.40,
    location=(0.40, 1.57, 0.22),
)
basket = bpy.context.active_object
basket.name = "Basket"
assign_material(basket, mat_basket)
add_bevel(basket, width=0.006, segments=2)
shade_smooth(basket)

bpy.ops.mesh.primitive_torus_add(
    major_radius=0.060,
    minor_radius=0.010,
    location=(0.24, 1.56, 0.34),
    rotation=(0.0, math.radians(90.0), 0.0),
    major_segments=28,
    minor_segments=16,
)
basket_handle_left = bpy.context.active_object
assign_material(basket_handle_left, mat_basket)
shade_smooth(basket_handle_left)

bpy.ops.mesh.primitive_torus_add(
    major_radius=0.060,
    minor_radius=0.010,
    location=(0.56, 1.56, 0.34),
    rotation=(0.0, math.radians(90.0), 0.0),
    major_segments=28,
    minor_segments=16,
)
basket_handle_right = bpy.context.active_object
assign_material(basket_handle_right, mat_basket)
shade_smooth(basket_handle_right)
mark("basket created")

# Boots
create_boot("BootLeft", (-0.255, 1.555, 0.00), yaw_degrees=-42.0, material=mat_boot, cuff_material=mat_boot_cuff)
create_boot("BootRight", (-0.125, 1.585, 0.00), yaw_degrees=-24.0, material=mat_boot, cuff_material=mat_boot_cuff)
mark("boots created")

# Lighting
bpy.ops.object.light_add(type="AREA", location=(-2.45, -0.35, 2.25))
window_light = bpy.context.active_object
window_light.name = "WindowLight"
window_light.rotation_euler = (0.0, math.radians(90.0), 0.0)
window_light.data.energy = 2600
window_light.data.shape = "RECTANGLE"
window_light.data.size = 3.2
window_light.data.size_y = 2.4
window_light.data.color = (1.0, 0.95, 0.88)

bpy.ops.object.light_add(type="AREA", location=(1.45, -2.25, 1.85))
fill_light = bpy.context.active_object
fill_light.name = "FillLight"
fill_light.rotation_euler = (math.radians(66.0), 0.0, math.radians(35.0))
fill_light.data.energy = 420
fill_light.data.shape = "RECTANGLE"
fill_light.data.size = 2.3
fill_light.data.size_y = 2.1
fill_light.data.color = (0.98, 0.98, 1.0)

bpy.ops.object.light_add(type="POINT", location=(-0.67, 1.79, 1.12))
lamp_light = bpy.context.active_object
lamp_light.name = "LampLight"
lamp_light.data.energy = 90
lamp_light.data.color = (1.0, 0.82, 0.68)
lamp_light.data.shadow_soft_size = 0.14
mark("lights created")

# Camera
bpy.ops.object.camera_add(location=(0.22, -2.45, 1.28))
camera = bpy.context.active_object
camera.name = "EntrywayCamera"
camera.rotation_euler = (math.radians(82.0), 0.0, math.radians(4.0))
camera.data.lens = 39
camera.data.sensor_width = 36
scene.camera = camera

print("Built expert Test 20 entryway scene with silhouette-focused boots and olive branches.")
