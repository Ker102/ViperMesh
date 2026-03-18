---
title: "Camera Placement & Cinematography Guide"
category: "camera"
tags: ["camera", "focal length", "depth of field", "DOF", "framing", "composition", "product shot", "portrait", "add_camera", "set_camera_properties"]
triggered_by: ["add_camera", "set_camera_properties"]
description: "Domain knowledge for camera placement, focal length selection, depth of field configuration, and shot composition in Blender. Essential for producing correctly framed renders."
blender_version: "4.0+"
---

# Camera Placement & Cinematography Guide

## CRITICAL RULES

1. **DOF focus_distance ≠ camera distance.** Focus distance is WHERE the focus plane sits (the sharp zone). Camera distance is WHERE the camera is physically placed. With telephoto lenses, the camera should be 1.5–2× further than the focus distance.

2. **Always verify with get_viewport_screenshot** after placing a camera. If the subject fills more than 90% of the frame, the camera is too close. The subject should occupy 30–70% of the frame for a well-composed shot.

## FOCAL LENGTH → MINIMUM CAMERA DISTANCE

For a subject approximately 2 meters wide (e.g., default cube, small object):

| Focal Length | Lens Type | Min Distance | Recommended Distance | Use Case |
|---|---|---|---|---|
| 24mm | Wide angle | 2–3m | 3–5m | Interiors, landscapes, dramatic perspective |
| 35mm | Normal | 3–5m | 4–7m | Documentary, natural scenes |
| 50mm | Standard | 4–6m | 5–8m | Human eye equivalent, general purpose |
| 85mm | Telephoto | 6–9m | 8–12m | Portraits, product shots, compressed look |
| 135mm | Long telephoto | 10–15m | 12–20m | Product close-ups, extreme compression |

**Rule of thumb:** For an 85mm lens, place the camera at **minimum 8 meters** from the subject center. For a 50mm lens, 5–8 meters is correct.

## CAMERA POSITIONING PATTERNS

### Product Shot (45° angle, looking down)
```
Location: (6, -6, 5)  — about 10m from origin
Rotation: aim at (0, 0, 0) via Track To constraint
Lens: 85mm
DOF: focus_distance = distance to subject, f/2.8
```

### Eye-Level Portrait
```
Location: (0, -8, 1.7)  — 8m back, eye height
Rotation: aim at (0, 0, 1.5)
Lens: 85mm or 50mm
DOF: focus_distance = 8.0, f/2.0
```

### Dramatic Low Angle
```
Location: (4, -5, 0.5)  — low, ~6.4m away
Rotation: aim at (0, 0, 2) — looking up
Lens: 35mm
```

### Wide Interior
```
Location: (3, -2, 1.7)  — close, eye height
Rotation: aim at (0, 5, 1.5)
Lens: 24mm
```

### Overhead / Top-Down
```
Location: (0, 0, 10)  — directly above
Rotation: (0, 0, 0) — pointing straight down
Lens: 50mm
```

## DEPTH OF FIELD SETUP

| Parameter | Effect | Typical Values |
|---|---|---|
| `dof_use` | Enable/disable DoF | `true` for cinematic |
| `dof_focus_distance` | Distance to sharp focus plane (meters) | Match subject distance |
| `dof_aperture_fstop` | Aperture size — lower = more blur | 1.4 extreme, 2.8 moderate, 5.6 slight, 16 sharp |

**Aperture guidelines:**
- f/1.4 – f/2.0: Extreme bokeh, only subject sharp
- f/2.8 – f/4.0: Product photography, moderate background blur
- f/5.6 – f/8.0: Landscape, most things in focus
- f/11 – f/16: Everything sharp, architectural

## SENSOR SIZE (affects field of view)

- Default Blender sensor: 36mm (full-frame equivalent)
- Larger sensor = wider field of view at same focal length
- For matching real cameras, set `sensor_width` accordingly

## COMMON MISTAKES TO AVOID

1. ❌ Placing camera at the DOF focus distance — results in subject filling entire frame with telephoto lenses
2. ❌ Using manual rotation_euler for camera aiming — fragile, use Track To constraint or point_camera_at function instead
3. ❌ Forgetting to set camera as active (`set_active: true`) — render will use the wrong camera
4. ❌ Not verifying with viewport screenshot — always check framing visually
