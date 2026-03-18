ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.curve.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.curve.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Curve Operators [¶](https://docs.blender.org/api/current/bpy.ops.curve.html\#module-bpy.ops.curve "Link to this heading")

bpy.ops.curve.cyclic\_toggle( _\*_, _direction='CYCLIC\_U'_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.cyclic_toggle "Link to this definition")

Make active spline closed/opened loop

Parameters:

**direction** (enum in \[`'CYCLIC_U'`, `'CYCLIC_V'`\], (optional)) – Direction, Direction to make surface cyclic in

bpy.ops.curve.de\_select\_first() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.de_select_first "Link to this definition")

(De)select first of visible part of each NURBS

bpy.ops.curve.de\_select\_last() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.de_select_last "Link to this definition")

(De)select last of visible part of each NURBS

bpy.ops.curve.decimate( _\*_, _ratio=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.decimate "Link to this definition")

Simplify selected curves

Parameters:

**ratio** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Ratio

bpy.ops.curve.delete( _\*_, _type='VERT'_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.delete "Link to this definition")

Delete selected control points or segments

Parameters:

**type** (enum in \[`'VERT'`, `'SEGMENT'`\], (optional)) – Type, Which elements to delete

bpy.ops.curve.dissolve\_verts() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.dissolve_verts "Link to this definition")

Delete selected control points, correcting surrounding handles

bpy.ops.curve.draw( _\*_, _error\_threshold=0.0_, _fit\_method='REFIT'_, _corner\_angle=1.22173_, _use\_cyclic=True_, _stroke=None_, _wait\_for\_input=True_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.draw "Link to this definition")

Draw a freehand spline

Parameters:

- **error\_threshold** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Error, Error distance threshold (in object units)

- **fit\_method** (enum in [Curve Fit Method Items](https://docs.blender.org/api/current/bpy_types_enum_items/curve_fit_method_items.html#rna-enum-curve-fit-method-items), (optional)) – Fit Method

- **corner\_angle** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Corner Angle

- **use\_cyclic** ( _boolean_ _,_ _(_ _optional_ _)_) – Cyclic

- **stroke** (`bpy_prop_collection` of `OperatorStrokeElement`, (optional)) – Stroke

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input


bpy.ops.curve.duplicate() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.duplicate "Link to this definition")

Duplicate selected control points

bpy.ops.curve.duplicate\_move( _\*_, _CURVE\_OT\_duplicate=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.duplicate_move "Link to this definition")

Duplicate curve and move

Parameters:

- **CURVE\_OT\_duplicate** (`CURVE_OT_duplicate`, (optional)) – Duplicate Curve, Duplicate selected control points

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.curve.extrude( _\*_, _mode='TRANSLATION'_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.extrude "Link to this definition")

Extrude selected control point(s)

Parameters:

**mode** (enum in [Transform Mode Type Items](https://docs.blender.org/api/current/bpy_types_enum_items/transform_mode_type_items.html#rna-enum-transform-mode-type-items), (optional)) – Mode

bpy.ops.curve.extrude\_move( _\*_, _CURVE\_OT\_extrude=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.extrude_move "Link to this definition")

Extrude curve and move result

Parameters:

- **CURVE\_OT\_extrude** (`CURVE_OT_extrude`, (optional)) – Extrude, Extrude selected control point(s)

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.curve.handle\_type\_set( _\*_, _type='AUTOMATIC'_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.handle_type_set "Link to this definition")

Set type of handles for selected control points

Parameters:

**type** (enum in \[`'AUTOMATIC'`, `'VECTOR'`, `'ALIGNED'`, `'FREE_ALIGN'`, `'TOGGLE_FREE_ALIGN'`\], (optional)) – Type, Spline type

bpy.ops.curve.hide( _\*_, _unselected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.hide "Link to this definition")

Hide (un)selected control points

Parameters:

**unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Hide unselected rather than selected

bpy.ops.curve.make\_segment() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.make_segment "Link to this definition")

Join two curves by their selected ends

bpy.ops.curve.match\_texture\_space() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.match_texture_space "Link to this definition")

Match texture space to object’s bounding box

bpy.ops.curve.normals\_make\_consistent( _\*_, _calc\_length=False_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.normals_make_consistent "Link to this definition")

Recalculate the direction of selected handles

Parameters:

**calc\_length** ( _boolean_ _,_ _(_ _optional_ _)_) – Length, Recalculate handle length

bpy.ops.curve.pen( _\*_, _extend=False_, _deselect=False_, _toggle=False_, _deselect\_all=False_, _select\_passthrough=False_, _extrude\_point=False_, _extrude\_handle='VECTOR'_, _delete\_point=False_, _insert\_point=False_, _move\_segment=False_, _select\_point=False_, _move\_point=False_, _close\_spline=True_, _close\_spline\_method='OFF'_, _toggle\_vector=False_, _cycle\_handle\_type=False_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.pen "Link to this definition")

Construct and edit splines

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Remove from selection

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle Selection, Toggle the selection

- **deselect\_all** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect On Nothing, Deselect all when nothing under the cursor

- **select\_passthrough** ( _boolean_ _,_ _(_ _optional_ _)_) – Only Select Unselected, Ignore the select action when the element is already selected

- **extrude\_point** ( _boolean_ _,_ _(_ _optional_ _)_) – Extrude Point, Add a point connected to the last selected point

- **extrude\_handle** (enum in \[`'AUTO'`, `'VECTOR'`\], (optional)) – Extrude Handle Type, Type of the extruded handle

- **delete\_point** ( _boolean_ _,_ _(_ _optional_ _)_) – Delete Point, Delete an existing point

- **insert\_point** ( _boolean_ _,_ _(_ _optional_ _)_) – Insert Point, Insert Point into a curve segment

- **move\_segment** ( _boolean_ _,_ _(_ _optional_ _)_) – Move Segment, Delete an existing point

- **select\_point** ( _boolean_ _,_ _(_ _optional_ _)_) – Select Point, Select a point or its handles

- **move\_point** ( _boolean_ _,_ _(_ _optional_ _)_) – Move Point, Move a point or its handles

- **close\_spline** ( _boolean_ _,_ _(_ _optional_ _)_) – Close Spline, Make a spline cyclic by clicking endpoints

- **close\_spline\_method** (enum in \[`'OFF'`, `'ON_PRESS'`, `'ON_CLICK'`\], (optional)) –

Close Spline Method, The condition for close spline to activate


  - `OFF`
    None.

  - `ON_PRESS`
    On Press – Move handles after closing the spline.

  - `ON_CLICK`
    On Click – Spline closes on release if not dragged.


- **toggle\_vector** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle Vector, Toggle between Vector and Auto handles

- **cycle\_handle\_type** ( _boolean_ _,_ _(_ _optional_ _)_) – Cycle Handle Type, Cycle between all four handle types


bpy.ops.curve.primitive\_bezier\_circle\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.primitive_bezier_circle_add "Link to this definition")

Construct a Bézier Circle

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


bpy.ops.curve.primitive\_bezier\_curve\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.primitive_bezier_curve_add "Link to this definition")

Construct a Bézier Curve

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


bpy.ops.curve.primitive\_nurbs\_circle\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.primitive_nurbs_circle_add "Link to this definition")

Construct a Nurbs Circle

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


bpy.ops.curve.primitive\_nurbs\_curve\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.primitive_nurbs_curve_add "Link to this definition")

Construct a Nurbs Curve

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


bpy.ops.curve.primitive\_nurbs\_path\_add( _\*_, _radius=1.0_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.primitive_nurbs_path_add "Link to this definition")

Construct a Path

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


bpy.ops.curve.radius\_set( _\*_, _radius=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.radius_set "Link to this definition")

Set per-point radius which is used for bevel tapering

Parameters:

**radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

bpy.ops.curve.reveal( _\*_, _select=True_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.reveal "Link to this definition")

Reveal hidden control points

Parameters:

**select** ( _boolean_ _,_ _(_ _optional_ _)_) – Select

bpy.ops.curve.select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_all "Link to this definition")

(De)select all control points

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


bpy.ops.curve.select\_less() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_less "Link to this definition")

Deselect control points at the boundary of each selection region

bpy.ops.curve.select\_linked() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_linked "Link to this definition")

Select all control points linked to the current selection

bpy.ops.curve.select\_linked\_pick( _\*_, _deselect=False_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_linked_pick "Link to this definition")

Select all control points linked to already selected ones

Parameters:

**deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Deselect linked control points rather than selecting them

bpy.ops.curve.select\_more() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_more "Link to this definition")

Select control points at the boundary of each selection region

bpy.ops.curve.select\_next() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_next "Link to this definition")

Select control points following already selected ones along the curves

bpy.ops.curve.select\_nth( _\*_, _skip=1_, _nth=1_, _offset=0_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_nth "Link to this definition")

Deselect every Nth point starting from the active one

Parameters:

- **skip** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Deselected, Number of deselected elements in the repetitive sequence

- **nth** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Selected, Number of selected elements in the repetitive sequence

- **offset** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Offset from the starting point


bpy.ops.curve.select\_previous() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_previous "Link to this definition")

Select control points preceding already selected ones along the curves

bpy.ops.curve.select\_random( _\*_, _ratio=0.5_, _seed=0_, _action='SELECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_random "Link to this definition")

Randomly select some control points

Parameters:

- **ratio** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Ratio, Portion of items to select randomly

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed for the random number generator

- **action** (enum in \[`'SELECT'`, `'DESELECT'`\], (optional)) –

Action, Selection action to execute


  - `SELECT`
    Select – Select all elements.

  - `DESELECT`
    Deselect – Deselect all elements.


bpy.ops.curve.select\_row() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_row "Link to this definition")

Select a row of control points including active one. Successive use on the same point switches between U/V directions

bpy.ops.curve.select\_similar( _\*_, _type='WEIGHT'_, _compare='EQUAL'_, _threshold=0.1_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.select_similar "Link to this definition")

Select similar curve points by property type

Parameters:

- **type** (enum in \[`'TYPE'`, `'RADIUS'`, `'WEIGHT'`, `'DIRECTION'`\], (optional)) – Type

- **compare** (enum in \[`'EQUAL'`, `'GREATER'`, `'LESS'`\], (optional)) – Compare

- **threshold** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Threshold


bpy.ops.curve.separate() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.separate "Link to this definition")

Separate selected points from connected unselected points into a new object

bpy.ops.curve.shade\_flat() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.shade_flat "Link to this definition")

Set shading to flat

bpy.ops.curve.shade\_smooth() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.shade_smooth "Link to this definition")

Set shading to smooth

bpy.ops.curve.shortest\_path\_pick() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.shortest_path_pick "Link to this definition")

Select shortest path between two selections

bpy.ops.curve.smooth() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.smooth "Link to this definition")

Flatten angles of selected points

bpy.ops.curve.smooth\_radius() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.smooth_radius "Link to this definition")

Interpolate radii of selected points

bpy.ops.curve.smooth\_tilt() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.smooth_tilt "Link to this definition")

Interpolate tilt of selected points

bpy.ops.curve.smooth\_weight() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.smooth_weight "Link to this definition")

Interpolate weight of selected points

bpy.ops.curve.spin( _\*_, _center=(0.0,0.0,0.0)_, _axis=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.spin "Link to this definition")

Extrude selected boundary row around pivot point and current view axis

Parameters:

- **center** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Center, Center in global view space

- **axis** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-1, 1\], (optional)) – Axis, Axis in global view space


bpy.ops.curve.spline\_type\_set( _\*_, _type='POLY'_, _use\_handles=False_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.spline_type_set "Link to this definition")

Set type of active spline

Parameters:

- **type** (enum in \[`'POLY'`, `'BEZIER'`, `'NURBS'`\], (optional)) – Type, Spline type

- **use\_handles** ( _boolean_ _,_ _(_ _optional_ _)_) – Handles, Use handles when converting Bézier curves into polygons


bpy.ops.curve.spline\_weight\_set( _\*_, _weight=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.spline_weight_set "Link to this definition")

Set softbody goal weight for selected points

Parameters:

**weight** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Weight

bpy.ops.curve.split() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.split "Link to this definition")

Split off selected points from connected unselected points

bpy.ops.curve.subdivide( _\*_, _number\_cuts=1_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.subdivide "Link to this definition")

Subdivide selected segments

Parameters:

**number\_cuts** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Number of Cuts

bpy.ops.curve.switch\_direction() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.switch_direction "Link to this definition")

Switch direction of selected splines

bpy.ops.curve.tilt\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.tilt_clear "Link to this definition")

Clear the tilt of selected control points

bpy.ops.curve.vertex\_add( _\*_, _location=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.curve.html#bpy.ops.curve.vertex_add "Link to this definition")

Add a new control point (linked to only selected end-curve one, if any)

Parameters:

**location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location, Location to add new vertex at