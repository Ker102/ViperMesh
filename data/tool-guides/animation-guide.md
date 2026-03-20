# Animation Guide — Blender Agent Best Practices

> **Domain:** Keyframing, Animation, Timeline, NLA, Easing
> **Version:** Blender 4.x / 5.x compatible
> **Purpose:** Guide the agent through correct animation workflows via `execute_code`.

---

## Decision: Use execute_code for All Animation

Animation involves keyframe manipulation, F-curve editing, and timeline configuration —
all operations that require Python scripting. **Use `execute_code` for all animation tasks.**

---

## 1. Timeline Setup (Always First)

```python
import bpy

scene = bpy.context.scene

# Set frame range
scene.frame_start = 1
scene.frame_end = 120  # 5 seconds at 24fps, or adjust per task

# Set FPS
scene.render.fps = 24  # Standard film rate
# scene.render.fps = 30  # For real-time/game content

# Go to frame 1
scene.frame_set(1)
```

---

## 2. Keyframe Insertion

### 2.1 Object Keyframes
```python
import bpy

obj = bpy.data.objects['Cube']

# Set position and insert keyframe
obj.location = (0, 0, 0)
obj.keyframe_insert(data_path='location', frame=1)

obj.location = (0, 0, 5)
obj.keyframe_insert(data_path='location', frame=30)

# Rotation (Euler, in radians)
import math
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert(data_path='rotation_euler', frame=1)
obj.rotation_euler = (0, 0, math.radians(360))
obj.keyframe_insert(data_path='rotation_euler', frame=60)

# Scale
obj.scale = (1, 1, 1)
obj.keyframe_insert(data_path='scale', frame=1)
obj.scale = (2, 2, 2)
obj.keyframe_insert(data_path='scale', frame=30)
```

### 2.2 Pose Bone Keyframes (For Rigged Characters)
```python
import bpy
import math

rig = bpy.data.objects['Character_Rig']
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')

# Get a pose bone
bone = rig.pose.bones.get('upper_arm.fk.L')

if bone:
    # Frame 1: rest position
    bone.rotation_quaternion = (1, 0, 0, 0)
    bone.keyframe_insert(data_path='rotation_quaternion', frame=1)
    
    # Frame 15: raised arm
    bone.rotation_euler = (0, 0, math.radians(-90))
    bone.keyframe_insert(data_path='rotation_euler', frame=15)

bpy.ops.object.mode_set(mode='OBJECT')
```

---

## 3. Interpolation & Easing

By default, Blender uses Bézier interpolation. For specific effects:

```python
import bpy

obj = bpy.data.objects['Ball']

# Access F-curves after inserting keyframes
if obj.animation_data and obj.animation_data.action:
    for fcurve in obj.animation_data.action.fcurves:
        for keyframe in fcurve.keyframe_points:
            # Interpolation types: 'CONSTANT', 'LINEAR', 'BEZIER', 'SINE',
            # 'QUAD', 'CUBIC', 'QUART', 'QUINT', 'EXPO', 'CIRC',
            # 'BACK', 'BOUNCE', 'ELASTIC'
            keyframe.interpolation = 'BEZIER'
            
            # Easing types: 'AUTO', 'EASE_IN', 'EASE_OUT', 'EASE_IN_OUT'
            keyframe.easing = 'EASE_IN_OUT'
```

### Common Easing Patterns
| Animation Type | Interpolation | Easing | Effect |
|---------------|--------------|--------|--------|
| Bounce | `BOUNCE` | `EASE_OUT` | Ball bouncing on floor |
| Elastic snap | `ELASTIC` | `EASE_OUT` | Snappy overshoot |
| Smooth motion | `BEZIER` | `EASE_IN_OUT` | Natural acceleration/deceleration |
| Mechanical | `LINEAR` | N/A | Constant speed (robots, machines) |
| Anticipation | `BACK` | `EASE_IN` | Pull back before action |

---

## 4. Bouncing Ball Pattern (Common Test)

```python
import bpy

# Clear scene and create ball
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(0, 0, 5))
ball = bpy.context.active_object
ball.name = 'BouncingBall'

# Bounce parameters
start_height = 5.0
bounce_factor = 0.6  # Each bounce is 60% of previous height
num_bounces = 5
fps = 24
frames_per_bounce = 20

frame = 1
height = start_height

for i in range(num_bounces):
    # Top of arc
    ball.location.z = height
    ball.keyframe_insert(data_path='location', index=2, frame=frame)
    
    # Ground contact (squash)
    frame += frames_per_bounce // 2
    ball.location.z = 0.3  # radius = ground level
    ball.scale = (1.3, 1.3, 0.6)  # squash
    ball.keyframe_insert(data_path='location', index=2, frame=frame)
    ball.keyframe_insert(data_path='scale', frame=frame)
    
    # Next peak (stretch on way up)
    height *= bounce_factor
    frames_per_bounce = max(int(frames_per_bounce * 0.85), 8)
    frame += frames_per_bounce // 2
    ball.location.z = height
    ball.scale = (0.85, 0.85, 1.2)  # stretch
    ball.keyframe_insert(data_path='location', index=2, frame=frame)
    ball.keyframe_insert(data_path='scale', frame=frame)

# Set final resting frame
ball.scale = (1, 1, 1)
ball.keyframe_insert(data_path='scale', frame=frame + 5)

# Set frame range
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = frame + 10

# Apply bounce easing to Z location
if ball.animation_data and ball.animation_data.action:
    for fc in ball.animation_data.action.fcurves:
        if fc.data_path == 'location' and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'
```

---

## 5. Animation Export Checklist

Before exporting animated content:
1. **Set frame range** — `scene.frame_start` / `scene.frame_end`
2. **Apply transforms** on all animated objects
3. **Bake animation** if using constraints: `bpy.ops.nla.bake()`
4. **Export format:**
   - **FBX** — best for game engines (Unity/Unreal), includes armature actions
   - **glTF/GLB** — best for web (Three.js, Babylon.js), compact format
   - **USD** — best for film pipelines

```python
# FBX export with animation
bpy.ops.export_scene.fbx(
    filepath='/tmp/character_anim.fbx',
    use_selection=True,
    bake_anim=True,
    bake_anim_use_all_actions=False
)

# glTF export with animation
bpy.ops.export_scene.gltf(
    filepath='/tmp/character_anim.glb',
    export_format='GLB',
    export_animations=True
)
```

---

## 6. Common Pitfalls

### Keyframes Not Showing
**Cause:** Object transform not applied, or keyframing wrong data_path.
**Fix:** Always ensure the object is selected and active before `keyframe_insert`.

### Animation Looks Robotic
**Cause:** Linear interpolation or no easing.
**Fix:** Use `BEZIER` interpolation with `EASE_IN_OUT` for organic motion.

### Character Mesh Doesn't Follow Rig Animation
**Cause:** Mesh not parented to rig, or wrong rig selected.
**Fix:** Ensure mesh is a child of the armature with `ARMATURE_AUTO` weights.
