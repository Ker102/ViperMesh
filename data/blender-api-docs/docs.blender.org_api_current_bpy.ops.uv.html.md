ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.uv.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.uv.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Uv Operators [¶](https://docs.blender.org/api/current/bpy.ops.uv.html\#module-bpy.ops.uv "Link to this heading")

bpy.ops.uv.align( _\*_, _axis='ALIGN\_AUTO'_, _position\_mode='MEAN'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.align "Link to this definition")

Aligns selected UV vertices on a line

Parameters:

- **axis** (enum in \[`'ALIGN_S'`, `'ALIGN_T'`, `'ALIGN_U'`, `'ALIGN_AUTO'`, `'ALIGN_X'`, `'ALIGN_Y'`\], (optional)) –

Axis, Axis to align UV locations on


  - `ALIGN_S`
    Straighten – Align UV vertices along the line defined by the endpoints.

  - `ALIGN_T`
    Straighten X – Align UV vertices, moving them horizontally to the line defined by the endpoints.

  - `ALIGN_U`
    Straighten Y – Align UV vertices, moving them vertically to the line defined by the endpoints.

  - `ALIGN_AUTO`
    Align Auto – Automatically choose the direction on which there is most alignment already.

  - `ALIGN_X`
    Align Vertically – Align UV vertices on a vertical line.

  - `ALIGN_Y`
    Align Horizontally – Align UV vertices on a horizontal line.


- **position\_mode** (enum in \[`'MEAN'`, `'MIN'`, `'MAX'`\], (optional)) –

Position Mode, Method of calculating the alignment position


  - `MEAN`
    Mean – Align UVs along the mean position.

  - `MIN`
    Minimum – Align UVs along the minimum position.

  - `MAX`
    Maximum – Align UVs along the maximum position.


bpy.ops.uv.align\_rotation( _\*_, _method='AUTO'_, _axis='X'_, _correct\_aspect=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.align_rotation "Link to this definition")

Align the UV island’s rotation

Parameters:

- **method** (enum in \[`'AUTO'`, `'EDGE'`, `'GEOMETRY'`\], (optional)) –

Method, Method to calculate rotation angle


  - `AUTO`
    Auto – Align from all edges.

  - `EDGE`
    Edge – Only selected edges.

  - `GEOMETRY`
    Geometry – Align to Geometry axis.


- **axis** (enum in \[`'X'`, `'Y'`, `'Z'`\], (optional)) –

Axis, Axis to align to


  - `X`
    X – X axis.

  - `Y`
    Y – Y axis.

  - `Z`
    Z – Z axis.


- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Take image aspect ratio into account


File:

[startup/bl\_operators/uvcalc\_transform.py:360](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/uvcalc_transform.py#L360)

bpy.ops.uv.arrange\_islands( _\*_, _initial\_position='BOUNDING\_BOX'_, _axis='Y'_, _align='MIN'_, _order='LARGE\_TO\_SMALL'_, _margin=0.05_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.arrange_islands "Link to this definition")

Arrange selected UV islands on a line

Parameters:

- **initial\_position** (enum in \[`'BOUNDING_BOX'`, `'UV_GRID'`, `'ACTIVE_UDIM'`, `'CURSOR'`\], (optional)) –

Initial Position, Initial position to arrange islands from


  - `BOUNDING_BOX`
    Bounding Box – Initial alignment based on the islands bounding box.

  - `UV_GRID`
    UV Grid – Initial alignment based on UV Tile Grid.

  - `ACTIVE_UDIM`
    Active UDIM – Initial alignment based on Active UDIM.

  - `CURSOR`
    2D Cursor – Initial alignment based on 2D cursor.


- **axis** (enum in \[`'X'`, `'Y'`\], (optional)) –

Axis, Axis to arrange UV islands on


  - `X`
    X – Align UV islands along the X axis.

  - `Y`
    Y – Align UV islands along the Y axis.


- **align** (enum in \[`'MIN'`, `'MAX'`, `'CENTER'`, `'NONE'`\], (optional)) –

Align, Location to align islands on


  - `MIN`
    Min – Align the islands to the min of the island.

  - `MAX`
    Max – Align the islands to the left side of the island.

  - `CENTER`
    Center – Align the islands to the center of the largest island.

  - `NONE`
    None – Preserve island alignment.


- **order** (enum in \[`'LARGE_TO_SMALL'`, `'SMALL_TO_LARGE'`, `'Fixed'`\], (optional)) –

Order, Order of islands


  - `LARGE_TO_SMALL`
    Largest to Smallest – Sort islands from largest to smallest.

  - `SMALL_TO_LARGE`
    Smallest to Largest – Sort islands from smallest to largest.

  - `Fixed`
    Fixed – Preserve island order.


- **margin** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Margin, Space between islands


bpy.ops.uv.average\_islands\_scale( _\*_, _scale\_uv=False_, _shear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.average_islands_scale "Link to this definition")

Average the size of separate UV islands, based on their area in 3D space

Parameters:

- **scale\_uv** ( _boolean_ _,_ _(_ _optional_ _)_) – Non-Uniform, Scale U and V independently

- **shear** ( _boolean_ _,_ _(_ _optional_ _)_) – Shear, Reduce shear within islands


bpy.ops.uv.copy() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.copy "Link to this definition")

Copy selected UV vertices

bpy.ops.uv.copy\_mirrored\_faces( _\*_, _direction='POSITIVE'_, _precision=3_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.copy_mirrored_faces "Link to this definition")

Copy mirror UV coordinates on the X axis based on a mirrored mesh

Parameters:

- **direction** (enum in \[`'POSITIVE'`, `'NEGATIVE'`\], (optional)) – Axis Direction

- **precision** ( _int in_ _\[_ _1_ _,_ _16_ _\]_ _,_ _(_ _optional_ _)_) – Precision, Tolerance for finding vertex duplicates


bpy.ops.uv.cube\_project( _\*_, _cube\_size=1.0_, _correct\_aspect=True_, _clip\_to\_bounds=False_, _scale\_to\_bounds=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.cube_project "Link to this definition")

Project the UV vertices of the mesh over the six faces of a cube

Parameters:

- **cube\_size** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Cube Size, Size of the cube to project on

- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Map UVs taking aspect ratio of the image associated with the material into account

- **clip\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Clip to Bounds, Clip UV coordinates to bounds after unwrapping

- **scale\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale to Bounds, Scale UV coordinates to bounds after unwrapping


bpy.ops.uv.cursor\_set( _\*_, _location=(0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.cursor_set "Link to this definition")

Set 2D cursor location

Parameters:

**location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-inf, inf\], (optional)) – Location, Cursor location in normalized (0.0 to 1.0) coordinates

bpy.ops.uv.custom\_region\_set( _\*_, _xmin=0_, _xmax=0_, _ymin=0_, _ymax=0_, _wait\_for\_input=True_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.custom_region_set "Link to this definition")

Set the boundaries of the user region

Parameters:

- **xmin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Min

- **xmax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Max

- **ymin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Min

- **ymax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Max

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input


bpy.ops.uv.cylinder\_project( _\*_, _direction='VIEW\_ON\_EQUATOR'_, _align='POLAR\_ZX'_, _pole='PINCH'_, _seam=False_, _radius=1.0_, _correct\_aspect=True_, _clip\_to\_bounds=False_, _scale\_to\_bounds=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.cylinder_project "Link to this definition")

Project the UV vertices of the mesh over the curved wall of a cylinder

Parameters:

- **direction** (enum in \[`'VIEW_ON_EQUATOR'`, `'VIEW_ON_POLES'`, `'ALIGN_TO_OBJECT'`\], (optional)) –

Direction, Direction of the sphere or cylinder


  - `VIEW_ON_EQUATOR`
    View on Equator – 3D view is on the equator.

  - `VIEW_ON_POLES`
    View on Poles – 3D view is on the poles.

  - `ALIGN_TO_OBJECT`
    Align to Object – Align according to object transform.


- **align** (enum in \[`'POLAR_ZX'`, `'POLAR_ZY'`\], (optional)) –

Align, How to determine rotation around the pole


  - `POLAR_ZX`
    Polar ZX – Polar 0 is X.

  - `POLAR_ZY`
    Polar ZY – Polar 0 is Y.


- **pole** (enum in \[`'PINCH'`, `'FAN'`\], (optional)) –

Pole, How to handle faces at the poles


  - `PINCH`
    Pinch – UVs are pinched at the poles.

  - `FAN`
    Fan – UVs are fanned at the poles.


- **seam** ( _boolean_ _,_ _(_ _optional_ _)_) – Preserve Seams, Separate projections by islands isolated by seams

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius, Radius of the sphere or cylinder

- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Map UVs taking aspect ratio of the image associated with the material into account

- **clip\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Clip to Bounds, Clip UV coordinates to bounds after unwrapping

- **scale\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale to Bounds, Scale UV coordinates to bounds after unwrapping


bpy.ops.uv.export\_layout( _\*_, _filepath=''_, _export\_all=False_, _export\_tiles='NONE'_, _modified=False_, _mode='PNG'_, _size=(1024,1024)_, _opacity=0.25_, _check\_existing=True_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.export_layout "Link to this definition")

Export UV layout to file

Parameters:

- **filepath** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – filepath

- **export\_all** ( _boolean_ _,_ _(_ _optional_ _)_) – All UVs, Export all UVs in this mesh (not just visible ones)

- **export\_tiles** (enum in \[`'NONE'`, `'UDIM'`, `'UV'`\], (optional)) –

Export Tiles, Choose whether to export only the \[0, 1\] range, or all UV tiles


  - `NONE`
    None – Export only UVs in the \[0, 1\] range.

  - `UDIM`
    UDIM – Export tiles in the UDIM numbering scheme: 1001 + u\_tile + 10\*v\_tile.

  - `UV`
    UVTILE – Export tiles in the UVTILE numbering scheme: u(u\_tile + 1)\_v(v\_tile + 1).


- **modified** ( _boolean_ _,_ _(_ _optional_ _)_) – Modified, Exports UVs from the modified mesh

- **mode** (enum in \[`'SVG'`, `'EPS'`, `'PNG'`\], (optional)) –

Format, File format to export the UV layout to


  - `SVG`
    Scalable Vector Graphic (.svg) – Export the UV layout to a vector SVG file.

  - `EPS`
    Encapsulated PostScript (.eps) – Export the UV layout to a vector EPS file.

  - `PNG`
    PNG Image (.png) – Export the UV layout to a bitmap image.


- **size** ( _int array_ _of_ _2 items in_ _\[_ _8_ _,_ _32768_ _\]_ _,_ _(_ _optional_ _)_) – Size, Dimensions of the exported file

- **opacity** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Fill Opacity, Set amount of opacity for exported UV layout

- **check\_existing** ( _boolean_ _,_ _(_ _optional_ _)_) – check\_existing


File:

[addons\_core/io\_mesh\_uv\_layout/\_\_init\_\_.py:139](https://projects.blender.org/blender/blender/src/branch/main/scripts/addons_core/io_mesh_uv_layout/__init__.py#L139)

bpy.ops.uv.follow\_active\_quads( _\*_, _mode='LENGTH\_AVERAGE'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.follow_active_quads "Link to this definition")

Follow UVs from active quads along continuous face loops

Parameters:

**mode** (enum in \[`'EVEN'`, `'LENGTH'`, `'LENGTH_AVERAGE'`\], (optional)) –

Edge Length Mode, Method to space UV edge loops

- `EVEN`
Even – Space all UVs evenly.

- `LENGTH`
Length – Average space UVs edge length of each loop.

- `LENGTH_AVERAGE`
Length Average – Average space UVs edge length of each loop.


File:

[startup/bl\_operators/uvcalc\_follow\_active.py:302](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/uvcalc_follow_active.py#L302)

bpy.ops.uv.hide( _\*_, _unselected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.hide "Link to this definition")

Hide (un)selected UV vertices

Parameters:

**unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Hide unselected rather than selected

bpy.ops.uv.lightmap\_pack( _\*_, _PREF\_CONTEXT='SEL\_FACES'_, _PREF\_PACK\_IN\_ONE=True_, _PREF\_NEW\_UVLAYER=False_, _PREF\_BOX\_DIV=12_, _PREF\_MARGIN\_DIV=0.1_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.lightmap_pack "Link to this definition")

Pack each face’s UVs into the UV bounds

Parameters:

- **PREF\_CONTEXT** (enum in \[`'SEL_FACES'`, `'ALL_FACES'`\], (optional)) –

Selection


  - `SEL_FACES`
    Selected Faces – Space all UVs evenly.

  - `ALL_FACES`
    All Faces – Average space UVs edge length of each loop.


- **PREF\_PACK\_IN\_ONE** ( _boolean_ _,_ _(_ _optional_ _)_) – Share Texture Space, Objects share texture space, map all objects into a single UV map

- **PREF\_NEW\_UVLAYER** ( _boolean_ _,_ _(_ _optional_ _)_) – New UV Map, Create a new UV map for every mesh packed

- **PREF\_BOX\_DIV** ( _int in_ _\[_ _1_ _,_ _48_ _\]_ _,_ _(_ _optional_ _)_) – Pack Quality, Quality of the packing. Higher values will be slower but waste less space

- **PREF\_MARGIN\_DIV** ( _float in_ _\[_ _0.001_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Margin, Size of the margin as a division of the UV


File:

[startup/bl\_operators/uvcalc\_lightmap.py:662](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/uvcalc_lightmap.py#L662)

bpy.ops.uv.mark\_seam( _\*_, _clear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.mark_seam "Link to this definition")

Mark selected UV edges as seams

Parameters:

**clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Seams, Clear instead of marking seams

bpy.ops.uv.minimize\_stretch( _\*_, _fill\_holes=True_, _blend=0.0_, _iterations=0_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.minimize_stretch "Link to this definition")

Reduce UV stretching by relaxing angles

Parameters:

- **fill\_holes** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill Holes, Virtually fill holes in mesh before unwrapping, to better avoid overlaps and preserve symmetry

- **blend** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Blend, Blend factor between stretch minimized and original

- **iterations** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Iterations, Number of iterations to run, 0 is unlimited when run interactively


bpy.ops.uv.move\_on\_axis( _\*_, _type='UDIM'_, _axis='X'_, _distance=1_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.move_on_axis "Link to this definition")

Move UVs on an axis

Parameters:

- **type** (enum in \[`'DYNAMIC'`, `'PIXEL'`, `'UDIM'`\], (optional)) –

Type, Move Type


  - `DYNAMIC`
    Dynamic – Move by dynamic grid.

  - `PIXEL`
    Pixel – Move by pixel.

  - `UDIM`
    UDIM – Move by UDIM.


- **axis** (enum in \[`'X'`, `'Y'`\], (optional)) –

Axis, Axis to move UVs on


  - `X`
    X axis – Move vertices on the X axis.

  - `Y`
    Y axis – Move vertices on the Y axis.


- **distance** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Distance, Distance to move UVs


bpy.ops.uv.pack\_islands( _\*_, _udim\_source='CLOSEST\_UDIM'_, _rotate=True_, _rotate\_method='ANY'_, _scale=True_, _merge\_overlap=False_, _margin\_method='SCALED'_, _margin=0.001_, _pin=False_, _pin\_method='LOCKED'_, _shape\_method='CONCAVE'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.pack_islands "Link to this definition")

Transform all islands so that they fill up the UV/UDIM space as much as possible

Parameters:

- **udim\_source** (enum in \[`'CLOSEST_UDIM'`, `'ACTIVE_UDIM'`, `'ORIGINAL_AABB'`, `'CUSTOM_REGION'`\], (optional)) –

Pack to


  - `CLOSEST_UDIM`
    Closest UDIM – Pack islands to closest UDIM.

  - `ACTIVE_UDIM`
    Active UDIM – Pack islands to active UDIM image tile or UDIM grid tile where 2D cursor is located.

  - `ORIGINAL_AABB`
    Original bounding box – Pack to starting bounding box of islands.

  - `CUSTOM_REGION`
    Custom Region – Pack islands to custom region.


- **rotate** ( _boolean_ _,_ _(_ _optional_ _)_) – Rotate, Rotate islands to improve layout

- **rotate\_method** (enum in \[`'ANY'`, `'CARDINAL'`, `'AXIS_ALIGNED'`, `'AXIS_ALIGNED_X'`, `'AXIS_ALIGNED_Y'`\], (optional)) –

Rotation Method


  - `ANY`
    Any – Any angle is allowed for rotation.

  - `CARDINAL`
    Cardinal – Only 90 degree rotations are allowed.

  - `AXIS_ALIGNED`
    Axis-aligned – Rotated to a minimal rectangle, either vertical or horizontal.

  - `AXIS_ALIGNED_X`
    Axis-aligned (Horizontal) – Rotate islands to be aligned horizontally.

  - `AXIS_ALIGNED_Y`
    Axis-aligned (Vertical) – Rotate islands to be aligned vertically.


- **scale** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale, Scale islands to fill unit square

- **merge\_overlap** ( _boolean_ _,_ _(_ _optional_ _)_) – Merge Overlapping, Overlapping islands stick together

- **margin\_method** (enum in \[`'SCALED'`, `'ADD'`, `'FRACTION'`\], (optional)) –

Margin Method


  - `SCALED`
    Scaled – Use scale of existing UVs to multiply margin.

  - `ADD`
    Add – Just add the margin, ignoring any UV scale.

  - `FRACTION`
    Fraction – Specify a precise fraction of final UV output.


- **margin** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Margin, Space between islands

- **pin** ( _boolean_ _,_ _(_ _optional_ _)_) – Lock Pinned Islands, Constrain islands containing any pinned UV’s

- **pin\_method** (enum in \[`'SCALE'`, `'ROTATION'`, `'ROTATION_SCALE'`, `'LOCKED'`\], (optional)) –

Pin Method


  - `SCALE`
    Scale – Pinned islands won’t rescale.

  - `ROTATION`
    Rotation – Pinned islands won’t rotate.

  - `ROTATION_SCALE`
    Rotation and Scale – Pinned islands will translate only.

  - `LOCKED`
    All – Pinned islands are locked in place.


- **shape\_method** (enum in \[`'CONCAVE'`, `'CONVEX'`, `'AABB'`\], (optional)) –

Shape Method


  - `CONCAVE`
    Exact Shape (Concave) – Uses exact geometry.

  - `CONVEX`
    Boundary Shape (Convex) – Uses convex hull.

  - `AABB`
    Bounding Box – Uses bounding boxes.


bpy.ops.uv.paste() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.paste "Link to this definition")

Paste selected UV vertices

bpy.ops.uv.pin( _\*_, _clear=False_, _invert=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.pin "Link to this definition")

Set/clear selected UV vertices as anchored between multiple unwrap operations

Parameters:

- **clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear, Clear pinning for the selection instead of setting it

- **invert** ( _boolean_ _,_ _(_ _optional_ _)_) – Invert, Invert pinning for the selection instead of setting it


bpy.ops.uv.project\_from\_view( _\*_, _orthographic=False_, _camera\_bounds=True_, _correct\_aspect=True_, _clip\_to\_bounds=False_, _scale\_to\_bounds=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.project_from_view "Link to this definition")

Project the UV vertices of the mesh as seen in current 3D view

Parameters:

- **orthographic** ( _boolean_ _,_ _(_ _optional_ _)_) – Orthographic, Use orthographic projection

- **camera\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Camera Bounds, Map UVs to the camera region taking resolution and aspect into account

- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Map UVs taking aspect ratio of the image associated with the material into account

- **clip\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Clip to Bounds, Clip UV coordinates to bounds after unwrapping

- **scale\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale to Bounds, Scale UV coordinates to bounds after unwrapping


bpy.ops.uv.randomize\_uv\_transform( _\*_, _random\_seed=0_, _use\_loc=True_, _loc=(0.0,0.0)_, _use\_rot=True_, _rot=0.0_, _use\_scale=True_, _scale\_even=False_, _scale=(1.0,1.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.randomize_uv_transform "Link to this definition")

Randomize the UV island’s location, rotation, and scale

Parameters:

- **random\_seed** ( _int in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed value for the random generator

- **use\_loc** ( _boolean_ _,_ _(_ _optional_ _)_) – Randomize Location, Randomize the location values

- **loc** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-100, 100\], (optional)) – Location, Maximum distance the objects can spread over each axis

- **use\_rot** ( _boolean_ _,_ _(_ _optional_ _)_) – Randomize Rotation, Randomize the rotation value

- **rot** ( _float in_ _\[_ _-6.28319_ _,_ _6.28319_ _\]_ _,_ _(_ _optional_ _)_) – Rotation, Maximum rotation

- **use\_scale** ( _boolean_ _,_ _(_ _optional_ _)_) – Randomize Scale, Randomize the scale values

- **scale\_even** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale Even, Use the same scale value for both axes

- **scale** ( _float array_ _of_ _2 items in_ _\[_ _-100_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Scale, Maximum scale randomization over each axis


File:

[startup/bl\_operators/uvcalc\_transform.py:536](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/uvcalc_transform.py#L536)

bpy.ops.uv.remove\_doubles( _\*_, _threshold=0.02_, _use\_unselected=False_, _use\_shared\_vertex=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.remove_doubles "Link to this definition")

Selected UV vertices that are within a radius of each other are welded together

Parameters:

- **threshold** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Merge Distance, Maximum distance between welded vertices

- **use\_unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Merge selected to other unselected vertices

- **use\_shared\_vertex** ( _boolean_ _,_ _(_ _optional_ _)_) – Shared Vertex, Weld UVs based on shared vertices


bpy.ops.uv.reset() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.reset "Link to this definition")

Reset UV projection

bpy.ops.uv.reveal( _\*_, _select=True_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.reveal "Link to this definition")

Reveal all hidden UV vertices

Parameters:

**select** ( _boolean_ _,_ _(_ _optional_ _)_) – Select

bpy.ops.uv.rip( _\*_, _mirror=False_, _release\_confirm=False_, _use\_accurate=False_, _location=(0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.rip "Link to this definition")

Rip selected vertices or a selected region

Parameters:

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation

- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-inf, inf\], (optional)) – Location, Mouse location in normalized coordinates, 0.0 to 1.0 is within the image bounds


bpy.ops.uv.rip\_move( _\*_, _UV\_OT\_rip=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.rip_move "Link to this definition")

Unstitch UVs and move the result

Parameters:

- **UV\_OT\_rip** (`UV_OT_rip`, (optional)) – UV Rip, Rip selected vertices or a selected region

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.uv.seams\_from\_islands( _\*_, _mark\_seams=True_, _mark\_sharp=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.seams_from_islands "Link to this definition")

Set mesh seams according to island setup in the UV editor

Parameters:

- **mark\_seams** ( _boolean_ _,_ _(_ _optional_ _)_) – Mark Seams, Mark boundary edges as seams

- **mark\_sharp** ( _boolean_ _,_ _(_ _optional_ _)_) – Mark Sharp, Mark boundary edges as sharp


bpy.ops.uv.select( _\*_, _extend=False_, _deselect=False_, _toggle=False_, _deselect\_all=False_, _select\_passthrough=False_, _location=(0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select "Link to this definition")

Select UV vertices

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Remove from selection

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle Selection, Toggle the selection

- **deselect\_all** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect On Nothing, Deselect all when nothing under the cursor

- **select\_passthrough** ( _boolean_ _,_ _(_ _optional_ _)_) – Only Select Unselected, Ignore the select action when the element is already selected

- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-inf, inf\], (optional)) – Location, Mouse location in normalized coordinates, 0.0 to 1.0 is within the image bounds


bpy.ops.uv.select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_all "Link to this definition")

Change selection of all UV vertices

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


bpy.ops.uv.select\_box( _\*_, _pinned=False_, _xmin=0_, _xmax=0_, _ymin=0_, _ymax=0_, _wait\_for\_input=True_, _mode='SET'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_box "Link to this definition")

Select UV vertices using box selection

Parameters:

- **pinned** ( _boolean_ _,_ _(_ _optional_ _)_) – Pinned, Border select pinned UVs only

- **xmin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Min

- **xmax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Max

- **ymin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Min

- **ymax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Max

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input

- **mode** (enum in \[`'SET'`, `'ADD'`, `'SUB'`\], (optional)) –

Mode


  - `SET`
    Set – Set a new selection.

  - `ADD`
    Extend – Extend existing selection.

  - `SUB`
    Subtract – Subtract existing selection.


bpy.ops.uv.select\_circle( _\*_, _x=0_, _y=0_, _radius=25_, _wait\_for\_input=True_, _mode='SET'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_circle "Link to this definition")

Select UV vertices using circle selection

Parameters:

- **x** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X

- **y** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y

- **radius** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input

- **mode** (enum in \[`'SET'`, `'ADD'`, `'SUB'`\], (optional)) –

Mode


  - `SET`
    Set – Set a new selection.

  - `ADD`
    Extend – Extend existing selection.

  - `SUB`
    Subtract – Subtract existing selection.


bpy.ops.uv.select\_edge\_ring( _\*_, _extend=False_, _location=(0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_edge_ring "Link to this definition")

Select an edge ring of connected UV vertices

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection rather than clearing the existing selection

- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-inf, inf\], (optional)) – Location, Mouse location in normalized coordinates, 0.0 to 1.0 is within the image bounds


bpy.ops.uv.select\_lasso( _\*_, _path=None_, _use\_smooth\_stroke=False_, _smooth\_stroke\_factor=0.75_, _smooth\_stroke\_radius=35_, _mode='SET'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_lasso "Link to this definition")

Select UVs using lasso selection

Parameters:

- **path** (`bpy_prop_collection` of `OperatorMousePath`, (optional)) – Path

- **use\_smooth\_stroke** ( _boolean_ _,_ _(_ _optional_ _)_) – Stabilize Stroke, Selection lags behind mouse and follows a smoother path

- **smooth\_stroke\_factor** ( _float in_ _\[_ _0.5_ _,_ _0.99_ _\]_ _,_ _(_ _optional_ _)_) – Smooth Stroke Factor, Higher values gives a smoother stroke

- **smooth\_stroke\_radius** ( _int in_ _\[_ _10_ _,_ _200_ _\]_ _,_ _(_ _optional_ _)_) – Smooth Stroke Radius, Minimum distance from last point before selection continues

- **mode** (enum in \[`'SET'`, `'ADD'`, `'SUB'`\], (optional)) –

Mode


  - `SET`
    Set – Set a new selection.

  - `ADD`
    Extend – Extend existing selection.

  - `SUB`
    Subtract – Subtract existing selection.


bpy.ops.uv.select\_less() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_less "Link to this definition")

Deselect UV vertices at the boundary of each selection region

bpy.ops.uv.select\_linked() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_linked "Link to this definition")

Select all UV vertices linked to the active UV map

bpy.ops.uv.select\_linked\_pick( _\*_, _extend=False_, _deselect=False_, _location=(0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_linked_pick "Link to this definition")

Select all UV vertices linked under the mouse

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection rather than clearing the existing selection

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Deselect linked UV vertices rather than selecting them

- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-inf, inf\], (optional)) – Location, Mouse location in normalized coordinates, 0.0 to 1.0 is within the image bounds


bpy.ops.uv.select\_loop( _\*_, _extend=False_, _location=(0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_loop "Link to this definition")

Select a loop of connected UV vertices

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection rather than clearing the existing selection

- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 2 items in \[-inf, inf\], (optional)) – Location, Mouse location in normalized coordinates, 0.0 to 1.0 is within the image bounds


bpy.ops.uv.select\_mode( _\*_, _type='VERTEX'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_mode "Link to this definition")

Change UV selection mode

Parameters:

**type** (enum in [Mesh Select Mode Uv Items](https://docs.blender.org/api/current/bpy_types_enum_items/mesh_select_mode_uv_items.html#rna-enum-mesh-select-mode-uv-items), (optional)) – Type

bpy.ops.uv.select\_more() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_more "Link to this definition")

Select more UV vertices connected to initial selection

bpy.ops.uv.select\_overlap( _\*_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_overlap "Link to this definition")

Select all UV faces which overlap each other

Parameters:

**extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection rather than clearing the existing selection

bpy.ops.uv.select\_pinned() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_pinned "Link to this definition")

Select all pinned UV vertices

bpy.ops.uv.select\_similar( _\*_, _type='PIN'_, _compare='EQUAL'_, _threshold=0.0_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_similar "Link to this definition")

Select similar UVs by property types

Parameters:

- **type** (enum in \[`'PIN'`, `'LENGTH'`, `'LENGTH_3D'`, `'AREA'`, `'AREA_3D'`, `'MATERIAL'`, `'OBJECT'`, `'SIDES'`, `'WINDING'`, `'FACE'`\], (optional)) –

Type


  - `PIN`
    Pinned.

  - `LENGTH`
    Length – Edge length in UV space.

  - `LENGTH_3D`
    Length 3D – Length of edge in 3D space.

  - `AREA`
    Area – Face area in UV space.

  - `AREA_3D`
    Area 3D – Area of face in 3D space.

  - `MATERIAL`
    Material.

  - `OBJECT`
    Object.

  - `SIDES`
    Polygon Sides.

  - `WINDING`
    Winding – Face direction defined by (clockwise or anti-clockwise winding (facing up or facing down).

  - `FACE`
    Amount of Faces in Island.


- **compare** (enum in \[`'EQUAL'`, `'GREATER'`, `'LESS'`\], (optional)) – Compare

- **threshold** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Threshold


bpy.ops.uv.select\_split() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.select_split "Link to this definition")

Select only entirely selected faces

bpy.ops.uv.shortest\_path\_pick( _\*_, _use\_face\_step=False_, _use\_topology\_distance=False_, _use\_fill=False_, _skip=0_, _nth=1_, _offset=0_, _object\_index=-1_, _index=-1_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.shortest_path_pick "Link to this definition")

Select shortest path between two selections

Parameters:

- **use\_face\_step** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Stepping, Traverse connected faces (includes diagonals and edge-rings)

- **use\_topology\_distance** ( _boolean_ _,_ _(_ _optional_ _)_) – Topology Distance, Find the minimum number of steps, ignoring spatial distance

- **use\_fill** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill Region, Select all paths between the source/destination elements

- **skip** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Deselected, Number of deselected elements in the repetitive sequence

- **nth** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Selected, Number of selected elements in the repetitive sequence

- **offset** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Offset from the starting point


bpy.ops.uv.shortest\_path\_select( _\*_, _use\_face\_step=False_, _use\_topology\_distance=False_, _use\_fill=False_, _skip=0_, _nth=1_, _offset=0_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.shortest_path_select "Link to this definition")

Selected shortest path between two vertices/edges/faces

Parameters:

- **use\_face\_step** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Stepping, Traverse connected faces (includes diagonals and edge-rings)

- **use\_topology\_distance** ( _boolean_ _,_ _(_ _optional_ _)_) – Topology Distance, Find the minimum number of steps, ignoring spatial distance

- **use\_fill** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill Region, Select all paths between the source/destination elements

- **skip** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Deselected, Number of deselected elements in the repetitive sequence

- **nth** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Selected, Number of selected elements in the repetitive sequence

- **offset** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Offset from the starting point


bpy.ops.uv.smart\_project( _\*_, _angle\_limit=1.15192_, _margin\_method='SCALED'_, _rotate\_method='AXIS\_ALIGNED\_Y'_, _island\_margin=0.0_, _area\_weight=0.0_, _correct\_aspect=True_, _scale\_to\_bounds=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.smart_project "Link to this definition")

Projection unwraps the selected faces of mesh objects

Parameters:

- **angle\_limit** ( _float in_ _\[_ _0_ _,_ _1.5708_ _\]_ _,_ _(_ _optional_ _)_) – Angle Limit, Lower for more projection groups, higher for less distortion

- **margin\_method** (enum in \[`'SCALED'`, `'ADD'`, `'FRACTION'`\], (optional)) –

Margin Method


  - `SCALED`
    Scaled – Use scale of existing UVs to multiply margin.

  - `ADD`
    Add – Just add the margin, ignoring any UV scale.

  - `FRACTION`
    Fraction – Specify a precise fraction of final UV output.


- **rotate\_method** (enum in \[`'AXIS_ALIGNED'`, `'AXIS_ALIGNED_X'`, `'AXIS_ALIGNED_Y'`\], (optional)) –

Rotation Method


  - `AXIS_ALIGNED`
    Axis-aligned – Rotated to a minimal rectangle, either vertical or horizontal.

  - `AXIS_ALIGNED_X`
    Axis-aligned (Horizontal) – Rotate islands to be aligned horizontally.

  - `AXIS_ALIGNED_Y`
    Axis-aligned (Vertical) – Rotate islands to be aligned vertically.


- **island\_margin** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Island Margin, Margin to reduce bleed from adjacent islands

- **area\_weight** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Area Weight, Weight projection’s vector by faces with larger areas

- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Map UVs taking aspect ratio of the image associated with the material into account

- **scale\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale to Bounds, Scale UV coordinates to bounds after unwrapping


bpy.ops.uv.snap\_cursor( _\*_, _target='PIXELS'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.snap_cursor "Link to this definition")

Snap cursor to target type

Parameters:

**target** (enum in \[`'PIXELS'`, `'SELECTED'`, `'ORIGIN'`\], (optional)) – Target, Target to snap the selected UVs to

bpy.ops.uv.snap\_selected( _\*_, _target='PIXELS'_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.snap_selected "Link to this definition")

Snap selected UV vertices to target type

Parameters:

**target** (enum in \[`'PIXELS'`, `'CURSOR'`, `'CURSOR_OFFSET'`, `'ADJACENT_UNSELECTED'`\], (optional)) – Target, Target to snap the selected UVs to

bpy.ops.uv.sphere\_project( _\*_, _direction='VIEW\_ON\_EQUATOR'_, _align='POLAR\_ZX'_, _pole='PINCH'_, _seam=False_, _correct\_aspect=True_, _clip\_to\_bounds=False_, _scale\_to\_bounds=False_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.sphere_project "Link to this definition")

Project the UV vertices of the mesh over the curved surface of a sphere

Parameters:

- **direction** (enum in \[`'VIEW_ON_EQUATOR'`, `'VIEW_ON_POLES'`, `'ALIGN_TO_OBJECT'`\], (optional)) –

Direction, Direction of the sphere or cylinder


  - `VIEW_ON_EQUATOR`
    View on Equator – 3D view is on the equator.

  - `VIEW_ON_POLES`
    View on Poles – 3D view is on the poles.

  - `ALIGN_TO_OBJECT`
    Align to Object – Align according to object transform.


- **align** (enum in \[`'POLAR_ZX'`, `'POLAR_ZY'`\], (optional)) –

Align, How to determine rotation around the pole


  - `POLAR_ZX`
    Polar ZX – Polar 0 is X.

  - `POLAR_ZY`
    Polar ZY – Polar 0 is Y.


- **pole** (enum in \[`'PINCH'`, `'FAN'`\], (optional)) –

Pole, How to handle faces at the poles


  - `PINCH`
    Pinch – UVs are pinched at the poles.

  - `FAN`
    Fan – UVs are fanned at the poles.


- **seam** ( _boolean_ _,_ _(_ _optional_ _)_) – Preserve Seams, Separate projections by islands isolated by seams

- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Map UVs taking aspect ratio of the image associated with the material into account

- **clip\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Clip to Bounds, Clip UV coordinates to bounds after unwrapping

- **scale\_to\_bounds** ( _boolean_ _,_ _(_ _optional_ _)_) – Scale to Bounds, Scale UV coordinates to bounds after unwrapping


bpy.ops.uv.stitch( _\*_, _use\_limit=False_, _snap\_islands=True_, _limit=0.01_, _static\_island=0_, _active\_object\_index=0_, _midpoint\_snap=False_, _clear\_seams=True_, _mode='VERTEX'_, _stored\_mode='VERTEX'_, _selection=None_, _objects\_selection\_count=(0,0,0,0,0,0)_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.stitch "Link to this definition")

Stitch selected UV vertices by proximity

Parameters:

- **use\_limit** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Limit, Stitch UVs within a specified limit distance

- **snap\_islands** ( _boolean_ _,_ _(_ _optional_ _)_) – Snap Islands, Snap islands together (on edge stitch mode, rotates the islands too)

- **limit** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Limit, Limit distance in normalized coordinates

- **static\_island** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Static Island, Island that stays in place when stitching islands

- **active\_object\_index** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Active Object, Index of the active object

- **midpoint\_snap** ( _boolean_ _,_ _(_ _optional_ _)_) – Snap at Midpoint, UVs are stitched at midpoint instead of at static island

- **clear\_seams** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Seams, Clear seams of stitched edges

- **mode** (enum in \[`'VERTEX'`, `'EDGE'`\], (optional)) – Operation Mode, Use vertex or edge stitching

- **stored\_mode** (enum in \[`'VERTEX'`, `'EDGE'`\], (optional)) – Stored Operation Mode, Use vertex or edge stitching

- **selection** (`bpy_prop_collection` of `SelectedUvElement`, (optional)) – Selection

- **objects\_selection\_count** ( _int array_ _of_ _6 items in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Objects Selection Count


bpy.ops.uv.unwrap( _\*_, _method='CONFORMAL'_, _fill\_holes=False_, _correct\_aspect=True_, _use\_subsurf\_data=False_, _margin\_method='SCALED'_, _margin=0.001_, _no\_flip=False_, _iterations=10_, _use\_weights=False_, _weight\_group='uv\_importance'_, _weight\_factor=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.unwrap "Link to this definition")

Unwrap the mesh of the object being edited

Parameters:

- **method** (enum in \[`'ANGLE_BASED'`, `'CONFORMAL'`, `'MINIMUM_STRETCH'`\], (optional)) – Method, Unwrapping method (Angle Based usually gives better results than Conformal, while being somewhat slower)

- **fill\_holes** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill Holes, Virtually fill holes in mesh before unwrapping, to better avoid overlaps and preserve symmetry

- **correct\_aspect** ( _boolean_ _,_ _(_ _optional_ _)_) – Correct Aspect, Map UVs taking aspect ratio of the image associated with the material into account

- **use\_subsurf\_data** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Subdivision Surface, Map UVs taking vertex position after Subdivision Surface modifier has been applied

- **margin\_method** (enum in \[`'SCALED'`, `'ADD'`, `'FRACTION'`\], (optional)) –

Margin Method


  - `SCALED`
    Scaled – Use scale of existing UVs to multiply margin.

  - `ADD`
    Add – Just add the margin, ignoring any UV scale.

  - `FRACTION`
    Fraction – Specify a precise fraction of final UV output.


- **margin** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Margin, Space between islands

- **no\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – No Flip, Prevent flipping UV’s, flipping may lower distortion depending on the position of pins

- **iterations** ( _int in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Iterations, Number of iterations when “Minimum Stretch” method is used

- **use\_weights** ( _boolean_ _,_ _(_ _optional_ _)_) – Importance Weights, Whether to take into account per-vertex importance weights

- **weight\_group** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Weight Group, Vertex group name for importance weights (modulating the deform)

- **weight\_factor** ( _float in_ _\[_ _-10000_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Weight Factor, How much influence the weightmap has for weighted parameterization, 0 being no influence


bpy.ops.uv.weld() [¶](https://docs.blender.org/api/current/bpy.ops.uv.html#bpy.ops.uv.weld "Link to this definition")

Weld selected UV vertices together