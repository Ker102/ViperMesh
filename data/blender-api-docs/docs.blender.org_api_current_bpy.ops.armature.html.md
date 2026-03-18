ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.armature.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.armature.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Armature Operators [¶](https://docs.blender.org/api/current/bpy.ops.armature.html\#module-bpy.ops.armature "Link to this heading")

bpy.ops.armature.align() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.align "Link to this definition")

Align selected bones to the active bone (or to their parent)

bpy.ops.armature.assign\_to\_collection( _\*_, _collection\_index=-1_, _new\_collection\_name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.assign_to_collection "Link to this definition")

Assign all selected bones to a collection, or unassign them, depending on whether the active bone is already assigned or not

Parameters:

- **collection\_index** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Collection Index, Index of the collection to assign selected bones to. When the operator should create a new bone collection, use new\_collection\_name to define the collection name, and set this parameter to the parent index of the new bone collection

- **new\_collection\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of a to-be-added bone collection. Only pass this if you want to create a new bone collection and assign the selected bones to it. To assign to an existing collection, do not include this parameter and use collection\_index


bpy.ops.armature.autoside\_names( _\*_, _type='XAXIS'_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.autoside_names "Link to this definition")

Automatically renames the selected bones according to which side of the target axis they fall on

Parameters:

**type** (enum in \[`'XAXIS'`, `'YAXIS'`, `'ZAXIS'`\], (optional)) –

Axis, Axis to tag names with

- `XAXIS`
X-Axis – Left/Right.

- `YAXIS`
Y-Axis – Front/Back.

- `ZAXIS`
Z-Axis – Top/Bottom.


bpy.ops.armature.bone\_primitive\_add( _\*_, _name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.bone_primitive_add "Link to this definition")

Add a new bone located at the 3D cursor

Parameters:

**name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of the newly created bone

bpy.ops.armature.calculate\_roll( _\*_, _type='POS\_X'_, _axis\_flip=False_, _axis\_only=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.calculate_roll "Link to this definition")

Automatically fix alignment of select bones’ axes

Parameters:

- **type** (enum in \[`'POS_X'`, `'POS_Z'`, `'GLOBAL_POS_X'`, `'GLOBAL_POS_Y'`, `'GLOBAL_POS_Z'`, `'NEG_X'`, `'NEG_Z'`, `'GLOBAL_NEG_X'`, `'GLOBAL_NEG_Y'`, `'GLOBAL_NEG_Z'`, `'ACTIVE'`, `'VIEW'`, `'CURSOR'`\], (optional)) – Type

- **axis\_flip** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Axis, Negate the alignment axis

- **axis\_only** ( _boolean_ _,_ _(_ _optional_ _)_) – Shortest Rotation, Ignore the axis direction, use the shortest rotation to align


bpy.ops.armature.click\_extrude() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.click_extrude "Link to this definition")

Create a new bone going from the last selected joint to the mouse position

bpy.ops.armature.collection\_add() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_add "Link to this definition")

Add a new bone collection

bpy.ops.armature.collection\_assign( _\*_, _name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_assign "Link to this definition")

Add selected bones to the chosen bone collection

Parameters:

**name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Bone Collection, Name of the bone collection to assign this bone to; empty to assign to the active bone collection

bpy.ops.armature.collection\_create\_and\_assign( _\*_, _name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_create_and_assign "Link to this definition")

Create a new bone collection and assign all selected bones

Parameters:

**name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Bone Collection, Name of the bone collection to create

bpy.ops.armature.collection\_deselect() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_deselect "Link to this definition")

Deselect bones of active Bone Collection

bpy.ops.armature.collection\_move( _\*_, _direction='UP'_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_move "Link to this definition")

Change position of active Bone Collection in list of Bone collections

Parameters:

**direction** (enum in \[`'UP'`, `'DOWN'`\], (optional)) – Direction, Direction to move the active Bone Collection towards

bpy.ops.armature.collection\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_remove "Link to this definition")

Remove the active bone collection

bpy.ops.armature.collection\_remove\_unused() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_remove_unused "Link to this definition")

Remove all bone collections that have neither bones nor children. This is done recursively, so bone collections that only have unused children are also removed

File:

[startup/bl\_operators/anim.py:617](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L617)

bpy.ops.armature.collection\_select() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_select "Link to this definition")

Select bones in active Bone Collection

bpy.ops.armature.collection\_show\_all() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_show_all "Link to this definition")

Show all bone collections

File:

[startup/bl\_operators/anim.py:572](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L572)

bpy.ops.armature.collection\_unassign( _\*_, _name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_unassign "Link to this definition")

Remove selected bones from the active bone collection

Parameters:

**name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Bone Collection, Name of the bone collection to unassign this bone from; empty to unassign from the active bone collection

bpy.ops.armature.collection\_unassign\_named( _\*_, _name=''_, _bone\_name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_unassign_named "Link to this definition")

Unassign the named bone from this bone collection

Parameters:

- **name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Bone Collection, Name of the bone collection to unassign this bone from; empty to unassign from the active bone collection

- **bone\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Bone Name, Name of the bone to unassign from the collection; empty to use the active bone


bpy.ops.armature.collection\_unsolo\_all() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.collection_unsolo_all "Link to this definition")

Clear the ‘solo’ setting on all bone collections

File:

[startup/bl\_operators/anim.py:595](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L595)

bpy.ops.armature.copy\_bone\_color\_to\_selected( _\*_, _bone\_type='EDIT'_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.copy_bone_color_to_selected "Link to this definition")

Copy the bone color of the active bone to all selected bones

Parameters:

**bone\_type** (enum in \[`'EDIT'`, `'POSE'`\], (optional)) –

Type

- `EDIT`
Bone – Copy Bone colors from the active bone to all selected bones.

- `POSE`
Pose Bone – Copy Pose Bone colors from the active pose bone to all selected pose bones.


File:

[startup/bl\_operators/anim.py:491](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L491)

bpy.ops.armature.delete( _\*_, _confirm=True_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.delete "Link to this definition")

Remove selected bones from the armature

Parameters:

**confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm, Prompt for confirmation

bpy.ops.armature.dissolve() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.dissolve "Link to this definition")

Dissolve selected bones from the armature

bpy.ops.armature.duplicate( _\*_, _do\_flip\_names=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.duplicate "Link to this definition")

Make copies of the selected bones within the same armature

Parameters:

**do\_flip\_names** ( _boolean_ _,_ _(_ _optional_ _)_) – Flip Names, Try to flip names of the bones, if possible, instead of adding a number extension

bpy.ops.armature.duplicate\_move( _\*_, _ARMATURE\_OT\_duplicate=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.duplicate_move "Link to this definition")

Make copies of the selected bones within the same armature and move them

Parameters:

- **ARMATURE\_OT\_duplicate** (`ARMATURE_OT_duplicate`, (optional)) – Duplicate Selected Bone(s), Make copies of the selected bones within the same armature

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.armature.extrude( _\*_, _forked=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.extrude "Link to this definition")

Create new bones from the selected joints

Parameters:

**forked** ( _boolean_ _,_ _(_ _optional_ _)_) – Forked

bpy.ops.armature.extrude\_forked( _\*_, _ARMATURE\_OT\_extrude=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.extrude_forked "Link to this definition")

Create new bones from the selected joints and move them

Parameters:

- **ARMATURE\_OT\_extrude** (`ARMATURE_OT_extrude`, (optional)) – Extrude, Create new bones from the selected joints

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.armature.extrude\_move( _\*_, _ARMATURE\_OT\_extrude=None_, _TRANSFORM\_OT\_translate=None_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.extrude_move "Link to this definition")

Create new bones from the selected joints and move them

Parameters:

- **ARMATURE\_OT\_extrude** (`ARMATURE_OT_extrude`, (optional)) – Extrude, Create new bones from the selected joints

- **TRANSFORM\_OT\_translate** (`TRANSFORM_OT_translate`, (optional)) – Move, Move selected items


bpy.ops.armature.fill() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.fill "Link to this definition")

Add bone between selected joint(s) and/or 3D cursor

bpy.ops.armature.flip\_names( _\*_, _do\_strip\_numbers=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.flip_names "Link to this definition")

Flips (and corrects) the axis suffixes of the names of selected bones

Parameters:

**do\_strip\_numbers** ( _boolean_ _,_ _(_ _optional_ _)_) – Strip Numbers, Try to remove right-most dot-number from flipped names.Warning: May result in incoherent naming in some cases

bpy.ops.armature.hide( _\*_, _unselected=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.hide "Link to this definition")

Tag selected bones to not be visible in Edit Mode

Parameters:

**unselected** ( _boolean_ _,_ _(_ _optional_ _)_) – Unselected, Hide unselected rather than selected

bpy.ops.armature.move\_to\_collection( _\*_, _collection\_index=-1_, _new\_collection\_name=''_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.move_to_collection "Link to this definition")

Move bones to a collection

Parameters:

- **collection\_index** ( _int in_ _\[_ _-1_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Collection Index, Index of the collection to move selected bones to. When the operator should create a new bone collection, do not include this parameter and pass new\_collection\_name

- **new\_collection\_name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of a to-be-added bone collection. Only pass this if you want to create a new bone collection and move the selected bones to it. To move to an existing collection, do not include this parameter and use collection\_index


bpy.ops.armature.parent\_clear( _\*_, _type='CLEAR'_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.parent_clear "Link to this definition")

Remove the parent-child relationship between selected bones and their parents

Parameters:

**type** (enum in \[`'CLEAR'`, `'DISCONNECT'`\], (optional)) – Clear Type, What way to clear parenting

bpy.ops.armature.parent\_set( _\*_, _type='CONNECTED'_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.parent_set "Link to this definition")

Set the active bone as the parent of the selected bones

Parameters:

**type** (enum in \[`'CONNECTED'`, `'OFFSET'`\], (optional)) – Parent Type, Type of parenting

bpy.ops.armature.reveal( _\*_, _select=True_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.reveal "Link to this definition")

Reveal all bones hidden in Edit Mode

Parameters:

**select** ( _boolean_ _,_ _(_ _optional_ _)_) – Select

bpy.ops.armature.roll\_clear( _\*_, _roll=0.0_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.roll_clear "Link to this definition")

Clear roll for selected bones

Parameters:

**roll** ( _float in_ _\[_ _-6.28319_ _,_ _6.28319_ _\]_ _,_ _(_ _optional_ _)_) – Roll

bpy.ops.armature.select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_all "Link to this definition")

Toggle selection status of all bones

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


bpy.ops.armature.select\_hierarchy( _\*_, _direction='PARENT'_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_hierarchy "Link to this definition")

Select immediate parent/children of selected bones

Parameters:

- **direction** (enum in \[`'PARENT'`, `'CHILD'`\], (optional)) – Direction

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection


bpy.ops.armature.select\_less() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_less "Link to this definition")

Deselect those bones at the boundary of each selection region

bpy.ops.armature.select\_linked( _\*_, _all\_forks=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_linked "Link to this definition")

Select all bones linked by parent/child connections to the current selection

Parameters:

**all\_forks** ( _boolean_ _,_ _(_ _optional_ _)_) – All Forks, Follow forks in the parents chain

bpy.ops.armature.select\_linked\_pick( _\*_, _deselect=False_, _all\_forks=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_linked_pick "Link to this definition")

(De)select bones linked by parent/child connections under the mouse cursor

Parameters:

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect

- **all\_forks** ( _boolean_ _,_ _(_ _optional_ _)_) – All Forks, Follow forks in the parents chain


bpy.ops.armature.select\_mirror( _\*_, _only\_active=False_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_mirror "Link to this definition")

Mirror the bone selection

Parameters:

- **only\_active** ( _boolean_ _,_ _(_ _optional_ _)_) – Active Only, Only operate on the active bone

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend the selection


bpy.ops.armature.select\_more() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_more "Link to this definition")

Select those bones connected to the initial selection

bpy.ops.armature.select\_similar( _\*_, _type='LENGTH'_, _threshold=0.1_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.select_similar "Link to this definition")

Select similar bones by property types

Parameters:

- **type** (enum in \[`'CHILDREN'`, `'CHILDREN_IMMEDIATE'`, `'SIBLINGS'`, `'LENGTH'`, `'DIRECTION'`, `'PREFIX'`, `'SUFFIX'`, `'BONE_COLLECTION'`, `'COLOR'`, `'SHAPE'`\], (optional)) – Type

- **threshold** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Threshold


bpy.ops.armature.separate() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.separate "Link to this definition")

Isolate selected bones into a separate armature

bpy.ops.armature.shortest\_path\_pick() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.shortest_path_pick "Link to this definition")

Select shortest path between two bones

bpy.ops.armature.split() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.split "Link to this definition")

Split off selected bones from connected unselected bones

bpy.ops.armature.subdivide( _\*_, _number\_cuts=1_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.subdivide "Link to this definition")

Break selected bones into chains of smaller bones

Parameters:

**number\_cuts** ( _int in_ _\[_ _1_ _,_ _1000_ _\]_ _,_ _(_ _optional_ _)_) – Number of Cuts

bpy.ops.armature.switch\_direction() [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.switch_direction "Link to this definition")

Change the direction that a chain of bones points in (head and tail swap)

bpy.ops.armature.symmetrize( _\*_, _direction='NEGATIVE\_X'_, _copy\_bone\_colors=False_) [¶](https://docs.blender.org/api/current/bpy.ops.armature.html#bpy.ops.armature.symmetrize "Link to this definition")

Enforce symmetry, make copies of the selection or use existing

Parameters:

- **direction** (enum in \[`'NEGATIVE_X'`, `'POSITIVE_X'`\], (optional)) – Direction, Which sides to copy from and to (when both are selected)

- **copy\_bone\_colors** ( _boolean_ _,_ _(_ _optional_ _)_) – Bone Colors, Copy colors to existing bones