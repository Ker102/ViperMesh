ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.particle.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.particle.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Particle Operators [¶](https://docs.blender.org/api/current/bpy.ops.particle.html\#module-bpy.ops.particle "Link to this heading")

bpy.ops.particle.brush\_edit( _\*_, _stroke=None_, _pen\_flip=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.brush_edit "Link to this definition")

Apply a stroke of brush to the particles

Parameters:

- **stroke** (`bpy_prop_collection` of `OperatorStrokeElement`, (optional)) – Stroke

- **pen\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Pen Flip, Whether a tablet’s eraser mode is being used


bpy.ops.particle.connect\_hair( _\*_, _all=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.connect_hair "Link to this definition")

Connect hair to the emitter mesh

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All Hair, Connect all hair systems to the emitter mesh

bpy.ops.particle.copy\_particle\_systems( _\*_, _space='OBJECT'_, _remove\_target\_particles=True_, _use\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.copy_particle_systems "Link to this definition")

Copy particle systems from the active object to selected objects

Parameters:

- **space** (enum in \[`'OBJECT'`, `'WORLD'`\], (optional)) –

Space, Space transform for copying from one object to another


  - `OBJECT`
    Object – Copy inside each object’s local space.

  - `WORLD`
    World – Copy in world space.


- **remove\_target\_particles** ( _boolean_ _,_ _(_ _optional_ _)_) – Remove Target Particles, Remove particle systems on the target objects

- **use\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Active, Use the active particle system from the context


bpy.ops.particle.delete( _\*_, _type='PARTICLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.delete "Link to this definition")

Delete selected particles or keys

Parameters:

**type** (enum in \[`'PARTICLE'`, `'KEY'`\], (optional)) – Type, Delete a full particle or only keys

bpy.ops.particle.disconnect\_hair( _\*_, _all=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.disconnect_hair "Link to this definition")

Disconnect hair from the emitter mesh

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All Hair, Disconnect all hair systems from the emitter mesh

bpy.ops.particle.duplicate\_particle\_system( _\*_, _use\_duplicate\_settings=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.duplicate_particle_system "Link to this definition")

Duplicate particle system within the active object

Parameters:

**use\_duplicate\_settings** ( _boolean_ _,_ _(_ _optional_ _)_) – Duplicate Settings, Duplicate settings as well, so the new particle system uses its own settings

bpy.ops.particle.dupliob\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.dupliob_copy "Link to this definition")

Duplicate the current instance object

bpy.ops.particle.dupliob\_move\_down() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.dupliob_move_down "Link to this definition")

Move instance object down in the list

bpy.ops.particle.dupliob\_move\_up() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.dupliob_move_up "Link to this definition")

Move instance object up in the list

bpy.ops.particle.dupliob\_refresh() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.dupliob_refresh "Link to this definition")

Refresh list of instance objects and their weights

bpy.ops.particle.dupliob\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.dupliob_remove "Link to this definition")

Remove the selected instance object

bpy.ops.particle.edited\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.edited_clear "Link to this definition")

Undo all edition performed on the particle system

bpy.ops.particle.hair\_dynamics\_preset\_add( _\*_, _name=''_, _remove\_name=False_, _remove\_active=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.hair_dynamics_preset_add "Link to this definition")

Add or remove a Hair Dynamics Preset

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the preset, used to make the path name

- **remove\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_name

- **remove\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – remove\_active


File:

[startup/bl\_operators/presets.py:119](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/presets.py#L119)

bpy.ops.particle.hide( _\*_, _unselected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.hide "Link to this definition")

Hide selected particles

Parameters:

**unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Hide unselected rather than selected

bpy.ops.particle.mirror() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.mirror "Link to this definition")

Duplicate and mirror the selected particles along the local X axis

bpy.ops.particle.new() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.new "Link to this definition")

Add new particle settings

bpy.ops.particle.new\_target() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.new_target "Link to this definition")

Add a new particle target

bpy.ops.particle.particle\_edit\_toggle() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.particle_edit_toggle "Link to this definition")

Toggle particle edit mode

bpy.ops.particle.particle\_system\_remove\_all() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.particle_system_remove_all "Link to this definition")

Remove all particle system within the active object

bpy.ops.particle.rekey( _\*_, _keys\_number=2_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.rekey "Link to this definition")

Change the number of keys of selected particles (root and tip keys included)

Parameters:

**keys\_number** ( _int in_ _\[_ _2_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Number of Keys

bpy.ops.particle.remove\_doubles( _\*_, _threshold=0.0002_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.remove_doubles "Link to this definition")

Remove selected particles close enough of others

Parameters:

**threshold** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Merge Distance, Threshold distance within which particles are removed

bpy.ops.particle.reveal( _\*_, _select=True_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.reveal "Link to this definition")

Show hidden particles

Parameters:

**select** ( _boolean_ _,_ _(_ _optional_ _)_) – Select

bpy.ops.particle.select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_all "Link to this definition")

(De)select all particles’ keys

Parameters:

**action** (enum in \[`'TOGGLE'`, `'SELECT'`, `'DESELECT'`, `'INVERT'`\], (optional)) –

Action, Selection action to execute

- `TOGGLE`
Toggle – Toggle selection for all elements.

- `SELECT`
Select – Select all elements.

- `DESELECT`
Deselect – Deselect all elements.

- `INVERT`
Invert – Invert selection of all elements.


bpy.ops.particle.select\_less() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_less "Link to this definition")

Deselect boundary selected keys of each particle

bpy.ops.particle.select\_linked() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_linked "Link to this definition")

Select all keys linked to already selected ones

bpy.ops.particle.select\_linked\_pick( _\*_, _deselect=False_, _location=(0,0)_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_linked_pick "Link to this definition")

Select nearest particle from mouse pointer

Parameters:

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Deselect linked keys rather than selecting them

- **location** ( _int array_ _of_ _2 items in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Location


bpy.ops.particle.select\_more() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_more "Link to this definition")

Select keys linked to boundary selected keys of each particle

bpy.ops.particle.select\_random( _\*_, _ratio=0.5_, _seed=0_, _action='SELECT'_, _type='HAIR'_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_random "Link to this definition")

Select a randomly distributed set of hair or points

Parameters:

- **ratio** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Ratio, Portion of items to select randomly

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed for the random number generator

- **action** (enum in \[`'SELECT'`, `'DESELECT'`\], (optional)) –

Action, Selection action to execute


  - `SELECT`
    Select – Select all elements.

  - `DESELECT`
    Deselect – Deselect all elements.


- **type** (enum in \[`'HAIR'`, `'POINTS'`\], (optional)) – Type, Select either hair or points


bpy.ops.particle.select\_roots( _\*_, _action='SELECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_roots "Link to this definition")

Select roots of all visible particles

Parameters:

**action** (enum in \[`'TOGGLE'`, `'SELECT'`, `'DESELECT'`, `'INVERT'`\], (optional)) –

Action, Selection action to execute

- `TOGGLE`
Toggle – Toggle selection for all elements.

- `SELECT`
Select – Select all elements.

- `DESELECT`
Deselect – Deselect all elements.

- `INVERT`
Invert – Invert selection of all elements.


bpy.ops.particle.select\_tips( _\*_, _action='SELECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.select_tips "Link to this definition")

Select tips of all visible particles

Parameters:

**action** (enum in \[`'TOGGLE'`, `'SELECT'`, `'DESELECT'`, `'INVERT'`\], (optional)) –

Action, Selection action to execute

- `TOGGLE`
Toggle – Toggle selection for all elements.

- `SELECT`
Select – Select all elements.

- `DESELECT`
Deselect – Deselect all elements.

- `INVERT`
Invert – Invert selection of all elements.


bpy.ops.particle.shape\_cut() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.shape_cut "Link to this definition")

Cut hair to conform to the set shape object

bpy.ops.particle.subdivide() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.subdivide "Link to this definition")

Subdivide selected particles segments (adds keys)

bpy.ops.particle.target\_move\_down() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.target_move_down "Link to this definition")

Move particle target down in the list

bpy.ops.particle.target\_move\_up() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.target_move_up "Link to this definition")

Move particle target up in the list

bpy.ops.particle.target\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.target_remove "Link to this definition")

Remove the selected particle target

bpy.ops.particle.unify\_length() [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.unify_length "Link to this definition")

Make selected hair the same length

bpy.ops.particle.weight\_set( _\*_, _factor=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.particle.html#bpy.ops.particle.weight_set "Link to this definition")

Set the weight of selected keys

Parameters:

**factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Factor, Interpolation factor between current brush weight, and keys’ weights