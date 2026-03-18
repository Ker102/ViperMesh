ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.render.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.render.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Render Operators [¶](https://docs.blender.org/api/current/bpy.ops.render.html\#module-bpy.ops.render "Link to this heading")

bpy.ops.render.color\_management\_white\_balance\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.color_management_white_balance_preset_add "Link to this definition")

Add or remove a white balance preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.cycles\_integrator\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.cycles_integrator_preset_add "Link to this definition")

Add an Integrator Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.cycles\_performance\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.cycles_performance_preset_add "Link to this definition")

Add an Performance Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.cycles\_sampling\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.cycles_sampling_preset_add "Link to this definition")

Add a Sampling Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.cycles\_viewport\_sampling\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.cycles_viewport_sampling_preset_add "Link to this definition")

Add a Viewport Sampling Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.eevee\_raytracing\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.eevee_raytracing_preset_add "Link to this definition")

Add or remove an EEVEE ray-tracing preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.opengl( _\*_, _animation=False_, _render\_keyed\_only=False_, _sequencer=False_, _write\_still=False_, _view\_context=True_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.opengl "Link to this definition")

Take a snapshot of the active viewport

Parameters:

- **animation** ( _boolean_ _,_ _(_ _optional_ _)_) – Animation, Render files from the animation range of this scene

- **render\_keyed\_only** ( _boolean_ _,_ _(_ _optional_ _)_) – Render Keyframes Only, Render only those frames where selected objects have a key in their animation data. Only used when rendering animation

- **sequencer** ( _boolean_ _,_ _(_ _optional_ _)_) – Sequencer, Render using the sequencer’s OpenGL display

- **write\_still** ( _boolean_ _,_ _(_ _optional_ _)_) – Write Image, Save the rendered image to the output path (used only when animation is disabled)

- **view\_context** ( _boolean_ _,_ _(_ _optional_ _)_) – View Context, Use the current 3D view for rendering, else use scene settings


bpy.ops.render.play\_rendered\_anim() [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.play_rendered_anim "Link to this definition")

Play back rendered frames/movies using an external player

File:

[startup/bl\_operators/screen\_play\_rendered\_anim.py:87](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/screen_play_rendered_anim.py#L87)

bpy.ops.render.preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.preset_add "Link to this definition")

Add or remove a Render Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.render.render( _\*_, _animation=False_, _write\_still=False_, _use\_viewport=False_, _use\_sequencer\_scene=False_, _layer=''_, _scene=''_, _frame\_start=0_, _frame\_end=0_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.render "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **animation** ( _boolean_ _,_ _(_ _optional_ _)_) – Animation, Render files from the animation range of this scene

- **write\_still** ( _boolean_ _,_ _(_ _optional_ _)_) – Write Image, Save the rendered image to the output path (used only when animation is disabled)

- **use\_viewport** ( _boolean_ _,_ _(_ _optional_ _)_) – Use 3D Viewport, When inside a 3D viewport, use layers and camera of the viewport

- **use\_sequencer\_scene** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Sequencer Scene, Render the sequencer scene instead of the active scene

- **layer** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Render Layer, Single render layer to re-render (used only when animation is disabled)

- **scene** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Scene, Scene to render, current scene if not specified

- **frame\_start** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Start Frame, Frame to start rendering animation at. If not specified, the scene start frame will be assumed. This should only be specified if doing an animation render

- **frame\_end** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – End Frame, Frame to end rendering animation at. If not specified, the scene end frame will be assumed. This should only be specified if doing an animation render


bpy.ops.render.shutter\_curve\_preset( _\*_, _shape='SMOOTH'_) [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.shutter_curve_preset "Link to this definition")

Set shutter curve

Parameters:

**shape** (enum in \[`'SHARP'`, `'SMOOTH'`, `'MAX'`, `'LINE'`, `'ROUND'`, `'ROOT'`\], (optional)) – Mode

bpy.ops.render.view\_cancel() [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.view_cancel "Link to this definition")

Cancel show render view

bpy.ops.render.view\_show() [¶](https://docs.blender.org/api/current/bpy.ops.render.html#bpy.ops.render.view_show "Link to this definition")

Toggle show render view