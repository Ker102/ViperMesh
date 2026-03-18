ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.mesh.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.mesh.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Mesh Operators [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html\#module-bpy.ops.mesh "Link to this heading")

bpy.ops.mesh.attribute\_set( _\*_, _value\_float=0.0_, _value\_float\_vector\_2d=(0.0,0.0)_, _value\_float\_vector\_3d=(0.0,0.0,0.0)_, _value\_int=0_, _value\_int\_vector\_2d=(0,0)_, _value\_color=(1.0,1.0,1.0,1.0)_, _value\_bool=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.attribute_set "Link to this definition")

Set values of the active attribute for selected elements

Parameters:

- **value\_float** ( _float in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Value

- **value\_float\_vector\_2d** ( _float array_ _of_ _2 items in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Value

- **value\_float\_vector\_3d** ( _float array_ _of_ _3 items in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Value

- **value\_int** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Value

- **value\_int\_vector\_2d** ( _int array_ _of_ _2 items in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Value

- **value\_color** ( _float array_ _of_ _4 items in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Value

- **value\_bool** ( _boolean_ _,_ _(_ _optional_ _)_) – Value


bpy.ops.mesh.average\_normals( _\*_, _average\_type='CUSTOM\_NORMAL'_, _weight=50_, _threshold=0.01_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.average_normals "Link to this definition")

Average custom normals of selected vertices

Parameters:

- **average\_type** (enum in \[`'CUSTOM_NORMAL'`, `'FACE_AREA'`, `'CORNER_ANGLE'`\], (optional)) –

Type, Averaging method


  - `CUSTOM_NORMAL`
    Custom Normal – Take average of vertex normals.

  - `FACE_AREA`
    Face Area – Set all vertex normals by face area.

  - `CORNER_ANGLE`
    Corner Angle – Set all vertex normals by corner angle.


- **weight** ( _int in_ _\[_ _1_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Weight, Weight applied per face

- **threshold** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Threshold, Threshold value for different weights to be considered equal


bpy.ops.mesh.beautify\_fill( _\*_, _angle\_limit=3.14159_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.beautify_fill "Link to this definition")

Rearrange some faces to try to get less degenerated geometry

Parameters:

**angle\_limit** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Angle, Angle limit

bpy.ops.mesh.bevel( _\*_, _offset\_type='OFFSET'_, _offset=0.0_, _profile\_type='SUPERELLIPSE'_, _offset\_pct=0.0_, _segments=1_, _profile=0.5_, _affect='EDGES'_, _clamp\_overlap=False_, _loop\_slide=True_, _mark\_seam=False_, _mark\_sharp=False_, _material=-1_, _harden\_normals=False_, _face\_strength\_mode='NONE'_, _miter\_outer='SHARP'_, _miter\_inner='SHARP'_, _spread=0.1_, _vmesh\_method='ADJ'_, _release\_confirm=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.bevel "Link to this definition")

Cut into selected items at an angle to create bevel or chamfer

Parameters:

- **offset\_type** (enum in \[`'OFFSET'`, `'WIDTH'`, `'DEPTH'`, `'PERCENT'`, `'ABSOLUTE'`\], (optional)) –

Width Type, The method for determining the size of the bevel


  - `OFFSET`
    Offset – Amount is offset of new edges from original.

  - `WIDTH`
    Width – Amount is width of new face.

  - `DEPTH`
    Depth – Amount is perpendicular distance from original edge to bevel face.

  - `PERCENT`
    Percent – Amount is percent of adjacent edge length.

  - `ABSOLUTE`
    Absolute – Amount is absolute distance along adjacent edge.


- **offset** ( _float in_ _\[_ _0_ _,_ _1e+06_ _\]_ _,_ _(_ _optional_ _)_) – Width, Bevel amount

- **profile\_type** (enum in \[`'SUPERELLIPSE'`, `'CUSTOM'`\], (optional)) –

Profile Type, The type of shape used to rebuild a beveled section


  - `SUPERELLIPSE`
    Superellipse – The profile can be a concave or convex curve.

  - `CUSTOM`
    Custom – The profile can be any arbitrary path between its endpoints.


- **offset\_pct** ( _float in_ _\[_ _0_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Width Percent, Bevel amount for percentage method

- **segments** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Segments, Segments for curved edge

- **profile** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Profile, Controls profile shape (0.5 = round)

- **affect** (enum in \[`'VERTICES'`, `'EDGES'`\], (optional)) –

Affect, Affect edges or vertices


  - `VERTICES`
    Vertices – Affect only vertices.

  - `EDGES`
    Edges – Affect only edges.


- **clamp\_overlap** ( _boolean_ _,_ _(_ _optional_ _)_) – Clamp Overlap, Do not allow beveled edges/vertices to overlap each other

- **loop\_slide** ( _boolean_ _,_ _(_ _optional_ _)_) – Loop Slide, Prefer sliding along edges to even widths

- **mark\_seam** ( _boolean_ _,_ _(_ _optional_ _)_) – Mark Seams, Preserve seams along beveled edges

- **mark\_sharp** ( _boolean_ _,_ _(_ _optional_ _)_) – Mark Sharp, Preserve sharp edges along beveled edges

- **material** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Material Index, Material for bevel faces (-1 means use adjacent faces)

- **harden\_normals** ( _boolean_ _,_ _(_ _optional_ _)_) – Harden Normals, Match normals of new faces to adjacent faces

- **face\_strength\_mode** (enum in \[`'NONE'`, `'NEW'`, `'AFFECTED'`, `'ALL'`\], (optional)) –

Face Strength Mode, Whether to set face strength, and which faces to set face strength on


  - `NONE`
    None – Do not set face strength.

  - `NEW`
    New – Set face strength on new faces only.

  - `AFFECTED`
    Affected – Set face strength on new and modified faces only.

  - `ALL`
    All – Set face strength on all faces.


- **miter\_outer** (enum in \[`'SHARP'`, `'PATCH'`, `'ARC'`\], (optional)) –

Outer Miter, Pattern to use for outside of miters


  - `SHARP`
    Sharp – Outside of miter is sharp.

  - `PATCH`
    Patch – Outside of miter is squared-off patch.

  - `ARC`
    Arc – Outside of miter is arc.


- **miter\_inner** (enum in \[`'SHARP'`, `'ARC'`\], (optional)) –

Inner Miter, Pattern to use for inside of miters


  - `SHARP`
    Sharp – Inside of miter is sharp.

  - `ARC`
    Arc – Inside of miter is arc.


- **spread** ( _float in_ _\[_ _0_ _,_ _1e+06_ _\]_ _,_ _(_ _optional_ _)_) – Spread, Amount to spread arcs for arc inner miters

- **vmesh\_method** (enum in \[`'ADJ'`, `'CUTOFF'`\], (optional)) –

Vertex Mesh Method, The method to use to create meshes at intersections


  - `ADJ`
    Grid Fill – Default patterned fill.

  - `CUTOFF`
    Cutoff – A cutoff at each profile’s end before the intersection.


- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release


bpy.ops.mesh.bisect( _\*_, _plane\_co=(0.0,0.0,0.0)_, _plane\_no=(0.0,0.0,0.0)_, _use\_fill=False_, _clear\_inner=False_, _clear\_outer=False_, _threshold=0.0001_, _xstart=0_, _xend=0_, _ystart=0_, _yend=0_, _flip=False_, _cursor=5_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.bisect "Link to this definition")

Cut geometry along a plane (click-drag to define plane)

Parameters:

- **plane\_co** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Plane Point, A point on the plane

- **plane\_no** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-1, 1\], (optional)) – Plane Normal, The direction the plane points

- **use\_fill** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill, Fill in the cut

- **clear\_inner** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Inner, Remove geometry behind the plane

- **clear\_outer** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear Outer, Remove geometry in front of the plane

- **threshold** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Axis Threshold, Preserves the existing geometry along the cut plane

- **xstart** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Start

- **xend** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X End

- **ystart** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Start

- **yend** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y End

- **flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip

- **cursor** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Cursor, Mouse cursor style to use during the modal operator


bpy.ops.mesh.blend\_from\_shape( _\*_, _shape=''_, _blend=1.0_, _add=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.blend_from_shape "Link to this definition")

Blend in shape from a shape key

Parameters:

- **shape** ( _enum in_ _\[_ _\]_ _,_ _(_ _optional_ _)_) – Shape, Shape key to use for blending

- **blend** ( _float in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Blend, Blending factor

- **add** ( _boolean_ _,_ _(_ _optional_ _)_) – Add, Add rather than blend between shapes


bpy.ops.mesh.bridge\_edge\_loops( _\*_, _type='SINGLE'_, _use\_merge=False_, _merge\_factor=0.5_, _twist\_offset=0_, _number\_cuts=0_, _interpolation='PATH'_, _smoothness=1.0_, _profile\_shape\_factor=0.0_, _profile\_shape='SMOOTH'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.bridge_edge_loops "Link to this definition")

Create a bridge of faces between two or more selected edge loops

Parameters:

- **type** (enum in \[`'SINGLE'`, `'CLOSED'`, `'PAIRS'`\], (optional)) – Connect Loops, Method of bridging multiple loops

- **use\_merge** ( _boolean_ _,_ _(_ _optional_ _)_) – Merge, Merge rather than creating faces

- **merge\_factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Merge Factor

- **twist\_offset** ( _int in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Twist, Twist offset for closed loops

- **number\_cuts** ( _int in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Number of Cuts

- **interpolation** (enum in \[`'LINEAR'`, `'PATH'`, `'SURFACE'`\], (optional)) – Interpolation, Interpolation method

- **smoothness** ( _float in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Smoothness, Smoothness factor

- **profile\_shape\_factor** ( _float in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Profile Factor, How much intermediary new edges are shrunk/expanded

- **profile\_shape** (enum in [Proportional Falloff Curve Only Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_curve_only_items.html#rna-enum-proportional-falloff-curve-only-items), (optional)) – Profile Shape, Shape of the profile


bpy.ops.mesh.colors\_reverse() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.colors_reverse "Link to this definition")

Flip direction of face corner color attribute inside faces

bpy.ops.mesh.colors\_rotate( _\*_, _use\_ccw=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.colors_rotate "Link to this definition")

Rotate face corner color attribute inside faces

Parameters:

**use\_ccw** ( _boolean_ _,_ _(_ _optional_ _)_) – Counter Clockwise

bpy.ops.mesh.convex\_hull( _\*_, _delete\_unused=True_, _use\_existing\_faces=True_, _make\_holes=False_, _join\_triangles=True_, _face\_threshold=0.698132_, _shape\_threshold=0.698132_, _topology\_influence=0.0_, _uvs=False_, _vcols=False_, _seam=False_, _sharp=False_, _materials=False_, _deselect\_joined=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.convex_hull "Link to this definition")

Enclose selected vertices in a convex polyhedron

Parameters:

- **delete\_unused** ( _boolean_ _,_ _(_ _optional_ _)_) – Delete Unused, Delete selected elements that are not used by the hull

- **use\_existing\_faces** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Existing Faces, Skip hull triangles that are covered by a pre-existing face

- **make\_holes** ( _boolean_ _,_ _(_ _optional_ _)_) – Make Holes, Delete selected faces that are used by the hull

- **join\_triangles** ( _boolean_ _,_ _(_ _optional_ _)_) – Join Triangles, Merge adjacent triangles into quads

- **face\_threshold** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Face Angle, Face angle limit

- **shape\_threshold** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Shape Angle, Shape angle limit

- **topology\_influence** ( _float in_ _\[_ _0_ _,_ _2_ _\]_ _,_ _(_ _optional_ _)_) – Topology Influence, How much to prioritize regular grids of quads as well as quads that touch existing quads

- **uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare UVs

- **vcols** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Color Attributes

- **seam** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Seam

- **sharp** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Sharp

- **materials** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Materials

- **deselect\_joined** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect Joined, Only select remaining triangles that were not merged


bpy.ops.mesh.customdata\_custom\_splitnormals\_add() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.customdata_custom_splitnormals_add "Link to this definition")

Add a custom normals layer, if none exists yet

bpy.ops.mesh.customdata\_custom\_splitnormals\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.customdata_custom_splitnormals_clear "Link to this definition")

Remove the custom normals layer, if it exists

bpy.ops.mesh.customdata\_mask\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.customdata_mask_clear "Link to this definition")

Clear vertex sculpt masking data from the mesh

bpy.ops.mesh.customdata\_skin\_add() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.customdata_skin_add "Link to this definition")

Add a vertex skin layer

bpy.ops.mesh.customdata\_skin\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.customdata_skin_clear "Link to this definition")

Clear vertex skin layer

bpy.ops.mesh.decimate( _\*_, _ratio=1.0_, _use\_vertex\_group=False_, _vertex\_group\_factor=1.0_, _invert\_vertex\_group=False_, _use\_symmetry=False_, _symmetry\_axis='Y'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.decimate "Link to this definition")

Simplify geometry by collapsing edges

Parameters:

- **ratio** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Ratio

- **use\_vertex\_group** ( _boolean_ _,_ _(_ _optional_ _)_) – Vertex Group, Use active vertex group as an influence

- **vertex\_group\_factor** ( _float in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Weight, Vertex group strength

- **invert\_vertex\_group** ( _boolean_ _,_ _(_ _optional_ _)_) – Invert, Invert vertex group influence

- **use\_symmetry** ( _boolean_ _,_ _(_ _optional_ _)_) – Symmetry, Maintain symmetry on an axis

- **symmetry\_axis** (enum in [Axis Xyz Items](https://docs.blender.org/api/current/bpy_types_enum_items/axis_xyz_items.html#rna-enum-axis-xyz-items), (optional)) – Axis, Axis of symmetry


bpy.ops.mesh.delete( _\*_, _type='VERT'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.delete "Link to this definition")

Delete selected vertices, edges or faces

Parameters:

**type** (enum in \[`'VERT'`, `'EDGE'`, `'FACE'`, `'EDGE_FACE'`, `'ONLY_FACE'`\], (optional)) – Type, Method used for deleting mesh data

bpy.ops.mesh.delete\_edgeloop( _\*_, _use\_face\_split=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.delete_edgeloop "Link to this definition")

Delete an edge loop by merging the faces on each side

Parameters:

**use\_face\_split** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Split, Split off face corners to maintain surrounding geometry

bpy.ops.mesh.delete\_loose( _\*_, _use\_verts=True_, _use\_edges=True_, _use\_faces=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.delete_loose "Link to this definition")

Delete loose vertices, edges or faces

Parameters:

- **use\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – Vertices, Remove loose vertices

- **use\_edges** ( _boolean_ _,_ _(_ _optional_ _)_) – Edges, Remove loose edges

- **use\_faces** ( _boolean_ _,_ _(_ _optional_ _)_) – Faces, Remove loose faces


bpy.ops.mesh.dissolve\_degenerate( _\*_, _threshold=0.0001_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dissolve_degenerate "Link to this definition")

Dissolve zero area faces and zero length edges

Parameters:

**threshold** ( _float in_ _\[_ _1e-06_ _,_ _50_ _\]_ _,_ _(_ _optional_ _)_) – Merge Distance, Maximum distance between elements to merge

bpy.ops.mesh.dissolve\_edges( _\*_, _use\_verts=True_, _angle\_threshold=3.14159_, _use\_face\_split=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dissolve_edges "Link to this definition")

Dissolve edges, merging faces

Parameters:

- **use\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – Dissolve Vertices, Dissolve remaining vertices which connect to only two edges

- **angle\_threshold** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Angle Threshold, Remaining vertices which separate edge pairs are preserved if their edge angle exceeds this threshold.

- **use\_face\_split** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Split, Split off face corners to maintain surrounding geometry


bpy.ops.mesh.dissolve\_faces( _\*_, _use\_verts=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dissolve_faces "Link to this definition")

Dissolve faces

Parameters:

**use\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – Dissolve Vertices, Dissolve remaining vertices which connect to only two edges

bpy.ops.mesh.dissolve\_limited( _\*_, _angle\_limit=0.0872665_, _use\_dissolve\_boundaries=False_, _delimit={'NORMAL'}_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dissolve_limited "Link to this definition")

Dissolve selected edges and vertices, limited by the angle of surrounding geometry

Parameters:

- **angle\_limit** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Angle, Angle limit

- **use\_dissolve\_boundaries** ( _boolean_ _,_ _(_ _optional_ _)_) – All Boundaries, Dissolve all vertices in between face boundaries

- **delimit** (enum set in [Mesh Delimit Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/mesh_delimit_mode_items.html#rna-enum-mesh-delimit-mode-items), (optional)) – Delimit, Delimit dissolve operation


bpy.ops.mesh.dissolve\_mode( _\*_, _use\_verts=False_, _angle\_threshold=3.14159_, _use\_face\_split=False_, _use\_boundary\_tear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dissolve_mode "Link to this definition")

Dissolve geometry based on the selection mode

Parameters:

- **use\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – Dissolve Vertices, Dissolve remaining vertices which connect to only two edges

- **angle\_threshold** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Angle Threshold, Remaining vertices which separate edge pairs are preserved if their edge angle exceeds this threshold.

- **use\_face\_split** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Split, Split off face corners to maintain surrounding geometry

- **use\_boundary\_tear** ( _boolean_ _,_ _(_ _optional_ _)_) – Tear Boundary, Split off face corners instead of merging faces


bpy.ops.mesh.dissolve\_verts( _\*_, _use\_face\_split=False_, _use\_boundary\_tear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dissolve_verts "Link to this definition")

Dissolve vertices, merge edges and faces

Parameters:

- **use\_face\_split** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Split, Split off face corners to maintain surrounding geometry

- **use\_boundary\_tear** ( _boolean_ _,_ _(_ _optional_ _)_) – Tear Boundary, Split off face corners instead of merging faces


bpy.ops.mesh.dupli\_extrude\_cursor( _\*_, _rotate\_source=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.dupli_extrude_cursor "Link to this definition")

Duplicate and extrude selected vertices, edges or faces towards the mouse cursor

Parameters:

**rotate\_source** ( _boolean_ _,_ _(_ _optional_ _)_) – Rotate Source, Rotate initial selection giving better shape

bpy.ops.mesh.duplicate( _\*_, _mode=1_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.duplicate "Link to this definition")

Duplicate selected vertices, edges or faces

Parameters:

**mode** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Mode

bpy.ops.mesh.duplicate\_move( _\*_, _MESH\_OT\_duplicate=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.duplicate_move "Link to this definition")

Duplicate mesh and move

Parameters:

- **MESH\_OT\_duplicate** (`MESH_OT_duplicate`, (optional)) – Duplicate, Duplicate selected vertices, edges or faces

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.edge\_collapse() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.edge_collapse "Link to this definition")

Collapse isolated edge and face regions, merging data such as UVs and color attributes. This can collapse edge-rings as well as regions of connected faces into vertices

bpy.ops.mesh.edge\_face\_add() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.edge_face_add "Link to this definition")

Add an edge or face to selected

bpy.ops.mesh.edge\_rotate( _\*_, _use\_ccw=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.edge_rotate "Link to this definition")

Rotate selected edge or adjoining faces

Parameters:

**use\_ccw** ( _boolean_ _,_ _(_ _optional_ _)_) – Counter Clockwise

bpy.ops.mesh.edge\_split( _\*_, _type='EDGE'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.edge_split "Link to this definition")

Split selected edges so that each neighbor face gets its own copy

Parameters:

**type** (enum in \[`'EDGE'`, `'VERT'`\], (optional)) –

Type, Method to use for splitting

- `EDGE`
Faces by Edges – Split faces along selected edges.

- `VERT`
Faces & Edges by Vertices – Split faces and edges connected to selected vertices.


bpy.ops.mesh.edgering\_select( _\*_, _extend=False_, _deselect=False_, _toggle=False_, _ring=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.edgering_select "Link to this definition")

Select an edge ring

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Remove from the selection

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle Select, Toggle the selection

- **ring** ( _boolean_ _,_ _(_ _optional_ _)_) – Select Ring, Select ring


bpy.ops.mesh.edges\_select\_sharp( _\*_, _sharpness=0.523599_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.edges_select_sharp "Link to this definition")

Select all sharp enough edges

Parameters:

**sharpness** ( _float in_ _\[_ _0.000174533_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Sharpness

bpy.ops.mesh.extrude\_context( _\*_, _use\_normal\_flip=False_, _use\_dissolve\_ortho\_edges=False_, _mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_context "Link to this definition")

Extrude selection

Parameters:

- **use\_normal\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Normals

- **use\_dissolve\_ortho\_edges** ( _boolean_ _,_ _(_ _optional_ _)_) – Dissolve Orthogonal Edges

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing


bpy.ops.mesh.extrude\_context\_move( _\*_, _MESH\_OT\_extrude\_context=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_context_move "Link to this definition")

Extrude region together along the average normal

Parameters:

- **MESH\_OT\_extrude\_context** (`MESH_OT_extrude_context`, (optional)) – Extrude Context, Extrude selection

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.extrude\_edges\_indiv( _\*_, _use\_normal\_flip=False_, _mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_edges_indiv "Link to this definition")

Extrude individual edges only

Parameters:

- **use\_normal\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Normals

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing


bpy.ops.mesh.extrude\_edges\_move( _\*_, _MESH\_OT\_extrude\_edges\_indiv=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_edges_move "Link to this definition")

Extrude edges and move result

Parameters:

- **MESH\_OT\_extrude\_edges\_indiv** (`MESH_OT_extrude_edges_indiv`, (optional)) – Extrude Only Edges, Extrude individual edges only

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.extrude\_faces\_indiv( _\*_, _mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_faces_indiv "Link to this definition")

Extrude individual faces only

Parameters:

**mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

bpy.ops.mesh.extrude\_faces\_move( _\*_, _MESH\_OT\_extrude\_faces\_indiv=None_, _TRANSFORM\_OT\_shrink\_fatten=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_faces_move "Link to this definition")

Extrude each individual face separately along local normals

Parameters:

- **MESH\_OT\_extrude\_faces\_indiv** (`MESH_OT_extrude_faces_indiv`, (optional)) – Extrude Individual Faces, Extrude individual faces only

- **TRANSFORM\_OT\_shrink\_fatten** (`TRANSFORM_OT_shrink_fatten`, (optional)) – Shrink/Fatten, Shrink/fatten selected vertices along normals


bpy.ops.mesh.extrude\_manifold( _\*_, _MESH\_OT\_extrude\_region=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_manifold "Link to this definition")

Extrude, dissolves edges whose faces form a flat surface and intersect new edges

Parameters:

- **MESH\_OT\_extrude\_region** (`MESH_OT_extrude_region`, (optional)) – Extrude Region, Extrude region of faces

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.extrude\_region( _\*_, _use\_normal\_flip=False_, _use\_dissolve\_ortho\_edges=False_, _mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_region "Link to this definition")

Extrude region of faces

Parameters:

- **use\_normal\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Normals

- **use\_dissolve\_ortho\_edges** ( _boolean_ _,_ _(_ _optional_ _)_) – Dissolve Orthogonal Edges

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing


bpy.ops.mesh.extrude\_region\_move( _\*_, _MESH\_OT\_extrude\_region=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_region_move "Link to this definition")

Extrude region and move result

Parameters:

- **MESH\_OT\_extrude\_region** (`MESH_OT_extrude_region`, (optional)) – Extrude Region, Extrude region of faces

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.extrude\_region\_shrink\_fatten( _\*_, _MESH\_OT\_extrude\_region=None_, _TRANSFORM\_OT\_shrink\_fatten=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_region_shrink_fatten "Link to this definition")

Extrude region together along local normals

Parameters:

- **MESH\_OT\_extrude\_region** (`MESH_OT_extrude_region`, (optional)) – Extrude Region, Extrude region of faces

- **TRANSFORM\_OT\_shrink\_fatten** (`TRANSFORM_OT_shrink_fatten`, (optional)) – Shrink/Fatten, Shrink/fatten selected vertices along normals


bpy.ops.mesh.extrude\_repeat( _\*_, _steps=10_, _offset=(0.0,0.0,0.0)_, _scale\_offset=1.0_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_repeat "Link to this definition")

Extrude selected vertices, edges or faces repeatedly

Parameters:

- **steps** ( _int in_ _\[_ _0_ _,_ _1000000_ _\]_ _,_ _(_ _optional_ _)_) – Steps

- **offset** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-100000, 100000\], (optional)) – Offset, Offset vector

- **scale\_offset** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Scale Offset


bpy.ops.mesh.extrude\_vertices\_move( _\*_, _MESH\_OT\_extrude\_verts\_indiv=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_vertices_move "Link to this definition")

Extrude vertices and move result

Parameters:

- **MESH\_OT\_extrude\_verts\_indiv** (`MESH_OT_extrude_verts_indiv`, (optional)) – Extrude Only Vertices, Extrude individual vertices only

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.extrude\_verts\_indiv( _\*_, _mirror=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.extrude_verts_indiv "Link to this definition")

Extrude individual vertices only

Parameters:

**mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

bpy.ops.mesh.face\_make\_planar( _\*_, _factor=1.0_, _repeat=1_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.face_make_planar "Link to this definition")

Flatten selected faces

Parameters:

- **factor** ( _float in_ _\[_ _-10_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Factor

- **repeat** ( _int in_ _\[_ _1_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Iterations


bpy.ops.mesh.face\_split\_by\_edges() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.face_split_by_edges "Link to this definition")

Weld loose edges into faces (splitting them into new faces)

bpy.ops.mesh.faces\_select\_linked\_flat( _\*_, _sharpness=0.0174533_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.faces_select_linked_flat "Link to this definition")

Select linked faces by angle

Parameters:

**sharpness** ( _float in_ _\[_ _0.000174533_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Sharpness

bpy.ops.mesh.faces\_shade\_flat() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.faces_shade_flat "Link to this definition")

Display faces flat

bpy.ops.mesh.faces\_shade\_smooth() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.faces_shade_smooth "Link to this definition")

Display faces smooth (using vertex normals)

bpy.ops.mesh.fill( _\*_, _use\_beauty=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.fill "Link to this definition")

Fill a selected edge loop with faces

Parameters:

**use\_beauty** ( _boolean_ _,_ _(_ _optional_ _)_) – Beauty, Use best triangulation division

bpy.ops.mesh.fill\_grid( _\*_, _span=1_, _offset=0_, _use\_interp\_simple=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.fill_grid "Link to this definition")

Fill grid from two loops

Parameters:

- **span** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Span, Number of grid columns

- **offset** ( _int in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Vertex that is the corner of the grid

- **use\_interp\_simple** ( _boolean_ _,_ _(_ _optional_ _)_) – Simple Blending, Use simple interpolation of grid vertices


bpy.ops.mesh.fill\_holes( _\*_, _sides=4_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.fill_holes "Link to this definition")

Fill in holes (boundary edge loops)

Parameters:

**sides** ( _int in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Sides, Number of sides in hole required to fill (zero fills all holes)

bpy.ops.mesh.flip\_normals( _\*_, _only\_clnors=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.flip_normals "Link to this definition")

Flip the direction of selected faces’ normals (and of their vertices)

Parameters:

**only\_clnors** ( _boolean_ _,_ _(_ _optional_ _)_) – Custom Normals Only, Only flip the custom loop normals of the selected elements

bpy.ops.mesh.flip\_quad\_tessellation() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.flip_quad_tessellation "Link to this definition")

Flips the tessellation of selected quads

bpy.ops.mesh.hide( _\*_, _unselected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.hide "Link to this definition")

Hide (un)selected vertices, edges or faces

Parameters:

**unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Hide unselected rather than selected

bpy.ops.mesh.inset( _\*_, _use\_boundary=True_, _use\_even\_offset=True_, _use\_relative\_offset=False_, _use\_edge\_rail=False_, _thickness=0.0_, _depth=0.0_, _use\_outset=False_, _use\_select\_inset=False_, _use\_individual=False_, _use\_interpolate=True_, _release\_confirm=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.inset "Link to this definition")

Inset new faces into selected faces

Parameters:

- **use\_boundary** ( _boolean_ _,_ _(_ _optional_ _)_) – Boundary, Inset face boundaries

- **use\_even\_offset** ( _boolean_ _,_ _(_ _optional_ _)_) – Offset Even, Scale the offset to give more even thickness

- **use\_relative\_offset** ( _boolean_ _,_ _(_ _optional_ _)_) – Offset Relative, Scale the offset by surrounding geometry

- **use\_edge\_rail** ( _boolean_ _,_ _(_ _optional_ _)_) – Edge Rail, Inset the region along existing edges

- **thickness** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Thickness

- **depth** ( _float in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Depth

- **use\_outset** ( _boolean_ _,_ _(_ _optional_ _)_) – Outset, Outset rather than inset

- **use\_select\_inset** ( _boolean_ _,_ _(_ _optional_ _)_) – Select Outer, Select the new inset faces

- **use\_individual** ( _boolean_ _,_ _(_ _optional_ _)_) – Individual, Individual face inset

- **use\_interpolate** ( _boolean_ _,_ _(_ _optional_ _)_) – Interpolate, Blend face data across the inset

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release


bpy.ops.mesh.intersect( _\*_, _mode='SELECT\_UNSELECT'_, _separate\_mode='CUT'_, _threshold=1e-06_, _solver='EXACT'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.intersect "Link to this definition")

Cut an intersection into faces

Parameters:

- **mode** (enum in \[`'SELECT'`, `'SELECT_UNSELECT'`\], (optional)) –

Source


  - `SELECT`
    Self Intersect – Self intersect selected faces.

  - `SELECT_UNSELECT`
    Selected/Unselected – Intersect selected with unselected faces.


- **separate\_mode** (enum in \[`'ALL'`, `'CUT'`, `'NONE'`\], (optional)) –

Separate Mode


  - `ALL`
    All – Separate all geometry from intersections.

  - `CUT`
    Cut – Cut into geometry keeping each side separate (Selected/Unselected only).

  - `NONE`
    Merge – Merge all geometry from the intersection.


- **threshold** ( _float in_ _\[_ _0_ _,_ _0.01_ _\]_ _,_ _(_ _optional_ _)_) – Merge Threshold

- **solver** (enum in \[`'FLOAT'`, `'EXACT'`\], (optional)) –

Solver, Which Intersect solver to use


  - `FLOAT`
    Float – Simple solver with good performance, without support for overlapping geometry.

  - `EXACT`
    Exact – Slower solver with the best results for coplanar faces.


bpy.ops.mesh.intersect\_boolean( _\*_, _operation='DIFFERENCE'_, _use\_swap=False_, _use\_self=False_, _threshold=1e-06_, _solver='EXACT'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.intersect_boolean "Link to this definition")

Cut solid geometry from selected to unselected

Parameters:

- **operation** (enum in \[`'INTERSECT'`, `'UNION'`, `'DIFFERENCE'`\], (optional)) – Boolean Operation, Which boolean operation to apply

- **use\_swap** ( _boolean_ _,_ _(_ _optional_ _)_) – Swap, Use with difference intersection to swap which side is kept

- **use\_self** ( _boolean_ _,_ _(_ _optional_ _)_) – Self Intersection, Do self-union or self-intersection

- **threshold** ( _float in_ _\[_ _0_ _,_ _0.01_ _\]_ _,_ _(_ _optional_ _)_) – Merge Threshold

- **solver** (enum in \[`'FLOAT'`, `'EXACT'`\], (optional)) –

Solver, Which Boolean solver to use


  - `FLOAT`
    Float – Faster solver, some limitations.

  - `EXACT`
    Exact – Exact solver, slower, handles more cases.


bpy.ops.mesh.knife\_project( _\*_, _cut\_through=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.knife_project "Link to this definition")

Use other objects outlines and boundaries to project knife cuts

Parameters:

**cut\_through** ( _boolean_ _,_ _(_ _optional_ _)_) – Cut Through, Cut through all faces, not just visible ones

bpy.ops.mesh.knife\_tool( _\*_, _use\_occlude\_geometry=True_, _only\_selected=False_, _xray=True_, _visible\_measurements='NONE'_, _angle\_snapping='NONE'_, _angle\_snapping\_increment=0.523599_, _wait\_for\_input=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.knife_tool "Link to this definition")

Cut new topology

Parameters:

- **use\_occlude\_geometry** ( _boolean_ _,_ _(_ _optional_ _)_) – Occlude Geometry, Only cut the front most geometry

- **only\_selected** ( _boolean_ _,_ _(_ _optional_ _)_) – Only Selected, Only cut selected geometry

- **xray** ( _boolean_ _,_ _(_ _optional_ _)_) – X-Ray, Show cuts hidden by geometry

- **visible\_measurements** (enum in \[`'NONE'`, `'BOTH'`, `'DISTANCE'`, `'ANGLE'`\], (optional)) –

Measurements, Visible distance and angle measurements


  - `NONE`
    None – Show no measurements.

  - `BOTH`
    Both – Show both distances and angles.

  - `DISTANCE`
    Distance – Show just distance measurements.

  - `ANGLE`
    Angle – Show just angle measurements.


- **angle\_snapping** (enum in \[`'NONE'`, `'SCREEN'`, `'RELATIVE'`\], (optional)) –

Angle Snapping, Angle snapping mode


  - `NONE`
    None – No angle snapping.

  - `SCREEN`
    Screen – Screen space angle snapping.

  - `RELATIVE`
    Relative – Angle snapping relative to the previous cut edge.


- **angle\_snapping\_increment** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Angle Snap Increment, The angle snap increment used when in constrained angle mode

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input


bpy.ops.mesh.loop\_multi\_select( _\*_, _ring=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.loop_multi_select "Link to this definition")

Select a loop of connected edges by connection type

Parameters:

**ring** ( _boolean_ _,_ _(_ _optional_ _)_) – Ring

bpy.ops.mesh.loop\_select( _\*_, _extend=False_, _deselect=False_, _toggle=False_, _ring=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.loop_select "Link to this definition")

Select a loop of connected edges

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend Select, Extend the selection

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Remove from the selection

- **toggle** ( _boolean_ _,_ _(_ _optional_ _)_) – Toggle Select, Toggle the selection

- **ring** ( _boolean_ _,_ _(_ _optional_ _)_) – Select Ring, Select ring


bpy.ops.mesh.loop\_to\_region( _\*_, _select\_bigger=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.loop_to_region "Link to this definition")

Select region of faces inside of a selected loop of edges

Parameters:

**select\_bigger** ( _boolean_ _,_ _(_ _optional_ _)_) – Select Bigger, Select bigger regions instead of smaller ones

bpy.ops.mesh.loopcut( _\*_, _number\_cuts=1_, _smoothness=0.0_, _falloff='INVERSE\_SQUARE'_, _object\_index=-1_, _edge\_index=-1_, _mesh\_select\_mode\_init=(False,False,False)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.loopcut "Link to this definition")

Add a new loop between existing loops

Parameters:

- **number\_cuts** ( _int in_ _\[_ _1_ _,_ _1000000_ _\]_ _,_ _(_ _optional_ _)_) – Number of Cuts

- **smoothness** ( _float in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Smoothness, Smoothness factor

- **falloff** (enum in [Proportional Falloff Curve Only Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_curve_only_items.html#rna-enum-proportional-falloff-curve-only-items), (optional)) – Falloff, Falloff type of the feather

- **object\_index** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Object Index

- **edge\_index** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Edge Index


bpy.ops.mesh.loopcut\_slide( _\*_, _MESH\_OT\_loopcut=None_, _TRANSFORM\_OT\_edge\_slide=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.loopcut_slide "Link to this definition")

Cut mesh loop and slide it

Parameters:

- **MESH\_OT\_loopcut** (`MESH_OT_loopcut`, (optional)) – Loop Cut, Add a new loop between existing loops

- **TRANSFORM\_OT\_edge\_slide** (`TRANSFORM_OT_edge_slide`, (optional)) – Edge Slide, Slide an edge loop along a mesh


bpy.ops.mesh.mark\_freestyle\_edge( _\*_, _clear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.mark_freestyle_edge "Link to this definition")

(Un)mark selected edges as Freestyle feature edges

Parameters:

**clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear

bpy.ops.mesh.mark\_freestyle\_face( _\*_, _clear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.mark_freestyle_face "Link to this definition")

(Un)mark selected faces for exclusion from Freestyle feature edge detection

Parameters:

**clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear

bpy.ops.mesh.mark\_seam( _\*_, _clear=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.mark_seam "Link to this definition")

(Un)mark selected edges as a seam

Parameters:

**clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear

bpy.ops.mesh.mark\_sharp( _\*_, _clear=False_, _use\_verts=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.mark_sharp "Link to this definition")

(Un)mark selected edges as sharp

Parameters:

- **clear** ( _boolean_ _,_ _(_ _optional_ _)_) – Clear

- **use\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – Vertices, Consider vertices instead of edges to select which edges to (un)tag as sharp


bpy.ops.mesh.merge( _\*_, _type='CENTER'_, _uvs=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.merge "Link to this definition")

Merge selected vertices

Parameters:

- **type** (enum in \[`'CENTER'`, `'CURSOR'`, `'COLLAPSE'`, `'FIRST'`, `'LAST'`\], (optional)) – Type, Merge method to use

- **uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – UVs, Move UVs according to merge


bpy.ops.mesh.merge\_normals() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.merge_normals "Link to this definition")

Merge custom normals of selected vertices

bpy.ops.mesh.mod\_weighted\_strength( _\*_, _set=False_, _face\_strength='MEDIUM'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.mod_weighted_strength "Link to this definition")

Set/Get strength of face (used in Weighted Normal modifier)

Parameters:

- **set** ( _boolean_ _,_ _(_ _optional_ _)_) – Set Value, Set value of faces

- **face\_strength** (enum in \[`'WEAK'`, `'MEDIUM'`, `'STRONG'`\], (optional)) – Face Strength, Strength to use for assigning or selecting face influence for weighted normal modifier


bpy.ops.mesh.normals\_make\_consistent( _\*_, _inside=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.normals_make_consistent "Link to this definition")

Make face and vertex normals point either outside or inside the mesh

Parameters:

**inside** ( _boolean_ _,_ _(_ _optional_ _)_) – Inside

bpy.ops.mesh.normals\_tools( _\*_, _mode='COPY'_, _absolute=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.normals_tools "Link to this definition")

Custom normals tools using Normal Vector of UI

Parameters:

- **mode** (enum in \[`'COPY'`, `'PASTE'`, `'ADD'`, `'MULTIPLY'`, `'RESET'`\], (optional)) –

Mode, Mode of tools taking input from interface


  - `COPY`
    Copy Normal – Copy normal to the internal clipboard.

  - `PASTE`
    Paste Normal – Paste normal from the internal clipboard.

  - `ADD`
    Add Normal – Add normal vector with selection.

  - `MULTIPLY`
    Multiply Normal – Multiply normal vector with selection.

  - `RESET`
    Reset Normal – Reset the internal clipboard and/or normal of selected element.


- **absolute** ( _boolean_ _,_ _(_ _optional_ _)_) – Absolute Coordinates, Copy Absolute coordinates of Normal vector


bpy.ops.mesh.offset\_edge\_loops( _\*_, _use\_cap\_endpoint=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.offset_edge_loops "Link to this definition")

Create offset edge loop from the current selection

Parameters:

**use\_cap\_endpoint** ( _boolean_ _,_ _(_ _optional_ _)_) – Cap Endpoint, Extend loop around end-points

bpy.ops.mesh.offset\_edge\_loops\_slide( _\*_, _MESH\_OT\_offset\_edge\_loops=None_, _TRANSFORM\_OT\_edge\_slide=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.offset_edge_loops_slide "Link to this definition")

Offset edge loop slide

Parameters:

- **MESH\_OT\_offset\_edge\_loops** (`MESH_OT_offset_edge_loops`, (optional)) – Offset Edge Loop, Create offset edge loop from the current selection

- **TRANSFORM\_OT\_edge\_slide** (`TRANSFORM_OT_edge_slide`, (optional)) – Edge Slide, Slide an edge loop along a mesh


bpy.ops.mesh.point\_normals( _\*_, _mode='COORDINATES'_, _invert=False_, _align=False_, _target\_location=(0.0,0.0,0.0)_, _spherize=False_, _spherize\_strength=0.1_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.point_normals "Link to this definition")

Point selected custom normals to specified Target

Parameters:

- **mode** (enum in \[`'COORDINATES'`, `'MOUSE'`\], (optional)) –

Mode, How to define coordinates to point custom normals to


  - `COORDINATES`
    Coordinates – Use static coordinates (defined by various means).

  - `MOUSE`
    Mouse – Follow mouse cursor.


- **invert** ( _boolean_ _,_ _(_ _optional_ _)_) – Invert, Invert affected normals

- **align** ( _boolean_ _,_ _(_ _optional_ _)_) – Align, Make all affected normals parallel

- **target\_location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Target, Target location to which normals will point

- **spherize** ( _boolean_ _,_ _(_ _optional_ _)_) – Spherize, Interpolate between original and new normals

- **spherize\_strength** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Spherize Strength, Ratio of spherized normal to original normal


bpy.ops.mesh.poke( _\*_, _offset=0.0_, _use\_relative\_offset=False_, _center\_mode='MEDIAN\_WEIGHTED'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.poke "Link to this definition")

Split a face into a fan

Parameters:

- **offset** ( _float in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Poke Offset, Poke Offset

- **use\_relative\_offset** ( _boolean_ _,_ _(_ _optional_ _)_) – Offset Relative, Scale the offset by surrounding geometry

- **center\_mode** (enum in \[`'MEDIAN_WEIGHTED'`, `'MEDIAN'`, `'BOUNDS'`\], (optional)) –

Poke Center, Poke face center calculation


  - `MEDIAN_WEIGHTED`
    Weighted Median – Weighted median face center.

  - `MEDIAN`
    Median – Median face center.

  - `BOUNDS`
    Bounds – Face bounds center.


bpy.ops.mesh.polybuild\_delete\_at\_cursor( _\*_, _mirror=False_, _use\_proportional\_edit=False_, _proportional\_edit\_falloff='SMOOTH'_, _proportional\_size=1.0_, _use\_proportional\_connected=False_, _use\_proportional\_projected=False_, _release\_confirm=False_, _use\_accurate=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_delete_at_cursor "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **use\_proportional\_edit** ( _boolean_ _,_ _(_ _optional_ _)_) – Proportional Editing

- **proportional\_edit\_falloff** (enum in [Proportional Falloff Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_items.html#rna-enum-proportional-falloff-items), (optional)) – Proportional Falloff, Falloff type for proportional editing mode

- **proportional\_size** ( _float in_ _\[_ _1e-06_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Proportional Size

- **use\_proportional\_connected** ( _boolean_ _,_ _(_ _optional_ _)_) – Connected

- **use\_proportional\_projected** ( _boolean_ _,_ _(_ _optional_ _)_) – Projected (2D)

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation


bpy.ops.mesh.polybuild\_dissolve\_at\_cursor() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_dissolve_at_cursor "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

bpy.ops.mesh.polybuild\_extrude\_at\_cursor\_move( _\*_, _MESH\_OT\_polybuild\_transform\_at\_cursor=None_, _MESH\_OT\_extrude\_edges\_indiv=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_extrude_at_cursor_move "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **MESH\_OT\_polybuild\_transform\_at\_cursor** (`MESH_OT_polybuild_transform_at_cursor`, (optional)) – Poly Build Transform at Cursor

- **MESH\_OT\_extrude\_edges\_indiv** (`MESH_OT_extrude_edges_indiv`, (optional)) – Extrude Only Edges, Extrude individual edges only

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.polybuild\_face\_at\_cursor( _\*_, _create\_quads=True_, _mirror=False_, _use\_proportional\_edit=False_, _proportional\_edit\_falloff='SMOOTH'_, _proportional\_size=1.0_, _use\_proportional\_connected=False_, _use\_proportional\_projected=False_, _release\_confirm=False_, _use\_accurate=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_face_at_cursor "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **create\_quads** ( _boolean_ _,_ _(_ _optional_ _)_) – Create Quads, Automatically split edges in triangles to maintain quad topology

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **use\_proportional\_edit** ( _boolean_ _,_ _(_ _optional_ _)_) – Proportional Editing

- **proportional\_edit\_falloff** (enum in [Proportional Falloff Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_items.html#rna-enum-proportional-falloff-items), (optional)) – Proportional Falloff, Falloff type for proportional editing mode

- **proportional\_size** ( _float in_ _\[_ _1e-06_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Proportional Size

- **use\_proportional\_connected** ( _boolean_ _,_ _(_ _optional_ _)_) – Connected

- **use\_proportional\_projected** ( _boolean_ _,_ _(_ _optional_ _)_) – Projected (2D)

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation


bpy.ops.mesh.polybuild\_face\_at\_cursor\_move( _\*_, _MESH\_OT\_polybuild\_face\_at\_cursor=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_face_at_cursor_move "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **MESH\_OT\_polybuild\_face\_at\_cursor** (`MESH_OT_polybuild_face_at_cursor`, (optional)) – Poly Build Face at Cursor

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.polybuild\_split\_at\_cursor( _\*_, _mirror=False_, _use\_proportional\_edit=False_, _proportional\_edit\_falloff='SMOOTH'_, _proportional\_size=1.0_, _use\_proportional\_connected=False_, _use\_proportional\_projected=False_, _release\_confirm=False_, _use\_accurate=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_split_at_cursor "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **use\_proportional\_edit** ( _boolean_ _,_ _(_ _optional_ _)_) – Proportional Editing

- **proportional\_edit\_falloff** (enum in [Proportional Falloff Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_items.html#rna-enum-proportional-falloff-items), (optional)) – Proportional Falloff, Falloff type for proportional editing mode

- **proportional\_size** ( _float in_ _\[_ _1e-06_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Proportional Size

- **use\_proportional\_connected** ( _boolean_ _,_ _(_ _optional_ _)_) – Connected

- **use\_proportional\_projected** ( _boolean_ _,_ _(_ _optional_ _)_) – Projected (2D)

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation


bpy.ops.mesh.polybuild\_split\_at\_cursor\_move( _\*_, _MESH\_OT\_polybuild\_split\_at\_cursor=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_split_at_cursor_move "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **MESH\_OT\_polybuild\_split\_at\_cursor** (`MESH_OT_polybuild_split_at_cursor`, (optional)) – Poly Build Split at Cursor

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.polybuild\_transform\_at\_cursor( _\*_, _mirror=False_, _use\_proportional\_edit=False_, _proportional\_edit\_falloff='SMOOTH'_, _proportional\_size=1.0_, _use\_proportional\_connected=False_, _use\_proportional\_projected=False_, _release\_confirm=False_, _use\_accurate=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_transform_at_cursor "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **use\_proportional\_edit** ( _boolean_ _,_ _(_ _optional_ _)_) – Proportional Editing

- **proportional\_edit\_falloff** (enum in [Proportional Falloff Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_items.html#rna-enum-proportional-falloff-items), (optional)) – Proportional Falloff, Falloff type for proportional editing mode

- **proportional\_size** ( _float in_ _\[_ _1e-06_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Proportional Size

- **use\_proportional\_connected** ( _boolean_ _,_ _(_ _optional_ _)_) – Connected

- **use\_proportional\_projected** ( _boolean_ _,_ _(_ _optional_ _)_) – Projected (2D)

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation


bpy.ops.mesh.polybuild\_transform\_at\_cursor\_move( _\*_, _MESH\_OT\_polybuild\_transform\_at\_cursor=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.polybuild_transform_at_cursor_move "Link to this definition")

Undocumented, consider [contributing](https://developer.blender.org/).

Parameters:

- **MESH\_OT\_polybuild\_transform\_at\_cursor** (`MESH_OT_polybuild_transform_at_cursor`, (optional)) – Poly Build Transform at Cursor

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.primitive\_circle\_add( _\*_, _vertices=32_, _radius=1.0_, _fill\_type='NOTHING'_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_circle_add "Link to this definition")

Construct a circle mesh

Parameters:

- **vertices** ( _int in_ _\[_ _3_ _,_ _10000000_ _\]_ _,_ _(_ _optional_ _)_) – Vertices

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **fill\_type** (enum in \[`'NOTHING'`, `'NGON'`, `'TRIFAN'`\], (optional)) –

Fill Type


  - `NOTHING`
    Nothing – Don’t fill at all.

  - `NGON`
    N-Gon – Use n-gons.

  - `TRIFAN`
    Triangle Fan – Use triangle fans.


- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_cone\_add( _\*_, _vertices=32_, _radius1=1.0_, _radius2=0.0_, _depth=2.0_, _end\_fill\_type='NGON'_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_cone_add "Link to this definition")

Construct a conic mesh

Parameters:

- **vertices** ( _int in_ _\[_ _3_ _,_ _10000000_ _\]_ _,_ _(_ _optional_ _)_) – Vertices

- **radius1** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius 1

- **radius2** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius 2

- **depth** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Depth

- **end\_fill\_type** (enum in \[`'NOTHING'`, `'NGON'`, `'TRIFAN'`\], (optional)) –

Base Fill Type


  - `NOTHING`
    Nothing – Don’t fill at all.

  - `NGON`
    N-Gon – Use n-gons.

  - `TRIFAN`
    Triangle Fan – Use triangle fans.


- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_cube\_add( _\*_, _size=2.0_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_cube_add "Link to this definition")

Construct a cube mesh that consists of six square faces

Parameters:

- **size** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Size

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_cube\_add\_gizmo( _\*_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_, _matrix=((0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0),(0.0,0.0,0.0,0.0))_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_cube_add_gizmo "Link to this definition")

Construct a cube mesh

Parameters:

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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

- **matrix** ( [`mathutils.Matrix`](https://docs.blender.org/api/current/mathutils.html#mathutils.Matrix "mathutils.Matrix") of 4 \* 4 items in \[-inf, inf\], (optional)) – Matrix


bpy.ops.mesh.primitive\_cylinder\_add( _\*_, _vertices=32_, _radius=1.0_, _depth=2.0_, _end\_fill\_type='NGON'_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_cylinder_add "Link to this definition")

Construct a cylinder mesh

Parameters:

- **vertices** ( _int in_ _\[_ _3_ _,_ _10000000_ _\]_ _,_ _(_ _optional_ _)_) – Vertices

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **depth** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Depth

- **end\_fill\_type** (enum in \[`'NOTHING'`, `'NGON'`, `'TRIFAN'`\], (optional)) –

Cap Fill Type


  - `NOTHING`
    Nothing – Don’t fill at all.

  - `NGON`
    N-Gon – Use n-gons.

  - `TRIFAN`
    Triangle Fan – Use triangle fans.


- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_grid\_add( _\*_, _x\_subdivisions=10_, _y\_subdivisions=10_, _size=2.0_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_grid_add "Link to this definition")

Construct a subdivided plane mesh

Parameters:

- **x\_subdivisions** ( _int in_ _\[_ _1_ _,_ _10000000_ _\]_ _,_ _(_ _optional_ _)_) – X Subdivisions

- **y\_subdivisions** ( _int in_ _\[_ _1_ _,_ _10000000_ _\]_ _,_ _(_ _optional_ _)_) – Y Subdivisions

- **size** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Size

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_ico\_sphere\_add( _\*_, _subdivisions=2_, _radius=1.0_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_ico_sphere_add "Link to this definition")

Construct a spherical mesh that consists of equally sized triangles

Parameters:

- **subdivisions** ( _int in_ _\[_ _1_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Subdivisions

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_monkey\_add( _\*_, _size=2.0_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_monkey_add "Link to this definition")

Construct a Suzanne mesh

Parameters:

- **size** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Size

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_plane\_add( _\*_, _size=2.0_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_plane_add "Link to this definition")

Construct a filled planar mesh with 4 vertices

Parameters:

- **size** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Size

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.primitive\_torus\_add( _\*_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _major\_segments=48_, _minor\_segments=12_, _mode='MAJOR\_MINOR'_, _major\_radius=1.0_, _minor\_radius=0.25_, _abso\_major\_rad=1.25_, _abso\_minor\_rad=0.75_, _generate\_uvs=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_torus_add "Link to this definition")

Construct a torus mesh

Parameters:

- **align** (enum in \[`'WORLD'`, `'VIEW'`, `'CURSOR'`\], (optional)) –

Align


  - `WORLD`
    World – Align the new object to the world.

  - `VIEW`
    View – Align the new object to the view.

  - `CURSOR`
    3D Cursor – Use the 3D cursor orientation for the new object.


- **location** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Location

- **rotation** ( [`mathutils.Euler`](https://docs.blender.org/api/current/mathutils.html#mathutils.Euler "mathutils.Euler") rotation of 3 items in \[-inf, inf\], (optional)) – Rotation

- **major\_segments** ( _int in_ _\[_ _3_ _,_ _256_ _\]_ _,_ _(_ _optional_ _)_) – Major Segments, Number of segments for the main ring of the torus

- **minor\_segments** ( _int in_ _\[_ _3_ _,_ _256_ _\]_ _,_ _(_ _optional_ _)_) – Minor Segments, Number of segments for the minor ring of the torus

- **mode** (enum in \[`'MAJOR_MINOR'`, `'EXT_INT'`\], (optional)) –

Dimensions Mode


  - `MAJOR_MINOR`
    Major/Minor – Use the major/minor radii for torus dimensions.

  - `EXT_INT`
    Exterior/Interior – Use the exterior/interior radii for torus dimensions.


- **major\_radius** ( _float in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Major Radius, Radius from the origin to the center of the cross sections

- **minor\_radius** ( _float in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Minor Radius, Radius of the torus’ cross section

- **abso\_major\_rad** ( _float in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Exterior Radius, Total Exterior Radius of the torus

- **abso\_minor\_rad** ( _float in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Interior Radius, Total Interior Radius of the torus

- **generate\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map


File:

[startup/bl\_operators/add\_mesh\_torus.py:222](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/add_mesh_torus.py#L222)

bpy.ops.mesh.primitive\_uv\_sphere\_add( _\*_, _segments=32_, _ring\_count=16_, _radius=1.0_, _calc\_uvs=True_, _enter\_editmode=False_, _align='WORLD'_, _location=(0.0,0.0,0.0)_, _rotation=(0.0,0.0,0.0)_, _scale=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.primitive_uv_sphere_add "Link to this definition")

Construct a spherical mesh with quad faces, except for triangle faces at the top and bottom

Parameters:

- **segments** ( _int in_ _\[_ _3_ _,_ _100000_ _\]_ _,_ _(_ _optional_ _)_) – Segments

- **ring\_count** ( _int in_ _\[_ _3_ _,_ _100000_ _\]_ _,_ _(_ _optional_ _)_) – Rings

- **radius** ( _float in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Radius

- **calc\_uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Generate UVs, Generate a default UV map

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


bpy.ops.mesh.quads\_convert\_to\_tris( _\*_, _quad\_method='BEAUTY'_, _ngon\_method='BEAUTY'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.quads_convert_to_tris "Link to this definition")

Triangulate selected faces

Parameters:

- **quad\_method** (enum in [Modifier Triangulate Quad Method Items](https://docs.blender.org/api/current/bpy_types_enum_items/modifier_triangulate_quad_method_items.html#rna-enum-modifier-triangulate-quad-method-items), (optional)) – Quad Method, Method for splitting the quads into triangles

- **ngon\_method** (enum in [Modifier Triangulate Ngon Method Items](https://docs.blender.org/api/current/bpy_types_enum_items/modifier_triangulate_ngon_method_items.html#rna-enum-modifier-triangulate-ngon-method-items), (optional)) – N-gon Method, Method for splitting the n-gons into triangles


bpy.ops.mesh.region\_to\_loop() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.region_to_loop "Link to this definition")

Select boundary edges around the selected faces

bpy.ops.mesh.remove\_doubles( _\*_, _threshold=0.0001_, _use\_centroid=True_, _use\_unselected=False_, _use\_sharp\_edge\_from\_normals=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.remove_doubles "Link to this definition")

Merge vertices based on their proximity

Parameters:

- **threshold** ( _float in_ _\[_ _1e-06_ _,_ _50_ _\]_ _,_ _(_ _optional_ _)_) – Merge Distance, Maximum distance between elements to merge

- **use\_centroid** ( _boolean_ _,_ _(_ _optional_ _)_) – Centroid Merge, Move vertices to the centroid of the duplicate cluster, otherwise the vertex closest to the centroid is used.

- **use\_unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Merge selected to other unselected vertices

- **use\_sharp\_edge\_from\_normals** ( _boolean_ _,_ _(_ _optional_ _)_) – Sharp Edges, Calculate sharp edges using custom normal data (when available)


bpy.ops.mesh.reorder\_vertices\_spatial() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.reorder_vertices_spatial "Link to this definition")

Reorder mesh faces and vertices based on their spatial position for better BVH building and sculpting performance.

bpy.ops.mesh.reveal( _\*_, _select=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.reveal "Link to this definition")

Reveal all hidden vertices, edges and faces

Parameters:

**select** ( _boolean_ _,_ _(_ _optional_ _)_) – Select

bpy.ops.mesh.rip( _\*_, _mirror=False_, _use\_proportional\_edit=False_, _proportional\_edit\_falloff='SMOOTH'_, _proportional\_size=1.0_, _use\_proportional\_connected=False_, _use\_proportional\_projected=False_, _release\_confirm=False_, _use\_accurate=False_, _use\_fill=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.rip "Link to this definition")

Disconnect vertex or edges from connected geometry

Parameters:

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **use\_proportional\_edit** ( _boolean_ _,_ _(_ _optional_ _)_) – Proportional Editing

- **proportional\_edit\_falloff** (enum in [Proportional Falloff Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_items.html#rna-enum-proportional-falloff-items), (optional)) – Proportional Falloff, Falloff type for proportional editing mode

- **proportional\_size** ( _float in_ _\[_ _1e-06_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Proportional Size

- **use\_proportional\_connected** ( _boolean_ _,_ _(_ _optional_ _)_) – Connected

- **use\_proportional\_projected** ( _boolean_ _,_ _(_ _optional_ _)_) – Projected (2D)

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation

- **use\_fill** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill, Fill the ripped region


bpy.ops.mesh.rip\_edge( _\*_, _mirror=False_, _use\_proportional\_edit=False_, _proportional\_edit\_falloff='SMOOTH'_, _proportional\_size=1.0_, _use\_proportional\_connected=False_, _use\_proportional\_projected=False_, _release\_confirm=False_, _use\_accurate=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.rip_edge "Link to this definition")

Extend vertices along the edge closest to the cursor

Parameters:

- **mirror** ( _boolean_ _,_ _(_ _optional_ _)_) – Mirror Editing

- **use\_proportional\_edit** ( _boolean_ _,_ _(_ _optional_ _)_) – Proportional Editing

- **proportional\_edit\_falloff** (enum in [Proportional Falloff Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_items.html#rna-enum-proportional-falloff-items), (optional)) – Proportional Falloff, Falloff type for proportional editing mode

- **proportional\_size** ( _float in_ _\[_ _1e-06_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Proportional Size

- **use\_proportional\_connected** ( _boolean_ _,_ _(_ _optional_ _)_) – Connected

- **use\_proportional\_projected** ( _boolean_ _,_ _(_ _optional_ _)_) – Projected (2D)

- **release\_confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm on Release, Always confirm operation when releasing button

- **use\_accurate** ( _boolean_ _,_ _(_ _optional_ _)_) – Accurate, Use accurate transformation


bpy.ops.mesh.rip\_edge\_move( _\*_, _MESH\_OT\_rip\_edge=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.rip_edge_move "Link to this definition")

Extend vertices and move the result

Parameters:

- **MESH\_OT\_rip\_edge** (`MESH_OT_rip_edge`, (optional)) – Extend Vertices, Extend vertices along the edge closest to the cursor

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.rip\_move( _\*_, _MESH\_OT\_rip=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.rip_move "Link to this definition")

Rip polygons and move the result

Parameters:

- **MESH\_OT\_rip** (`MESH_OT_rip`, (optional)) – Rip, Disconnect vertex or edges from connected geometry

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.mesh.screw( _\*_, _steps=9_, _turns=1_, _center=(0.0,0.0,0.0)_, _axis=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.screw "Link to this definition")

Extrude selected vertices in screw-shaped rotation around the cursor in indicated viewport

Parameters:

- **steps** ( _int in_ _\[_ _1_ _,_ _100000_ _\]_ _,_ _(_ _optional_ _)_) – Steps, Steps

- **turns** ( _int in_ _\[_ _1_ _,_ _100000_ _\]_ _,_ _(_ _optional_ _)_) – Turns, Turns

- **center** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Center, Center in global view space

- **axis** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-1, 1\], (optional)) – Axis, Axis in global view space


bpy.ops.mesh.select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_all "Link to this definition")

(De)select all vertices, edges or faces

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


bpy.ops.mesh.select\_axis( _\*_, _orientation='LOCAL'_, _sign='POS'_, _axis='X'_, _threshold=0.0001_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_axis "Link to this definition")

Select all data in the mesh on a single axis

Parameters:

- **orientation** (enum in [Transform Orientation Items](https://docs.blender.org/api/current/bpy_types_enum_items/transform_orientation_items.html#rna-enum-transform-orientation-items), (optional)) – Axis Mode, Axis orientation

- **sign** (enum in \[`'POS'`, `'NEG'`, `'ALIGN'`\], (optional)) – Axis Sign, Side to select

- **axis** (enum in [Axis Xyz Items](https://docs.blender.org/api/current/bpy_types_enum_items/axis_xyz_items.html#rna-enum-axis-xyz-items), (optional)) – Axis, Select the axis to compare each vertex on

- **threshold** ( _float in_ _\[_ _1e-06_ _,_ _50_ _\]_ _,_ _(_ _optional_ _)_) – Threshold


bpy.ops.mesh.select\_by\_attribute() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_by_attribute "Link to this definition")

Select elements based on the active boolean attribute

bpy.ops.mesh.select\_by\_pole\_count( _\*_, _pole\_count=4_, _type='NOTEQUAL'_, _extend=False_, _exclude\_nonmanifold=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_by_pole_count "Link to this definition")

Select vertices at poles by the number of connected edges. In edge and face mode the geometry connected to the vertices is selected

Parameters:

- **pole\_count** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Pole Count

- **type** (enum in \[`'LESS'`, `'EQUAL'`, `'GREATER'`, `'NOTEQUAL'`\], (optional)) – Type, Type of comparison to make

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection

- **exclude\_nonmanifold** ( _boolean_ _,_ _(_ _optional_ _)_) – Exclude Non Manifold, Exclude non-manifold poles


bpy.ops.mesh.select\_face\_by\_sides( _\*_, _number=4_, _type='EQUAL'_, _extend=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_face_by_sides "Link to this definition")

Select vertices or faces by the number of face sides

Parameters:

- **number** ( _int in_ _\[_ _3_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Number of Vertices

- **type** (enum in \[`'LESS'`, `'EQUAL'`, `'GREATER'`, `'NOTEQUAL'`\], (optional)) – Type, Type of comparison to make

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection


bpy.ops.mesh.select\_interior\_faces() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_interior_faces "Link to this definition")

Select faces where all edges have more than 2 face users

bpy.ops.mesh.select\_less( _\*_, _use\_face\_step=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_less "Link to this definition")

Deselect vertices, edges or faces at the boundary of each selection region

Parameters:

**use\_face\_step** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Step, Connected faces (instead of edges)

bpy.ops.mesh.select\_linked( _\*_, _delimit={'SEAM'}_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_linked "Link to this definition")

Select all vertices connected to the current selection

Parameters:

**delimit** (enum set in [Mesh Delimit Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/mesh_delimit_mode_items.html#rna-enum-mesh-delimit-mode-items), (optional)) – Delimit, Delimit selected region

bpy.ops.mesh.select\_linked\_pick( _\*_, _deselect=False_, _delimit={'SEAM'}_, _object\_index=-1_, _index=-1_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_linked_pick "Link to this definition")

(De)select all vertices linked to the edge under the mouse cursor

Parameters:

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect

- **delimit** (enum set in [Mesh Delimit Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/mesh_delimit_mode_items.html#rna-enum-mesh-delimit-mode-items), (optional)) – Delimit, Delimit selected region


bpy.ops.mesh.select\_loose( _\*_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_loose "Link to this definition")

Select loose geometry based on the selection mode

Parameters:

**extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection

bpy.ops.mesh.select\_mirror( _\*_, _axis={'X'}_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_mirror "Link to this definition")

Select mesh items at mirrored locations

Parameters:

- **axis** (enum set in [Axis Flag Xyz Items](https://docs.blender.org/api/current/bpy_types_enum_items/axis_flag_xyz_items.html#rna-enum-axis-flag-xyz-items), (optional)) – Axis

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the existing selection


bpy.ops.mesh.select\_mode( _\*_, _use\_extend=False_, _use\_expand=False_, _type='VERT'_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_mode "Link to this definition")

Change selection mode

Parameters:

- **use\_extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend

- **use\_expand** ( _boolean_ _,_ _(_ _optional_ _)_) – Expand

- **type** (enum in [Mesh Select Mode Items](https://docs.blender.org/api/current/bpy_types_enum_items/mesh_select_mode_items.html#rna-enum-mesh-select-mode-items), (optional)) – Type

- **action** (enum in \[`'DISABLE'`, `'ENABLE'`, `'TOGGLE'`\], (optional)) –

Action, Selection action to execute


  - `DISABLE`
    Disable – Disable selected markers.

  - `ENABLE`
    Enable – Enable selected markers.

  - `TOGGLE`
    Toggle – Toggle disabled flag for selected markers.


bpy.ops.mesh.select\_more( _\*_, _use\_face\_step=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_more "Link to this definition")

Select more vertices, edges or faces connected to initial selection

Parameters:

**use\_face\_step** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Step, Connected faces (instead of edges)

bpy.ops.mesh.select\_next\_item() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_next_item "Link to this definition")

Select the next element (using selection order)

File:

[startup/bl\_operators/mesh.py:18](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/mesh.py#L18)

bpy.ops.mesh.select\_non\_manifold( _\*_, _extend=True_, _use\_wire=True_, _use\_boundary=True_, _use\_multi\_face=True_, _use\_non\_contiguous=True_, _use\_verts=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_non_manifold "Link to this definition")

Select all non-manifold vertices or edges

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection

- **use\_wire** ( _boolean_ _,_ _(_ _optional_ _)_) – Wire, Wire edges

- **use\_boundary** ( _boolean_ _,_ _(_ _optional_ _)_) – Boundaries, Boundary edges

- **use\_multi\_face** ( _boolean_ _,_ _(_ _optional_ _)_) – Multiple Faces, Edges shared by more than two faces

- **use\_non\_contiguous** ( _boolean_ _,_ _(_ _optional_ _)_) – Non Contiguous, Edges between faces pointing in alternate directions

- **use\_verts** ( _boolean_ _,_ _(_ _optional_ _)_) – Vertices, Vertices connecting multiple face regions


bpy.ops.mesh.select\_nth( _\*_, _skip=1_, _nth=1_, _offset=0_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_nth "Link to this definition")

Deselect every Nth element starting from the active vertex, edge or face

Parameters:

- **skip** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Deselected, Number of deselected elements in the repetitive sequence

- **nth** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Selected, Number of selected elements in the repetitive sequence

- **offset** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Offset from the starting point


bpy.ops.mesh.select\_prev\_item() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_prev_item "Link to this definition")

Select the previous element (using selection order)

File:

[startup/bl\_operators/mesh.py:43](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/mesh.py#L43)

bpy.ops.mesh.select\_random( _\*_, _ratio=0.5_, _seed=0_, _action='SELECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_random "Link to this definition")

Randomly select vertices

Parameters:

- **ratio** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Ratio, Portion of items to select randomly

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed for the random number generator

- **action** (enum in \[`'SELECT'`, `'DESELECT'`\], (optional)) –

Action, Selection action to execute


  - `SELECT`
    Select – Select all elements.

  - `DESELECT`
    Deselect – Deselect all elements.


bpy.ops.mesh.select\_similar( _\*_, _type='VERT\_NORMAL'_, _compare='EQUAL'_, _threshold=0.0_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_similar "Link to this definition")

Select similar vertices, edges or faces by property types

Parameters:

- **type** (enum in \[`'VERT_NORMAL'`, `'VERT_FACES'`, `'VERT_GROUPS'`, `'VERT_EDGES'`, `'VERT_CREASE'`, `'EDGE_LENGTH'`, `'EDGE_DIR'`, `'EDGE_FACES'`, `'EDGE_FACE_ANGLE'`, `'EDGE_CREASE'`, `'EDGE_BEVEL'`, `'EDGE_SEAM'`, `'EDGE_SHARP'`, `'EDGE_FREESTYLE'`, `'FACE_MATERIAL'`, `'FACE_AREA'`, `'FACE_SIDES'`, `'FACE_PERIMETER'`, `'FACE_NORMAL'`, `'FACE_COPLANAR'`, `'FACE_SMOOTH'`, `'FACE_FREESTYLE'`\], (optional)) – Type

- **compare** (enum in \[`'EQUAL'`, `'GREATER'`, `'LESS'`\], (optional)) – Compare

- **threshold** ( _float in_ _\[_ _0_ _,_ _100000_ _\]_ _,_ _(_ _optional_ _)_) – Threshold


bpy.ops.mesh.select\_similar\_region() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_similar_region "Link to this definition")

Select similar face regions to the current selection

bpy.ops.mesh.select\_ungrouped( _\*_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.select_ungrouped "Link to this definition")

Select vertices without a group

Parameters:

**extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection

bpy.ops.mesh.separate( _\*_, _type='SELECTED'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.separate "Link to this definition")

Separate selected geometry into a new mesh

Parameters:

**type** (enum in \[`'SELECTED'`, `'MATERIAL'`, `'LOOSE'`\], (optional)) – Type

bpy.ops.mesh.set\_normals\_from\_faces( _\*_, _keep\_sharp=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.set_normals_from_faces "Link to this definition")

Set the custom normals from the selected faces ones

Parameters:

**keep\_sharp** ( _boolean_ _,_ _(_ _optional_ _)_) – Keep Sharp Edges, Do not set sharp edges to face

bpy.ops.mesh.set\_sharpness\_by\_angle( _\*_, _angle=0.523599_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.set_sharpness_by_angle "Link to this definition")

Set edge sharpness based on the angle between neighboring faces

Parameters:

- **angle** ( _float in_ _\[_ _0.000174533_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Angle

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Add new sharp edges without clearing existing sharp edges


bpy.ops.mesh.shape\_propagate\_to\_all() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.shape_propagate_to_all "Link to this definition")

Apply selected vertex locations to all other shape keys

bpy.ops.mesh.shortest\_path\_pick( _\*_, _edge\_mode='SELECT'_, _use\_face\_step=False_, _use\_topology\_distance=False_, _use\_fill=False_, _skip=0_, _nth=1_, _offset=0_, _index=-1_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.shortest_path_pick "Link to this definition")

Select shortest path between two selections

Parameters:

- **edge\_mode** (enum in \[`'SELECT'`, `'SEAM'`, `'SHARP'`, `'CREASE'`, `'BEVEL'`, `'FREESTYLE'`\], (optional)) – Edge Tag, The edge flag to tag when selecting the shortest path

- **use\_face\_step** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Stepping, Traverse connected faces (includes diagonals and edge-rings)

- **use\_topology\_distance** ( _boolean_ _,_ _(_ _optional_ _)_) – Topology Distance, Find the minimum number of steps, ignoring spatial distance

- **use\_fill** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill Region, Select all paths between the source/destination elements

- **skip** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Deselected, Number of deselected elements in the repetitive sequence

- **nth** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Selected, Number of selected elements in the repetitive sequence

- **offset** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Offset from the starting point


bpy.ops.mesh.shortest\_path\_select( _\*_, _edge\_mode='SELECT'_, _use\_face\_step=False_, _use\_topology\_distance=False_, _use\_fill=False_, _skip=0_, _nth=1_, _offset=0_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.shortest_path_select "Link to this definition")

Selected shortest path between two vertices/edges/faces

Parameters:

- **edge\_mode** (enum in \[`'SELECT'`, `'SEAM'`, `'SHARP'`, `'CREASE'`, `'BEVEL'`, `'FREESTYLE'`\], (optional)) – Edge Tag, The edge flag to tag when selecting the shortest path

- **use\_face\_step** ( _boolean_ _,_ _(_ _optional_ _)_) – Face Stepping, Traverse connected faces (includes diagonals and edge-rings)

- **use\_topology\_distance** ( _boolean_ _,_ _(_ _optional_ _)_) – Topology Distance, Find the minimum number of steps, ignoring spatial distance

- **use\_fill** ( _boolean_ _,_ _(_ _optional_ _)_) – Fill Region, Select all paths between the source/destination elements

- **skip** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Deselected, Number of deselected elements in the repetitive sequence

- **nth** ( _int in_ _\[_ _1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Selected, Number of selected elements in the repetitive sequence

- **offset** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Offset, Offset from the starting point


bpy.ops.mesh.smooth\_normals( _\*_, _factor=0.5_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.smooth_normals "Link to this definition")

Smooth custom normals based on adjacent vertex normals

Parameters:

**factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Factor, Specifies weight of smooth vs original normal

bpy.ops.mesh.solidify( _\*_, _thickness=0.01_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.solidify "Link to this definition")

Create a solid skin by extruding, compensating for sharp angles

Parameters:

**thickness** ( _float in_ _\[_ _-10000_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Thickness

bpy.ops.mesh.sort\_elements( _\*_, _type='VIEW\_ZAXIS'_, _elements={'VERT'}_, _reverse=False_, _seed=0_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.sort_elements "Link to this definition")

The order of selected vertices/edges/faces is modified, based on a given method

Parameters:

- **type** (enum in \[`'VIEW_ZAXIS'`, `'VIEW_XAXIS'`, `'CURSOR_DISTANCE'`, `'MATERIAL'`, `'SELECTED'`, `'RANDOMIZE'`, `'REVERSE'`\], (optional)) –

Type, Type of reordering operation to apply


  - `VIEW_ZAXIS`
    View Z Axis – Sort selected elements from farthest to nearest one in current view.

  - `VIEW_XAXIS`
    View X Axis – Sort selected elements from left to right one in current view.

  - `CURSOR_DISTANCE`
    Cursor Distance – Sort selected elements from nearest to farthest from 3D cursor.

  - `MATERIAL`
    Material – Sort selected faces from smallest to greatest material index.

  - `SELECTED`
    Selected – Move all selected elements in first places, preserving their relative order.
    Warning: This will affect unselected elements’ indices as well.

  - `RANDOMIZE`
    Randomize – Randomize order of selected elements.

  - `REVERSE`
    Reverse – Reverse current order of selected elements.


- **elements** (enum set in {`'VERT'`, `'EDGE'`, `'FACE'`}, (optional)) – Elements, Which elements to affect (vertices, edges and/or faces)

- **reverse** ( _boolean_ _,_ _(_ _optional_ _)_) – Reverse, Reverse the sorting effect

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Seed, Seed for random-based operations


bpy.ops.mesh.spin( _\*_, _steps=12_, _dupli=False_, _angle=1.5708_, _use\_auto\_merge=True_, _use\_normal\_flip=False_, _center=(0.0,0.0,0.0)_, _axis=(0.0,0.0,0.0)_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.spin "Link to this definition")

Extrude selected vertices in a circle around the cursor in indicated viewport

Parameters:

- **steps** ( _int in_ _\[_ _0_ _,_ _1000000_ _\]_ _,_ _(_ _optional_ _)_) – Steps, Steps

- **dupli** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Duplicates

- **angle** ( _float in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Angle, Rotation for each step

- **use\_auto\_merge** ( _boolean_ _,_ _(_ _optional_ _)_) – Auto Merge, Merge first/last when the angle is a full revolution

- **use\_normal\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Normals

- **center** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-inf, inf\], (optional)) – Center, Center in global view space

- **axis** ( [`mathutils.Vector`](https://docs.blender.org/api/current/mathutils.html#mathutils.Vector "mathutils.Vector") of 3 items in \[-1, 1\], (optional)) – Axis, Axis in global view space


bpy.ops.mesh.split() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.split "Link to this definition")

Split off selected geometry from connected unselected geometry

bpy.ops.mesh.split\_normals() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.split_normals "Link to this definition")

Split custom normals of selected vertices

bpy.ops.mesh.subdivide( _\*_, _number\_cuts=1_, _smoothness=0.0_, _ngon=True_, _quadcorner='STRAIGHT\_CUT'_, _fractal=0.0_, _fractal\_along\_normal=0.0_, _seed=0_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.subdivide "Link to this definition")

Subdivide selected edges

Parameters:

- **number\_cuts** ( _int in_ _\[_ _1_ _,_ _100_ _\]_ _,_ _(_ _optional_ _)_) – Number of Cuts

- **smoothness** ( _float in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Smoothness, Smoothness factor

- **ngon** ( _boolean_ _,_ _(_ _optional_ _)_) – Create N-Gons, When disabled, newly created faces are limited to 3 and 4 sided faces

- **quadcorner** (enum in \[`'INNERVERT'`, `'PATH'`, `'STRAIGHT_CUT'`, `'FAN'`\], (optional)) – Quad Corner Type, How to subdivide quad corners (anything other than Straight Cut will prevent n-gons)

- **fractal** ( _float in_ _\[_ _0_ _,_ _1e+06_ _\]_ _,_ _(_ _optional_ _)_) – Fractal, Fractal randomness factor

- **fractal\_along\_normal** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Along Normal, Apply fractal displacement along normal only

- **seed** ( _int in_ _\[_ _0_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Random Seed, Seed for the random number generator


bpy.ops.mesh.subdivide\_edgering( _\*_, _number\_cuts=10_, _interpolation='PATH'_, _smoothness=1.0_, _profile\_shape\_factor=0.0_, _profile\_shape='SMOOTH'_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.subdivide_edgering "Link to this definition")

Subdivide perpendicular edges to the selected edge-ring

Parameters:

- **number\_cuts** ( _int in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Number of Cuts

- **interpolation** (enum in \[`'LINEAR'`, `'PATH'`, `'SURFACE'`\], (optional)) – Interpolation, Interpolation method

- **smoothness** ( _float in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Smoothness, Smoothness factor

- **profile\_shape\_factor** ( _float in_ _\[_ _-1000_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Profile Factor, How much intermediary new edges are shrunk/expanded

- **profile\_shape** (enum in [Proportional Falloff Curve Only Items](https://docs.blender.org/api/current/bpy_types_enum_items/proportional_falloff_curve_only_items.html#rna-enum-proportional-falloff-curve-only-items), (optional)) – Profile Shape, Shape of the profile


bpy.ops.mesh.symmetrize( _\*_, _direction='NEGATIVE\_X'_, _threshold=0.0001_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.symmetrize "Link to this definition")

Enforce symmetry (both form and topological) across an axis

Parameters:

- **direction** (enum in [Symmetrize Direction Items](https://docs.blender.org/api/current/bpy_types_enum_items/symmetrize_direction_items.html#rna-enum-symmetrize-direction-items), (optional)) – Direction, Which sides to copy from and to

- **threshold** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Threshold, Limit for snap middle vertices to the axis center


bpy.ops.mesh.symmetry\_snap( _\*_, _direction='NEGATIVE\_X'_, _threshold=0.05_, _factor=0.5_, _use\_center=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.symmetry_snap "Link to this definition")

Snap vertex pairs to their mirrored locations

Parameters:

- **direction** (enum in [Symmetrize Direction Items](https://docs.blender.org/api/current/bpy_types_enum_items/symmetrize_direction_items.html#rna-enum-symmetrize-direction-items), (optional)) – Direction, Which sides to copy from and to

- **threshold** ( _float in_ _\[_ _0_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Threshold, Distance within which matching vertices are searched

- **factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Factor, Mix factor of the locations of the vertices

- **use\_center** ( _boolean_ _,_ _(_ _optional_ _)_) – Center, Snap middle vertices to the axis center


bpy.ops.mesh.tris\_convert\_to\_quads( _\*_, _face\_threshold=0.698132_, _shape\_threshold=0.698132_, _topology\_influence=0.0_, _uvs=False_, _vcols=False_, _seam=False_, _sharp=False_, _materials=False_, _deselect\_joined=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.tris_convert_to_quads "Link to this definition")

Merge triangles into four sided polygons where possible

Parameters:

- **face\_threshold** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Face Angle, Face angle limit

- **shape\_threshold** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Shape Angle, Shape angle limit

- **topology\_influence** ( _float in_ _\[_ _0_ _,_ _2_ _\]_ _,_ _(_ _optional_ _)_) – Topology Influence, How much to prioritize regular grids of quads as well as quads that touch existing quads

- **uvs** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare UVs

- **vcols** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Color Attributes

- **seam** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Seam

- **sharp** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Sharp

- **materials** ( _boolean_ _,_ _(_ _optional_ _)_) – Compare Materials

- **deselect\_joined** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect Joined, Only select remaining triangles that were not merged


bpy.ops.mesh.unsubdivide( _\*_, _iterations=2_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.unsubdivide "Link to this definition")

Un-subdivide selected edges and faces

Parameters:

**iterations** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Iterations, Number of times to un-subdivide

bpy.ops.mesh.uv\_texture\_add() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.uv_texture_add "Link to this definition")

Add UV map

bpy.ops.mesh.uv\_texture\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.uv_texture_remove "Link to this definition")

Remove UV map

bpy.ops.mesh.uvs\_reverse() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.uvs_reverse "Link to this definition")

Flip direction of UV coordinates inside faces

bpy.ops.mesh.uvs\_rotate( _\*_, _use\_ccw=False_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.uvs_rotate "Link to this definition")

Rotate UV coordinates inside faces

Parameters:

**use\_ccw** ( _boolean_ _,_ _(_ _optional_ _)_) – Counter Clockwise

bpy.ops.mesh.vert\_connect() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.vert_connect "Link to this definition")

Connect selected vertices of faces, splitting the face

bpy.ops.mesh.vert\_connect\_concave() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.vert_connect_concave "Link to this definition")

Make all faces convex

bpy.ops.mesh.vert\_connect\_nonplanar( _\*_, _angle\_limit=0.0872665_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.vert_connect_nonplanar "Link to this definition")

Split non-planar faces that exceed the angle threshold

Parameters:

**angle\_limit** ( _float in_ _\[_ _0_ _,_ _3.14159_ _\]_ _,_ _(_ _optional_ _)_) – Max Angle, Angle limit

bpy.ops.mesh.vert\_connect\_path() [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.vert_connect_path "Link to this definition")

Connect vertices by their selection order, creating edges, splitting faces

bpy.ops.mesh.vertices\_smooth( _\*_, _factor=0.0_, _repeat=1_, _xaxis=True_, _yaxis=True_, _zaxis=True_, _wait\_for\_input=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.vertices_smooth "Link to this definition")

Flatten angles of selected vertices

Parameters:

- **factor** ( _float in_ _\[_ _-10_ _,_ _10_ _\]_ _,_ _(_ _optional_ _)_) – Smoothing, Smoothing factor

- **repeat** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Repeat, Number of times to smooth the mesh

- **xaxis** ( _boolean_ _,_ _(_ _optional_ _)_) – X-Axis, Smooth along the X axis

- **yaxis** ( _boolean_ _,_ _(_ _optional_ _)_) – Y-Axis, Smooth along the Y axis

- **zaxis** ( _boolean_ _,_ _(_ _optional_ _)_) – Z-Axis, Smooth along the Z axis

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input


bpy.ops.mesh.vertices\_smooth\_laplacian( _\*_, _repeat=1_, _lambda\_factor=1.0_, _lambda\_border=5e-05_, _use\_x=True_, _use\_y=True_, _use\_z=True_, _preserve\_volume=True_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.vertices_smooth_laplacian "Link to this definition")

Laplacian smooth of selected vertices

Parameters:

- **repeat** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Number of iterations to smooth the mesh

- **lambda\_factor** ( _float in_ _\[_ _1e-07_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Lambda factor

- **lambda\_border** ( _float in_ _\[_ _1e-07_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Lambda factor in border

- **use\_x** ( _boolean_ _,_ _(_ _optional_ _)_) – Smooth X Axis, Smooth object along X axis

- **use\_y** ( _boolean_ _,_ _(_ _optional_ _)_) – Smooth Y Axis, Smooth object along Y axis

- **use\_z** ( _boolean_ _,_ _(_ _optional_ _)_) – Smooth Z Axis, Smooth object along Z axis

- **preserve\_volume** ( _boolean_ _,_ _(_ _optional_ _)_) – Preserve Volume, Apply volume preservation after smooth


bpy.ops.mesh.wireframe( _\*_, _use\_boundary=True_, _use\_even\_offset=True_, _use\_relative\_offset=False_, _use\_replace=True_, _thickness=0.01_, _offset=0.01_, _use\_crease=False_, _crease\_weight=0.01_) [¶](https://docs.blender.org/api/current/bpy.ops.mesh.html#bpy.ops.mesh.wireframe "Link to this definition")

Create a solid wireframe from faces

Parameters:

- **use\_boundary** ( _boolean_ _,_ _(_ _optional_ _)_) – Boundary, Inset face boundaries

- **use\_even\_offset** ( _boolean_ _,_ _(_ _optional_ _)_) – Offset Even, Scale the offset to give more even thickness

- **use\_relative\_offset** ( _boolean_ _,_ _(_ _optional_ _)_) – Offset Relative, Scale the offset by surrounding geometry

- **use\_replace** ( _boolean_ _,_ _(_ _optional_ _)_) – Replace, Remove original faces

- **thickness** ( _float in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Thickness

- **offset** ( _float in_ _\[_ _0_ _,_ _10000_ _\]_ _,_ _(_ _optional_ _)_) – Offset

- **use\_crease** ( _boolean_ _,_ _(_ _optional_ _)_) – Crease, Crease hub edges for an improved subdivision surface

- **crease\_weight** ( _float in_ _\[_ _0_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Crease Weight