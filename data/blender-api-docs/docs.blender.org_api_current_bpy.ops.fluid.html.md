ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.fluid.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.fluid.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Fluid Operators [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html\#module-bpy.ops.fluid "Link to this heading")

bpy.ops.fluid.bake\_all() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.bake_all "Link to this definition")

Bake Entire Fluid Simulation

bpy.ops.fluid.bake\_data() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.bake_data "Link to this definition")

Bake Fluid Data

bpy.ops.fluid.bake\_guides() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.bake_guides "Link to this definition")

Bake Fluid Guiding

bpy.ops.fluid.bake\_mesh() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.bake_mesh "Link to this definition")

Bake Fluid Mesh

bpy.ops.fluid.bake\_noise() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.bake_noise "Link to this definition")

Bake Fluid Noise

bpy.ops.fluid.bake\_particles() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.bake_particles "Link to this definition")

Bake Fluid Particles

bpy.ops.fluid.free\_all() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.free_all "Link to this definition")

Free Entire Fluid Simulation

bpy.ops.fluid.free\_data() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.free_data "Link to this definition")

Free Fluid Data

bpy.ops.fluid.free\_guides() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.free_guides "Link to this definition")

Free Fluid Guiding

bpy.ops.fluid.free\_mesh() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.free_mesh "Link to this definition")

Free Fluid Mesh

bpy.ops.fluid.free\_noise() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.free_noise "Link to this definition")

Free Fluid Noise

bpy.ops.fluid.free\_particles() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.free_particles "Link to this definition")

Free Fluid Particles

bpy.ops.fluid.pause\_bake() [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.pause_bake "Link to this definition")

Pause Bake

bpy.ops.fluid.preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.fluid.html#bpy.ops.fluid.preset_add "Link to this definition")

Add or remove a Fluid Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)