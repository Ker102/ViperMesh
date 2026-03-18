ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.anim.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.anim.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Anim Operators [¶](https://docs.blender.org/api/current/bpy.ops.anim.html\#module-bpy.ops.anim "Link to this heading")

bpy.ops.anim.change\_frame( _\*_, _frame=0.0_, _snap=False_, _seq\_solo\_preview=False_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.change_frame "Link to this definition")

Interactively change the current frame number

Parameters:

- **frame** ( _float in_ _\[_ _-1.04857e+06_ _,_ _1.04857e+06_ _\]_ _,_ _(_ _optional_ _)_) – Frame

- **snap** ( _boolean_ _,_ _(_ _optional_ _)_) – Snap

- **seq\_solo\_preview** ( _boolean_ _,_ _(_ _optional_ _)_) – Strip Preview


bpy.ops.anim.channel\_select\_keys( _\*_, _extend=False_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channel_select_keys "Link to this definition")

Select all keyframes of channel under mouse

Parameters:

**extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection

bpy.ops.anim.channel\_view\_pick( _\*_, _include\_handles=True_, _use\_preview\_range=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channel_view_pick "Link to this definition")

Reset viewable area to show the channel under the cursor

Parameters:

- **include\_handles** ( _boolean_ _,_ _(_ _optional_ _)_) – Include Handles, Include handles of keyframes when calculating extents

- **use\_preview\_range** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Preview Range, Ignore frames outside of the preview range


bpy.ops.anim.channels\_bake( _\*_, _range=(0,0)_, _step=1.0_, _remove\_outside\_range=False_, _interpolation\_type='BEZIER'_, _bake\_modifiers=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_bake "Link to this definition")

Create keyframes following the current shape of F-Curves of selected channels

Parameters:

- **range** ( _int array_ _of_ _2 items in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Frame Range, The range in which to create new keys

- **step** ( _float in_ _\[_ _0.01_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Frame Step, At which interval to add keys

- **remove\_outside\_range** ( _boolean_ _,_ _(_ _optional_ _)_) – Remove Outside Range, Removes keys outside the given range, leaving only the newly baked

- **interpolation\_type** (enum in \[`'BEZIER'`, `'LIN'`, `'CONST'`\], (optional)) –

Interpolation Type, Choose the interpolation type with which new keys will be added


  - `BEZIER`
    Bézier – New keys will be Bézier.

  - `LIN`
    Linear – New keys will be linear.

  - `CONST`
    Constant – New keys will be constant.


- **bake\_modifiers** ( _boolean_ _,_ _(_ _optional_ _)_) – Bake Modifiers, Bake Modifiers into keyframes and delete them after


bpy.ops.anim.channels\_clean\_empty() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_clean_empty "Link to this definition")

Delete all empty animation data containers from visible data-blocks

bpy.ops.anim.channels\_click( _\*_, _extend=False_, _extend\_range=False_, _children\_only=False_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_click "Link to this definition")

Handle mouse clicks over animation channels

Parameters:

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend Select

- **extend\_range** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend Range, Selection of active channel to clicked channel

- **children\_only** ( _boolean_ _,_ _(_ _optional_ _)_) – Select Children Only


bpy.ops.anim.channels\_collapse( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_collapse "Link to this definition")

Collapse (close) all selected expandable animation channels

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Collapse all channels (not just selected ones)

bpy.ops.anim.channels\_delete() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_delete "Link to this definition")

Delete all selected animation channels

bpy.ops.anim.channels\_editable\_toggle( _\*_, _mode='TOGGLE'_, _type='PROTECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_editable_toggle "Link to this definition")

Toggle editability of selected channels

Parameters:

- **mode** (enum in \[`'TOGGLE'`, `'DISABLE'`, `'ENABLE'`, `'INVERT'`\], (optional)) – Mode

- **type** (enum in \[`'PROTECT'`, `'MUTE'`\], (optional)) – Type


bpy.ops.anim.channels\_expand( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_expand "Link to this definition")

Expand (open) all selected expandable animation channels

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Expand all channels (not just selected ones)

bpy.ops.anim.channels\_fcurves\_enable() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_fcurves_enable "Link to this definition")

Clear ‘disabled’ tag from all F-Curves to get broken F-Curves working again

bpy.ops.anim.channels\_group( _\*_, _name='NewGroup'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_group "Link to this definition")

Add selected F-Curves to a new group

Parameters:

**name** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Name, Name of newly created group

bpy.ops.anim.channels\_move( _\*_, _direction='DOWN'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_move "Link to this definition")

Rearrange selected animation channels

Parameters:

**direction** (enum in \[`'TOP'`, `'UP'`, `'DOWN'`, `'BOTTOM'`\], (optional)) – Direction

bpy.ops.anim.channels\_rename() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_rename "Link to this definition")

Rename animation channel under mouse

bpy.ops.anim.channels\_select\_all( _\*_, _action='TOGGLE'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_select_all "Link to this definition")

Toggle selection of all animation channels

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


bpy.ops.anim.channels\_select\_box( _\*_, _xmin=0_, _xmax=0_, _ymin=0_, _ymax=0_, _wait\_for\_input=True_, _deselect=False_, _extend=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_select_box "Link to this definition")

Select all animation channels within the specified region

Parameters:

- **xmin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Min

- **xmax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Max

- **ymin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Min

- **ymax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Max

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input

- **deselect** ( _boolean_ _,_ _(_ _optional_ _)_) – Deselect, Deselect rather than select items

- **extend** ( _boolean_ _,_ _(_ _optional_ _)_) – Extend, Extend selection instead of deselecting everything first


bpy.ops.anim.channels\_select\_filter() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_select_filter "Link to this definition")

Start entering text which filters the set of channels shown to only include those with matching names

bpy.ops.anim.channels\_setting\_disable( _\*_, _mode='DISABLE'_, _type='PROTECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_setting_disable "Link to this definition")

Disable specified setting on all selected animation channels

Parameters:

- **mode** (enum in \[`'TOGGLE'`, `'DISABLE'`, `'ENABLE'`, `'INVERT'`\], (optional)) – Mode

- **type** (enum in \[`'PROTECT'`, `'MUTE'`\], (optional)) – Type


bpy.ops.anim.channels\_setting\_enable( _\*_, _mode='ENABLE'_, _type='PROTECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_setting_enable "Link to this definition")

Enable specified setting on all selected animation channels

Parameters:

- **mode** (enum in \[`'TOGGLE'`, `'DISABLE'`, `'ENABLE'`, `'INVERT'`\], (optional)) – Mode

- **type** (enum in \[`'PROTECT'`, `'MUTE'`\], (optional)) – Type


bpy.ops.anim.channels\_setting\_toggle( _\*_, _mode='TOGGLE'_, _type='PROTECT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_setting_toggle "Link to this definition")

Toggle specified setting on all selected animation channels

Parameters:

- **mode** (enum in \[`'TOGGLE'`, `'DISABLE'`, `'ENABLE'`, `'INVERT'`\], (optional)) – Mode

- **type** (enum in \[`'PROTECT'`, `'MUTE'`\], (optional)) – Type


bpy.ops.anim.channels\_ungroup() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_ungroup "Link to this definition")

Remove selected F-Curves from their current groups

bpy.ops.anim.channels\_view\_selected( _\*_, _include\_handles=True_, _use\_preview\_range=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.channels_view_selected "Link to this definition")

Reset viewable area to show the selected channels

Parameters:

- **include\_handles** ( _boolean_ _,_ _(_ _optional_ _)_) – Include Handles, Include handles of keyframes when calculating extents

- **use\_preview\_range** ( _boolean_ _,_ _(_ _optional_ _)_) – Use Preview Range, Ignore frames outside of the preview range


bpy.ops.anim.clear\_useless\_actions( _\*_, _only\_unused=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.clear_useless_actions "Link to this definition")

Mark actions with no F-Curves for deletion after save and reload of file preserving “action libraries”

Parameters:

**only\_unused** ( _boolean_ _,_ _(_ _optional_ _)_) – Only Unused, Only unused (Fake User only) actions get considered

File:

[startup/bl\_operators/anim.py:365](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L365)

bpy.ops.anim.convert\_legacy\_action() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.convert_legacy_action "Link to this definition")

Convert a legacy Action to a layered Action on the active object

bpy.ops.anim.copy\_driver\_button() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.copy_driver_button "Link to this definition")

Copy the driver for the highlighted button

bpy.ops.anim.driver\_button\_add() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.driver_button_add "Link to this definition")

Add driver for the property under the cursor

bpy.ops.anim.driver\_button\_edit() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.driver_button_edit "Link to this definition")

Edit the drivers for the connected property represented by the highlighted button

bpy.ops.anim.driver\_button\_remove( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.driver_button_remove "Link to this definition")

Remove the driver(s) for the connected property(s) represented by the highlighted button

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Delete drivers for all elements of the array

bpy.ops.anim.end\_frame\_set() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.end_frame_set "Link to this definition")

Set the current frame as the preview or scene end frame

bpy.ops.anim.keyframe\_clear\_button( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_clear_button "Link to this definition")

Clear all keyframes on the currently active property

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Clear keyframes from all elements of the array

bpy.ops.anim.keyframe\_clear\_v3d( _\*_, _confirm=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_clear_v3d "Link to this definition")

Remove all keyframe animation for selected objects

Parameters:

**confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm, Prompt for confirmation

bpy.ops.anim.keyframe\_clear\_vse( _\*_, _confirm=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_clear_vse "Link to this definition")

Remove all keyframe animation for selected strips

Parameters:

**confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm, Prompt for confirmation

bpy.ops.anim.keyframe\_delete( _\*_, _type='DEFAULT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_delete "Link to this definition")

Delete keyframes on the current frame for all properties in the specified Keying Set

Parameters:

**type** (enum in \[`'DEFAULT'`\], (optional)) – Keying Set, The Keying Set to use

bpy.ops.anim.keyframe\_delete\_button( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_delete_button "Link to this definition")

Delete current keyframe of current UI-active property

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Delete keyframes from all elements of the array

bpy.ops.anim.keyframe\_delete\_by\_name( _\*_, _type=''_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_delete_by_name "Link to this definition")

Alternate access to ‘Delete Keyframe’ for keymaps to use

Parameters:

**type** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Keying Set, The Keying Set to use

bpy.ops.anim.keyframe\_delete\_v3d( _\*_, _confirm=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_delete_v3d "Link to this definition")

Remove keyframes on current frame for selected objects and bones

Parameters:

**confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm, Prompt for confirmation

bpy.ops.anim.keyframe\_delete\_vse( _\*_, _confirm=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_delete_vse "Link to this definition")

Remove keyframes on current frame for selected strips

Parameters:

**confirm** ( _boolean_ _,_ _(_ _optional_ _)_) – Confirm, Prompt for confirmation

bpy.ops.anim.keyframe\_insert( _\*_, _type='DEFAULT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_insert "Link to this definition")

Insert keyframes on the current frame using either the active keying set, or the user preferences if no keying set is active

Parameters:

**type** (enum in \[`'DEFAULT'`\], (optional)) – Keying Set, The Keying Set to use

bpy.ops.anim.keyframe\_insert\_button( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_insert_button "Link to this definition")

Insert a keyframe for current UI-active property

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Insert a keyframe for all element of the array

bpy.ops.anim.keyframe\_insert\_by\_name( _\*_, _type=''_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_insert_by_name "Link to this definition")

Alternate access to ‘Insert Keyframe’ for keymaps to use

Parameters:

**type** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – Keying Set, The Keying Set to use

bpy.ops.anim.keyframe\_insert\_menu( _\*_, _type='DEFAULT'_, _always\_prompt=False_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyframe_insert_menu "Link to this definition")

Insert Keyframes for specified Keying Set, with menu of available Keying Sets if undefined

Parameters:

- **type** (enum in \[`'DEFAULT'`\], (optional)) – Keying Set, The Keying Set to use

- **always\_prompt** ( _boolean_ _,_ _(_ _optional_ _)_) – Always Show Menu


bpy.ops.anim.keying\_set\_active\_set( _\*_, _type='DEFAULT'_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keying_set_active_set "Link to this definition")

Set a new active keying set

Parameters:

**type** (enum in \[`'DEFAULT'`\], (optional)) – Keying Set, The Keying Set to use

bpy.ops.anim.keying\_set\_add() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keying_set_add "Link to this definition")

Add a new (empty) keying set to the active Scene

bpy.ops.anim.keying\_set\_export( _\*_, _filepath=''_, _filter\_folder=True_, _filter\_text=True_, _filter\_python=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keying_set_export "Link to this definition")

Export Keying Set to a Python script

Parameters:

- **filepath** ( _string_ _,_ _(_ _optional_ _,_ _never None_ _)_) – filepath

- **filter\_folder** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter folders

- **filter\_text** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter text

- **filter\_python** ( _boolean_ _,_ _(_ _optional_ _)_) – Filter Python


File:

[startup/bl\_operators/anim.py:46](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L46)

bpy.ops.anim.keying\_set\_path\_add() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keying_set_path_add "Link to this definition")

Add empty path to active keying set

bpy.ops.anim.keying\_set\_path\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keying_set_path_remove "Link to this definition")

Remove active Path from active keying set

bpy.ops.anim.keying\_set\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keying_set_remove "Link to this definition")

Remove the active keying set

bpy.ops.anim.keyingset\_button\_add( _\*_, _all=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyingset_button_add "Link to this definition")

Add current UI-active property to current keying set

Parameters:

**all** ( _boolean_ _,_ _(_ _optional_ _)_) – All, Add all elements of the array to a Keying Set

bpy.ops.anim.keyingset\_button\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.keyingset_button_remove "Link to this definition")

Remove current UI-active property from current keying set

bpy.ops.anim.merge\_animation() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.merge_animation "Link to this definition")

Merge the animation of the selected objects into the action of the active object. Actions are not deleted by this, but might end up with zero users

bpy.ops.anim.paste\_driver\_button() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.paste_driver_button "Link to this definition")

Paste the driver in the internal clipboard to the highlighted button

bpy.ops.anim.previewrange\_clear() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.previewrange_clear "Link to this definition")

Clear preview range

bpy.ops.anim.previewrange\_set( _\*_, _xmin=0_, _xmax=0_, _ymin=0_, _ymax=0_, _wait\_for\_input=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.previewrange_set "Link to this definition")

Interactively define frame range used for playback

Parameters:

- **xmin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Min

- **xmax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – X Max

- **ymin** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Min

- **ymax** ( _int in_ _\[_ _-inf_ _,_ _inf_ _\]_ _,_ _(_ _optional_ _)_) – Y Max

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input


bpy.ops.anim.scene\_range\_frame() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.scene_range_frame "Link to this definition")

Reset the horizontal view to the current scene frame range, taking the preview range into account if it is active

bpy.ops.anim.separate\_slots() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.separate_slots "Link to this definition")

Move all slots of the action on the active object into newly created, separate actions. All users of those slots will be reassigned to the new actions. The current action won’t be deleted but will be empty and might end up having zero users

bpy.ops.anim.slot\_channels\_move\_to\_new\_action() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.slot_channels_move_to_new_action "Link to this definition")

Move the selected slots into a newly created action

bpy.ops.anim.slot\_new\_for\_id() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.slot_new_for_id "Link to this definition")

Create a new action slot for this data-block, to hold its animation

File:

[startup/bl\_operators/anim.py:722](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L722)

bpy.ops.anim.slot\_unassign\_from\_constraint() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.slot_unassign_from_constraint "Link to this definition")

Un-assign the action slot from this constraint

File:

[startup/bl\_operators/anim.py:780](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L780)

bpy.ops.anim.slot\_unassign\_from\_id() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.slot_unassign_from_id "Link to this definition")

Un-assign the action slot, effectively making this data-block non-animated

File:

[startup/bl\_operators/anim.py:759](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L759)

bpy.ops.anim.slot\_unassign\_from\_nla\_strip() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.slot_unassign_from_nla_strip "Link to this definition")

Un-assign the action slot from this NLA strip, effectively making it non-animated

File:

[startup/bl\_operators/anim.py:780](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L780)

bpy.ops.anim.start\_frame\_set() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.start_frame_set "Link to this definition")

Set the current frame as the preview or scene start frame

bpy.ops.anim.update\_animated\_transform\_constraints( _\*_, _use\_convert\_to\_radians=True_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.update_animated_transform_constraints "Link to this definition")

Update f-curves/drivers affecting Transform constraints (use it with files from 2.70 and earlier)

Parameters:

**use\_convert\_to\_radians** ( _boolean_ _,_ _(_ _optional_ _)_) – Convert to Radians, Convert f-curves/drivers affecting rotations to radians.Warning: Use this only once

File:

[startup/bl\_operators/anim.py:400](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L400)

bpy.ops.anim.version\_bone\_hide\_property() [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.version_bone_hide_property "Link to this definition")

Moves any F-Curves for the hide property of selected armatures into the action of the object. This will only operate on the first layer and strip of the action

File:

[startup/bl\_operators/anim.py:843](https://projects.blender.org/blender/blender/src/branch/main/scripts/startup/bl_operators/anim.py#L843)

bpy.ops.anim.view\_curve\_in\_graph\_editor( _\*_, _all=False_, _isolate=False_) [¶](https://docs.blender.org/api/current/bpy.ops.anim.html#bpy.ops.anim.view_curve_in_graph_editor "Link to this definition")

Frame the property under the cursor in the Graph Editor

Parameters:

- **all** ( _boolean_ _,_ _(_ _optional_ _)_) – Show All, Frame the whole array property instead of only the index under the cursor

- **isolate** ( _boolean_ _,_ _(_ _optional_ _)_) – Isolate, Hides all F-Curves other than the ones being framed