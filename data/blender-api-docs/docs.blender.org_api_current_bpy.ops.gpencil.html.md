ContentsMenuExpandLight modeDark modeAuto light/dark, in light modeAuto light/dark, in dark mode[Skip to content](https://docs.blender.org/api/current/bpy.ops.gpencil.html#furo-main-content)

[Back to top](https://docs.blender.org/api/current/bpy.ops.gpencil.html#)

Toggle Light / Dark / Auto color theme

Toggle table of contents sidebar

# Gpencil Operators [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html\#module-bpy.ops.gpencil "Link to this heading")

bpy.ops.gpencil.annotate( _\*_, _mode='DRAW'_, _arrowstyle\_start='NONE'_, _arrowstyle\_end='NONE'_, _use\_stabilizer=False_, _stabilizer\_factor=0.75_, _stabilizer\_radius=35_, _stroke=None_, _wait\_for\_input=True_) [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.annotate "Link to this definition")

Make annotations on the active data

Parameters:

- **mode** (enum in \[`'DRAW'`, `'DRAW_STRAIGHT'`, `'DRAW_POLY'`, `'ERASER'`\], (optional)) –

Mode, Way to interpret mouse movements


  - `DRAW`
    Draw Freehand – Draw freehand stroke(s).

  - `DRAW_STRAIGHT`
    Draw Straight Lines – Draw straight line segment(s).

  - `DRAW_POLY`
    Draw Poly Line – Click to place endpoints of straight line segments (connected).

  - `ERASER`
    Eraser – Erase Annotation strokes.


- **arrowstyle\_start** (enum in \[`'NONE'`, `'ARROW'`, `'ARROW_OPEN'`, `'ARROW_OPEN_INVERTED'`, `'DIAMOND'`\], (optional)) –

Start Arrow Style, Stroke start style


  - `NONE`
    None – Don’t use any arrow/style in corner.

  - `ARROW`
    Arrow – Use closed arrow style.

  - `ARROW_OPEN`
    Open Arrow – Use open arrow style.

  - `ARROW_OPEN_INVERTED`
    Segment – Use perpendicular segment style.

  - `DIAMOND`
    Square – Use square style.


- **arrowstyle\_end** (enum in \[`'NONE'`, `'ARROW'`, `'ARROW_OPEN'`, `'ARROW_OPEN_INVERTED'`, `'DIAMOND'`\], (optional)) –

End Arrow Style, Stroke end style


  - `NONE`
    None – Don’t use any arrow/style in corner.

  - `ARROW`
    Arrow – Use closed arrow style.

  - `ARROW_OPEN`
    Open Arrow – Use open arrow style.

  - `ARROW_OPEN_INVERTED`
    Segment – Use perpendicular segment style.

  - `DIAMOND`
    Square – Use square style.


- **use\_stabilizer** ( _boolean_ _,_ _(_ _optional_ _)_) – Stabilize Stroke, Helper to draw smooth and clean lines. Press Shift for an invert effect (even if this option is not active)

- **stabilizer\_factor** ( _float in_ _\[_ _0_ _,_ _1_ _\]_ _,_ _(_ _optional_ _)_) – Stabilizer Stroke Factor, Higher values gives a smoother stroke

- **stabilizer\_radius** ( _int in_ _\[_ _0_ _,_ _200_ _\]_ _,_ _(_ _optional_ _)_) – Stabilizer Stroke Radius, Minimum distance from last point before stroke continues

- **stroke** (`bpy_prop_collection` of `OperatorStrokeElement`, (optional)) – Stroke

- **wait\_for\_input** ( _boolean_ _,_ _(_ _optional_ _)_) – Wait for Input, Wait for first click instead of painting immediately


bpy.ops.gpencil.annotation\_active\_frame\_delete() [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.annotation_active_frame_delete "Link to this definition")

Delete the active frame for the active Annotation Layer

bpy.ops.gpencil.annotation\_add() [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.annotation_add "Link to this definition")

Add new Annotation data-block

bpy.ops.gpencil.data\_unlink() [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.data_unlink "Link to this definition")

Unlink active Annotation data-block

bpy.ops.gpencil.layer\_annotation\_add() [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.layer_annotation_add "Link to this definition")

Add new Annotation layer or note for the active data-block

bpy.ops.gpencil.layer\_annotation\_move( _\*_, _type='UP'_) [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.layer_annotation_move "Link to this definition")

Move the active Annotation layer up/down in the list

Parameters:

**type** (enum in \[`'UP'`, `'DOWN'`\], (optional)) – Type

bpy.ops.gpencil.layer\_annotation\_remove() [¶](https://docs.blender.org/api/current/bpy.ops.gpencil.html#bpy.ops.gpencil.layer_annotation_remove "Link to this definition")

Remove active Annotation layer