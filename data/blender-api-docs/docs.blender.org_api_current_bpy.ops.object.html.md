ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.object.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.object.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Object Operators [¶](https://docs.blender.org/api/current/bpy.ops.object.html\#module-bpy.ops.object "Link to this heading")

bpy.ops.object.add( _\*_, _radius=1.0_, _type='EMPTY'_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.add "Link to this definition")

Add an object to the scene

Parameters:

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **type** (enum in [Object Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_type_items.html#rna-enum-object-type-items), (optional)) – Type

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.add\_modifier\_menu() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.add_modifier_menu "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

File:

[startup/bl\_ui/properties\_data\_modifier.py:303](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_ui/properties_data_modifier.py#L303)

bpy.ops.object.add\_named( _\*_, _linked=False_, _name=''_, _session\_uid=0_, _matrix=((0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0))_, _drop\_x=0_, _drop\_y=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.add_named "Link to this definition")

Add named object

Parameters:

- **linked** ( _boolean_ _,_ _(_ _optional_ _)_) – Linked, Duplicate object but not object data, linking to the original data

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the data-block to use by the operator

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **matrix** ( [`mathutils.Matrix`](https://docs.blender.org/api/current/mathutils.html#mathutils.Matrix "mathutils.Matrix") of 4 \* 4 items in \[-inf, inf\], (optional)) – Matrix

- **drop\_x** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop X, X-coordinate (screen space) to place the new object under

- **drop\_y** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop Y, Y-coordinate (screen space) to place the new object under


bpy.ops.object.align( _\*_, _bb\_quality=True_, _align\_mode='OPT\_2'_, _relative\_to='OPT\_4'_, _align\_axis={}_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.align "Link to this definition")

Align objects

Parameters:

- **bb\_quality** ( _boolean_ _,_ _(_ _optional_ _)_) – High Quality, Enables high quality but slow calculation of the bounding box for perfect results on complex shape meshes with rotation/scale

- **align\_mode** (enum in \[`'OPT_1'`, `'OPT_2'`, `'OPT_3'`\], (optional)) – Align Mode, Side of object to use for alignment

- **relative\_to** (enum in \[`'OPT_1'`, `'OPT_2'`, `'OPT_3'`, `'OPT_4'`\], (optional)) –

Relative To, Reference location to align to


  - `OPT_1`
    Scene Origin – Use the scene origin as the position for the selected objects to align to.

  - `OPT_2`
    3D Cursor – Use the 3D cursor as the position for the selected objects to align to.

  - `OPT_3`
    Selection – Use the selected objects as the position for the selected objects to align to.

  - `OPT_4`
    Active – Use the active object as the position for the selected objects to align to.


- **align\_axis** (enum set in {`'X'`, `'Y'`, `'Z'`}, (optional)) – Align, Align to axis


File:

[startup/bl\_operators/object\_align.py:386](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object_align.py#L386)

bpy.ops.object.anim\_transforms\_to\_deltas() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.anim_transforms_to_deltas "Link to this definition")

Convert object animation for normal transforms to delta transforms

File:

[startup/bl\_operators/object.py:822](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L822)

bpy.ops.object.armature\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.armature_add "Link to this definition")

Add an armature object to the scene

Parameters:

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.assign\_property\_defaults( _\*_, _process\_data=True_, _process\_bones=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.assign_property_defaults "Link to this definition")

Assign the current values of custom properties as their defaults, for use as part of the rest pose state in NLA track mixing

Parameters:

- **process\_data** ( _boolean_ _,_ _(_ _optional_ _)_) – Process data properties

- **process\_bones** ( _boolean_ _,_ _(_ _optional_ _)_) – Process bone properties


File:

[startup/bl\_operators/object.py:979](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L979)

bpy.ops.object.bake( _\*_, _type='COMBINED'_, _pass\_filter={}_, _filepath=''_, _width=512_, _height=512_, _margin=16_, _margin\_type='EXTEND'_, _use\_selected\_to\_active=False_, _max\_ray\_distance=0.0_, _cage\_extrusion=0.0_, _cage\_object=''_, _normal\_space='TANGENT'_, _normal\_r='POS\_X'_, _normal\_g='POS\_Y'_, _normal\_b='POS\_Z'_, _target='IMAGE\_TEXTURES'_, _save\_mode='INTERNAL'_, _use\_clear=False_, _use\_cage=False_, _use\_split\_materials=False_, _use\_automatic\_name=False_, _uv\_layer=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.bake "Link to this definition")

Bake image textures of selected objects

Parameters:

- **type** (enum in [Bake Pass Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/bake_pass_type_items.html#rna-enum-bake-pass-type-items), (optional)) – Type, Type of pass to bake, some of them may not be supported by the current render engine

- **pass\_filter** (enum set in [Bake Pass Filter Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/bake_pass_filter_type_items.html#rna-enum-bake-pass-filter-type-items), (optional)) – Pass Filter, Filter to combined, diffuse, glossy, transmission and subsurface passes

- **filepath** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – File Path, Image filepath to use when saving externally

- **width** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Width, Horizontal dimension of the baking map (external only)

- **height** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Height, Vertical dimension of the baking map (external only)

- **margin** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Margin, Extends the baked result as a post process filter

- **margin\_type** (enum in [Bake Margin Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/bake_margin_type_items.html#rna-enum-bake-margin-type-items), (optional)) – Margin Type, Which algorithm to use to generate the margin

- **use\_selected\_to\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected to Active, Bake shading on the surface of selected objects to the active object

- **max\_ray\_distance** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Max Ray Distance, The maximum ray distance for matching points between the active and selected objects. If zero, there is no limit

- **cage\_extrusion** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Cage Extrusion, Inflate the active object by the specified distance for baking. This helps matching to points nearer to the outside of the selected object meshes

- **cage\_object** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Cage Object, Object to use as cage, instead of calculating the cage from the active object with cage extrusion

- **normal\_space** (enum in [Normal Space Items](https://docs.blender.org/api/current/bpy_types_enum_items/normal_space_items.html#rna-enum-normal-space-items), (optional)) – Normal Space, Choose normal space for baking

- **normal\_r** (enum in [Normal Swizzle Items](https://docs.blender.org/api/current/bpy_types_enum_items/normal_swizzle_items.html#rna-enum-normal-swizzle-items), (optional)) – R, Axis to bake in red channel

- **normal\_g** (enum in [Normal Swizzle Items](https://docs.blender.org/api/current/bpy_types_enum_items/normal_swizzle_items.html#rna-enum-normal-swizzle-items), (optional)) – G, Axis to bake in green channel

- **normal\_b** (enum in [Normal Swizzle Items](https://docs.blender.org/api/current/bpy_types_enum_items/normal_swizzle_items.html#rna-enum-normal-swizzle-items), (optional)) – B, Axis to bake in blue channel

- **target** (enum in [Bake Target Items](https://docs.blender.org/api/current/bpy_types_enum_items/bake_target_items.html#rna-enum-bake-target-items), (optional)) – Target, Where to output the baked map

- **save\_mode** (enum in [Bake Save Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/bake_save_mode_items.html#rna-enum-bake-save-mode-items), (optional)) – Save Mode, Where to save baked image textures

- **use\_clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear, Clear images before baking (only for internal saving)

- **use\_cage** ( _boolean_ _,_ _(_ _optional_ _)_) – Cage, Cast rays to active object from a cage

- **use\_split\_materials** ( _boolean_ _,_ _(_ _optional_ _)_) – Split Materials, Split baked maps per material, using material name in output file (external only)

- **use\_automatic\_name** ( _boolean_ _,_ _(_ _optional_ _)_) – Automatic Name, Automatically name the output file with the pass type

- **uv\_layer** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – UV Layer, UV layer to override active


bpy.ops.object.bake\_image() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.bake_image "Link to this definition")

Bake image textures of selected objects

bpy.ops.object.camera\_add( _\*_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.camera_add "Link to this definition")

Add a camera object to the scene

Parameters:

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.camera\_custom\_update() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.camera_custom_update "Link to this definition")

Update custom camera with new parameters from the shader

bpy.ops.object.clear\_override\_library() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.clear_override_library "Link to this definition")

Delete the selected local overrides and relink their usages to the linked data-blocks if possible, else reset them and mark them as non editable

bpy.ops.object.collection\_add() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_add "Link to this definition")

Add an object to a new collection

bpy.ops.object.collection\_external\_asset\_drop( _\*_, _session\_uid=0_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_, _use\_instance=True_, _drop\_x=0_, _drop\_y=0_, _collection=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_external_asset_drop "Link to this definition")

Add the dragged collection to the scene

Parameters:

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object

- **use\_instance** ( _boolean_ _,_ _(_ _optional_ _)_) – Instance, Add the dropped collection as collection instance

- **drop\_x** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop X, X-coordinate (screen space) to place the new object under

- **drop\_y** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop Y, Y-coordinate (screen space) to place the new object under

- **collection** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Collection


bpy.ops.object.collection\_instance\_add( _\*_, _name='Collection'_, _collection=''_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_, _session\_uid=0_, _drop\_x=0_, _drop\_y=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_instance_add "Link to this definition")

Add a collection instance

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Collection name to add

- **collection** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Collection

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **drop\_x** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop X, X-coordinate (screen space) to place the new object under

- **drop\_y** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop Y, Y-coordinate (screen space) to place the new object under


bpy.ops.object.collection\_link( _\*_, _collection=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_link "Link to this definition")

Add an object to an existing collection

Parameters:

**collection** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Collection

bpy.ops.object.collection\_objects\_select() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_objects_select "Link to this definition")

Select all objects in collection

bpy.ops.object.collection\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_remove "Link to this definition")

Remove the active object from this collection

bpy.ops.object.collection\_unlink() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.collection_unlink "Link to this definition")

Unlink the collection from all objects

bpy.ops.object.constraint\_add( _\*_, _type=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.constraint_add "Link to this definition")

Add a constraint to the active object

Parameters:

**type** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Type

bpy.ops.object.constraint\_add\_with\_targets( _\*_, _type=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.constraint_add_with_targets "Link to this definition")

Add a constraint to the active object, with target (where applicable) set to the selected objects/bones

Parameters:

**type** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Type

bpy.ops.object.constraints\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.constraints_clear "Link to this definition")

Clear all constraints from the selected objects

bpy.ops.object.constraints\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.constraints_copy "Link to this definition")

Copy constraints to other selected objects

bpy.ops.object.convert( _\*_, _target='MESH'_, _keep\_original=False_, _merge\_customdata=True_, _thickness=5_, _faces=True_, _offset=0.01_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.convert "Link to this definition")

Convert selected objects to another type

Parameters:

- **target** (enum in \[`'CURVE'`, `'MESH'`, `'POINTCLOUD'`, `'CURVES'`, `'GREASEPENCIL'`\], (optional)) –

Target, Type of object to convert to


  - `CURVE`
    Curve – Curve from Mesh or Text objects.

  - `MESH`
    Mesh – Mesh from Curve, Surface, Metaball, Text, or Point Cloud objects.

  - `POINTCLOUD`
    Point Cloud – Point Cloud from Mesh objects.

  - `CURVES`
    Curves – Curves from evaluated curve data.

  - `GREASEPENCIL`
    Grease Pencil – Grease Pencil from Curve or Mesh objects.


- **keep\_original** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Original, Keep original objects instead of replacing them

- **merge\_customdata** ( _boolean_ _,_ _(_ _optional_ _)_) – Merge UVs, Merge UV coordinates that share a vertex to account for imprecision in some modifiers

- **thickness** ( _int in_ _\[_ _1_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Thickness

- **faces** ( _boolean_ _,_ _(_ _optional_ _)_) – Export Faces, Export faces as filled strokes

- **offset** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Stroke Offset, Offset strokes from fill


bpy.ops.object.copy\_global\_transform() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.copy_global_transform "Link to this definition")

Copies the matrix of the currently active object or pose bone to the clipboard. Uses world-space matrices

File:

[startup/bl\_operators/copy\_global\_transform.py:150](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/copy_global_transform.py#L150)

bpy.ops.object.copy\_relative\_transform() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.copy_relative_transform "Link to this definition")

Copies the matrix of the currently active object or pose bone to the clipboard. Uses matrices relative to a specific object or the active scene camera

File:

[startup/bl\_operators/copy\_global\_transform.py:180](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/copy_global_transform.py#L180)

bpy.ops.object.correctivesmooth\_bind( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.correctivesmooth_bind "Link to this definition")

Bind base pose in Corrective Smooth modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.curves\_empty\_hair\_add( _\*_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.curves_empty_hair_add "Link to this definition")

Add an empty curve object to the scene with the selected mesh as surface

Parameters:

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.curves\_random\_add( _\*_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.curves_random_add "Link to this definition")

Add a curves object with random curves to the scene

Parameters:

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.data\_instance\_add( _\*_, _name=''_, _session\_uid=0_, _type='ACTION'_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_, _drop\_x=0_, _drop\_y=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.data_instance_add "Link to this definition")

Add an object data instance

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the data-block to use by the operator

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **type** (enum in [Id Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/id_type_items.html#rna-enum-id-type-items), (optional)) – Type

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object

- **drop\_x** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop X, X-coordinate (screen space) to place the new object under

- **drop\_y** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop Y, Y-coordinate (screen space) to place the new object under


bpy.ops.object.data\_transfer( _\*_, _use\_reverse\_transfer=False_, _use\_freeze=False_, _data\_type=''_, _use\_create=True_, _vert\_mapping='NEAREST'_, _edge\_mapping='NEAREST'_, _loop\_mapping='NEAREST\_POLYNOR'_, _poly\_mapping='NEAREST'_, _use\_auto\_transform=False_, _use\_object\_transform=True_, _use\_max\_distance=False_, _max\_distance=1.0_, _ray\_radius=0.0_, _islands\_precision=0.1_, _layers\_select\_src='ACTIVE'_, _layers\_select\_dst='ACTIVE'_, _mix\_mode='REPLACE'_, _mix\_factor=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.data_transfer "Link to this definition")

Transfer data layer(s) (weights, edge sharp, etc.) from active to selected meshes

Parameters:

- **use\_reverse\_transfer** ( _boolean_ _,_ _(_ _optional_ _)_) – Reverse Transfer, Transfer from selected objects to active one

- **use\_freeze** ( _boolean_ _,_ _(_ _optional_ _)_) – Freeze Operator, Prevent changes to settings to re-run the operator, handy to change several things at once with heavy geometry

- **data\_type** (enum in \[`'VGROUP_WEIGHTS'`, `'BEVEL_WEIGHT_VERT'`, `'COLOR_VERTEX'`, `'SHARP_EDGE'`, `'SEAM'`, `'CREASE'`, `'BEVEL_WEIGHT_EDGE'`, `'FREESTYLE_EDGE'`, `'CUSTOM_NORMAL'`, `'COLOR_CORNER'`, `'UV'`, `'SMOOTH'`, `'FREESTYLE_FACE'`\], (optional)) –

Data Type, Which data to transfer


  - `VGROUP_WEIGHTS`
    Vertex Group(s) – Transfer active or all vertex groups.

  - `BEVEL_WEIGHT_VERT`
    Bevel Weight – Transfer bevel weights.

  - `COLOR_VERTEX`
    Colors – Color Attributes.

  - `SHARP_EDGE`
    Sharp – Transfer sharp mark.

  - `SEAM`
    UV Seam – Transfer UV seam mark.

  - `CREASE`
    Subdivision Crease – Transfer crease values.

  - `BEVEL_WEIGHT_EDGE`
    Bevel Weight – Transfer bevel weights.

  - `FREESTYLE_EDGE`
    Freestyle Mark – Transfer Freestyle edge mark.

  - `CUSTOM_NORMAL`
    Custom Normals – Transfer custom normals.

  - `COLOR_CORNER`
    Colors – Color Attributes.

  - `UV`
    UVs – Transfer UV layers.

  - `SMOOTH`
    Smooth – Transfer flat/smooth mark.

  - `FREESTYLE_FACE`
    Freestyle Mark – Transfer Freestyle face mark.


- **use\_create** ( _boolean_ _,_ _(_ _optional_ _)_) – Create Data, Add data layers on destination meshes if needed

- **vert\_mapping** (enum in [Dt Method Vertex Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_method_vertex_items.html#rna-enum-dt-method-vertex-items), (optional)) – Vertex Mapping, Method used to map source vertices to destination ones

- **edge\_mapping** (enum in [Dt Method Edge Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_method_edge_items.html#rna-enum-dt-method-edge-items), (optional)) – Edge Mapping, Method used to map source edges to destination ones

- **loop\_mapping** (enum in [Dt Method Loop Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_method_loop_items.html#rna-enum-dt-method-loop-items), (optional)) – Face Corner Mapping, Method used to map source faces’ corners to destination ones

- **poly\_mapping** (enum in [Dt Method Poly Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_method_poly_items.html#rna-enum-dt-method-poly-items), (optional)) – Face Mapping, Method used to map source faces to destination ones

- **use\_auto\_transform** ( _boolean_ _,_ _(_ _optional_ _)_) – Auto Transform, Automatically compute transformation to get the best possible match between source and destination meshes.Warning: Results will never be as good as manual matching of objects

- **use\_object\_transform** ( _boolean_ _,_ _(_ _optional_ _)_) – Object Transform, Evaluate source and destination meshes in global space

- **use\_max\_distance** ( _boolean_ _,_ _(_ _optional_ _)_) – Only Neighbor Geometry, Source elements must be closer than given distance from destination one

- **max\_distance** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Max Distance, Maximum allowed distance between source and destination element, for non-topology mappings

- **ray\_radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Ray Radius, ‘Width’ of rays (especially useful when raycasting against vertices or edges)

- **islands\_precision** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Islands Precision, Factor controlling precision of islands handling (the higher, the better the results)

- **layers\_select\_src** (enum in [Dt Layers Select Src Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_layers_select_src_items.html#rna-enum-dt-layers-select-src-items), (optional)) – Source Layers Selection, Which layers to transfer, in case of multi-layers types

- **layers\_select\_dst** (enum in [Dt Layers Select Dst Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_layers_select_dst_items.html#rna-enum-dt-layers-select-dst-items), (optional)) – Destination Layers Matching, How to match source and destination layers

- **mix\_mode** (enum in [Dt Mix Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_mix_mode_items.html#rna-enum-dt-mix-mode-items), (optional)) – Mix Mode, How to affect destination elements with source values

- **mix\_factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Mix Factor, Factor to use when applying data to destination (exact behavior depends on mix mode)


bpy.ops.object.datalayout\_transfer( _\*_, _modifier=''_, _data\_type=''_, _use\_delete=False_, _layers\_select\_src='ACTIVE'_, _layers\_select\_dst='ACTIVE'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.datalayout_transfer "Link to this definition")

Transfer layout of data layer(s) from active to selected meshes

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **data\_type** (enum in \[`'VGROUP_WEIGHTS'`, `'BEVEL_WEIGHT_VERT'`, `'COLOR_VERTEX'`, `'SHARP_EDGE'`, `'SEAM'`, `'CREASE'`, `'BEVEL_WEIGHT_EDGE'`, `'FREESTYLE_EDGE'`, `'CUSTOM_NORMAL'`, `'COLOR_CORNER'`, `'UV'`, `'SMOOTH'`, `'FREESTYLE_FACE'`\], (optional)) –

Data Type, Which data to transfer


  - `VGROUP_WEIGHTS`
    Vertex Group(s) – Transfer active or all vertex groups.

  - `BEVEL_WEIGHT_VERT`
    Bevel Weight – Transfer bevel weights.

  - `COLOR_VERTEX`
    Colors – Color Attributes.

  - `SHARP_EDGE`
    Sharp – Transfer sharp mark.

  - `SEAM`
    UV Seam – Transfer UV seam mark.

  - `CREASE`
    Subdivision Crease – Transfer crease values.

  - `BEVEL_WEIGHT_EDGE`
    Bevel Weight – Transfer bevel weights.

  - `FREESTYLE_EDGE`
    Freestyle Mark – Transfer Freestyle edge mark.

  - `CUSTOM_NORMAL`
    Custom Normals – Transfer custom normals.

  - `COLOR_CORNER`
    Colors – Color Attributes.

  - `UV`
    UVs – Transfer UV layers.

  - `SMOOTH`
    Smooth – Transfer flat/smooth mark.

  - `FREESTYLE_FACE`
    Freestyle Mark – Transfer Freestyle face mark.


- **use\_delete** ( _boolean_ _,_ _(_ _optional_ _)_) – Exact Match, Also delete some data layers from destination if necessary, so that it matches exactly source

- **layers\_select\_src** (enum in [Dt Layers Select Src Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_layers_select_src_items.html#rna-enum-dt-layers-select-src-items), (optional)) – Source Layers Selection, Which layers to transfer, in case of multi-layers types

- **layers\_select\_dst** (enum in [Dt Layers Select Dst Items](https://docs.blender.org/api/current/bpy_types_enum_items/dt_layers_select_dst_items.html#rna-enum-dt-layers-select-dst-items), (optional)) – Destination Layers Matching, How to match source and destination layers


bpy.ops.object.delete( _\*_, _use\_global=False_, _confirm=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.delete "Link to this definition")

Delete selected objects

Parameters:

- **use\_global** ( _boolean_ _,_ _(_ _optional_ _)_) – Delete Globally, Remove object from all scenes

- **confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm, Prompt for confirmation


bpy.ops.object.delete\_fix\_to\_camera\_keys() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.delete_fix_to_camera_keys "Link to this definition")

Delete all keys that were generated by the ‘Fix to Scene Camera’ operator

File:

[startup/bl\_operators/copy\_global\_transform.py:639](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/copy_global_transform.py#L639)

bpy.ops.object.drop\_geometry\_nodes( _\*_, _session\_uid=0_, _show\_datablock\_in\_modifier=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.drop_geometry_nodes "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the geometry node group being dropped

- **show\_datablock\_in\_modifier** ( _boolean_ _,_ _(_ _optional_ _)_) – Show the data-block selector in the modifier


bpy.ops.object.drop\_named\_material( _\*_, _name=''_, _session\_uid=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.drop_named_material "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the data-block to use by the operator

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator


bpy.ops.object.duplicate( _\*_, _linked=False_, _mode='TRANSLATION'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.duplicate "Link to this definition")

Duplicate selected objects

Parameters:

- **linked** ( _boolean_ _,_ _(_ _optional_ _)_) – Linked, Duplicate object but not object data, linking to the original data

- **mode** (enum in [Transform Mode Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/transform_mode_type_items.html#rna-enum-transform-mode-type-items), (optional)) – Mode


bpy.ops.object.duplicate\_move( _\*_, _OBJECT\_OT\_duplicate=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.duplicate_move "Link to this definition")

Duplicate the selected objects and move them

Parameters:

- **OBJECT\_OT\_duplicate** (`OBJECT_OT_duplicate`, (optional)) – Duplicate Objects, Duplicate selected objects

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.object.duplicate\_move\_linked( _\*_, _OBJECT\_OT\_duplicate=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.duplicate_move_linked "Link to this definition")

Duplicate the selected objects, but not their object data, and move them

Parameters:

- **OBJECT\_OT\_duplicate** (`OBJECT_OT_duplicate`, (optional)) – Duplicate Objects, Duplicate selected objects

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.object.duplicates\_make\_real( _\*_, _use\_base\_parent=False_, _use\_hierarchy=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.duplicates_make_real "Link to this definition")

Make instanced objects attached to this object real

Parameters:

- **use\_base\_parent** ( _boolean_ _,_ _(_ _optional_ _)_) – Parent, Parent newly created objects to the original instancer

- **use\_hierarchy** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Hierarchy, Maintain parent child relationships


bpy.ops.object.editmode\_toggle() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.editmode_toggle "Link to this definition")

Toggle object’s edit mode

bpy.ops.object.effector\_add( _\*_, _type='FORCE'_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.effector_add "Link to this definition")

Add an empty object with a physics effector to the scene

Parameters:

- **type** (enum in \[`'FORCE'`, `'WIND'`, `'VORTEX'`, `'MAGNET'`, `'HARMONIC'`, `'CHARGE'`, `'LENNARDJ'`, `'TEXTURE'`, `'GUIDE'`, `'BOID'`, `'TURBULENCE'`, `'DRAG'`, `'FLUID'`\], (optional)) – Type

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.empty\_add( _\*_, _type='PLAIN\_AXES'_, _radius=1.0_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.empty_add "Link to this definition")

Add an empty object to the scene

Parameters:

- **type** (enum in [Object Empty Drawtype Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_empty_drawtype_items.html#rna-enum-object-empty-drawtype-items), (optional)) – Type

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.empty\_image\_add( _\*_, _filepath=''_, _hide\_props\_region=True_, _check\_existing=False_, _filter\_blender=False_, _filter\_backup=False_, _filter\_image=True_, _filter\_movie=True_, _filter\_python=False_, _filter\_font=False_, _filter\_sound=False_, _filter\_text=False_, _filter\_archive=False_, _filter\_btx=False_, _filter\_alembic=False_, _filter\_usd=False_, _filter\_obj=False_, _filter\_volume=False_, _filter\_folder=True_, _filter\_blenlib=False_, _filemode=9_, _relative\_path=True_, _show\_multiview=False_, _use\_multiview=False_, _display\_type='DEFAULT'_, _sort\_method=''_, _name=''_, _session\_uid=0_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_, _background=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.empty_image_add "Link to this definition")

Add an empty image type to scene with data

Parameters:

- **filepath** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – File Path, Path to file

- **hide\_props\_region** ( _boolean_ _,_ _(_ _optional_ _)_) – Hide Operator Properties, Collapse the region displaying the operator settings

- **check\_existing** ( _boolean_ _,_ _(_ _optional_ _)_) – Check Existing, Check and warn on overwriting existing files

- **filter\_blender** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter .blend files

- **filter\_backup** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter .blend files

- **filter\_image** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter image files

- **filter\_movie** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter movie files

- **filter\_python** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Python files

- **filter\_font** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter font files

- **filter\_sound** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter sound files

- **filter\_text** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter text files

- **filter\_archive** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter archive files

- **filter\_btx** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter btx files

- **filter\_alembic** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Alembic files

- **filter\_usd** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter USD files

- **filter\_obj** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter OBJ files

- **filter\_volume** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter OpenVDB volume files

- **filter\_folder** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter folders

- **filter\_blenlib** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Blender IDs

- **filemode** ( _int in_ _\[_ _1_ _,_ _9_ _\]_ _,_ _(_ _optional_ _)_) – File Browser Mode, The setting for the file browser mode to load a .blend file, a library or a special file

- **relative\_path** ( _boolean_ _,_ _(_ _optional_ _)_) – Relative Path, Select the file relative to the blend file

- **show\_multiview** ( _boolean_ _,_ _(_ _optional_ _)_) – Enable Multi-View

- **use\_multiview** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Multi-View

- **display\_type** (enum in \[`'DEFAULT'`, `'LIST_VERTICAL'`, `'LIST_HORIZONTAL'`, `'THUMBNAIL'`\], (optional)) –

Display Type


  - `DEFAULT`
    Default – Automatically determine display type for files.

  - `LIST_VERTICAL`
    Short List – Display files as short list.

  - `LIST_HORIZONTAL`
    Long List – Display files as a detailed list.

  - `THUMBNAIL`
    Thumbnails – Display files as thumbnails.


- **sort\_method** (enum in \[`'DEFAULT'`, `'FILE_SORT_ALPHA'`, `'FILE_SORT_EXTENSION'`, `'FILE_SORT_TIME'`, `'FILE_SORT_SIZE'`, `'ASSET_CATALOG'`\], (optional)) –

File sorting mode


  - `DEFAULT`
    Default – Automatically determine sort method for files.

  - `FILE_SORT_ALPHA`
    Name – Sort the file list alphabetically.

  - `FILE_SORT_EXTENSION`
    Extension – Sort the file list by extension/type.

  - `FILE_SORT_TIME`
    Modified Date – Sort files by modification time.

  - `FILE_SORT_SIZE`
    Size – Sort files by size.

  - `ASSET_CATALOG`
    Asset Catalog – Sort the asset list so that assets in the same catalog are kept together. Within a single catalog, assets are ordered by name. The catalogs are in order of the flattened catalog hierarchy..


- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the data-block to use by the operator

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object

- **background** ( _boolean_ _,_ _(_ _optional_ _)_) – Put in Background, Make the image render behind all objects


bpy.ops.object.explode\_refresh( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.explode_refresh "Link to this definition")

Refresh data in the Explode modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.fix\_to\_camera( _\*_, _use\_location=True_, _use\_rotation=True_, _use\_scale=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.fix_to_camera "Link to this definition")

Generate new keys to fix the selected object/bone to the camera on unkeyed frames

Parameters:

- **use\_location** ( _boolean_ _,_ _(_ _optional_ _)_) – Location, Create Location keys when fixing to the scene camera

- **use\_rotation** ( _boolean_ _,_ _(_ _optional_ _)_) – Rotation, Create Rotation keys when fixing to the scene camera

- **use\_scale** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale, Create Scale keys when fixing to the scene camera


File:

[startup/bl\_operators/copy\_global\_transform.py:639](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/copy_global_transform.py#L639)

bpy.ops.object.forcefield\_toggle() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.forcefield_toggle "Link to this definition")

Toggle object’s force field

bpy.ops.object.geometry\_node\_bake\_delete\_single( _\*_, _session\_uid=0_, _modifier\_name=''_, _bake\_id=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_node_bake_delete_single "Link to this definition")

Delete baked data of a single bake node or simulation

Parameters:

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **modifier\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier Name, Name of the modifier that contains the node

- **bake\_id** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Bake ID, Nested node id of the node


bpy.ops.object.geometry\_node\_bake\_pack\_single( _\*_, _session\_uid=0_, _modifier\_name=''_, _bake\_id=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_node_bake_pack_single "Link to this definition")

Pack baked data from disk into the .blend file

Parameters:

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **modifier\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier Name, Name of the modifier that contains the node

- **bake\_id** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Bake ID, Nested node id of the node


bpy.ops.object.geometry\_node\_bake\_single( _\*_, _session\_uid=0_, _modifier\_name=''_, _bake\_id=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_node_bake_single "Link to this definition")

Bake a single bake node or simulation

Parameters:

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **modifier\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier Name, Name of the modifier that contains the node

- **bake\_id** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Bake ID, Nested node id of the node


bpy.ops.object.geometry\_node\_bake\_unpack\_single( _\*_, _session\_uid=0_, _modifier\_name=''_, _bake\_id=0_, _method='USE\_LOCAL'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_node_bake_unpack_single "Link to this definition")

Unpack baked data from the .blend file to disk

Parameters:

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **modifier\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier Name, Name of the modifier that contains the node

- **bake\_id** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Bake ID, Nested node id of the node

- **method** (enum in \[`'USE_LOCAL'`, `'WRITE_LOCAL'`, `'USE_ORIGINAL'`, `'WRITE_ORIGINAL'`\], (optional)) – Method, How to unpack


bpy.ops.object.geometry\_node\_tree\_copy\_assign() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_node_tree_copy_assign "Link to this definition")

Duplicate the active geometry node group and assign it to the active modifier

bpy.ops.object.geometry\_nodes\_input\_attribute\_toggle( _\*_, _input\_name=''_, _modifier\_name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_nodes_input_attribute_toggle "Link to this definition")

Switch between an attribute and a single value to define the data for every element

Parameters:

- **input\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Input Name

- **modifier\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier Name


bpy.ops.object.geometry\_nodes\_move\_to\_nodes( _\*_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.geometry_nodes_move_to_nodes "Link to this definition")

Move inputs and outputs from in the modifier to a new node group

Parameters:

**use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object

File:

[startup/bl\_operators/geometry\_nodes.py:280](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/geometry_nodes.py#L280)

bpy.ops.object.grease\_pencil\_add( _\*_, _type='EMPTY'_, _use\_in\_front=True_, _stroke\_depth\_offset=0.05_, _use\_lights=True_, _stroke\_depth\_order='3D'_, _radius=1.0_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_add "Link to this definition")

Add a Grease Pencil object to the scene

Parameters:

- **type** (enum in [Object Gpencil Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_gpencil_type_items.html#rna-enum-object-gpencil-type-items), (optional)) – Type

- **use\_in\_front** ( _boolean_ _,_ _(_ _optional_ _)_) – Show In Front, Show Line Art Grease Pencil in front of everything

- **stroke\_depth\_offset** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Stroke Offset, Stroke offset for the Line Art modifier

- **use\_lights** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Lights, Use lights for this Grease Pencil object

- **stroke\_depth\_order** (enum in \[`'2D'`, `'3D'`\], (optional)) –

Stroke Depth Order, Defines how the strokes are ordered in 3D space (for objects not displayed ‘In Front’)


  - `2D`
    2D Layers – Display strokes using Grease Pencil layers to define order.

  - `3D`
    3D Location – Display strokes using real 3D position in 3D space.


- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.grease\_pencil\_dash\_modifier\_segment\_add( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_dash_modifier_segment_add "Link to this definition")

Add a segment to the dash modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.grease\_pencil\_dash\_modifier\_segment\_move( _\*_, _modifier=''_, _type='UP'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_dash_modifier_segment_move "Link to this definition")

Move the active dash segment up or down

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **type** (enum in \[`'UP'`, `'DOWN'`\], (optional)) – Type


bpy.ops.object.grease\_pencil\_dash\_modifier\_segment\_remove( _\*_, _modifier=''_, _index=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_dash_modifier_segment_remove "Link to this definition")

Remove the active segment from the dash modifier

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **index** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Index, Index of the segment to remove


bpy.ops.object.grease\_pencil\_time\_modifier\_segment\_add( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_time_modifier_segment_add "Link to this definition")

Add a segment to the time modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.grease\_pencil\_time\_modifier\_segment\_move( _\*_, _modifier=''_, _type='UP'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_time_modifier_segment_move "Link to this definition")

Move the active time segment up or down

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **type** (enum in \[`'UP'`, `'DOWN'`\], (optional)) – Type


bpy.ops.object.grease\_pencil\_time\_modifier\_segment\_remove( _\*_, _modifier=''_, _index=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.grease_pencil_time_modifier_segment_remove "Link to this definition")

Remove the active segment from the time modifier

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **index** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Index, Index of the segment to remove


bpy.ops.object.hide\_collection( _\*_, _collection\_index=-1_, _toggle=False_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hide_collection "Link to this definition")

Show only objects in collection (Shift to extend)

Parameters:

- **collection\_index** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Collection Index, Index of the collection to change visibility

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle, Toggle visibility

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend visibility


bpy.ops.object.hide\_render\_clear\_all() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hide_render_clear_all "Link to this definition")

Reveal all render objects by setting the hide render flag

File:

[startup/bl\_operators/object.py:729](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L729)

bpy.ops.object.hide\_view\_clear( _\*_, _select=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hide_view_clear "Link to this definition")

Reveal temporarily hidden objects

Parameters:

**select** ( _boolean_ _,_ _(_ _optional_ _)_) – Select, Select revealed objects

bpy.ops.object.hide\_view\_set( _\*_, _unselected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hide_view_set "Link to this definition")

Temporarily hide objects from the viewport

Parameters:

**unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Hide unselected rather than selected objects

bpy.ops.object.hook\_add\_newob() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_add_newob "Link to this definition")

Hook selected vertices to a newly created object

bpy.ops.object.hook\_add\_selob( _\*_, _use\_bone=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_add_selob "Link to this definition")

Hook selected vertices to the first selected object

Parameters:

**use\_bone** ( _boolean_ _,_ _(_ _optional_ _)_) – Active Bone, Assign the hook to the hook object’s active bone

bpy.ops.object.hook\_assign( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_assign "Link to this definition")

Assign the selected vertices to a hook

Parameters:

**modifier** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Modifier, Modifier number to assign to

bpy.ops.object.hook\_recenter( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_recenter "Link to this definition")

Set hook center to cursor position

Parameters:

**modifier** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Modifier, Modifier number to assign to

bpy.ops.object.hook\_remove( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_remove "Link to this definition")

Remove a hook from the active object

Parameters:

**modifier** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Modifier, Modifier number to remove

bpy.ops.object.hook\_reset( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_reset "Link to this definition")

Recalculate and clear offset transformation

Parameters:

**modifier** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Modifier, Modifier number to assign to

bpy.ops.object.hook\_select( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.hook_select "Link to this definition")

Select affected vertices on mesh

Parameters:

**modifier** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Modifier, Modifier number to remove

bpy.ops.object.instance\_offset\_from\_cursor() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.instance_offset_from_cursor "Link to this definition")

Set offset used for collection instances based on cursor position

File:

[startup/bl\_operators/object.py:914](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L914)

bpy.ops.object.instance\_offset\_from\_object() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.instance_offset_from_object "Link to this definition")

Set offset used for collection instances based on the active object position

File:

[startup/bl\_operators/object.py:946](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L946)

bpy.ops.object.instance\_offset\_to\_cursor() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.instance_offset_to_cursor "Link to this definition")

Set cursor position to the offset used for collection instances

File:

[startup/bl\_operators/object.py:929](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L929)

bpy.ops.object.isolate\_type\_render() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.isolate_type_render "Link to this definition")

Hide unselected render objects of same type as active by setting the hide render flag

File:

[startup/bl\_operators/object.py:709](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L709)

bpy.ops.object.join() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.join "Link to this definition")

Join selected objects into active object

bpy.ops.object.join\_shapes( _\*_, _use\_mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.join_shapes "Link to this definition")

Add the vertex positions of selected objects as shape keys or update existing shape keys with matching names

Parameters:

**use\_mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror, Mirror the new shape key values

bpy.ops.object.join\_uvs() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.join_uvs "Link to this definition")

Transfer UV Maps from active to selected objects (needs matching geometry)

File:

[startup/bl\_operators/object.py:610](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L610)

bpy.ops.object.laplaciandeform\_bind( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.laplaciandeform_bind "Link to this definition")

Bind mesh to system in laplacian deform modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.lattice\_add\_to\_selected( _\*_, _fit\_to\_selected=True_, _radius=1.0_, _margin=0.0_, _add\_modifiers=True_, _resolution\_u=2_, _resolution\_v=2_, _resolution\_w=2_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.lattice_add_to_selected "Link to this definition")

Add a lattice and use it to deform selected objects

Parameters:

- **fit\_to\_selected** ( _boolean_ _,_ _(_ _optional_ _)_) – Fit to Selected, Resize lattice to fit selected deformable objects

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **margin** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Margin, Add margin to lattice dimensions

- **add\_modifiers** ( _boolean_ _,_ _(_ _optional_ _)_) – Add Modifiers, Automatically add lattice modifiers to selected objects

- **resolution\_u** ( _int in_ _\[_ _1_ _,_ _64_ _\]_ _,_ _(_ _optional_ _)_) – Resolution U, Lattice resolution in U direction

- **resolution\_v** ( _int in_ _\[_ _1_ _,_ _64_ _\]_ _,_ _(_ _optional_ _)_) – V, Lattice resolution in V direction

- **resolution\_w** ( _int in_ _\[_ _1_ _,_ _64_ _\]_ _,_ _(_ _optional_ _)_) – W, Lattice resolution in W direction

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.light\_add( _\*_, _type='POINT'_, _radius=1.0_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_add "Link to this definition")

Add a light object to the scene

Parameters:

- **type** (enum in [Light Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/light_type_items.html#rna-enum-light-type-items), (optional)) – Type

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.light\_linking\_blocker\_collection\_new() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_blocker_collection_new "Link to this definition")

Create new light linking collection used by the active emitter

bpy.ops.object.light\_linking\_blockers\_link( _\*_, _link\_state='INCLUDE'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_blockers_link "Link to this definition")

Light link selected blockers to the active emitter object

Parameters:

**link\_state** (enum in \[`'INCLUDE'`, `'EXCLUDE'`\], (optional)) –

Link State, State of the shadow linking

- `INCLUDE`
Include – Include selected blockers to cast shadows from the active emitter.

- `EXCLUDE`
Exclude – Exclude selected blockers from casting shadows from the active emitter.


bpy.ops.object.light\_linking\_blockers\_select() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_blockers_select "Link to this definition")

Select all objects which block light from this emitter

bpy.ops.object.light\_linking\_receiver\_collection\_new() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_receiver_collection_new "Link to this definition")

Create new light linking collection used by the active emitter

bpy.ops.object.light\_linking\_receivers\_link( _\*_, _link\_state='INCLUDE'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_receivers_link "Link to this definition")

Light link selected receivers to the active emitter object

Parameters:

**link\_state** (enum in \[`'INCLUDE'`, `'EXCLUDE'`\], (optional)) –

Link State, State of the light linking

- `INCLUDE`
Include – Include selected receivers to receive light from the active emitter.

- `EXCLUDE`
Exclude – Exclude selected receivers from receiving light from the active emitter.


bpy.ops.object.light\_linking\_receivers\_select() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_receivers_select "Link to this definition")

Select all objects which receive light from this emitter

bpy.ops.object.light\_linking\_unlink\_from\_collection() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.light_linking_unlink_from_collection "Link to this definition")

Remove this object or collection from the light linking collection

bpy.ops.object.lightprobe\_add( _\*_, _type='SPHERE'_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.lightprobe_add "Link to this definition")

Add a light probe object

Parameters:

- **type** (enum in \[`'SPHERE'`, `'PLANE'`, `'VOLUME'`\], (optional)) –

Type


  - `SPHERE`
    Sphere – Light probe that captures precise lighting from all directions at a single point in space.

  - `PLANE`
    Plane – Light probe that captures incoming light from a single direction on a plane.

  - `VOLUME`
    Volume – Light probe that captures low frequency lighting inside a volume.


- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.lightprobe\_cache\_bake( _\*_, _subset='ALL'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.lightprobe_cache_bake "Link to this definition")

Bake irradiance volume light cache

Parameters:

**subset** (enum in \[`'ALL'`, `'SELECTED'`, `'ACTIVE'`\], (optional)) –

Subset, Subset of probes to update

- `ALL`
All Volumes – Bake all light probe volumes.

- `SELECTED`
Selected Only – Only bake selected light probe volumes.

- `ACTIVE`
Active Only – Only bake the active light probe volume.


bpy.ops.object.lightprobe\_cache\_free( _\*_, _subset='SELECTED'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.lightprobe_cache_free "Link to this definition")

Delete cached indirect lighting

Parameters:

**subset** (enum in \[`'ALL'`, `'SELECTED'`, `'ACTIVE'`\], (optional)) –

Subset, Subset of probes to update

- `ALL`
All Light Probes – Delete all light probes’ baked lighting data.

- `SELECTED`
Selected Only – Only delete selected light probes’ baked lighting data.

- `ACTIVE`
Active Only – Only delete the active light probe’s baked lighting data.


bpy.ops.object.lineart\_bake\_strokes( _\*_, _bake\_all=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.lineart_bake_strokes "Link to this definition")

Bake Line Art for current Grease Pencil object

Parameters:

**bake\_all** ( _boolean_ _,_ _(_ _optional_ _)_) – Bake All, Bake all Line Art modifiers

bpy.ops.object.lineart\_clear( _\*_, _clear\_all=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.lineart_clear "Link to this definition")

Clear all strokes in current Grease Pencil object

Parameters:

**clear\_all** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear All, Clear all Line Art modifier bakes

bpy.ops.object.link\_to\_collection( _\*_, _collection\_uid=-1_, _is\_new=False_, _new\_collection\_name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.link_to_collection "Link to this definition")

Link objects to a collection

Parameters:

- **collection\_uid** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Collection UID, Session UID of the collection to link to

- **is\_new** ( _boolean_ _,_ _(_ _optional_ _)_) – New, Link objects to a new collection

- **new\_collection\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the newly added collection


bpy.ops.object.location\_clear( _\*_, _clear\_delta=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.location_clear "Link to this definition")

Clear the object’s location

Parameters:

**clear\_delta** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Delta, Clear delta location in addition to clearing the normal location transform

bpy.ops.object.make\_dupli\_face() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.make_dupli_face "Link to this definition")

Convert objects into instanced faces

File:

[startup/bl\_operators/object.py:692](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L692)

bpy.ops.object.make\_links\_data( _\*_, _type='OBDATA'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.make_links_data "Link to this definition")

Transfer data from active object to selected objects

Parameters:

**type** (enum in \[`'OBDATA'`, `'MATERIAL'`, `'ANIMATION'`, `'GROUPS'`, `'DUPLICOLLECTION'`, `'FONTS'`, `'MODIFIERS'`, `'EFFECTS'`\], (optional)) –

Type

- `OBDATA`
Link Object Data – Replace assigned Object Data.

- `MATERIAL`
Link Materials – Replace assigned Materials.

- `ANIMATION`
Link Animation Data – Replace assigned Animation Data.

- `GROUPS`
Link Collections – Replace assigned Collections.

- `DUPLICOLLECTION`
Link Instance Collection – Replace assigned Collection Instance.

- `FONTS`
Link Fonts to Text – Replace Text object Fonts.

- `MODIFIERS`
Copy Modifiers – Replace Modifiers.

- `EFFECTS`
Copy Grease Pencil Effects – Replace Grease Pencil Effects.


bpy.ops.object.make\_links\_scene( _\*_, _scene=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.make_links_scene "Link to this definition")

Link selection to another scene

Parameters:

**scene** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Scene

bpy.ops.object.make\_local( _\*_, _type='SELECT\_OBJECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.make_local "Link to this definition")

Make library linked data-blocks local to this file

Parameters:

**type** (enum in \[`'SELECT_OBJECT'`, `'SELECT_OBDATA'`, `'SELECT_OBDATA_MATERIAL'`, `'ALL'`\], (optional)) – Type

bpy.ops.object.make\_override\_library( _\*_, _collection=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.make_override_library "Link to this definition")

Create a local override of the selected linked objects, and their hierarchy of dependencies

Parameters:

**collection** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Override Collection, Session UID of the directly linked collection containing the selected object, to make an override from

bpy.ops.object.make\_single\_user( _\*_, _type='SELECTED\_OBJECTS'_, _object=False_, _obdata=False_, _material=False_, _animation=False_, _obdata\_animation=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.make_single_user "Link to this definition")

Make linked data local to each object

Parameters:

- **type** (enum in \[`'SELECTED_OBJECTS'`, `'ALL'`\], (optional)) – Type

- **object** ( _boolean_ _,_ _(_ _optional_ _)_) – Object, Make single user objects

- **obdata** ( _boolean_ _,_ _(_ _optional_ _)_) – Object Data, Make single user object data

- **material** ( _boolean_ _,_ _(_ _optional_ _)_) – Materials, Make materials local to each data-block

- **animation** ( _boolean_ _,_ _(_ _optional_ _)_) – Object Animation, Make object animation data local to each object

- **obdata\_animation** ( _boolean_ _,_ _(_ _optional_ _)_) – Object Data Animation, Make object data (mesh, curve etc.) animation data local to each object


bpy.ops.object.material\_slot\_add() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_add "Link to this definition")

Add a new material slot

bpy.ops.object.material\_slot\_assign() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_assign "Link to this definition")

Assign active material slot to selection

bpy.ops.object.material\_slot\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_copy "Link to this definition")

Copy material to selected objects

bpy.ops.object.material\_slot\_deselect() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_deselect "Link to this definition")

Deselect by active material slot

bpy.ops.object.material\_slot\_move( _\*_, _direction='UP'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_move "Link to this definition")

Move the active material up/down in the list

Parameters:

**direction** (enum in \[`'UP'`, `'DOWN'`\], (optional)) – Direction, Direction to move the active material towards

bpy.ops.object.material\_slot\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_remove "Link to this definition")

Remove the selected material slot

bpy.ops.object.material\_slot\_remove\_all() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_remove_all "Link to this definition")

Remove all materials

bpy.ops.object.material\_slot\_remove\_unused() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_remove_unused "Link to this definition")

Remove unused material slots

bpy.ops.object.material\_slot\_select() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.material_slot_select "Link to this definition")

Select by active material slot

bpy.ops.object.meshdeform\_bind( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.meshdeform_bind "Link to this definition")

Bind mesh to cage in mesh deform modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.metaball\_add( _\*_, _type='BALL'_, _radius=2.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.metaball_add "Link to this definition")

Add an metaball object to the scene

Parameters:

- **type** (enum in [Metaelem Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/metaelem_type_items.html#rna-enum-metaelem-type-items), (optional)) – Primitive

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.mode\_set( _\*_, _mode='OBJECT'_, _toggle=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.mode_set "Link to this definition")

Sets the object interaction mode

Parameters:

- **mode** (enum in [Object Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_mode_items.html#rna-enum-object-mode-items), (optional)) – Mode

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle


bpy.ops.object.mode\_set\_with\_submode( _\*_, _mode='OBJECT'_, _toggle=False_, _mesh\_select\_mode={}_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.mode_set_with_submode "Link to this definition")

Sets the object interaction mode

Parameters:

- **mode** (enum in [Object Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_mode_items.html#rna-enum-object-mode-items), (optional)) – Mode

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle

- **mesh\_select\_mode** (enum set in [Mesh Select Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/mesh_select_mode_items.html#rna-enum-mesh-select-mode-items), (optional)) – Mesh Mode


bpy.ops.object.modifier\_add( _\*_, _type='SUBSURF'_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_add "Link to this definition")

Add a procedural operation/effect to the active object

Parameters:

- **type** (enum in [Object Modifier Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_modifier_type_items.html#rna-enum-object-modifier-type-items), (optional)) – Type

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_add\_node\_group( _\*_, _asset\_library\_type='LOCAL'_, _asset\_library\_identifier=''_, _relative\_asset\_identifier=''_, _session\_uid=0_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_add_node_group "Link to this definition")

Add a procedural operation/effect to the active object

Parameters:

- **asset\_library\_type** (enum in [Asset Library Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/asset_library_type_items.html#rna-enum-asset-library-type-items), (optional)) – Asset Library Type

- **asset\_library\_identifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Asset Library Identifier

- **relative\_asset\_identifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Relative Asset Identifier

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UID, Session UID of the data-block to use by the operator

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_apply( _\*_, _modifier=''_, _report=False_, _merge\_customdata=True_, _single\_user=False_, _all\_keyframes=False_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_apply "Link to this definition")

Apply modifier and remove from the stack

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **report** ( _boolean_ _,_ _(_ _optional_ _)_) – Report, Create a notification after the operation

- **merge\_customdata** ( _boolean_ _,_ _(_ _optional_ _)_) – Merge UVs, For mesh objects, merge UV coordinates that share a vertex to account for imprecision in some modifiers

- **single\_user** ( _boolean_ _,_ _(_ _optional_ _)_) – Make Data Single User, Make the object’s data single user if needed

- **all\_keyframes** ( _boolean_ _,_ _(_ _optional_ _)_) – Apply to all keyframes, For Grease Pencil objects, apply the modifier to all the keyframes

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_apply\_as\_shapekey( _\*_, _keep\_modifier=False_, _modifier=''_, _report=False_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_apply_as_shapekey "Link to this definition")

Apply modifier as a new shape key and remove from the stack

Parameters:

- **keep\_modifier** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Modifier, Do not remove the modifier from stack

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **report** ( _boolean_ _,_ _(_ _optional_ _)_) – Report, Create a notification after the operation

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_convert( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_convert "Link to this definition")

Convert particles to a mesh object

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.modifier\_copy( _\*_, _modifier=''_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_copy "Link to this definition")

Duplicate modifier at the same position in the stack

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_copy\_to\_selected( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_copy_to_selected "Link to this definition")

Copy the modifier from the active object to all selected objects

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.modifier\_move\_down( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_move_down "Link to this definition")

Move modifier down in the stack

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.modifier\_move\_to\_index( _\*_, _modifier=''_, _index=0_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_move_to_index "Link to this definition")

Change the modifier’s index in the stack so it evaluates after the set number of others

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **index** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Index, The index to move the modifier to

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_move\_up( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_move_up "Link to this definition")

Move modifier up in the stack

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.modifier\_remove( _\*_, _modifier=''_, _report=False_, _use\_selected\_objects=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_remove "Link to this definition")

Remove a modifier from the active object

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **report** ( _boolean_ _,_ _(_ _optional_ _)_) – Report, Create a notification after the operation

- **use\_selected\_objects** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected Objects, Affect all selected objects instead of just the active object


bpy.ops.object.modifier\_set\_active( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifier_set_active "Link to this definition")

Activate the modifier to use as the context

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.modifiers\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifiers_clear "Link to this definition")

Clear all modifiers from the selected objects

bpy.ops.object.modifiers\_copy\_to\_selected() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.modifiers_copy_to_selected "Link to this definition")

Copy modifiers to other selected objects

bpy.ops.object.move\_to\_collection( _\*_, _collection\_uid=-1_, _is\_new=False_, _new\_collection\_name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.move_to_collection "Link to this definition")

Move objects to a collection

Parameters:

- **collection\_uid** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Collection UID, Session UID of the collection to move to

- **is\_new** ( _boolean_ _,_ _(_ _optional_ _)_) – New, Move objects to a new collection

- **new\_collection\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the newly added collection


bpy.ops.object.multires\_base\_apply( _\*_, _modifier=''_, _apply\_heuristic=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_base_apply "Link to this definition")

Modify the base mesh to conform to the displaced mesh

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **apply\_heuristic** ( _boolean_ _,_ _(_ _optional_ _)_) – Apply Subdivision Heuristic, Whether or not the final base mesh positions will be slightly altered to account for a new subdivision modifier being added


bpy.ops.object.multires\_external\_pack() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_external_pack "Link to this definition")

Pack displacements from an external file

bpy.ops.object.multires\_external\_save( _\*_, _filepath=''_, _hide\_props\_region=True_, _check\_existing=True_, _filter\_blender=False_, _filter\_backup=False_, _filter\_image=False_, _filter\_movie=False_, _filter\_python=False_, _filter\_font=False_, _filter\_sound=False_, _filter\_text=False_, _filter\_archive=False_, _filter\_btx=True_, _filter\_alembic=False_, _filter\_usd=False_, _filter\_obj=False_, _filter\_volume=False_, _filter\_folder=True_, _filter\_blenlib=False_, _filemode=9_, _relative\_path=True_, _display\_type='DEFAULT'_, _sort\_method=''_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_external_save "Link to this definition")

Save displacements to an external file

Parameters:

- **filepath** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – File Path, Path to file

- **hide\_props\_region** ( _boolean_ _,_ _(_ _optional_ _)_) – Hide Operator Properties, Collapse the region displaying the operator settings

- **check\_existing** ( _boolean_ _,_ _(_ _optional_ _)_) – Check Existing, Check and warn on overwriting existing files

- **filter\_blender** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter .blend files

- **filter\_backup** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter .blend files

- **filter\_image** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter image files

- **filter\_movie** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter movie files

- **filter\_python** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Python files

- **filter\_font** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter font files

- **filter\_sound** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter sound files

- **filter\_text** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter text files

- **filter\_archive** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter archive files

- **filter\_btx** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter btx files

- **filter\_alembic** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Alembic files

- **filter\_usd** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter USD files

- **filter\_obj** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter OBJ files

- **filter\_volume** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter OpenVDB volume files

- **filter\_folder** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter folders

- **filter\_blenlib** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Blender IDs

- **filemode** ( _int in_ _\[_ _1_ _,_ _9_ _\]_ _,_ _(_ _optional_ _)_) – File Browser Mode, The setting for the file browser mode to load a .blend file, a library or a special file

- **relative\_path** ( _boolean_ _,_ _(_ _optional_ _)_) – Relative Path, Select the file relative to the blend file

- **display\_type** (enum in \[`'DEFAULT'`, `'LIST_VERTICAL'`, `'LIST_HORIZONTAL'`, `'THUMBNAIL'`\], (optional)) –

Display Type


  - `DEFAULT`
    Default – Automatically determine display type for files.

  - `LIST_VERTICAL`
    Short List – Display files as short list.

  - `LIST_HORIZONTAL`
    Long List – Display files as a detailed list.

  - `THUMBNAIL`
    Thumbnails – Display files as thumbnails.


- **sort\_method** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – File sorting mode

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit


bpy.ops.object.multires\_higher\_levels\_delete( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_higher_levels_delete "Link to this definition")

Deletes the higher resolution mesh, potential loss of detail

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.multires\_rebuild\_subdiv( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_rebuild_subdiv "Link to this definition")

Rebuilds all possible subdivisions levels to generate a lower resolution base mesh

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.multires\_reshape( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_reshape "Link to this definition")

Copy vertex coordinates from other object

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.multires\_subdivide( _\*_, _modifier=''_, _mode='CATMULL\_CLARK'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_subdivide "Link to this definition")

Add a new level of subdivision

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **mode** (enum in \[`'CATMULL_CLARK'`, `'SIMPLE'`, `'LINEAR'`\], (optional)) –

Subdivision Mode, How the mesh is going to be subdivided to create a new level


  - `CATMULL_CLARK`
    Catmull-Clark – Create a new level using Catmull-Clark subdivisions.

  - `SIMPLE`
    Simple – Create a new level using simple subdivisions.

  - `LINEAR`
    Linear – Create a new level using linear interpolation of the sculpted displacement.


bpy.ops.object.multires\_unsubdivide( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.multires_unsubdivide "Link to this definition")

Rebuild a lower subdivision level of the current base mesh

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.ocean\_bake( _\*_, _modifier=''_, _free=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.ocean_bake "Link to this definition")

Bake an image sequence of ocean data

Parameters:

- **modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

- **free** ( _boolean_ _,_ _(_ _optional_ _)_) – Free, Free the bake, rather than generating it


bpy.ops.object.origin\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.origin_clear "Link to this definition")

Clear the object’s origin

bpy.ops.object.origin\_set( _\*_, _type='GEOMETRY\_ORIGIN'_, _center='MEDIAN'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.origin_set "Link to this definition")

Set the object’s origin, by either moving the data, or set to center of data, or use 3D cursor

Parameters:

- **type** (enum in \[`'GEOMETRY_ORIGIN'`, `'ORIGIN_GEOMETRY'`, `'ORIGIN_CURSOR'`, `'ORIGIN_CENTER_OF_MASS'`, `'ORIGIN_CENTER_OF_VOLUME'`\], (optional)) –

Type


  - `GEOMETRY_ORIGIN`
    Geometry to Origin – Move object geometry to object origin.

  - `ORIGIN_GEOMETRY`
    Origin to Geometry – Calculate the center of geometry based on the current pivot point (median, otherwise bounding box).

  - `ORIGIN_CURSOR`
    Origin to 3D Cursor – Move object origin to position of the 3D cursor.

  - `ORIGIN_CENTER_OF_MASS`
    Origin to Center of Mass (Surface) – Calculate the center of mass from the surface area.

  - `ORIGIN_CENTER_OF_VOLUME`
    Origin to Center of Mass (Volume) – Calculate the center of mass from the volume (must be manifold geometry with consistent normals).


- **center** (enum in \[`'MEDIAN'`, `'BOUNDS'`\], (optional)) – Center


bpy.ops.object.parent\_clear( _\*_, _type='CLEAR'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.parent_clear "Link to this definition")

Clear the object’s parenting

Parameters:

**type** (enum in \[`'CLEAR'`, `'CLEAR_KEEP_TRANSFORM'`, `'CLEAR_INVERSE'`\], (optional)) –

Type

- `CLEAR`
Clear Parent – Completely clear the parenting relationship, including involved modifiers if any.

- `CLEAR_KEEP_TRANSFORM`
Clear and Keep Transformation – As ‘Clear Parent’, but keep the current visual transformations of the object.

- `CLEAR_INVERSE`
Clear Parent Inverse – Reset the transform corrections applied to the parenting relationship, does not remove parenting itself.


bpy.ops.object.parent\_inverse\_apply() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.parent_inverse_apply "Link to this definition")

Apply the object’s parent inverse to its data

bpy.ops.object.parent\_no\_inverse\_set( _\*_, _keep\_transform=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.parent_no_inverse_set "Link to this definition")

Set the object’s parenting without setting the inverse parent correction

Parameters:

**keep\_transform** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Transform, Preserve the world transform throughout parenting

bpy.ops.object.parent\_set( _\*_, _type='OBJECT'_, _xmirror=False_, _keep\_transform=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.parent_set "Link to this definition")

Set the object’s parenting

Parameters:

- **type** (enum in \[`'OBJECT'`, `'ARMATURE'`, `'ARMATURE_NAME'`, `'ARMATURE_AUTO'`, `'ARMATURE_ENVELOPE'`, `'BONE'`, `'BONE_RELATIVE'`, `'CURVE'`, `'FOLLOW'`, `'PATH_CONST'`, `'LATTICE'`, `'VERTEX'`, `'VERTEX_TRI'`\], (optional)) – Type

- **xmirror** ( _boolean_ _,_ _(_ _optional_ _)_) – X Mirror, Apply weights symmetrically along X axis, for Envelope/Automatic vertex groups creation

- **keep\_transform** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Transform, Apply transformation before parenting


bpy.ops.object.particle\_system\_add() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.particle_system_add "Link to this definition")

Add a particle system

bpy.ops.object.particle\_system\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.particle_system_remove "Link to this definition")

Remove the selected particle system

bpy.ops.object.paste\_transform( _\*_, _method='CURRENT'_, _bake\_step=0_, _use\_mirror=False_, _mirror\_axis\_loc='x'_, _mirror\_axis\_rot='z'_, _use\_relative=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.paste_transform "Link to this definition")

Pastes the matrix from the clipboard to the currently active pose bone or object. Uses world-space matrices

Parameters:

- **method** (enum in \[`'CURRENT'`, `'EXISTING_KEYS'`, `'BAKE'`\], (optional)) –

Paste Method, Update the current transform, selected keyframes, or even create new keys


  - `CURRENT`
    Current Transform – Paste onto the current values only, only manipulating the animation data if auto-keying is enabled.

  - `EXISTING_KEYS`
    Selected Keys – Paste onto frames that have a selected key, potentially creating new keys on those frames.

  - `BAKE`
    Bake on Key Range – Paste onto all frames between the first and last selected key, creating new keyframes if necessary.


- **bake\_step** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Frame Step, Only used for baking. Step=1 creates a key on every frame, step=2 bakes on 2s, etc

- **use\_mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Transform, When pasting, mirror the transform relative to a specific object or bone

- **mirror\_axis\_loc** (enum in \[`'x'`, `'y'`, `'z'`\], (optional)) – Location Axis, Coordinate axis used to mirror the location part of the transform

- **mirror\_axis\_rot** (enum in \[`'x'`, `'y'`, `'z'`\], (optional)) – Rotation Axis, Coordinate axis used to mirror the rotation part of the transform

- **use\_relative** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Relative Paste, When pasting, assume the pasted matrix is relative to another object (set in the user interface)


File:

[startup/bl\_operators/copy\_global\_transform.py:325](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/copy_global_transform.py#L325)

bpy.ops.object.paths\_calculate( _\*_, _display\_type='RANGE'_, _range='SCENE'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.paths_calculate "Link to this definition")

Generate motion paths for the selected objects

Parameters:

- **display\_type** (enum in [Motionpath Display Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/motionpath_display_type_items.html#rna-enum-motionpath-display-type-items), (optional)) – Display Type

- **range** (enum in [Motionpath Range Items](https://docs.blender.org/api/current/bpy_types_enum_items/motionpath_range_items.html#rna-enum-motionpath-range-items), (optional)) – Computation Range


bpy.ops.object.paths\_clear( _\*_, _only\_selected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.paths_clear "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

**only\_selected** ( _boolean_ _,_ _(_ _optional_ _)_) – Only Selected, Only clear motion paths of selected objects

bpy.ops.object.paths\_update() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.paths_update "Link to this definition")

Recalculate motion paths for selected objects

bpy.ops.object.paths\_update\_visible() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.paths_update_visible "Link to this definition")

Recalculate all visible motion paths for objects and poses

bpy.ops.object.pointcloud\_random\_add( _\*_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.pointcloud_random_add "Link to this definition")

Add a point cloud object to the scene

Parameters:

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.posemode\_toggle() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.posemode_toggle "Link to this definition")

Enable or disable posing/selecting bones

bpy.ops.object.quadriflow\_remesh( _\*_, _use\_mesh\_symmetry=True_, _use\_preserve\_sharp=False_, _use\_preserve\_boundary=False_, _preserve\_attributes=False_, _smooth\_normals=False_, _mode='FACES'_, _target\_ratio=1.0_, _target\_edge\_length=0.1_, _target\_faces=4000_, _mesh\_area=-1.0_, _seed=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.quadriflow_remesh "Link to this definition")

Create a new quad based mesh using the surface data of the current mesh. All data layers will be lost

Parameters:

- **use\_mesh\_symmetry** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Mesh Symmetry, Generates a symmetrical mesh using the mesh symmetry configuration

- **use\_preserve\_sharp** ( _boolean_ _,_ _(_ _optional_ _)_) – Preserve Sharp, Try to preserve sharp features on the mesh

- **use\_preserve\_boundary** ( _boolean_ _,_ _(_ _optional_ _)_) – Preserve Mesh Boundary, Try to preserve mesh boundary on the mesh

- **preserve\_attributes** ( _boolean_ _,_ _(_ _optional_ _)_) – Preserve Attributes, Reproject attributes onto the new mesh

- **smooth\_normals** ( _boolean_ _,_ _(_ _optional_ _)_) – Smooth Normals, Set the output mesh normals to smooth

- **mode** (enum in \[`'RATIO'`, `'EDGE'`, `'FACES'`\], (optional)) –

Mode, How to specify the amount of detail for the new mesh


  - `RATIO`
    Ratio – Specify target number of faces relative to the current mesh.

  - `EDGE`
    Edge Length – Input target edge length in the new mesh.

  - `FACES`
    Faces – Input target number of faces in the new mesh.


- **target\_ratio** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Ratio, Relative number of faces compared to the current mesh

- **target\_edge\_length** ( _float in_ _\[_ _1e-07_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Edge Length, Target edge length in the new mesh

- **target\_faces** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Number of Faces, Approximate number of faces (quads) in the new mesh

- **mesh\_area** ( _float in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Old Object Face Area, This property is only used to cache the object area for later calculations

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Seed, Random seed to use with the solver. Different seeds will cause the remesher to come up with different quad layouts on the mesh


bpy.ops.object.quick\_explode( _\*_, _style='EXPLODE'_, _amount=100_, _frame\_duration=50_, _frame\_start=1_, _frame\_end=10_, _velocity=1.0_, _fade=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.quick_explode "Link to this definition")

Make selected objects explode

Parameters:

- **style** (enum in \[`'EXPLODE'`, `'BLEND'`\], (optional)) – Explode Style

- **amount** ( _int in_ _\[_ _2_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Number of Pieces

- **frame\_duration** ( _int in_ _\[_ _1_ _,_ _300000_ _\]_ _,_ _(_ _optional_ _)_) – Duration

- **frame\_start** ( _int in_ _\[_ _1_ _,_ _300000_ _\]_ _,_ _(_ _optional_ _)_) – Start Frame

- **frame\_end** ( _int in_ _\[_ _1_ _,_ _300000_ _\]_ _,_ _(_ _optional_ _)_) – End Frame

- **velocity** ( _float in_ _\[_ _0_ _,_ _300000_ _\]_ _,_ _(_ _optional_ _)_) – Outwards Velocity

- **fade** ( _boolean_ _,_ _(_ _optional_ _)_) – Fade, Fade the pieces over time


File:

[startup/bl\_operators/object\_quick\_effects.py:273](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object_quick_effects.py#L273)

bpy.ops.object.quick\_fur( _\*_, _density='MEDIUM'_, _length=0.1_, _radius=0.001_, _view\_percentage=1.0_, _apply\_hair\_guides=True_, _use\_noise=True_, _use\_frizz=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.quick_fur "Link to this definition")

Add a fur setup to the selected objects

Parameters:

- **density** (enum in \[`'LOW'`, `'MEDIUM'`, `'HIGH'`\], (optional)) – Density

- **length** ( _float in_ _\[_ _0.001_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Length

- **radius** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Hair Radius

- **view\_percentage** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – View Percentage

- **apply\_hair\_guides** ( _boolean_ _,_ _(_ _optional_ _)_) – Apply Hair Guides

- **use\_noise** ( _boolean_ _,_ _(_ _optional_ _)_) – Noise

- **use\_frizz** ( _boolean_ _,_ _(_ _optional_ _)_) – Frizz


File:

[startup/bl\_operators/object\_quick\_effects.py:92](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object_quick_effects.py#L92)

bpy.ops.object.quick\_liquid( _\*_, _show\_flows=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.quick_liquid "Link to this definition")

Make selected objects liquid

Parameters:

**show\_flows** ( _boolean_ _,_ _(_ _optional_ _)_) – Render Liquid Objects, Keep the liquid objects visible during rendering

File:

[startup/bl\_operators/object\_quick\_effects.py:553](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object_quick_effects.py#L553)

bpy.ops.object.quick\_smoke( _\*_, _style='SMOKE'_, _show\_flows=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.quick_smoke "Link to this definition")

Use selected objects as smoke emitters

Parameters:

- **style** (enum in \[`'SMOKE'`, `'FIRE'`, `'BOTH'`\], (optional)) – Smoke Style

- **show\_flows** ( _boolean_ _,_ _(_ _optional_ _)_) – Render Smoke Objects, Keep the smoke objects visible during rendering


File:

[startup/bl\_operators/object\_quick\_effects.py:447](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object_quick_effects.py#L447)

bpy.ops.object.randomize\_transform( _\*_, _random\_seed=0_, _use\_delta=False_, _use\_loc=True_, _loc=(0.0,0.0,0.0)_, _use\_rot=True_, _rot=(0.0,0.0,0.0)_, _use\_scale=True_, _scale\_even=False_, _scale=(1.0,1.0,1.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.randomize_transform "Link to this definition")

Randomize objects location, rotation, and scale

Parameters:

- **random\_seed** ( _int in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed value for the random generator

- **use\_delta** ( _boolean_ _,_ _(_ _optional_ _)_) – Transform Delta, Randomize delta transform values instead of regular transform

- **use\_loc** ( _boolean_ _,_ _(_ _optional_ _)_) – Randomize Location, Randomize the location values

- **loc** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-100, 100\], (optional)) – Location, Maximum distance the objects can spread over each axis

- **use\_rot** ( _boolean_ _,_ _(_ _optional_ _)_) – Randomize Rotation, Randomize the rotation values

- **rot** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-3.14159, 3.14159\], (optional)) – Rotation, Maximum rotation over each axis

- **use\_scale** ( _boolean_ _,_ _(_ _optional_ _)_) – Randomize Scale, Randomize the scale values

- **scale\_even** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale Even, Use the same scale value for all axis

- **scale** ( _float array_ _of_ _3 items in_ _\[_ _-100_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Scale, Maximum scale randomization over each axis


File:

[startup/bl\_operators/object\_randomize\_transform.py:161](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object_randomize_transform.py#L161)

bpy.ops.object.reset\_override\_library() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.reset_override_library "Link to this definition")

Reset the selected local overrides to their linked references values

bpy.ops.object.rotation\_clear( _\*_, _clear\_delta=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.rotation_clear "Link to this definition")

Clear the object’s rotation

Parameters:

**clear\_delta** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Delta, Clear delta rotation in addition to clearing the normal rotation transform

bpy.ops.object.scale\_clear( _\*_, _clear\_delta=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.scale_clear "Link to this definition")

Clear the object’s scale

Parameters:

**clear\_delta** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Delta, Clear delta scale in addition to clearing the normal scale transform

bpy.ops.object.select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_all "Link to this definition")

Change selection of all visible objects in scene

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


bpy.ops.object.select\_by\_type( _\*_, _extend=False_, _type='MESH'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_by_type "Link to this definition")

Select all visible objects that are of a type

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first

- **type** (enum in [Object Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_type_items.html#rna-enum-object-type-items), (optional)) – Type


bpy.ops.object.select\_camera( _\*_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_camera "Link to this definition")

Select the active camera

Parameters:

**extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection

File:

[startup/bl\_operators/object.py:122](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L122)

bpy.ops.object.select\_grouped( _\*_, _extend=False_, _type='CHILDREN\_RECURSIVE'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_grouped "Link to this definition")

Select all visible objects grouped by various properties

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first

- **type** (enum in \[`'CHILDREN_RECURSIVE'`, `'CHILDREN'`, `'PARENT'`, `'SIBLINGS'`, `'TYPE'`, `'COLLECTION'`, `'HOOK'`, `'PASS'`, `'COLOR'`, `'KEYINGSET'`, `'LIGHT_TYPE'`\], (optional)) –

Type


  - `CHILDREN_RECURSIVE`
    Children.

  - `CHILDREN`
    Immediate Children.

  - `PARENT`
    Parent.

  - `SIBLINGS`
    Siblings – Shared parent.

  - `TYPE`
    Type – Shared object type.

  - `COLLECTION`
    Collection – Shared collection.

  - `HOOK`
    Hook.

  - `PASS`
    Pass – Render pass index.

  - `COLOR`
    Color – Object color.

  - `KEYINGSET`
    Keying Set – Objects included in active Keying Set.

  - `LIGHT_TYPE`
    Light Type – Matching light types.


bpy.ops.object.select\_hierarchy( _\*_, _direction='PARENT'_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_hierarchy "Link to this definition")

Select object relative to the active object’s position in the hierarchy

Parameters:

- **direction** (enum in \[`'PARENT'`, `'CHILD'`\], (optional)) – Direction, Direction to select in the hierarchy

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the existing selection


File:

[startup/bl\_operators/object.py:172](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L172)

bpy.ops.object.select\_less() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_less "Link to this definition")

Deselect objects at the boundaries of parent/child relationships

bpy.ops.object.select\_linked( _\*_, _extend=False_, _type='OBDATA'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_linked "Link to this definition")

Select all visible objects that are linked

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first

- **type** (enum in \[`'OBDATA'`, `'MATERIAL'`, `'DUPGROUP'`, `'PARTICLE'`, `'LIBRARY'`, `'LIBRARY_OBDATA'`\], (optional)) – Type


bpy.ops.object.select\_mirror( _\*_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_mirror "Link to this definition")

Select the mirror objects of the selected object e.g. “L.sword” and “R.sword”

Parameters:

**extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first

bpy.ops.object.select\_more() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_more "Link to this definition")

Select connected parent/child objects

bpy.ops.object.select\_pattern( _\*_, _pattern='\*'_, _case\_sensitive=False_, _extend=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_pattern "Link to this definition")

Select objects matching a naming pattern

Parameters:

- **pattern** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Pattern, Name filter using ‘\*’, ‘?’ and ‘\[abc\]’ unix style wildcards

- **case\_sensitive** ( _boolean_ _,_ _(_ _optional_ _)_) – Case Sensitive, Do a case sensitive compare

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the existing selection


File:

[startup/bl\_operators/object.py:45](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L45)

bpy.ops.object.select\_random( _\*_, _ratio=0.5_, _seed=0_, _action='SELECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_random "Link to this definition")

Select or deselect random visible objects

Parameters:

- **ratio** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Ratio, Portion of items to select randomly

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed for the random number generator

- **action** (enum in \[`'SELECT'`, `'DESELECT'`\], (optional)) –

Action, Selection action to execute


  - `SELECT`
    Select – Select all elements.

  - `DESELECT`
    Deselect – Deselect all elements.


bpy.ops.object.select\_same\_collection( _\*_, _collection=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.select_same_collection "Link to this definition")

Select object in the same collection

Parameters:

**collection** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Collection, Name of the collection to select

bpy.ops.object.shade\_auto\_smooth( _\*_, _use\_auto\_smooth=True_, _angle=0.523599_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shade_auto_smooth "Link to this definition")

Add modifier to automatically set the sharpness of mesh edges based on the angle between the neighboring faces

Parameters:

- **use\_auto\_smooth** ( _boolean_ _,_ _(_ _optional_ _)_) – Auto Smooth, Add modifier to set edge sharpness automatically

- **angle** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Angle, Maximum angle between face normals that will be considered as smooth


bpy.ops.object.shade\_flat( _\*_, _keep\_sharp\_edges=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shade_flat "Link to this definition")

Render and display faces uniform, using face normals

Parameters:

**keep\_sharp\_edges** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Sharp Edges, Don’t remove sharp edges, which are redundant with faces shaded smooth

bpy.ops.object.shade\_smooth( _\*_, _keep\_sharp\_edges=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shade_smooth "Link to this definition")

Render and display faces smooth, using interpolated vertex normals

Parameters:

**keep\_sharp\_edges** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Sharp Edges, Don’t remove sharp edges. Tagged edges will remain sharp

bpy.ops.object.shade\_smooth\_by\_angle( _\*_, _angle=0.523599_, _keep\_sharp\_edges=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shade_smooth_by_angle "Link to this definition")

Set the sharpness of mesh edges based on the angle between the neighboring faces

Parameters:

- **angle** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Angle, Maximum angle between face normals that will be considered as smooth

- **keep\_sharp\_edges** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Sharp Edges, Only add sharp edges instead of clearing existing tags first


bpy.ops.object.shaderfx\_add( _\*_, _type='FX\_BLUR'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shaderfx_add "Link to this definition")

Add a visual effect to the active object

Parameters:

**type** (enum in [Object Shaderfx Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/object_shaderfx_type_items.html#rna-enum-object-shaderfx-type-items), (optional)) – Type

bpy.ops.object.shaderfx\_copy( _\*_, _shaderfx=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shaderfx_copy "Link to this definition")

Duplicate effect at the same position in the stack

Parameters:

**shaderfx** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Shader, Name of the shaderfx to edit

bpy.ops.object.shaderfx\_move\_down( _\*_, _shaderfx=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shaderfx_move_down "Link to this definition")

Move effect down in the stack

Parameters:

**shaderfx** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Shader, Name of the shaderfx to edit

bpy.ops.object.shaderfx\_move\_to\_index( _\*_, _shaderfx=''_, _index=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shaderfx_move_to_index "Link to this definition")

Change the effect’s position in the list so it evaluates after the set number of others

Parameters:

- **shaderfx** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Shader, Name of the shaderfx to edit

- **index** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Index, The index to move the effect to


bpy.ops.object.shaderfx\_move\_up( _\*_, _shaderfx=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shaderfx_move_up "Link to this definition")

Move effect up in the stack

Parameters:

**shaderfx** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Shader, Name of the shaderfx to edit

bpy.ops.object.shaderfx\_remove( _\*_, _shaderfx=''_, _report=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shaderfx_remove "Link to this definition")

Remove a effect from the active Grease Pencil object

Parameters:

- **shaderfx** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Shader, Name of the shaderfx to edit

- **report** ( _boolean_ _,_ _(_ _optional_ _)_) – Report, Create a notification after the operation


bpy.ops.object.shape\_key\_add( _\*_, _from\_mix=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_add "Link to this definition")

Add shape key to the object

Parameters:

**from\_mix** ( _boolean_ _,_ _(_ _optional_ _)_) – From Mix, Create the new shape key from the existing mix of keys

bpy.ops.object.shape\_key\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_clear "Link to this definition")

Reset the weights of all shape keys to 0 or to the closest value respecting the limits

bpy.ops.object.shape\_key\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_copy "Link to this definition")

Duplicate the active shape key

bpy.ops.object.shape\_key\_lock( _\*_, _action='LOCK'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_lock "Link to this definition")

Change the lock state of all shape keys of active object

Parameters:

**action** (enum in \[`'LOCK'`, `'UNLOCK'`\], (optional)) –

Action, Lock action to execute on vertex groups

- `LOCK`
Lock – Lock all shape keys.

- `UNLOCK`
Unlock – Unlock all shape keys.


bpy.ops.object.shape\_key\_make\_basis() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_make_basis "Link to this definition")

Make this shape key the new basis key, effectively applying it to the mesh. Note that this applies the shape key at its 100% value

bpy.ops.object.shape\_key\_mirror( _\*_, _use\_topology=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_mirror "Link to this definition")

Mirror the current shape key along the local X axis

Parameters:

**use\_topology** ( _boolean_ _,_ _(_ _optional_ _)_) – Topology Mirror, Use topology based mirroring (for when both sides of mesh have matching, unique topology)

bpy.ops.object.shape\_key\_move( _\*_, _type='TOP'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_move "Link to this definition")

Move selected shape keys up/down in the list

Parameters:

**type** (enum in \[`'TOP'`, `'UP'`, `'DOWN'`, `'BOTTOM'`\], (optional)) –

Type

- `TOP`
Top – Top of the list.

- `UP`
Up.

- `DOWN`
Down.

- `BOTTOM`
Bottom – Bottom of the list.


bpy.ops.object.shape\_key\_remove( _\*_, _all=False_, _apply\_mix=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_remove "Link to this definition")

Remove shape key from the object

Parameters:

- **all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Remove all shape keys

- **apply\_mix** ( _boolean_ _,_ _(_ _optional_ _)_) – Apply Mix, Apply current mix of shape keys to the geometry before removing them


bpy.ops.object.shape\_key\_retime() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_retime "Link to this definition")

Resets the timing for absolute shape keys

bpy.ops.object.shape\_key\_transfer( _\*_, _mode='OFFSET'_, _use\_clamp=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.shape_key_transfer "Link to this definition")

Copy the active shape key of another selected object to this one

Parameters:

- **mode** (enum in \[`'OFFSET'`, `'RELATIVE_FACE'`, `'RELATIVE_EDGE'`\], (optional)) –

Transformation Mode, Relative shape positions to the new shape method


  - `OFFSET`
    Offset – Apply the relative positional offset.

  - `RELATIVE_FACE`
    Relative Face – Calculate relative position (using faces).

  - `RELATIVE_EDGE`
    Relative Edge – Calculate relative position (using edges).


- **use\_clamp** ( _boolean_ _,_ _(_ _optional_ _)_) – Clamp Offset, Clamp the transformation to the distance each vertex moves in the original shape


File:

[startup/bl\_operators/object.py:502](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L502)

bpy.ops.object.simulation\_nodes\_cache\_bake( _\*_, _selected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.simulation_nodes_cache_bake "Link to this definition")

Bake simulations in geometry nodes modifiers

Parameters:

**selected** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected, Bake cache on all selected objects

bpy.ops.object.simulation\_nodes\_cache\_calculate\_to\_frame( _\*_, _selected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.simulation_nodes_cache_calculate_to_frame "Link to this definition")

Calculate simulations in geometry nodes modifiers from the start to current frame

Parameters:

**selected** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected, Calculate all selected objects instead of just the active object

bpy.ops.object.simulation\_nodes\_cache\_delete( _\*_, _selected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.simulation_nodes_cache_delete "Link to this definition")

Delete cached/baked simulations in geometry nodes modifiers

Parameters:

**selected** ( _boolean_ _,_ _(_ _optional_ _)_) – Selected, Delete cache on all selected objects

bpy.ops.object.skin\_armature\_create( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.skin_armature_create "Link to this definition")

Create an armature that parallels the skin layout

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.skin\_loose\_mark\_clear( _\*_, _action='MARK'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.skin_loose_mark_clear "Link to this definition")

Mark/clear selected vertices as loose

Parameters:

**action** (enum in \[`'MARK'`, `'CLEAR'`\], (optional)) –

Action

- `MARK`
Mark – Mark selected vertices as loose.

- `CLEAR`
Clear – Set selected vertices as not loose.


bpy.ops.object.skin\_radii\_equalize() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.skin_radii_equalize "Link to this definition")

Make skin radii of selected vertices equal on each axis

bpy.ops.object.skin\_root\_mark() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.skin_root_mark "Link to this definition")

Mark selected vertices as roots

bpy.ops.object.speaker\_add( _\*_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.speaker_add "Link to this definition")

Add a speaker object to the scene

Parameters:

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.subdivision\_set( _\*_, _level=1_, _relative=False_, _ensure\_modifier=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.subdivision_set "Link to this definition")

Sets a Subdivision Surface level (1 to 5)

Parameters:

- **level** ( _int in_ _\[_ _-100_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Level

- **relative** ( _boolean_ _,_ _(_ _optional_ _)_) – Relative, Apply the subdivision surface level as an offset relative to the current level

- **ensure\_modifier** ( _boolean_ _,_ _(_ _optional_ _)_) – Ensure Modifier, Create the corresponding modifier if it does not exist


File:

[startup/bl\_operators/object.py:245](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L245)

bpy.ops.object.surfacedeform\_bind( _\*_, _modifier=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.surfacedeform_bind "Link to this definition")

Bind mesh to target in surface deform modifier

Parameters:

**modifier** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Modifier, Name of the modifier to edit

bpy.ops.object.text\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.text_add "Link to this definition")

Add a text object to the scene

Parameters:

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **enter\_editmode** ( _boolean_ _,_ _(_ _optional_ _)_) – Enter Edit Mode, Enter edit mode when adding this object

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.track\_clear( _\*_, _type='CLEAR'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.track_clear "Link to this definition")

Clear tracking constraint or flag from object

Parameters:

**type** (enum in \[`'CLEAR'`, `'CLEAR_KEEP_TRANSFORM'`\], (optional)) – Type

bpy.ops.object.track\_set( _\*_, _type='DAMPTRACK'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.track_set "Link to this definition")

Make the object track another object, using various methods/constraints

Parameters:

**type** (enum in \[`'DAMPTRACK'`, `'TRACKTO'`, `'LOCKTRACK'`\], (optional)) – Type

bpy.ops.object.transfer\_mode( _\*_, _use\_flash\_on\_transfer=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.transfer_mode "Link to this definition")

Switches the active object and assigns the same mode to a new one under the mouse cursor, leaving the active mode in the current one

Parameters:

**use\_flash\_on\_transfer** ( _boolean_ _,_ _(_ _optional_ _)_) – Flash On Transfer, Flash the target object when transferring the mode

bpy.ops.object.transform\_apply( _\*_, _location=True_, _rotation=True_, _scale=True_, _properties=True_, _isolate\_users=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.transform_apply "Link to this definition")

Apply the object’s transformation to its data

Parameters:

- **location** ( _boolean_ _,_ _(_ _optional_ _)_) – Location

- **rotation** ( _boolean_ _,_ _(_ _optional_ _)_) – Rotation

- **scale** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale

- **properties** ( _boolean_ _,_ _(_ _optional_ _)_) – Apply Properties, Modify properties such as curve vertex radius, font size and bone envelope

- **isolate\_users** ( _boolean_ _,_ _(_ _optional_ _)_) – Isolate Multi User Data, Create new object-data users if needed


bpy.ops.object.transform\_axis\_target() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.transform_axis_target "Link to this definition")

Interactively point cameras and lights to a location (Ctrl translates)

bpy.ops.object.transform\_to\_mouse( _\*_, _name=''_, _session\_uid=0_, _matrix=((0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0))_, _drop\_x=0_, _drop\_y=0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.transform_to_mouse "Link to this definition")

Snap selected item(s) to the mouse location

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Object name to place (uses the active object when this and ‘session\_uid’ are unset)

- **session\_uid** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Session UUID, Session UUID of the object to place (uses the active object when this and ‘name’ are unset)

- **matrix** ( [`mathutils.Matrix`](https://docs.blender.org/api/current/mathutils.html#mathutils.Matrix "mathutils.Matrix") of 4 \* 4 items in \[-inf, inf\], (optional)) – Matrix

- **drop\_x** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop X, X-coordinate (screen space) to place the new object under

- **drop\_y** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Drop Y, Y-coordinate (screen space) to place the new object under


bpy.ops.object.transforms\_to\_deltas( _\*_, _mode='ALL'_, _reset\_values=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.transforms_to_deltas "Link to this definition")

Convert normal object transforms to delta transforms, any existing delta transforms will be included as well

Parameters:

- **mode** (enum in \[`'ALL'`, `'LOC'`, `'ROT'`, `'SCALE'`\], (optional)) –

Mode, Which transforms to transfer


  - `ALL`
    All Transforms – Transfer location, rotation, and scale transforms.

  - `LOC`
    Location – Transfer location transforms only.

  - `ROT`
    Rotation – Transfer rotation transforms only.

  - `SCALE`
    Scale – Transfer scale transforms only.


- **reset\_values** ( _boolean_ _,_ _(_ _optional_ _)_) – Reset Values, Clear transform values after transferring to deltas


File:

[startup/bl\_operators/object.py:764](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/object.py#L764)

bpy.ops.object.unlink\_data() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.unlink_data "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

bpy.ops.object.update\_shapes( _\*_, _use\_mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.update_shapes "Link to this definition")

Update existing shape keys with the vertex positions of selected objects with matching names

Parameters:

**use\_mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror, Mirror the new shape key values

bpy.ops.object.vertex\_group\_add() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_add "Link to this definition")

Add a new vertex group to the active object

bpy.ops.object.vertex\_group\_assign() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_assign "Link to this definition")

Assign the selected vertices to the active vertex group

bpy.ops.object.vertex\_group\_assign\_new() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_assign_new "Link to this definition")

Assign the selected vertices to a new vertex group

bpy.ops.object.vertex\_group\_clean( _\*_, _group\_select\_mode=''_, _limit=0.0_, _keep\_single=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_clean "Link to this definition")

Remove vertex group assignments which are not required

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **limit** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Limit, Remove vertices which weight is below or equal to this limit

- **keep\_single** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Single, Keep verts assigned to at least one group when cleaning


bpy.ops.object.vertex\_group\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_copy "Link to this definition")

Make a copy of the active vertex group

bpy.ops.object.vertex\_group\_copy\_to\_selected() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_copy_to_selected "Link to this definition")

Replace vertex groups of selected objects by vertex groups of active object

bpy.ops.object.vertex\_group\_deselect() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_deselect "Link to this definition")

Deselect all selected vertices assigned to the active vertex group

bpy.ops.object.vertex\_group\_invert( _\*_, _group\_select\_mode=''_, _auto\_assign=True_, _auto\_remove=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_invert "Link to this definition")

Invert active vertex group’s weights

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **auto\_assign** ( _boolean_ _,_ _(_ _optional_ _)_) – Add Weights, Add vertices from groups that have zero weight before inverting

- **auto\_remove** ( _boolean_ _,_ _(_ _optional_ _)_) – Remove Weights, Remove vertices from groups that have zero weight after inverting


bpy.ops.object.vertex\_group\_levels( _\*_, _group\_select\_mode=''_, _offset=0.0_, _gain=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_levels "Link to this definition")

Add some offset and multiply with some gain the weights of the active vertex group

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **offset** ( _float in_ _\[_ _-1_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Value to add to weights

- **gain** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Gain, Value to multiply weights by


bpy.ops.object.vertex\_group\_limit\_total( _\*_, _group\_select\_mode=''_, _limit=4_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_limit_total "Link to this definition")

Limit deform weights associated with a vertex to a specified number by removing lowest weights

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **limit** ( _int in_ _\[_ _1_ _,_ _32_ _\]_ _,_ _(_ _optional_ _)_) – Limit, Maximum number of deform weights


bpy.ops.object.vertex\_group\_lock( _\*_, _action='TOGGLE'_, _mask='ALL'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_lock "Link to this definition")

Change the lock state of all or some vertex groups of active object

Parameters:

- **action** (enum in \[`'TOGGLE'`, `'LOCK'`, `'UNLOCK'`, `'INVERT'`\], (optional)) –

Action, Lock action to execute on vertex groups


  - `TOGGLE`
    Toggle – Unlock all vertex groups if there is at least one locked group, lock all in other case.

  - `LOCK`
    Lock – Lock all vertex groups.

  - `UNLOCK`
    Unlock – Unlock all vertex groups.

  - `INVERT`
    Invert – Invert the lock state of all vertex groups.


- **mask** (enum in \[`'ALL'`, `'SELECTED'`, `'UNSELECTED'`, `'INVERT_UNSELECTED'`\], (optional)) –

Mask, Apply the action based on vertex group selection


  - `ALL`
    All – Apply action to all vertex groups.

  - `SELECTED`
    Selected – Apply to selected vertex groups.

  - `UNSELECTED`
    Unselected – Apply to unselected vertex groups.

  - `INVERT_UNSELECTED`
    Invert Unselected – Apply the opposite of Lock/Unlock to unselected vertex groups.


bpy.ops.object.vertex\_group\_mirror( _\*_, _mirror\_weights=True_, _flip\_group\_names=True_, _all\_groups=False_, _use\_topology=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_mirror "Link to this definition")

Mirror vertex group, flip weights and/or names, editing only selected vertices, flipping when both sides are selected otherwise copy from unselected

Parameters:

- **mirror\_weights** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Weights, Mirror weights

- **flip\_group\_names** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Group Names, Flip vertex group names

- **all\_groups** ( _boolean_ _,_ _(_ _optional_ _)_) – All Groups, Mirror all vertex groups weights

- **use\_topology** ( _boolean_ _,_ _(_ _optional_ _)_) – Topology Mirror, Use topology based mirroring (for when both sides of mesh have matching, unique topology)


bpy.ops.object.vertex\_group\_move( _\*_, _direction='UP'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_move "Link to this definition")

Move the active vertex group up/down in the list

Parameters:

**direction** (enum in \[`'UP'`, `'DOWN'`\], (optional)) – Direction, Direction to move the active vertex group towards

bpy.ops.object.vertex\_group\_normalize() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_normalize "Link to this definition")

Normalize weights of the active vertex group, so that the highest ones are now 1.0

bpy.ops.object.vertex\_group\_normalize\_all( _\*_, _group\_select\_mode=''_, _lock\_active=True_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_normalize_all "Link to this definition")

Normalize all weights of all vertex groups, so that for each vertex, the sum of all weights is 1.0

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **lock\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – Lock Active, Keep the values of the active group while normalizing others


bpy.ops.object.vertex\_group\_quantize( _\*_, _group\_select\_mode=''_, _steps=4_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_quantize "Link to this definition")

Set weights to a fixed number of steps

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **steps** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Steps, Number of steps between 0 and 1


bpy.ops.object.vertex\_group\_remove( _\*_, _all=False_, _all\_unlocked=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_remove "Link to this definition")

Delete the active or all vertex groups from the active object

Parameters:

- **all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Remove all vertex groups

- **all\_unlocked** ( _boolean_ _,_ _(_ _optional_ _)_) – All Unlocked, Remove all unlocked vertex groups


bpy.ops.object.vertex\_group\_remove\_from( _\*_, _use\_all\_groups=False_, _use\_all\_verts=False_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_remove_from "Link to this definition")

Remove the selected vertices from active or all vertex group(s)

Parameters:

- **use\_all\_groups** ( _boolean_ _,_ _(_ _optional_ _)_) – All Groups, Remove from all groups

- **use\_all\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – All Vertices, Clear the active group


bpy.ops.object.vertex\_group\_select() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_select "Link to this definition")

Select all the vertices assigned to the active vertex group

bpy.ops.object.vertex\_group\_set\_active( _\*_, _group=''_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_set_active "Link to this definition")

Set the active vertex group

Parameters:

**group** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Group, Vertex group to set as active

bpy.ops.object.vertex\_group\_smooth( _\*_, _group\_select\_mode=''_, _factor=0.5_, _repeat=1_, _expand=0.0_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_smooth "Link to this definition")

Smooth weights for selected vertices

Parameters:

- **group\_select\_mode** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Subset, Define which subset of groups shall be used

- **factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Factor

- **repeat** ( _int in_ _\[_ _1_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Iterations

- **expand** ( _float in_ _\[_ _-1_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Expand/Contract, Expand/contract weights


bpy.ops.object.vertex\_group\_sort( _\*_, _sort\_type='NAME'_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_sort "Link to this definition")

Sort vertex groups

Parameters:

**sort\_type** (enum in \[`'NAME'`, `'BONE_HIERARCHY'`\], (optional)) – Sort Type, Sort type

bpy.ops.object.vertex\_parent\_set() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_parent_set "Link to this definition")

Parent selected objects to the selected vertices

bpy.ops.object.vertex\_weight\_copy() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_weight_copy "Link to this definition")

Copy weights from active to selected

bpy.ops.object.vertex\_weight\_delete( _\*_, _weight\_group=-1_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_weight_delete "Link to this definition")

Delete this weight from the vertex (disabled if vertex group is locked)

Parameters:

**weight\_group** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Weight Index, Index of source weight in active vertex group

bpy.ops.object.vertex\_weight\_normalize\_active\_vertex() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_weight_normalize_active_vertex "Link to this definition")

Normalize active vertex’s weights

bpy.ops.object.vertex\_weight\_paste( _\*_, _weight\_group=-1_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_weight_paste "Link to this definition")

Copy this group’s weight to other selected vertices (disabled if vertex group is locked)

Parameters:

**weight\_group** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Weight Index, Index of source weight in active vertex group

bpy.ops.object.vertex\_weight\_set\_active( _\*_, _weight\_group=-1_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_weight_set_active "Link to this definition")

Set as active vertex group

Parameters:

**weight\_group** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Weight Index, Index of source weight in active vertex group

bpy.ops.object.visual\_geometry\_to\_objects() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.visual_geometry_to_objects "Link to this definition")

Convert geometry and instances into editable objects and collections

bpy.ops.object.visual\_transform\_apply() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.visual_transform_apply "Link to this definition")

Apply the object’s visual transformation to its data

bpy.ops.object.volume\_add( _\*_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.volume_add "Link to this definition")

Add a volume object to the scene

Parameters:

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.volume\_import( _\*_, _filepath=''_, _directory=''_, _files=None_, _hide\_props\_region=True_, _check\_existing=False_, _filter\_blender=False_, _filter\_backup=False_, _filter\_image=False_, _filter\_movie=False_, _filter\_python=False_, _filter\_font=False_, _filter\_sound=False_, _filter\_text=False_, _filter\_archive=False_, _filter\_btx=False_, _filter\_alembic=False_, _filter\_usd=False_, _filter\_obj=False_, _filter\_volume=True_, _filter\_folder=True_, _filter\_blenlib=False_, _filemode=9_, _relative\_path=True_, _display\_type='DEFAULT'_, _sort\_method=''_, _use\_sequence\_detection=True_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.volume_import "Link to this definition")

Import OpenVDB volume file

Parameters:

- **filepath** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – File Path, Path to file

- **directory** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Directory, Directory of the file

- **files** (`bpy_prop_collection` of `OperatorFileListElement`, (optional)) – Files

- **hide\_props\_region** ( _boolean_ _,_ _(_ _optional_ _)_) – Hide Operator Properties, Collapse the region displaying the operator settings

- **check\_existing** ( _boolean_ _,_ _(_ _optional_ _)_) – Check Existing, Check and warn on overwriting existing files

- **filter\_blender** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter .blend files

- **filter\_backup** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter .blend files

- **filter\_image** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter image files

- **filter\_movie** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter movie files

- **filter\_python** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Python files

- **filter\_font** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter font files

- **filter\_sound** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter sound files

- **filter\_text** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter text files

- **filter\_archive** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter archive files

- **filter\_btx** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter btx files

- **filter\_alembic** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Alembic files

- **filter\_usd** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter USD files

- **filter\_obj** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter OBJ files

- **filter\_volume** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter OpenVDB volume files

- **filter\_folder** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter folders

- **filter\_blenlib** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Blender IDs

- **filemode** ( _int in_ _\[_ _1_ _,_ _9_ _\]_ _,_ _(_ _optional_ _)_) – File Browser Mode, The setting for the file browser mode to load a .blend file, a library or a special file

- **relative\_path** ( _boolean_ _,_ _(_ _optional_ _)_) – Relative Path, Select the file relative to the blend file

- **display\_type** (enum in \[`'DEFAULT'`, `'LIST_VERTICAL'`, `'LIST_HORIZONTAL'`, `'THUMBNAIL'`\], (optional)) –

Display Type


  - `DEFAULT`
    Default – Automatically determine display type for files.

  - `LIST_VERTICAL`
    Short List – Display files as short list.

  - `LIST_HORIZONTAL`
    Long List – Display files as a detailed list.

  - `THUMBNAIL`
    Thumbnails – Display files as thumbnails.


- **sort\_method** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – File sorting mode

- **use\_sequence\_detection** ( _boolean_ _,_ _(_ _optional_ _)_) – Detect Sequences, Automatically detect animated sequences in selected volume files (based on file names)

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align, The alignment of the new object


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location for the newly added object

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation, Rotation for the newly added object

- **scale** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Scale, Scale for the newly added object


bpy.ops.object.voxel\_remesh() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.voxel_remesh "Link to this definition")

Calculates a new manifold mesh based on the volume of the current mesh. All data layers will be lost

bpy.ops.object.voxel\_size\_edit() [¶](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.voxel_size_edit "Link to this definition")

Modify the mesh voxel size interactively used in the voxel remesher