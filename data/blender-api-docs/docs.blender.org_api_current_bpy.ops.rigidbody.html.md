ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Rigidbody Operators [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html\#module-bpy.ops.rigidbody "Link to this heading")

bpy.ops.rigidbody.bake\_to\_keyframes( _\*_, _frame\_start=1_, _frame\_end=250_, _step=1_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.bake_to_keyframes "Link to this definition")

Bake rigid body transformations of selected objects to keyframes

Parameters:

- **frame\_start** ( _int in_ _\[_ _0_ _,_ _300000_ _\]_ _,_ _(_ _optional_ _)_) – Start Frame, Start frame for baking

- **frame\_end** ( _int in_ _\[_ _1_ _,_ _300000_ _\]_ _,_ _(_ _optional_ _)_) – End Frame, End frame for baking

- **step** ( _int in_ _\[_ _1_ _,_ _120_ _\]_ _,_ _(_ _optional_ _)_) – Frame Step, Frame Step


File:

[startup/bl\_operators/rigidbody.py:108](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/rigidbody.py#L108)

bpy.ops.rigidbody.connect( _\*_, _con\_type='FIXED'_, _pivot\_type='CENTER'_, _connection\_pattern='SELECTED\_TO\_ACTIVE'_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.connect "Link to this definition")

Create rigid body constraints between selected rigid bodies

Parameters:

- **con\_type** (enum in \[`'FIXED'`, `'POINT'`, `'HINGE'`, `'SLIDER'`, `'PISTON'`, `'GENERIC'`, `'GENERIC_SPRING'`, `'MOTOR'`\], (optional)) –

Type, Type of generated constraint


  - `FIXED`
    Fixed – Glue rigid bodies together.

  - `POINT`
    Point – Constrain rigid bodies to move around common pivot point.

  - `HINGE`
    Hinge – Restrict rigid body rotation to one axis.

  - `SLIDER`
    Slider – Restrict rigid body translation to one axis.

  - `PISTON`
    Piston – Restrict rigid body translation and rotation to one axis.

  - `GENERIC`
    Generic – Restrict translation and rotation to specified axes.

  - `GENERIC_SPRING`
    Generic Spring – Restrict translation and rotation to specified axes with springs.

  - `MOTOR`
    Motor – Drive rigid body around or along an axis.


- **pivot\_type** (enum in \[`'CENTER'`, `'ACTIVE'`, `'SELECTED'`\], (optional)) –

Location, Constraint pivot location


  - `CENTER`
    Center – Pivot location is between the constrained rigid bodies.

  - `ACTIVE`
    Active – Pivot location is at the active object position.

  - `SELECTED`
    Selected – Pivot location is at the selected object position.


- **connection\_pattern** (enum in \[`'SELECTED_TO_ACTIVE'`, `'CHAIN_DISTANCE'`\], (optional)) –

Connection Pattern, Pattern used to connect objects


  - `SELECTED_TO_ACTIVE`
    Selected to Active – Connect selected objects to the active object.

  - `CHAIN_DISTANCE`
    Chain by Distance – Connect objects as a chain based on distance, starting at the active object.


File:

[startup/bl\_operators/rigidbody.py:277](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/rigidbody.py#L277)

bpy.ops.rigidbody.constraint\_add( _\*_, _type='FIXED'_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.constraint_add "Link to this definition")

Add Rigid Body Constraint to active object

Parameters:

**type** (enum in [Rigidbody Constraint Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/rigidbody_constraint_type_items.html#rna-enum-rigidbody-constraint-type-items), (optional)) – Rigid Body Constraint Type

bpy.ops.rigidbody.constraint\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.constraint_remove "Link to this definition")

Remove Rigid Body Constraint from Object

bpy.ops.rigidbody.mass\_calculate( _\*_, _material='DEFAULT'_, _density=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.mass_calculate "Link to this definition")

Automatically calculate mass values for Rigid Body Objects based on volume

Parameters:

- **material** (enum in \[`'DEFAULT'`\], (optional)) – Material Preset, Type of material that objects are made of (determines material density)

- **density** ( _float in_ _\[_ _1.17549e-38_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Density, Density value (kg/m^3), allows custom value if the ‘Custom’ preset is used


bpy.ops.rigidbody.object\_add( _\*_, _type='ACTIVE'_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.object_add "Link to this definition")

Add active object as Rigid Body

Parameters:

**type** (enum in [Rigidbody Object Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/rigidbody_object_type_items.html#rna-enum-rigidbody-object-type-items), (optional)) – Rigid Body Type

bpy.ops.rigidbody.object\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.object_remove "Link to this definition")

Remove Rigid Body settings from Object

bpy.ops.rigidbody.object\_settings\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.object_settings_copy "Link to this definition")

Copy Rigid Body settings from active object to selected

File:

[startup/bl\_operators/rigidbody.py:45](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/rigidbody.py#L45)

bpy.ops.rigidbody.objects\_add( _\*_, _type='ACTIVE'_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.objects_add "Link to this definition")

Add selected objects as Rigid Bodies

Parameters:

**type** (enum in [Rigidbody Object Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/rigidbody_object_type_items.html#rna-enum-rigidbody-object-type-items), (optional)) – Rigid Body Type

bpy.ops.rigidbody.objects\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.objects_remove "Link to this definition")

Remove selected objects from Rigid Body simulation

bpy.ops.rigidbody.shape\_change( _\*_, _type='MESH'_) [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.shape_change "Link to this definition")

Change collision shapes for selected Rigid Body Objects

Parameters:

**type** (enum in [Rigidbody Object Shape Items](https://docs.blender.org/api/current/bpy_types_enum_items/rigidbody_object_shape_items.html#rna-enum-rigidbody-object-shape-items), (optional)) – Rigid Body Shape

bpy.ops.rigidbody.world\_add() [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.world_add "Link to this definition")

Add Rigid Body simulation world to the current scene

bpy.ops.rigidbody.world\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.rigidbody.html#bpy.ops.rigidbody.world_remove "Link to this definition")

Remove Rigid Body simulation world from the current scene