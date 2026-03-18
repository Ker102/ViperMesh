# ModelForge Blender Addon
# Based on BlenderMCP by Siddharth Ahuja (www.github.com/ahujasid)
# Modified for ModelForge - AI-Powered Blender Assistant

import bpy
import mathutils
import json
import threading
import socket
import time
import requests
import tempfile
import traceback
import os
import shutil
import zipfile
from bpy.props import StringProperty, IntProperty, BoolProperty, EnumProperty
import io
from contextlib import redirect_stdout, suppress

bl_info = {
    "name": "ModelForge Blender",
    "author": "ModelForge Team",
    "version": (1, 1, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > ModelForge",
    "description": "Connect Blender to ModelForge AI Assistant",
    "category": "Interface",
    "doc_url": "https://github.com/Ker102/ModelForge",
}

RODIN_FREE_TRIAL_KEY = os.environ.get("RODIN_FREE_TRIAL_KEY", "")

# Add User-Agent as required by Poly Haven API
REQ_HEADERS = requests.utils.default_headers()
REQ_HEADERS.update({"User-Agent": "modelforge-blender"})

class BlenderMCPServer:
    def __init__(self, host='localhost', port=9876):
        self.host = host
        self.port = port
        self.running = False
        self.socket = None
        self.server_thread = None

    def start(self):
        if self.running:
            print("Server is already running")
            return

        try:
            # Create socket
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind((self.host, self.port))
            self.socket.listen(1)

            # Only set running after socket is successfully bound
            self.running = True

            # Start server thread
            self.server_thread = threading.Thread(target=self._server_loop)
            self.server_thread.daemon = True
            self.server_thread.start()

            print(f"BlenderMCP server started on {self.host}:{self.port}")
        except Exception as e:
            print(f"Failed to start server: {str(e)}")
            self.stop()

    def stop(self):
        self.running = False

        # Close socket
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None

        # Wait for thread to finish
        if self.server_thread:
            try:
                if self.server_thread.is_alive():
                    self.server_thread.join(timeout=1.0)
            except:
                pass
            self.server_thread = None

        print("BlenderMCP server stopped")

    def _server_loop(self):
        """Main server loop in a separate thread"""
        print("Server thread started")
        self.socket.settimeout(1.0)  # Timeout to allow for stopping

        while self.running:
            try:
                # Accept new connection
                try:
                    client, address = self.socket.accept()
                    print(f"Connected to client: {address}")

                    # Handle client in a separate thread
                    client_thread = threading.Thread(
                        target=self._handle_client,
                        args=(client,)
                    )
                    client_thread.daemon = True
                    client_thread.start()
                except socket.timeout:
                    # Just check running condition
                    continue
                except Exception as e:
                    print(f"Error accepting connection: {str(e)}")
                    time.sleep(0.5)
            except Exception as e:
                print(f"Error in server loop: {str(e)}")
                if not self.running:
                    break
                time.sleep(0.5)

        print("Server thread stopped")

    def _handle_client(self, client):
        """Handle connected client"""
        print("Client handler started")
        client.settimeout(None)  # No timeout
        buffer = b''
        MAX_BUFFER_BYTES = 10 * 1024 * 1024  # 10 MB safety limit

        try:
            while self.running:
                # Receive data
                try:
                    data = client.recv(8192)
                    if not data:
                        print("Client disconnected")
                        break

                    buffer += data
                    if len(buffer) > MAX_BUFFER_BYTES:
                        print(f"Buffer exceeded {MAX_BUFFER_BYTES} bytes, dropping connection")
                        break
                    try:
                        # Try to parse command
                        command = json.loads(buffer.decode('utf-8'))
                        buffer = b''

                        # Execute command in Blender's main thread
                        def execute_wrapper():
                            try:
                                response = self.execute_command(command)
                                response_json = json.dumps(response)
                                try:
                                    client.sendall(response_json.encode('utf-8'))
                                except:
                                    print("Failed to send response - client disconnected")
                            except Exception as e:
                                print(f"Error executing command: {str(e)}")
                                traceback.print_exc()
                                try:
                                    error_response = {
                                        "status": "error",
                                        "message": str(e)
                                    }
                                    client.sendall(json.dumps(error_response).encode('utf-8'))
                                except:
                                    pass
                            return None

                        # Schedule execution in main thread
                        bpy.app.timers.register(execute_wrapper, first_interval=0.0)
                    except json.JSONDecodeError:
                        # Incomplete data, wait for more
                        pass
                except Exception as e:
                    print(f"Error receiving data: {str(e)}")
                    break
        except Exception as e:
            print(f"Error in client handler: {str(e)}")
        finally:
            try:
                client.close()
            except:
                pass
            print("Client handler stopped")

    def execute_command(self, command):
        """Execute a command in the main Blender thread"""
        try:
            return self._execute_command_internal(command)

        except Exception as e:
            print(f"Error executing command: {str(e)}")
            traceback.print_exc()
            return {"status": "error", "message": str(e)}

    def _execute_command_internal(self, command):
        """Internal command execution with proper context"""
        cmd_type = command.get("type")
        params = command.get("params", {})

        # Base handlers that are always available
        handlers = {
            "get_scene_info": self.get_scene_info,
            "get_object_info": self.get_object_info,
            "get_all_object_info": self.get_all_object_info,
            "get_viewport_screenshot": self.get_viewport_screenshot,
            "execute_code": self.execute_code,
            "list_materials": self.list_materials,
            "delete_object": self.delete_object,
            "set_object_transform": self.set_object_transform,
            "rename_object": self.rename_object,
            "duplicate_object": self.duplicate_object,
            "join_objects": self.join_objects,
            "add_modifier": self.add_modifier,
            "apply_modifier": self.apply_modifier,
            "apply_transforms": self.apply_transforms,
            "shade_smooth": self.shade_smooth,
            "parent_set": self.parent_set,
            "parent_clear": self.parent_clear,
            "set_origin": self.set_origin,
            "move_to_collection": self.move_to_collection,
            "set_visibility": self.set_visibility,
            "export_object": self.export_object,
            "list_installed_addons": self.list_installed_addons,
            "create_material": self.create_material,
            "assign_material": self.assign_material,
            "add_light": self.add_light,
            "set_light_properties": self.set_light_properties,
            "add_camera": self.add_camera,
            "set_camera_properties": self.set_camera_properties,
            "set_render_settings": self.set_render_settings,
            "render_image": self.render_image,
            "get_polyhaven_status": self.get_polyhaven_status,
            "get_hyper3d_status": self.get_hyper3d_status,
            "get_sketchfab_status": self.get_sketchfab_status,
        }

        # Add Polyhaven handlers only if enabled
        if bpy.context.scene.blendermcp_use_polyhaven:
            polyhaven_handlers = {
                "get_polyhaven_categories": self.get_polyhaven_categories,
                "search_polyhaven_assets": self.search_polyhaven_assets,
                "download_polyhaven_asset": self.download_polyhaven_asset,
                "set_texture": self.set_texture,
            }
            handlers.update(polyhaven_handlers)

        # Add Hyper3d handlers only if enabled
        if bpy.context.scene.blendermcp_use_hyper3d:
            hyper3d_handlers = {
                "create_rodin_job": self.create_rodin_job,
                "poll_rodin_job_status": self.poll_rodin_job_status,
                "import_generated_asset": self.import_generated_asset,
            }
            handlers.update(hyper3d_handlers)

        # Add Sketchfab handlers only if enabled
        if bpy.context.scene.blendermcp_use_sketchfab:
            sketchfab_handlers = {
                "search_sketchfab_models": self.search_sketchfab_models,
                "download_sketchfab_model": self.download_sketchfab_model,
            }
            handlers.update(sketchfab_handlers)

        handler = handlers.get(cmd_type)
        if handler:
            try:
                print(f"Executing handler for {cmd_type}")
                result = handler(**params)
                print(f"Handler execution complete")
                return {"status": "success", "result": result}
            except Exception as e:
                print(f"Error in handler: {str(e)}")
                traceback.print_exc()
                return {"status": "error", "message": str(e)}
        else:
            return {"status": "error", "message": f"Unknown command type: {cmd_type}"}



    def get_scene_info(self):
        """Get information about the current Blender scene"""
        try:
            print("Getting scene info...")
            # Simplify the scene info to reduce data size
            scene_info = {
                "name": bpy.context.scene.name,
                "object_count": len(bpy.context.scene.objects),
                "objects": [],
                "materials_count": len(bpy.data.materials),
            }

            # Collect minimal object information (limit to first 10 objects)
            for i, obj in enumerate(bpy.context.scene.objects):
                if i >= 10:  # Reduced from 20 to 10
                    break

                obj_info = {
                    "name": obj.name,
                    "type": obj.type,
                    # Only include basic location data
                    "location": [round(float(obj.location.x), 2),
                                round(float(obj.location.y), 2),
                                round(float(obj.location.z), 2)],
                }
                scene_info["objects"].append(obj_info)

            print(f"Scene info collected: {len(scene_info['objects'])} objects")
            return scene_info
        except Exception as e:
            print(f"Error in get_scene_info: {str(e)}")
            traceback.print_exc()
            return {"error": str(e)}

    @staticmethod
    def _get_aabb(obj):
        """ Returns the world-space axis-aligned bounding box (AABB) of an object. """
        if obj.type != 'MESH':
            raise TypeError("Object must be a mesh")

        # Get the bounding box corners in local space
        local_bbox_corners = [mathutils.Vector(corner) for corner in obj.bound_box]

        # Convert to world coordinates
        world_bbox_corners = [obj.matrix_world @ corner for corner in local_bbox_corners]

        # Compute axis-aligned min/max coordinates
        min_corner = mathutils.Vector(map(min, zip(*world_bbox_corners)))
        max_corner = mathutils.Vector(map(max, zip(*world_bbox_corners)))

        return [
            [*min_corner], [*max_corner]
        ]



    def get_object_info(self, name):
        """Get detailed information about a specific object"""
        obj = bpy.data.objects.get(name)
        if not obj:
            raise ValueError(f"Object not found: {name}")

        # Basic object info
        obj_info = {
            "name": obj.name,
            "type": obj.type,
            "location": [obj.location.x, obj.location.y, obj.location.z],
            "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],
            "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
            "visible": obj.visible_get(),
            "materials": [],
        }

        if obj.type == "MESH":
            bounding_box = self._get_aabb(obj)
            obj_info["world_bounding_box"] = bounding_box

        # Add material slots
        for slot in obj.material_slots:
            if slot.material:
                obj_info["materials"].append(slot.material.name)

        # Add mesh data if applicable
        if obj.type == 'MESH' and obj.data:
            mesh = obj.data
            obj_info["mesh"] = {
                "vertices": len(mesh.vertices),
                "edges": len(mesh.edges),
                "polygons": len(mesh.polygons),
            }

        return obj_info

    def get_all_object_info(self, max_objects=50, start_index=0):
        """Get detailed information about all objects in the scene.
        Returns a list of object details including type, transforms, materials,
        mesh stats, and modifiers for every object.
        Supports pagination via max_objects and start_index."""
        try:
            print("Getting all object info...")
            all_scene_objects = list(bpy.context.scene.objects)
            total_count = len(all_scene_objects)
            subset = all_scene_objects[start_index:start_index + max_objects]
            all_objects = []

            for obj in subset:
                obj_info = {
                    "name": obj.name,
                    "type": obj.type,
                    "location": [round(float(obj.location.x), 3),
                                 round(float(obj.location.y), 3),
                                 round(float(obj.location.z), 3)],
                    "rotation": [round(float(obj.rotation_euler.x), 3),
                                 round(float(obj.rotation_euler.y), 3),
                                 round(float(obj.rotation_euler.z), 3)],
                    "scale": [round(float(obj.scale.x), 3),
                              round(float(obj.scale.y), 3),
                              round(float(obj.scale.z), 3)],
                    "visible": obj.visible_get(),
                    "materials": [],
                    "modifiers": [],
                }

                # Bounding box for mesh objects
                if obj.type == "MESH":
                    try:
                        bounding_box = self._get_aabb(obj)
                        obj_info["world_bounding_box"] = bounding_box
                    except Exception:
                        pass

                # Material slots
                for slot in obj.material_slots:
                    if slot.material:
                        obj_info["materials"].append(slot.material.name)

                # Mesh stats
                if obj.type == 'MESH' and obj.data:
                    mesh = obj.data
                    obj_info["mesh"] = {
                        "vertices": len(mesh.vertices),
                        "edges": len(mesh.edges),
                        "polygons": len(mesh.polygons),
                    }

                # Modifiers
                for mod in obj.modifiers:
                    obj_info["modifiers"].append({
                        "name": mod.name,
                        "type": mod.type,
                    })

                # Light-specific data
                if obj.type == 'LIGHT' and obj.data:
                    light = obj.data
                    obj_info["light"] = {
                        "type": light.type,
                        "energy": round(float(light.energy), 2),
                        "color": [round(float(light.color.r), 3),
                                  round(float(light.color.g), 3),
                                  round(float(light.color.b), 3)],
                    }

                # Camera-specific data
                if obj.type == 'CAMERA' and obj.data:
                    cam = obj.data
                    obj_info["camera"] = {
                        "type": cam.type,
                        "lens": round(float(cam.lens), 2),
                        "clip_start": round(float(cam.clip_start), 3),
                        "clip_end": round(float(cam.clip_end), 2),
                    }

                all_objects.append(obj_info)

            print(f"Collected info for {len(all_objects)} objects (of {total_count} total)")
            return {
                "object_count": len(all_objects),
                "total_in_scene": total_count,
                "start_index": start_index,
                "has_more": start_index + max_objects < total_count,
                "objects": all_objects,
            }
        except Exception as e:
            print(f"Error in get_all_object_info: {str(e)}")
            traceback.print_exc()
            raise

    def get_viewport_screenshot(self, max_size=800, filepath=None, format="png"):
        """
        Capture a screenshot of the current 3D viewport.

        Parameters:
        - max_size: Maximum size in pixels for the largest dimension of the image
        - filepath: Optional path to save the screenshot file. If None, returns
                    the image as base64-encoded data directly.
        - format: Image format (png, jpg, etc.)

        Returns:
        - If filepath: {success, width, height, filepath}
        - If no filepath: {image (base64), width, height, format}
        """
        import os
        import tempfile
        import base64

        return_base64 = filepath is None
        try:
            # Find the active 3D viewport
            area = None
            for a in bpy.context.screen.areas:
                if a.type == 'VIEW_3D':
                    area = a
                    break

            if not area:
                return {"error": "No 3D viewport found"}

            # Determine file path — use temp if none provided
            if return_base64:
                tmp = tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False)
                filepath = tmp.name
                tmp.close()

            # Take screenshot with proper context override
            with bpy.context.temp_override(area=area):
                bpy.ops.screen.screenshot_area(filepath=filepath)

            # Load and resize if needed
            img = bpy.data.images.load(filepath)
            width, height = img.size

            if max(width, height) > max_size:
                scale = max_size / max(width, height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                img.scale(new_width, new_height)

                # Set format and save
                img.file_format = format.upper()
                img.save()
                width, height = new_width, new_height

            # Cleanup Blender image data
            bpy.data.images.remove(img)

            if return_base64:
                # Read the file and encode as base64
                with open(filepath, "rb") as f:
                    image_data = base64.b64encode(f.read()).decode("utf-8")
                # Clean up temp file
                try:
                    os.remove(filepath)
                except OSError:
                    pass
                return {
                    "image": image_data,
                    "width": width,
                    "height": height,
                    "format": format,
                }
            else:
                return {
                    "success": True,
                    "width": width,
                    "height": height,
                    "filepath": filepath
                }

        except Exception as e:
            # Clean up temp file on error
            if return_base64 and filepath:
                try:
                    os.remove(filepath)
                except OSError:
                    pass
            return {"error": str(e)}

    def execute_code(self, code):
        """Execute arbitrary Blender Python code"""
        # This is powerful but potentially dangerous - use with caution
        try:
            # Create a local namespace for execution
            namespace = {"bpy": bpy}

            # Capture stdout during execution, and return it as result
            capture_buffer = io.StringIO()
            with redirect_stdout(capture_buffer):
                exec(code, namespace)

            captured_output = capture_buffer.getvalue()
            return {"executed": True, "result": captured_output}
        except Exception as e:
            raise Exception(f"Code execution error: {str(e)}")

    def list_materials(self):
        """List all materials in the .blend file with their node counts and linked objects"""
        try:
            materials = []
            for mat in bpy.data.materials:
                mat_info = {
                    "name": mat.name,
                    "use_nodes": mat.use_nodes,
                    "node_count": len(mat.node_tree.nodes) if mat.use_nodes and mat.node_tree else 0,
                    "users": mat.users,
                    "linked_objects": [],
                }
                # Find objects using this material
                for obj in bpy.data.objects:
                    if obj.type == 'MESH' and obj.data:
                        for slot in obj.material_slots:
                            if slot.material == mat:
                                mat_info["linked_objects"].append(obj.name)
                                break
                materials.append(mat_info)
            return {"materials": materials, "count": len(materials)}
        except Exception as e:
            return {"error": str(e)}

    def delete_object(self, name):
        """Safely delete an object from the scene by name"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            obj_type = obj.type
            # Store mesh/data ref for orphan cleanup
            obj_data = obj.data

            # Deselect all, select target, delete
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.delete(use_global=False)

            # Clean up orphaned mesh data
            if obj_data and obj_data.users == 0:
                if obj_type == 'MESH':
                    bpy.data.meshes.remove(obj_data)
                elif obj_type == 'CURVE':
                    bpy.data.curves.remove(obj_data)
                elif obj_type == 'LIGHT':
                    bpy.data.lights.remove(obj_data)
                elif obj_type == 'CAMERA':
                    bpy.data.cameras.remove(obj_data)

            return {
                "success": True,
                "message": f"Deleted object '{name}' (type: {obj_type})",
                "remaining_objects": len(bpy.context.scene.objects)
            }
        except Exception as e:
            return {"error": f"Failed to delete object: {str(e)}"}

    # ---------- Phase 1A: Transform Tools ----------

    def set_object_transform(self, name, location=None, rotation=None, scale=None):
        """Set an object's location, rotation (euler degrees), and/or scale"""
        try:
            import math
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            changes = []
            if location is not None:
                obj.location = (float(location[0]), float(location[1]), float(location[2]))
                changes.append("location")
            if rotation is not None:
                obj.rotation_euler = (
                    math.radians(float(rotation[0])),
                    math.radians(float(rotation[1])),
                    math.radians(float(rotation[2])),
                )
                changes.append("rotation")
            if scale is not None:
                obj.scale = (float(scale[0]), float(scale[1]), float(scale[2]))
                changes.append("scale")

            if not changes:
                return {"error": "No transform values provided. Supply location, rotation, and/or scale."}

            return {
                "success": True,
                "object": name,
                "changed": changes,
                "location": list(obj.location),
                "rotation_degrees": [math.degrees(r) for r in obj.rotation_euler],
                "scale": list(obj.scale),
            }
        except Exception as e:
            return {"error": f"Failed to set transform: {str(e)}"}

    def rename_object(self, name, new_name):
        """Rename an object in the scene"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}
            if bpy.data.objects.get(new_name):
                return {"error": f"An object named '{new_name}' already exists"}

            old_name = obj.name
            obj.name = new_name
            # Also rename the data block if it matches the old name
            if obj.data and obj.data.name == old_name:
                obj.data.name = new_name

            return {
                "success": True,
                "old_name": old_name,
                "new_name": obj.name,
            }
        except Exception as e:
            return {"error": f"Failed to rename object: {str(e)}"}

    def duplicate_object(self, name, new_name=None, linked=False):
        """Duplicate an object. linked=True shares mesh data."""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.duplicate(linked=linked)

            dup = bpy.context.active_object
            if new_name:
                dup.name = new_name
                if dup.data and not linked:
                    dup.data.name = new_name

            return {
                "success": True,
                "original": name,
                "duplicate": dup.name,
                "linked": linked,
            }
        except Exception as e:
            return {"error": f"Failed to duplicate object: {str(e)}"}

    def join_objects(self, names):
        """Join multiple objects into one. First name becomes the active (target) object."""
        try:
            if not names or len(names) < 2:
                return {"error": "Provide at least 2 object names to join"}

            # Validate all names exist
            objects = []
            for n in names:
                obj = bpy.data.objects.get(n)
                if not obj:
                    return {"error": f"Object not found: {n}"}
                if obj.type != 'MESH':
                    return {"error": f"Object '{n}' is type '{obj.type}', only MESH objects can be joined"}
                objects.append(obj)

            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = objects[0]
            bpy.ops.object.join()

            result_obj = bpy.context.active_object
            return {
                "success": True,
                "result_object": result_obj.name,
                "joined_count": len(names),
                "vertex_count": len(result_obj.data.vertices) if result_obj.data else 0,
            }
        except Exception as e:
            return {"error": f"Failed to join objects: {str(e)}"}

    # ---------- Phase 1B: Modifier & Mesh Tools ----------

    def add_modifier(self, name, modifier_type, modifier_name=None, properties=None):
        """Add a modifier to an object. modifier_type is the Blender enum (SUBSURF, MIRROR, BEVEL, etc.)"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_add(type=modifier_type)

            # The newly added modifier is the last one
            mod = obj.modifiers[-1]
            if modifier_name:
                mod.name = modifier_name

            # Apply optional properties
            if properties and isinstance(properties, dict):
                for prop_name, prop_value in properties.items():
                    try:
                        setattr(mod, prop_name, prop_value)
                    except (AttributeError, TypeError) as prop_err:
                        pass  # Skip invalid properties silently

            return {
                "success": True,
                "object": name,
                "modifier": mod.name,
                "type": modifier_type,
                "total_modifiers": len(obj.modifiers),
            }
        except RuntimeError as e:
            return {"error": f"Invalid modifier type '{modifier_type}': {str(e)}"}
        except Exception as e:
            return {"error": f"Failed to add modifier: {str(e)}"}

    def apply_modifier(self, name, modifier):
        """Apply (bake) a modifier on an object and remove it from the stack"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}
            if modifier not in obj.modifiers:
                available = [m.name for m in obj.modifiers]
                return {"error": f"Modifier '{modifier}' not found on '{name}'. Available: {available}"}

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier)

            return {
                "success": True,
                "object": name,
                "applied_modifier": modifier,
                "remaining_modifiers": [m.name for m in obj.modifiers],
            }
        except Exception as e:
            return {"error": f"Failed to apply modifier: {str(e)}"}

    def apply_transforms(self, name, location=True, rotation=True, scale=True):
        """Apply the object's visual transforms to its data (freezes transforms)"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.transform_apply(
                location=bool(location),
                rotation=bool(rotation),
                scale=bool(scale),
            )

            applied = []
            if location:
                applied.append("location")
            if rotation:
                applied.append("rotation")
            if scale:
                applied.append("scale")

            return {
                "success": True,
                "object": name,
                "applied": applied,
            }
        except Exception as e:
            return {"error": f"Failed to apply transforms: {str(e)}"}

    def shade_smooth(self, name, smooth=True, angle=None):
        """Set smooth or flat shading on an object. Optional angle for auto-smooth."""
        try:
            import math
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}
            if obj.type != 'MESH':
                return {"error": f"Object '{name}' is type '{obj.type}', shading only works on MESH"}

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj

            if smooth:
                if angle is not None:
                    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(float(angle)))
                    mode = f"smooth_by_angle({angle}°)"
                else:
                    bpy.ops.object.shade_smooth()
                    mode = "smooth"
            else:
                bpy.ops.object.shade_flat()
                mode = "flat"

            return {
                "success": True,
                "object": name,
                "shading": mode,
            }
        except Exception as e:
            return {"error": f"Failed to set shading: {str(e)}"}

    # ---------- Phase 2: Medium-Priority Tools ----------

    def parent_set(self, child_name, parent_name, parent_type='OBJECT'):
        """Set parent-child relationship between objects"""
        try:
            child = bpy.data.objects.get(child_name)
            parent = bpy.data.objects.get(parent_name)
            if not child:
                return {"error": f"Child object not found: {child_name}"}
            if not parent:
                return {"error": f"Parent object not found: {parent_name}"}

            bpy.ops.object.select_all(action='DESELECT')
            child.select_set(True)
            parent.select_set(True)
            bpy.context.view_layer.objects.active = parent
            bpy.ops.object.parent_set(type=parent_type, keep_transform=True)

            return {
                "success": True,
                "child": child.name,
                "parent": parent.name,
                "type": parent_type,
            }
        except Exception as e:
            return {"error": f"Failed to set parent: {str(e)}"}

    def parent_clear(self, name, keep_transform=True):
        """Clear parent from an object"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}
            if not obj.parent:
                return {"error": f"Object '{name}' has no parent"}

            old_parent = obj.parent.name
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj

            clear_type = 'CLEAR_KEEP_TRANSFORM' if keep_transform else 'CLEAR'
            bpy.ops.object.parent_clear(type=clear_type)

            return {
                "success": True,
                "object": name,
                "old_parent": old_parent,
                "keep_transform": keep_transform,
            }
        except Exception as e:
            return {"error": f"Failed to clear parent: {str(e)}"}

    def set_origin(self, name, origin_type='ORIGIN_GEOMETRY', center='MEDIAN'):
        """Set the origin point of an object"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            valid_types = ['GEOMETRY_ORIGIN', 'ORIGIN_GEOMETRY', 'ORIGIN_CURSOR',
                           'ORIGIN_CENTER_OF_MASS', 'ORIGIN_CENTER_OF_VOLUME']
            if origin_type not in valid_types:
                return {"error": f"Invalid origin type. Must be one of: {valid_types}"}

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.origin_set(type=origin_type, center=center)

            return {
                "success": True,
                "object": name,
                "origin_type": origin_type,
                "new_origin": list(obj.location),
            }
        except Exception as e:
            return {"error": f"Failed to set origin: {str(e)}"}

    def move_to_collection(self, name, collection_name, create_new=False):
        """Move an object to a collection. Optionally create the collection if it doesn't exist."""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            target_col = bpy.data.collections.get(collection_name)
            if not target_col:
                if create_new:
                    target_col = bpy.data.collections.new(collection_name)
                    bpy.context.scene.collection.children.link(target_col)
                else:
                    available = [c.name for c in bpy.data.collections]
                    return {"error": f"Collection '{collection_name}' not found. Available: {available}. Set create_new=true to create it."}

            # Link to target collection
            if obj.name not in target_col.objects:
                target_col.objects.link(obj)

            # Unlink from all other collections
            for col in obj.users_collection:
                if col != target_col:
                    col.objects.unlink(obj)

            return {
                "success": True,
                "object": name,
                "collection": target_col.name,
                "created_new": create_new and not bpy.data.collections.get(collection_name),
            }
        except Exception as e:
            return {"error": f"Failed to move to collection: {str(e)}"}

    def set_visibility(self, name, hide_viewport=None, hide_render=None):
        """Set viewport and/or render visibility for an object"""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}

            changes = []
            if hide_viewport is not None:
                obj.hide_viewport = bool(hide_viewport)
                changes.append(f"hide_viewport={hide_viewport}")
            if hide_render is not None:
                obj.hide_render = bool(hide_render)
                changes.append(f"hide_render={hide_render}")

            if not changes:
                return {"error": "Provide hide_viewport and/or hide_render"}

            return {
                "success": True,
                "object": name,
                "hide_viewport": obj.hide_viewport,
                "hide_render": obj.hide_render,
                "changes": changes,
            }
        except Exception as e:
            return {"error": f"Failed to set visibility: {str(e)}"}

    def export_object(self, names, filepath, file_format='GLB'):
        """Export selected objects to a file. Supports GLB, GLTF, FBX, OBJ, STL."""
        try:
            import os
            # Validate objects
            objects = []
            for n in (names if isinstance(names, list) else [names]):
                obj = bpy.data.objects.get(n)
                if not obj:
                    return {"error": f"Object not found: {n}"}
                objects.append(obj)

            # Select only the target objects
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = objects[0]

            fmt = file_format.upper()
            if fmt in ('GLB', 'GLTF'):
                export_format = 'GLB' if fmt == 'GLB' else 'GLTF_SEPARATE'
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    use_selection=True,
                    export_format=export_format,
                )
            elif fmt == 'FBX':
                bpy.ops.export_scene.fbx(
                    filepath=filepath,
                    use_selection=True,
                )
            elif fmt == 'OBJ':
                bpy.ops.wm.obj_export(
                    filepath=filepath,
                    export_selected_objects=True,
                )
            elif fmt == 'STL':
                bpy.ops.wm.stl_export(
                    filepath=filepath,
                    export_selected_objects=True,
                )
            else:
                return {"error": f"Unsupported format: {file_format}. Use GLB, GLTF, FBX, OBJ, or STL."}

            file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
            return {
                "success": True,
                "exported_objects": [o.name for o in objects],
                "filepath": filepath,
                "format": fmt,
                "file_size_bytes": file_size,
            }
        except Exception as e:
            return {"error": f"Failed to export: {str(e)}"}

    # ---------- Phase 3: Dynamic Addon Detection ----------

    def list_installed_addons(self):
        """List all enabled Blender addons with metadata for dynamic capability detection"""
        try:
            import addon_utils
            addons = []
            for mod in addon_utils.modules():
                addon_name = mod.__name__
                is_enabled = addon_name in bpy.context.preferences.addons

                if not is_enabled:
                    continue

                info = {
                    "module": addon_name,
                    "name": getattr(mod, "bl_info", {}).get("name", addon_name),
                    "description": getattr(mod, "bl_info", {}).get("description", ""),
                    "category": getattr(mod, "bl_info", {}).get("category", ""),
                    "version": str(getattr(mod, "bl_info", {}).get("version", "")),
                    "author": getattr(mod, "bl_info", {}).get("author", ""),
                }
                addons.append(info)

            return {
                "addons": addons,
                "count": len(addons),
                "blender_version": ".".join(str(v) for v in bpy.app.version),
            }
        except Exception as e:
            return {"error": f"Failed to list addons: {str(e)}"}

    # ---------- Phase 5: Material / Lighting / Camera / Render Tools ----------

    def create_material(self, name, color=None, metallic=None, roughness=None, use_nodes=True):
        """Create a new Principled BSDF material with optional base color, metallic, and roughness."""
        try:
            mat = bpy.data.materials.new(name=name)
            mat.use_nodes = bool(use_nodes)

            if mat.use_nodes and mat.node_tree:
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    if color is not None:
                        # Accept [R,G,B] or [R,G,B,A] in 0-1 range
                        c = list(color)
                        if len(c) == 3:
                            c.append(1.0)
                        bsdf.inputs["Base Color"].default_value = c
                    if metallic is not None:
                        bsdf.inputs["Metallic"].default_value = float(metallic)
                    if roughness is not None:
                        bsdf.inputs["Roughness"].default_value = float(roughness)

            return {
                "success": True,
                "material": mat.name,
                "use_nodes": mat.use_nodes,
            }
        except Exception as e:
            return {"error": f"Failed to create material: {str(e)}"}

    def assign_material(self, object_name, material_name, slot_index=None):
        """Assign a material to an object. Replaces slot 0 by default (so the material is visible).
        Use slot_index to target a specific slot, or slot_index=-1 to append to a new slot."""
        try:
            obj = bpy.data.objects.get(object_name)
            if not obj:
                return {"error": f"Object not found: {object_name}"}
            mat = bpy.data.materials.get(material_name)
            if not mat:
                return {"error": f"Material not found: {material_name}"}

            if slot_index is not None and int(slot_index) == -1:
                # Explicit append mode
                obj.data.materials.append(mat)
                assigned_slot = len(obj.material_slots) - 1
            elif slot_index is not None:
                # Replace specific slot
                idx = int(slot_index)
                while len(obj.material_slots) <= idx:
                    obj.data.materials.append(None)
                obj.material_slots[idx].material = mat
                assigned_slot = idx
            else:
                # Default: replace slot 0 (or create it) so the material is immediately visible
                if len(obj.material_slots) > 0:
                    obj.material_slots[0].material = mat
                else:
                    obj.data.materials.append(mat)
                assigned_slot = 0

            return {
                "success": True,
                "object": obj.name,
                "material": mat.name,
                "slot": assigned_slot,
                "total_slots": len(obj.material_slots),
            }
        except Exception as e:
            return {"error": f"Failed to assign material: {str(e)}"}

    def add_light(self, light_type='POINT', name=None, location=None, energy=None, color=None):
        """Add a new light to the scene. Types: POINT, SUN, SPOT, AREA."""
        try:
            valid = {'POINT', 'SUN', 'SPOT', 'AREA'}
            lt = light_type.upper()
            if lt not in valid:
                return {"error": f"Invalid light type: {light_type}. Use one of {valid}"}

            light_name = name or f"{lt.capitalize()}Light"
            light_data = bpy.data.lights.new(name=light_name, type=lt)
            if energy is not None:
                light_data.energy = float(energy)
            if color is not None:
                light_data.color = tuple(float(c) for c in color[:3])

            light_obj = bpy.data.objects.new(name=light_name, object_data=light_data)
            bpy.context.collection.objects.link(light_obj)

            if location is not None:
                light_obj.location = tuple(float(v) for v in location[:3])

            return {
                "success": True,
                "name": light_obj.name,
                "type": lt,
                "energy": light_data.energy,
                "color": list(light_data.color),
                "location": list(light_obj.location),
            }
        except Exception as e:
            return {"error": f"Failed to add light: {str(e)}"}

    def set_light_properties(self, name, energy=None, color=None, shadow_soft_size=None,
                              spot_size=None, spot_blend=None, size=None):
        """Set properties on an existing light object."""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}
            if obj.type != 'LIGHT':
                return {"error": f"Object '{name}' is not a light (type: {obj.type})"}

            light = obj.data
            changes = []

            if energy is not None:
                light.energy = float(energy)
                changes.append(f"energy={energy}")
            if color is not None:
                light.color = tuple(float(c) for c in color[:3])
                changes.append(f"color={list(light.color)}")
            if shadow_soft_size is not None:
                light.shadow_soft_size = float(shadow_soft_size)
                changes.append(f"shadow_soft_size={shadow_soft_size}")
            if spot_size is not None and light.type == 'SPOT':
                import math
                light.spot_size = math.radians(float(spot_size))
                changes.append(f"spot_size={spot_size}°")
            if spot_blend is not None and light.type == 'SPOT':
                light.spot_blend = float(spot_blend)
                changes.append(f"spot_blend={spot_blend}")
            if size is not None and light.type == 'AREA':
                light.size = float(size)
                changes.append(f"size={size}")

            if not changes:
                return {"error": "No valid properties provided"}

            return {
                "success": True,
                "light": name,
                "light_type": light.type,
                "changes": changes,
            }
        except Exception as e:
            return {"error": f"Failed to set light properties: {str(e)}"}

    def add_camera(self, name=None, location=None, rotation=None, lens=None, sensor_width=None):
        """Add a new camera to the scene."""
        try:
            import math
            cam_name = name or "Camera"
            cam_data = bpy.data.cameras.new(name=cam_name)
            if lens is not None:
                cam_data.lens = float(lens)
            if sensor_width is not None:
                cam_data.sensor_width = float(sensor_width)

            cam_obj = bpy.data.objects.new(name=cam_name, object_data=cam_data)
            bpy.context.collection.objects.link(cam_obj)

            if location is not None:
                cam_obj.location = tuple(float(v) for v in location[:3])
            if rotation is not None:
                cam_obj.rotation_euler = tuple(math.radians(float(v)) for v in rotation[:3])

            return {
                "success": True,
                "name": cam_obj.name,
                "lens": cam_data.lens,
                "sensor_width": cam_data.sensor_width,
                "location": list(cam_obj.location),
                "rotation_deg": [round(math.degrees(r), 2) for r in cam_obj.rotation_euler],
            }
        except Exception as e:
            return {"error": f"Failed to add camera: {str(e)}"}

    def set_camera_properties(self, name, lens=None, sensor_width=None, clip_start=None,
                               clip_end=None, dof_use=None, dof_focus_distance=None,
                               dof_aperture_fstop=None, set_active=None):
        """Set properties on an existing camera. Optionally set it as the active scene camera."""
        try:
            obj = bpy.data.objects.get(name)
            if not obj:
                return {"error": f"Object not found: {name}"}
            if obj.type != 'CAMERA':
                return {"error": f"Object '{name}' is not a camera (type: {obj.type})"}

            cam = obj.data
            changes = []

            if lens is not None:
                cam.lens = float(lens)
                changes.append(f"lens={lens}mm")
            if sensor_width is not None:
                cam.sensor_width = float(sensor_width)
                changes.append(f"sensor_width={sensor_width}")
            if clip_start is not None:
                cam.clip_start = float(clip_start)
                changes.append(f"clip_start={clip_start}")
            if clip_end is not None:
                cam.clip_end = float(clip_end)
                changes.append(f"clip_end={clip_end}")
            if dof_use is not None:
                cam.dof.use_dof = bool(dof_use)
                changes.append(f"dof_use={dof_use}")
            if dof_focus_distance is not None:
                cam.dof.focus_distance = float(dof_focus_distance)
                changes.append(f"dof_focus_distance={dof_focus_distance}")
            if dof_aperture_fstop is not None:
                cam.dof.aperture_fstop = float(dof_aperture_fstop)
                changes.append(f"dof_aperture_fstop={dof_aperture_fstop}")
            if set_active is not None and set_active:
                bpy.context.scene.camera = obj
                changes.append("set_active=True")

            if not changes:
                return {"error": "No valid properties provided"}

            return {
                "success": True,
                "camera": name,
                "changes": changes,
            }
        except Exception as e:
            return {"error": f"Failed to set camera properties: {str(e)}"}

    def set_render_settings(self, engine=None, resolution_x=None, resolution_y=None,
                             resolution_percentage=None, samples=None, use_denoising=None,
                             film_transparent=None, output_path=None, file_format=None):
        """Set render engine and render settings. Engines: BLENDER_EEVEE_NEXT, CYCLES."""
        try:
            scene = bpy.context.scene
            changes = []

            if engine is not None:
                eng = engine.upper()
                # Map common aliases — auto-detect which name the Blender version accepts
                if eng in ('EEVEE', 'EEVEE_NEXT', 'BLENDER_EEVEE_NEXT'):
                    # Try BLENDER_EEVEE_NEXT first (Blender 4.x), fall back to BLENDER_EEVEE (3.x)
                    try:
                        scene.render.engine = 'BLENDER_EEVEE_NEXT'
                        eng = 'BLENDER_EEVEE_NEXT'
                    except TypeError:
                        scene.render.engine = 'BLENDER_EEVEE'
                        eng = 'BLENDER_EEVEE'
                else:
                    scene.render.engine = eng
                changes.append(f"engine={eng}")
            if resolution_x is not None:
                scene.render.resolution_x = int(resolution_x)
                changes.append(f"resolution_x={resolution_x}")
            if resolution_y is not None:
                scene.render.resolution_y = int(resolution_y)
                changes.append(f"resolution_y={resolution_y}")
            if resolution_percentage is not None:
                scene.render.resolution_percentage = int(resolution_percentage)
                changes.append(f"resolution_percentage={resolution_percentage}")
            if samples is not None:
                if scene.render.engine == 'CYCLES':
                    scene.cycles.samples = int(samples)
                elif hasattr(scene.eevee, 'taa_render_samples'):
                    scene.eevee.taa_render_samples = int(samples)
                changes.append(f"samples={samples}")
            if use_denoising is not None:
                if scene.render.engine == 'CYCLES':
                    scene.cycles.use_denoising = bool(use_denoising)
                changes.append(f"use_denoising={use_denoising}")
            if film_transparent is not None:
                scene.render.film_transparent = bool(film_transparent)
                changes.append(f"film_transparent={film_transparent}")
            if output_path is not None:
                scene.render.filepath = output_path
                changes.append(f"output_path={output_path}")
            if file_format is not None:
                scene.render.image_settings.file_format = file_format.upper()
                changes.append(f"file_format={file_format}")

            if not changes:
                return {"error": "No valid settings provided"}

            return {
                "success": True,
                "engine": scene.render.engine,
                "resolution": f"{scene.render.resolution_x}x{scene.render.resolution_y}",
                "changes": changes,
            }
        except Exception as e:
            return {"error": f"Failed to set render settings: {str(e)}"}

    def render_image(self, output_path=None, file_format=None, open_after=False):
        """Render the current scene and optionally save to a file. Returns the output path."""
        try:
            scene = bpy.context.scene

            if output_path:
                scene.render.filepath = output_path
            if file_format:
                scene.render.image_settings.file_format = file_format.upper()

            bpy.ops.render.render(write_still=True)

            return {
                "success": True,
                "output_path": bpy.path.abspath(scene.render.filepath),
                "engine": scene.render.engine,
                "resolution": f"{scene.render.resolution_x}x{scene.render.resolution_y}",
                "file_format": scene.render.image_settings.file_format,
            }
        except Exception as e:
            return {"error": f"Failed to render: {str(e)}"}

    def get_polyhaven_categories(self, asset_type):
        """Get categories for a specific asset type from Polyhaven"""
        try:
            if asset_type not in ["hdris", "textures", "models", "all"]:
                return {"error": f"Invalid asset type: {asset_type}. Must be one of: hdris, textures, models, all"}

            response = requests.get(f"https://api.polyhaven.com/categories/{asset_type}", headers=REQ_HEADERS)
            if response.status_code == 200:
                return {"categories": response.json()}
            else:
                return {"error": f"API request failed with status code {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    def search_polyhaven_assets(self, asset_type=None, categories=None):
        """Search for assets from Polyhaven with optional filtering"""
        try:
            url = "https://api.polyhaven.com/assets"
            params = {}

            if asset_type and asset_type != "all":
                if asset_type not in ["hdris", "textures", "models"]:
                    return {"error": f"Invalid asset type: {asset_type}. Must be one of: hdris, textures, models, all"}
                params["type"] = asset_type

            if categories:
                params["categories"] = categories

            response = requests.get(url, params=params, headers=REQ_HEADERS)
            if response.status_code == 200:
                # Limit the response size to avoid overwhelming Blender
                assets = response.json()
                # Return only the first 20 assets to keep response size manageable
                limited_assets = {}
                for i, (key, value) in enumerate(assets.items()):
                    if i >= 20:  # Limit to 20 assets
                        break
                    limited_assets[key] = value

                return {"assets": limited_assets, "total_count": len(assets), "returned_count": len(limited_assets)}
            else:
                return {"error": f"API request failed with status code {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    def download_polyhaven_asset(self, asset_id, asset_type, resolution="1k", file_format=None):
        try:
            # First get the files information
            files_response = requests.get(f"https://api.polyhaven.com/files/{asset_id}", headers=REQ_HEADERS)
            if files_response.status_code != 200:
                return {"error": f"Failed to get asset files: {files_response.status_code}"}

            files_data = files_response.json()

            # Handle different asset types
            if asset_type == "hdris":
                # For HDRIs, download the .hdr or .exr file
                if not file_format:
                    file_format = "hdr"  # Default format for HDRIs

                if "hdri" in files_data and resolution in files_data["hdri"] and file_format in files_data["hdri"][resolution]:
                    file_info = files_data["hdri"][resolution][file_format]
                    file_url = file_info["url"]

                    # Save HDRI to a persistent cache directory so Blender can
                    # reference the file after loading (temp files get deleted and
                    # cause pink 'missing texture' errors)
                    cache_dir = os.path.join(os.path.expanduser("~"), ".modelforge", "cache", "hdris")
                    os.makedirs(cache_dir, exist_ok=True)
                    cache_path = os.path.join(cache_dir, f"{asset_id}_{resolution}.{file_format}")

                    # Download the file (skip if already cached)
                    if not os.path.isfile(cache_path):
                        response = requests.get(file_url, headers=REQ_HEADERS)
                        if response.status_code != 200:
                            return {"error": f"Failed to download HDRI: {response.status_code}"}
                        with open(cache_path, 'wb') as f:
                            f.write(response.content)

                    try:
                        # Create a new world if none exists
                        if not bpy.data.worlds:
                            bpy.data.worlds.new("World")

                        world = bpy.data.worlds[0]
                        world.use_nodes = True
                        node_tree = world.node_tree

                        # Clear existing nodes
                        for node in node_tree.nodes:
                            node_tree.nodes.remove(node)

                        # Create nodes
                        tex_coord = node_tree.nodes.new(type='ShaderNodeTexCoord')
                        tex_coord.location = (-800, 0)

                        mapping = node_tree.nodes.new(type='ShaderNodeMapping')
                        mapping.location = (-600, 0)

                        # Load the image from the persistent cache file
                        env_tex = node_tree.nodes.new(type='ShaderNodeTexEnvironment')
                        env_tex.location = (-400, 0)
                        env_tex.image = bpy.data.images.load(cache_path)

                        # Use a color space that exists in all Blender versions
                        if file_format.lower() == 'exr':
                            # Try to use Linear color space for EXR files
                            try:
                                env_tex.image.colorspace_settings.name = 'Linear'
                            except:
                                # Fallback to Non-Color if Linear isn't available
                                env_tex.image.colorspace_settings.name = 'Non-Color'
                        else:  # hdr
                            # For HDR files, try these options in order
                            for color_space in ['Linear', 'Linear Rec.709', 'Non-Color']:
                                try:
                                    env_tex.image.colorspace_settings.name = color_space
                                    break  # Stop if we successfully set a color space
                                except:
                                    continue

                        background = node_tree.nodes.new(type='ShaderNodeBackground')
                        background.location = (-200, 0)

                        output = node_tree.nodes.new(type='ShaderNodeOutputWorld')
                        output.location = (0, 0)

                        # Connect nodes
                        node_tree.links.new(tex_coord.outputs['Generated'], mapping.inputs['Vector'])
                        node_tree.links.new(mapping.outputs['Vector'], env_tex.inputs['Vector'])
                        node_tree.links.new(env_tex.outputs['Color'], background.inputs['Color'])
                        node_tree.links.new(background.outputs['Background'], output.inputs['Surface'])

                        # Set as active world
                        bpy.context.scene.world = world

                        return {
                            "success": True,
                            "message": f"HDRI {asset_id} imported successfully",
                            "image_name": env_tex.image.name
                        }
                    except Exception as e:
                        return {"error": f"Failed to set up HDRI in Blender: {str(e)}"}
                else:
                    return {"error": f"Requested resolution or format not available for this HDRI"}

            elif asset_type == "textures":
                if not file_format:
                    file_format = "jpg"  # Default format for textures

                downloaded_maps = {}

                try:
                    for map_type in files_data:
                        if map_type not in ["blend", "gltf"]:  # Skip non-texture files
                            if resolution in files_data[map_type] and file_format in files_data[map_type][resolution]:
                                file_info = files_data[map_type][resolution][file_format]
                                file_url = file_info["url"]

                                # Use NamedTemporaryFile like we do for HDRIs
                                with tempfile.NamedTemporaryFile(suffix=f".{file_format}", delete=False) as tmp_file:
                                    # Download the file
                                    response = requests.get(file_url, headers=REQ_HEADERS)
                                    if response.status_code == 200:
                                        tmp_file.write(response.content)
                                        tmp_path = tmp_file.name

                                        # Load image from temporary file
                                        image = bpy.data.images.load(tmp_path)
                                        image.name = f"{asset_id}_{map_type}.{file_format}"

                                        # Pack the image into .blend file
                                        image.pack()

                                        # Set color space based on map type
                                        if map_type in ['color', 'diffuse', 'albedo']:
                                            try:
                                                image.colorspace_settings.name = 'sRGB'
                                            except:
                                                pass
                                        else:
                                            try:
                                                image.colorspace_settings.name = 'Non-Color'
                                            except:
                                                pass

                                        downloaded_maps[map_type] = image

                                        # Clean up temporary file
                                        try:
                                            os.unlink(tmp_path)
                                        except:
                                            pass

                    if not downloaded_maps:
                        return {"error": f"No texture maps found for the requested resolution and format"}

                    # Create a new material with the downloaded textures
                    mat = bpy.data.materials.new(name=asset_id)
                    mat.use_nodes = True # Fix #8: Add use_nodes=True safety check
                    nodes = mat.node_tree.nodes
                    links = mat.node_tree.links

                    # Clear default nodes
                    for node in nodes:
                        nodes.remove(node)

                    # Create output node
                    output = nodes.new(type='ShaderNodeOutputMaterial')
                    output.location = (300, 0)

                    # Create principled BSDF node
                    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
                    principled.location = (0, 0)
                    links.new(principled.outputs[0], output.inputs[0])

                    # Add texture nodes based on available maps
                    tex_coord = nodes.new(type='ShaderNodeTexCoord')
                    tex_coord.location = (-800, 0)

                    mapping = nodes.new(type='ShaderNodeMapping')
                    mapping.location = (-600, 0)
                    mapping.vector_type = 'TEXTURE'  # Changed from default 'POINT' to 'TEXTURE'
                    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

                    # Position offset for texture nodes
                    x_pos = -400
                    y_pos = 300

                    # Connect different texture maps
                    for map_type, image in downloaded_maps.items():
                        tex_node = nodes.new(type='ShaderNodeTexImage')
                        tex_node.location = (x_pos, y_pos)
                        tex_node.image = image

                        # Set color space based on map type
                        if map_type.lower() in ['color', 'diffuse', 'albedo']:
                            try:
                                tex_node.image.colorspace_settings.name = 'sRGB'
                            except:
                                pass  # Use default if sRGB not available
                        else:
                            try:
                                tex_node.image.colorspace_settings.name = 'Non-Color'
                            except:
                                pass  # Use default if Non-Color not available

                        links.new(mapping.outputs['Vector'], tex_node.inputs['Vector'])

                        # Connect to appropriate input on Principled BSDF
                        if map_type.lower() in ['color', 'diffuse', 'albedo']:
                            links.new(tex_node.outputs['Color'], principled.inputs['Base Color'])
                        elif map_type.lower() in ['roughness', 'rough']:
                            links.new(tex_node.outputs['Color'], principled.inputs['Roughness'])
                        elif map_type.lower() in ['metallic', 'metalness', 'metal']:
                            links.new(tex_node.outputs['Color'], principled.inputs['Metallic'])
                        elif map_type.lower() in ['normal', 'nor']:
                            # Add normal map node
                            normal_map = nodes.new(type='ShaderNodeNormalMap')
                            normal_map.location = (x_pos + 200, y_pos)
                            links.new(tex_node.outputs['Color'], normal_map.inputs['Color'])
                            links.new(normal_map.outputs['Normal'], principled.inputs['Normal'])
                        elif map_type in ['displacement', 'disp', 'height']:
                            # Add displacement node
                            disp_node = nodes.new(type='ShaderNodeDisplacement')
                            disp_node.location = (x_pos + 200, y_pos - 200)
                            links.new(tex_node.outputs['Color'], disp_node.inputs['Height'])
                            links.new(disp_node.outputs['Displacement'], output.inputs['Displacement'])

                        y_pos -= 250

                    return {
                        "success": True,
                        "message": f"Texture {asset_id} imported as material",
                        "material": mat.name,
                        "maps": list(downloaded_maps.keys())
                    }

                except Exception as e:
                    return {"error": f"Failed to process textures: {str(e)}"}

            elif asset_type == "models":
                # For models, prefer glTF format if available
                if not file_format:
                    file_format = "gltf"  # Default format for models

                if file_format in files_data and resolution in files_data[file_format]:
                    file_info = files_data[file_format][resolution][file_format]
                    file_url = file_info["url"]

                    # Create a temporary directory to store the model and its dependencies
                    temp_dir = tempfile.mkdtemp()
                    main_file_path = ""

                    try:
                        # Download the main model file
                        main_file_name = file_url.split("/")[-1]
                        main_file_path = os.path.join(temp_dir, main_file_name)

                        response = requests.get(file_url, headers=REQ_HEADERS)
                        if response.status_code != 200:
                            return {"error": f"Failed to download model: {response.status_code}"}

                        with open(main_file_path, "wb") as f:
                            f.write(response.content)

                        # Check for included files and download them
                        if "include" in file_info and file_info["include"]:
                            for include_path, include_info in file_info["include"].items():
                                # Get the URL for the included file - this is the fix
                                include_url = include_info["url"]

                                # Create the directory structure for the included file
                                include_file_path = os.path.join(temp_dir, include_path)
                                os.makedirs(os.path.dirname(include_file_path), exist_ok=True)

                                # Download the included file
                                include_response = requests.get(include_url, headers=REQ_HEADERS)
                                if include_response.status_code == 200:
                                    with open(include_file_path, "wb") as f:
                                        f.write(include_response.content)
                                else:
                                    print(f"Failed to download included file: {include_path}")

                        # Import the model into Blender
                        if file_format == "gltf" or file_format == "glb":
                            bpy.ops.import_scene.gltf(filepath=main_file_path)
                        elif file_format == "fbx":
                            bpy.ops.import_scene.fbx(filepath=main_file_path)
                        elif file_format == "obj":
                            bpy.ops.import_scene.obj(filepath=main_file_path)
                        elif file_format == "blend":
                            # For blend files, we need to append or link
                            with bpy.data.libraries.load(main_file_path, link=False) as (data_from, data_to):
                                data_to.objects = data_from.objects

                            # Link the objects to the scene
                            for obj in data_to.objects:
                                if obj is not None:
                                    bpy.context.collection.objects.link(obj)
                        else:
                            return {"error": f"Unsupported model format: {file_format}"}

                        # Get the names of imported objects
                        imported_objects = [obj.name for obj in bpy.context.selected_objects]

                        return {
                            "success": True,
                            "message": f"Model {asset_id} imported successfully",
                            "imported_objects": imported_objects
                        }
                    except Exception as e:
                        return {"error": f"Failed to import model: {str(e)}"}
                    finally:
                        # Clean up temporary directory
                        with suppress(Exception):
                            shutil.rmtree(temp_dir)
                else:
                    return {"error": f"Requested format or resolution not available for this model"}

            else:
                return {"error": f"Unsupported asset type: {asset_type}"}

        except Exception as e:
            return {"error": f"Failed to download asset: {str(e)}"}

    def set_texture(self, object_name, texture_id):
        """Apply a previously downloaded Polyhaven texture to an object by creating a new material"""
        try:
            # Get the object
            obj = bpy.data.objects.get(object_name)
            if not obj:
                return {"error": f"Object not found: {object_name}"}

            # Make sure object can accept materials
            if not hasattr(obj, 'data') or not hasattr(obj.data, 'materials'):
                return {"error": f"Object {object_name} cannot accept materials"}

            # Find all images related to this texture and ensure they're properly loaded
            texture_images = {}
            for img in bpy.data.images:
                if img.name.startswith(texture_id + "_"):
                    # Extract the map type from the image name
                    map_type = img.name.split('_')[-1].split('.')[0]

                    # Force a reload of the image
                    img.reload()

                    # Ensure proper color space
                    if map_type.lower() in ['color', 'diffuse', 'albedo']:
                        try:
                            img.colorspace_settings.name = 'sRGB'
                        except:
                            pass
                    else:
                        try:
                            img.colorspace_settings.name = 'Non-Color'
                        except:
                            pass

                    # Ensure the image is packed
                    if not img.packed_file:
                        img.pack()

                    texture_images[map_type] = img
                    print(f"Loaded texture map: {map_type} - {img.name}")

                    # Debug info
                    print(f"Image size: {img.size[0]}x{img.size[1]}")
                    print(f"Color space: {img.colorspace_settings.name}")
                    print(f"File format: {img.file_format}")
                    print(f"Is packed: {bool(img.packed_file)}")

            if not texture_images:
                return {"error": f"No texture images found for: {texture_id}. Please download the texture first."}

            # Create a new material
            new_mat_name = f"{texture_id}_material_{object_name}"

            # Remove any existing material with this name to avoid conflicts
            existing_mat = bpy.data.materials.get(new_mat_name)
            if existing_mat:
                bpy.data.materials.remove(existing_mat)

            new_mat = bpy.data.materials.new(name=new_mat_name)
            new_mat.use_nodes = True

            # Set up the material nodes
            nodes = new_mat.node_tree.nodes
            links = new_mat.node_tree.links

            # Clear default nodes
            nodes.clear()

            # Create output node
            output = nodes.new(type='ShaderNodeOutputMaterial')
            output.location = (600, 0)

            # Create principled BSDF node
            principled = nodes.new(type='ShaderNodeBsdfPrincipled')
            principled.location = (300, 0)
            links.new(principled.outputs[0], output.inputs[0])

            # Add texture nodes based on available maps
            tex_coord = nodes.new(type='ShaderNodeTexCoord')
            tex_coord.location = (-800, 0)

            mapping = nodes.new(type='ShaderNodeMapping')
            mapping.location = (-600, 0)
            mapping.vector_type = 'TEXTURE'  # Changed from default 'POINT' to 'TEXTURE'
            links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

            # Position offset for texture nodes
            x_pos = -400
            y_pos = 300

            # Connect different texture maps
            for map_type, image in texture_images.items():
                tex_node = nodes.new(type='ShaderNodeTexImage')
                tex_node.location = (x_pos, y_pos)
                tex_node.image = image

                # Set color space based on map type
                if map_type.lower() in ['color', 'diffuse', 'albedo']:
                    try:
                        tex_node.image.colorspace_settings.name = 'sRGB'
                    except:
                        pass  # Use default if sRGB not available
                else:
                    try:
                        tex_node.image.colorspace_settings.name = 'Non-Color'
                    except:
                        pass  # Use default if Non-Color not available

                links.new(mapping.outputs['Vector'], tex_node.inputs['Vector'])

                # Connect to appropriate input on Principled BSDF
                if map_type.lower() in ['color', 'diffuse', 'albedo']:
                    links.new(tex_node.outputs['Color'], principled.inputs['Base Color'])
                elif map_type.lower() in ['roughness', 'rough']:
                    links.new(tex_node.outputs['Color'], principled.inputs['Roughness'])
                elif map_type.lower() in ['metallic', 'metalness', 'metal']:
                    links.new(tex_node.outputs['Color'], principled.inputs['Metallic'])
                elif map_type.lower() in ['normal', 'nor', 'dx', 'gl']:
                    # Add normal map node
                    normal_map = nodes.new(type='ShaderNodeNormalMap')
                    normal_map.location = (x_pos + 200, y_pos)
                    links.new(tex_node.outputs['Color'], normal_map.inputs['Color'])
                    links.new(normal_map.outputs['Normal'], principled.inputs['Normal'])
                elif map_type.lower() in ['displacement', 'disp', 'height']:
                    # Add displacement node
                    disp_node = nodes.new(type='ShaderNodeDisplacement')
                    disp_node.location = (x_pos + 200, y_pos - 200)
                    disp_node.inputs['Scale'].default_value = 0.1  # Reduce displacement strength
                    links.new(tex_node.outputs['Color'], disp_node.inputs['Height'])
                    links.new(disp_node.outputs['Displacement'], output.inputs['Displacement'])

                y_pos -= 250

            # Build lookup of tex nodes by map type for ARM/AO handling
            texture_nodes = {}
            for node in nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    for map_type, image in texture_images.items():
                        if node.image == image:
                            texture_nodes[map_type] = node
                            break

            # Handle ARM texture (Ambient Occlusion, Roughness, Metallic packed)
            if 'arm' in texture_nodes:
                separate_rgb = nodes.new(type='ShaderNodeSeparateColor')
                separate_rgb.location = (-200, -100)
                links.new(texture_nodes['arm'].outputs['Color'], separate_rgb.inputs['Color'])

                # Connect Roughness (G) if no dedicated roughness map
                if not any(mn in texture_nodes for mn in ['roughness', 'rough']):
                    links.new(separate_rgb.outputs[1], principled.inputs['Roughness'])
                    print("Connected ARM.G to Roughness")

                # Connect Metallic (B) if no dedicated metallic map
                if not any(mn in texture_nodes for mn in ['metallic', 'metalness', 'metal']):
                    links.new(separate_rgb.outputs[2], principled.inputs['Metallic'])
                    print("Connected ARM.B to Metallic")

                # For AO (R channel), multiply with base color if we have one
                base_color_node = None
                for mn in ['color', 'diffuse', 'albedo']:
                    if mn in texture_nodes:
                        base_color_node = texture_nodes[mn]
                        break

                if base_color_node:
                    mix_node = nodes.new(type='ShaderNodeMix')
                    mix_node.data_type = 'RGBA'
                    mix_node.blend_type = 'MULTIPLY'
                    mix_node.location = (100, 200)
                    mix_node.inputs['Factor'].default_value = 0.8

                    # Disconnect direct connection to base color
                    for link in list(base_color_node.outputs['Color'].links):
                        if link.to_socket == principled.inputs['Base Color']:
                            links.remove(link)

                    links.new(base_color_node.outputs['Color'], mix_node.inputs[6])  # A input
                    links.new(separate_rgb.outputs[0], mix_node.inputs[7])  # B input
                    links.new(mix_node.outputs[2], principled.inputs['Base Color'])  # Result
                    print("Connected ARM.R to AO mix with Base Color")

            # Handle AO (Ambient Occlusion) if separate
            if 'ao' in texture_nodes:
                base_color_node = None
                for mn in ['color', 'diffuse', 'albedo']:
                    if mn in texture_nodes:
                        base_color_node = texture_nodes[mn]
                        break

                if base_color_node:
                    mix_node = nodes.new(type='ShaderNodeMix')
                    mix_node.data_type = 'RGBA'
                    mix_node.blend_type = 'MULTIPLY'
                    mix_node.location = (100, 200)
                    mix_node.inputs['Factor'].default_value = 0.8

                    for link in list(base_color_node.outputs['Color'].links):
                        if link.to_socket == principled.inputs['Base Color']:
                            links.remove(link)

                    links.new(base_color_node.outputs['Color'], mix_node.inputs[6])
                    links.new(texture_nodes['ao'].outputs['Color'], mix_node.inputs[7])
                    links.new(mix_node.outputs[2], principled.inputs['Base Color'])
                    print("Connected AO to mix with Base Color")

            # CRITICAL: Make sure to clear all existing materials from the object
            while len(obj.data.materials) > 0:
                obj.data.materials.pop(index=0)

            # Assign the new material to the object
            obj.data.materials.append(new_mat)

            # CRITICAL: Make the object active and select it
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)

            # CRITICAL: Force Blender to update the material
            bpy.context.view_layer.update()

            # Get the list of texture maps
            texture_maps = list(texture_images.keys())

            # Get info about texture nodes for debugging
            material_info = {
                "name": new_mat.name,
                "has_nodes": new_mat.use_nodes,
                "node_count": len(new_mat.node_tree.nodes),
                "texture_nodes": []
            }

            for node in new_mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    connections = []
                    for output in node.outputs:
                        for link in output.links:
                            connections.append(f"{output.name} → {link.to_node.name}.{link.to_socket.name}")

                    material_info["texture_nodes"].append({
                        "name": node.name,
                        "image": node.image.name,
                        "colorspace": node.image.colorspace_settings.name,
                        "connections": connections
                    })

            return {
                "success": True,
                "message": f"Created new material and applied texture {texture_id} to {object_name}",
                "material": new_mat.name,
                "maps": texture_maps,
                "material_info": material_info
            }

        except Exception as e:
            print(f"Error in set_texture: {str(e)}")
            traceback.print_exc()
            return {"error": f"Failed to apply texture: {str(e)}"}

    def get_polyhaven_status(self):
        """Get the current status of PolyHaven integration"""
        enabled = bpy.context.scene.blendermcp_use_polyhaven
        if enabled:
            return {"enabled": True, "message": "PolyHaven integration is enabled and ready to use."}
        else:
            return {
                "enabled": False,
                "message": """PolyHaven integration is currently disabled. To enable it:
                            1. In the 3D Viewport, find the BlenderMCP panel in the sidebar (press N if hidden)
                            2. Check the 'Use assets from Poly Haven' checkbox
                            3. Restart the connection to Claude"""
        }

    #region Hyper3D
    def get_hyper3d_status(self):
        """Get the current status of Hyper3D Rodin integration"""
        enabled = bpy.context.scene.blendermcp_use_hyper3d
        if enabled:
            if not bpy.context.scene.blendermcp_hyper3d_api_key:
                return {
                    "enabled": False,
                    "message": """Hyper3D Rodin integration is currently enabled, but API key is not given. To enable it:
                                1. In the 3D Viewport, find the BlenderMCP panel in the sidebar (press N if hidden)
                                2. Keep the 'Use Hyper3D Rodin 3D model generation' checkbox checked
                                3. Choose the right plaform and fill in the API Key
                                4. Restart the connection to Claude"""
                }
            mode = bpy.context.scene.blendermcp_hyper3d_mode
            message = f"Hyper3D Rodin integration is enabled and ready to use. Mode: {mode}. " + \
                f"Key type: {'private' if bpy.context.scene.blendermcp_hyper3d_api_key != RODIN_FREE_TRIAL_KEY else 'free_trial'}"
            return {
                "enabled": True,
                "message": message
            }
        else:
            return {
                "enabled": False,
                "message": """Hyper3D Rodin integration is currently disabled. To enable it:
                            1. In the 3D Viewport, find the BlenderMCP panel in the sidebar (press N if hidden)
                            2. Check the 'Use Hyper3D Rodin 3D model generation' checkbox
                            3. Restart the connection to Claude"""
            }

    def create_rodin_job(self, *args, **kwargs):
        match bpy.context.scene.blendermcp_hyper3d_mode:
            case "MAIN_SITE":
                return self.create_rodin_job_main_site(*args, **kwargs)
            case "FAL_AI":
                return self.create_rodin_job_fal_ai(*args, **kwargs)
            case _:
                return {"error": "Unknown Hyper3D Rodin mode"}

    def create_rodin_job_main_site(
            self,
            text_prompt: str=None,
            images: list[tuple[str, str]]=None,
            bbox_condition=None
        ):
        try:
            if images is None:
                images = []
            """Call Rodin API, get the job uuid and subscription key"""
            files = [
                *[("images", (f"{i:04d}{img_suffix}", img)) for i, (img_suffix, img) in enumerate(images)],
                ("tier", (None, "Sketch")),
                ("mesh_mode", (None, "Raw")),
            ]
            if text_prompt:
                files.append(("prompt", (None, text_prompt)))
            if bbox_condition:
                files.append(("bbox_condition", (None, json.dumps(bbox_condition))))
            response = requests.post(
                "https://hyperhuman.deemos.com/api/v2/rodin",
                headers={
                    "Authorization": f"Bearer {bpy.context.scene.blendermcp_hyper3d_api_key}",
                },
                files=files
            )
            data = response.json()
            return data
        except Exception as e:
            return {"error": str(e)}

    def create_rodin_job_fal_ai(
            self,
            text_prompt: str=None,
            images: list[tuple[str, str]]=None,
            bbox_condition=None
        ):
        try:
            req_data = {
                "tier": "Sketch",
            }
            if images:
                req_data["input_image_urls"] = images
            if text_prompt:
                req_data["prompt"] = text_prompt
            if bbox_condition:
                req_data["bbox_condition"] = bbox_condition
            response = requests.post(
                "https://queue.fal.run/fal-ai/hyper3d/rodin",
                headers={
                    "Authorization": f"Key {bpy.context.scene.blendermcp_hyper3d_api_key}",
                    "Content-Type": "application/json",
                },
                json=req_data
            )
            data = response.json()
            return data
        except Exception as e:
            return {"error": str(e)}

    def poll_rodin_job_status(self, *args, **kwargs):
        match bpy.context.scene.blendermcp_hyper3d_mode:
            case "MAIN_SITE":
                return self.poll_rodin_job_status_main_site(*args, **kwargs)
            case "FAL_AI":
                return self.poll_rodin_job_status_fal_ai(*args, **kwargs)
            case _:
                return f"Error: Unknown Hyper3D Rodin mode!"

    def poll_rodin_job_status_main_site(self, subscription_key: str):
        """Call the job status API to get the job status"""
        response = requests.post(
            "https://hyperhuman.deemos.com/api/v2/status",
            headers={
                "Authorization": f"Bearer {bpy.context.scene.blendermcp_hyper3d_api_key}",
            },
            json={
                "subscription_key": subscription_key,
            },
        )
        data = response.json()
        return {
            "status_list": [i["status"] for i in data["jobs"]]
        }

    def poll_rodin_job_status_fal_ai(self, request_id: str):
        """Call the job status API to get the job status"""
        response = requests.get(
            f"https://queue.fal.run/fal-ai/hyper3d/requests/{request_id}/status",
            headers={
                "Authorization": f"KEY {bpy.context.scene.blendermcp_hyper3d_api_key}",
            },
        )
        data = response.json()
        return data

    @staticmethod
    def _clean_imported_glb(filepath, mesh_name=None):
        # Get the set of existing objects before import
        existing_objects = set(bpy.data.objects)

        # Import the GLB file
        bpy.ops.import_scene.gltf(filepath=filepath)

        # Ensure the context is updated
        bpy.context.view_layer.update()

        # Get all imported objects
        imported_objects = list(set(bpy.data.objects) - existing_objects)
        # imported_objects = [obj for obj in bpy.context.view_layer.objects if obj.select_get()]

        if not imported_objects:
            print("Error: No objects were imported.")
            return

        # Identify the mesh object
        mesh_obj = None

        if len(imported_objects) == 1 and imported_objects[0].type == 'MESH':
            mesh_obj = imported_objects[0]
            print("Single mesh imported, no cleanup needed.")
        else:
            if len(imported_objects) == 2:
                empty_objs = [i for i in imported_objects if i.type == "EMPTY"]
                if len(empty_objs) != 1:
                    print("Error: Expected an empty node with one mesh child or a single mesh object.")
                    return
                parent_obj = empty_objs.pop()
                if len(parent_obj.children) == 1:
                    potential_mesh = parent_obj.children[0]
                    if potential_mesh.type == 'MESH':
                        print("GLB structure confirmed: Empty node with one mesh child.")

                        # Unparent the mesh from the empty node
                        potential_mesh.parent = None

                        # Remove the empty node
                        bpy.data.objects.remove(parent_obj)
                        print("Removed empty node, keeping only the mesh.")

                        mesh_obj = potential_mesh
                    else:
                        print("Error: Child is not a mesh object.")
                        return
                else:
                    print("Error: Expected an empty node with one mesh child or a single mesh object.")
                    return
            else:
                print("Error: Expected an empty node with one mesh child or a single mesh object.")
                return

        # Rename the mesh if needed
        try:
            if mesh_obj and mesh_obj.name is not None and mesh_name:
                mesh_obj.name = mesh_name
                if mesh_obj.data.name is not None:
                    mesh_obj.data.name = mesh_name
                print(f"Mesh renamed to: {mesh_name}")
        except Exception as e:
            print("Having issue with renaming, give up renaming.")

        return mesh_obj

    def import_generated_asset(self, *args, **kwargs):
        match bpy.context.scene.blendermcp_hyper3d_mode:
            case "MAIN_SITE":
                return self.import_generated_asset_main_site(*args, **kwargs)
            case "FAL_AI":
                return self.import_generated_asset_fal_ai(*args, **kwargs)
            case _:
                return f"Error: Unknown Hyper3D Rodin mode!"

    def import_generated_asset_main_site(self, task_uuid: str, name: str):
        """Fetch the generated asset, import into blender"""
        response = requests.post(
            "https://hyperhuman.deemos.com/api/v2/download",
            headers={
                "Authorization": f"Bearer {bpy.context.scene.blendermcp_hyper3d_api_key}",
            },
            json={
                'task_uuid': task_uuid
            }
        )
        data_ = response.json()
        temp_file = None
        for i in data_["list"]:
            if i["name"].endswith(".glb"):
                temp_file = tempfile.NamedTemporaryFile(
                    delete=False,
                    prefix=task_uuid,
                    suffix=".glb",
                )

                try:
                    # Download the content
                    response = requests.get(i["url"], stream=True)
                    response.raise_for_status()  # Raise an exception for HTTP errors

                    # Write the content to the temporary file
                    for chunk in response.iter_content(chunk_size=8192):
                        temp_file.write(chunk)

                    # Close the file
                    temp_file.close()

                except Exception as e:
                    # Clean up the file if there's an error
                    temp_file.close()
                    os.unlink(temp_file.name)
                    return {"succeed": False, "error": str(e)}

                break
        else:
            return {"succeed": False, "error": "Generation failed. Please first make sure that all jobs of the task are done and then try again later."}

        try:
            obj = self._clean_imported_glb(
                filepath=temp_file.name,
                mesh_name=name
            )
            result = {
                "name": obj.name,
                "type": obj.type,
                "location": [obj.location.x, obj.location.y, obj.location.z],
                "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],
                "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
            }

            if obj.type == "MESH":
                bounding_box = self._get_aabb(obj)
                result["world_bounding_box"] = bounding_box

            return {
                "succeed": True, **result
            }
        except Exception as e:
            return {"succeed": False, "error": str(e)}
        finally:
            # Clean up temp file
            try:
                if temp_file and os.path.isfile(temp_file.name):
                    os.unlink(temp_file.name)
            except OSError:
                pass

    def import_generated_asset_fal_ai(self, request_id: str, name: str):
        """Fetch the generated asset, import into blender"""
        response = requests.get(
            f"https://queue.fal.run/fal-ai/hyper3d/requests/{request_id}",
            headers={
                "Authorization": f"Key {bpy.context.scene.blendermcp_hyper3d_api_key}",
            }
        )
        data_ = response.json()
        temp_file = None

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            prefix=request_id,
            suffix=".glb",
        )

        try:
            # Download the content
            response = requests.get(data_["model_mesh"]["url"], stream=True)
            response.raise_for_status()  # Raise an exception for HTTP errors

            # Write the content to the temporary file
            for chunk in response.iter_content(chunk_size=8192):
                temp_file.write(chunk)

            # Close the file
            temp_file.close()

        except Exception as e:
            # Clean up the file if there's an error
            temp_file.close()
            os.unlink(temp_file.name)
            return {"succeed": False, "error": str(e)}

        try:
            obj = self._clean_imported_glb(
                filepath=temp_file.name,
                mesh_name=name
            )
            result = {
                "name": obj.name,
                "type": obj.type,
                "location": [obj.location.x, obj.location.y, obj.location.z],
                "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],
                "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
            }

            if obj.type == "MESH":
                bounding_box = self._get_aabb(obj)
                result["world_bounding_box"] = bounding_box

            return {
                "succeed": True, **result
            }
        except Exception as e:
            return {"succeed": False, "error": str(e)}
        finally:
            # Clean up temp file
            try:
                if temp_file and os.path.isfile(temp_file.name):
                    os.unlink(temp_file.name)
            except OSError:
                pass
    #endregion

    #region Sketchfab API
    def get_sketchfab_status(self):
        """Get the current status of Sketchfab integration"""
        enabled = bpy.context.scene.blendermcp_use_sketchfab
        api_key = bpy.context.scene.blendermcp_sketchfab_api_key

        # Test the API key if present
        if api_key:
            try:
                headers = {
                    "Authorization": f"Token {api_key}"
                }

                response = requests.get(
                    "https://api.sketchfab.com/v3/me",
                    headers=headers,
                    timeout=30  # Add timeout of 30 seconds
                )

                if response.status_code == 200:
                    user_data = response.json()
                    username = user_data.get("username", "Unknown user")
                    return {
                        "enabled": True,
                        "message": f"Sketchfab integration is enabled and ready to use. Logged in as: {username}"
                    }
                else:
                    return {
                        "enabled": False,
                        "message": f"Sketchfab API key seems invalid. Status code: {response.status_code}"
                    }
            except requests.exceptions.Timeout:
                return {
                    "enabled": False,
                    "message": "Timeout connecting to Sketchfab API. Check your internet connection."
                }
            except Exception as e:
                return {
                    "enabled": False,
                    "message": f"Error testing Sketchfab API key: {str(e)}"
                }

        if enabled and api_key:
            return {"enabled": True, "message": "Sketchfab integration is enabled and ready to use."}
        elif enabled and not api_key:
            return {
                "enabled": False,
                "message": """Sketchfab integration is currently enabled, but API key is not given. To enable it:
                            1. In the 3D Viewport, find the BlenderMCP panel in the sidebar (press N if hidden)
                            2. Keep the 'Use Sketchfab' checkbox checked
                            3. Enter your Sketchfab API Key
                            4. Restart the connection to Claude"""
            }
        else:
            return {
                "enabled": False,
                "message": """Sketchfab integration is currently disabled. To enable it:
                            1. In the 3D Viewport, find the BlenderMCP panel in the sidebar (press N if hidden)
                            2. Check the 'Use assets from Sketchfab' checkbox
                            3. Enter your Sketchfab API Key
                            4. Restart the connection to Claude"""
            }

    def search_sketchfab_models(self, query, categories=None, count=20, downloadable=True):
        """Search for models on Sketchfab based on query and optional filters"""
        try:
            api_key = bpy.context.scene.blendermcp_sketchfab_api_key
            if not api_key:
                return {"error": "Sketchfab API key is not configured"}

            # Build search parameters with exact fields from Sketchfab API docs
            params = {
                "type": "models",
                "q": query,
                "count": count,
                "downloadable": downloadable,
                "archives_flavours": False
            }

            if categories:
                params["categories"] = categories

            # Make API request to Sketchfab search endpoint
            # The proper format according to Sketchfab API docs for API key auth
            headers = {
                "Authorization": f"Token {api_key}"
            }


            # Use the search endpoint as specified in the API documentation
            response = requests.get(
                "https://api.sketchfab.com/v3/search",
                headers=headers,
                params=params,
                timeout=30  # Add timeout of 30 seconds
            )

            if response.status_code == 401:
                return {"error": "Authentication failed (401). Check your API key."}

            if response.status_code != 200:
                return {"error": f"API request failed with status code {response.status_code}"}

            response_data = response.json()

            # Safety check on the response structure
            if response_data is None:
                return {"error": "Received empty response from Sketchfab API"}

            # Handle 'results' potentially missing from response
            results = response_data.get("results", [])
            if not isinstance(results, list):
                return {"error": f"Unexpected response format from Sketchfab API: {response_data}"}

            return response_data

        except requests.exceptions.Timeout:
            return {"error": "Request timed out. Check your internet connection."}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON response from Sketchfab API: {str(e)}"}
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    def download_sketchfab_model(self, uid):
        """Download a model from Sketchfab by its UID"""
        try:
            api_key = bpy.context.scene.blendermcp_sketchfab_api_key
            if not api_key:
                return {"error": "Sketchfab API key is not configured"}

            # Use proper authorization header for API key auth
            headers = {
                "Authorization": f"Token {api_key}"
            }

            # Request download URL using the exact endpoint from the documentation
            download_endpoint = f"https://api.sketchfab.com/v3/models/{uid}/download"

            response = requests.get(
                download_endpoint,
                headers=headers,
                timeout=30  # Add timeout of 30 seconds
            )

            if response.status_code == 401:
                return {"error": "Authentication failed (401). Check your API key."}

            if response.status_code != 200:
                return {"error": f"Download request failed with status code {response.status_code}"}

            data = response.json()

            # Safety check for None data
            if data is None:
                return {"error": "Received empty response from Sketchfab API for download request"}

            # Extract download URL with safety checks
            gltf_data = data.get("gltf")
            if not gltf_data:
                return {"error": "No gltf download URL available for this model. Response: " + str(data)}

            download_url = gltf_data.get("url")
            if not download_url:
                return {"error": "No download URL available for this model. Make sure the model is downloadable and you have access."}

            # Download the model (already has timeout)
            model_response = requests.get(download_url, timeout=60)  # 60 second timeout

            if model_response.status_code != 200:
                return {"error": f"Model download failed with status code {model_response.status_code}"}

            # Save to temporary file
            temp_dir = tempfile.mkdtemp()
            zip_file_path = os.path.join(temp_dir, f"{uid}.zip")

            with open(zip_file_path, "wb") as f:
                f.write(model_response.content)

            # Extract the zip file with enhanced security
            with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                # More secure zip slip prevention
                for file_info in zip_ref.infolist():
                    # Get the path of the file
                    file_path = file_info.filename

                    # Convert directory separators to the current OS style
                    # This handles both / and \ in zip entries
                    target_path = os.path.join(temp_dir, os.path.normpath(file_path))

                    # Get absolute paths for comparison
                    abs_temp_dir = os.path.abspath(temp_dir)
                    abs_target_path = os.path.abspath(target_path)

                    # Ensure the normalized path doesn't escape the target directory
                    if not abs_target_path.startswith(abs_temp_dir):
                        with suppress(Exception):
                            shutil.rmtree(temp_dir)
                        return {"error": "Security issue: Zip contains files with path traversal attempt"}

                    # Additional explicit check for directory traversal
                    if ".." in file_path:
                        with suppress(Exception):
                            shutil.rmtree(temp_dir)
                        return {"error": "Security issue: Zip contains files with directory traversal sequence"}

                # If all files passed security checks, extract them
                zip_ref.extractall(temp_dir)

            # Find the main glTF file
            gltf_files = [f for f in os.listdir(temp_dir) if f.endswith('.gltf') or f.endswith('.glb')]

            if not gltf_files:
                with suppress(Exception):
                    shutil.rmtree(temp_dir)
                return {"error": "No glTF file found in the downloaded model"}

            main_file = os.path.join(temp_dir, gltf_files[0])

            # Import the model
            bpy.ops.import_scene.gltf(filepath=main_file)

            # Get the names of imported objects
            imported_objects = [obj.name for obj in bpy.context.selected_objects]

            # Clean up temporary files
            with suppress(Exception):
                shutil.rmtree(temp_dir)

            return {
                "success": True,
                "message": "Model imported successfully",
                "imported_objects": imported_objects
            }

        except requests.exceptions.Timeout:
            return {"error": "Request timed out. Check your internet connection and try again with a simpler model."}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON response from Sketchfab API: {str(e)}"}
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": f"Failed to download model: {str(e)}"}
    #endregion

# Blender UI Panel
class MODELFORGE_PT_Panel(bpy.types.Panel):
    bl_label = "ModelForge"
    bl_idname = "MODELFORGE_PT_Panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'ModelForge'

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        # Sync scene property from actual server state (survives File → New)
        actually_running = (
            hasattr(bpy.types, "blendermcp_server")
            and bpy.types.blendermcp_server is not None
            and getattr(bpy.types.blendermcp_server, "running", False)
        )
        if scene.blendermcp_server_running != actually_running:
            scene.blendermcp_server_running = actually_running

        # Header with status
        box = layout.box()
        row = box.row()
        row.scale_y = 1.5
        
        if scene.blendermcp_server_running:
            row.label(text="● Connected", icon='CHECKMARK')
        else:
            row.label(text="○ Disconnected", icon='X')

        # Connection button
        if not scene.blendermcp_server_running:
            layout.operator("modelforge.start_server", text="Connect to ModelForge", icon='PLAY')
        else:
            layout.operator("modelforge.stop_server", text="Disconnect", icon='PAUSE')
            layout.label(text=f"Port: {scene.blendermcp_port}")

        layout.separator()

        # Settings section
        box = layout.box()
        box.label(text="Settings", icon='PREFERENCES')
        box.prop(scene, "blendermcp_port", text="Port")

        layout.separator()

        # Asset Sources
        box = layout.box()
        box.label(text="Asset Sources", icon='ASSET_MANAGER')
        box.prop(scene, "blendermcp_use_polyhaven", text="Poly Haven")

        box.prop(scene, "blendermcp_use_hyper3d", text="Hyper3D Rodin")
        if scene.blendermcp_use_hyper3d:
            col = box.column(align=True)
            col.prop(scene, "blendermcp_hyper3d_mode", text="Mode")
            col.prop(scene, "blendermcp_hyper3d_api_key", text="API Key")
            col.operator("modelforge.set_hyper3d_free_trial_api_key", text="Use Free Trial Key")

        box.prop(scene, "blendermcp_use_sketchfab", text="Sketchfab")
        if scene.blendermcp_use_sketchfab:
            col = box.column(align=True)
            col.prop(scene, "blendermcp_sketchfab_api_key", text="API Key")

# Operator to set Hyper3D API Key
class MODELFORGE_OT_SetFreeTrialHyper3DAPIKey(bpy.types.Operator):
    bl_idname = "modelforge.set_hyper3d_free_trial_api_key"
    bl_label = "Set Free Trial API Key"

    def execute(self, context):
        context.scene.blendermcp_hyper3d_api_key = RODIN_FREE_TRIAL_KEY
        context.scene.blendermcp_hyper3d_mode = 'MAIN_SITE'
        self.report({'INFO'}, "API Key set successfully!")
        return {'FINISHED'}

# Operator to start the server
class MODELFORGE_OT_StartServer(bpy.types.Operator):
    bl_idname = "modelforge.start_server"
    bl_label = "Connect to ModelForge"
    bl_description = "Start the server to connect with ModelForge"

    def execute(self, context):
        scene = context.scene

        # Create a new server instance
        if not hasattr(bpy.types, "blendermcp_server") or not bpy.types.blendermcp_server:
            bpy.types.blendermcp_server = BlenderMCPServer(port=scene.blendermcp_port)

        # Start the server
        bpy.types.blendermcp_server.start()
        scene.blendermcp_server_running = bpy.types.blendermcp_server.running

        return {'FINISHED'}

# Operator to stop the server
class MODELFORGE_OT_StopServer(bpy.types.Operator):
    bl_idname = "modelforge.stop_server"
    bl_label = "Disconnect from ModelForge"
    bl_description = "Stop the connection to ModelForge"

    def execute(self, context):
        scene = context.scene

        # Stop the server if it exists
        if hasattr(bpy.types, "blendermcp_server") and bpy.types.blendermcp_server:
            bpy.types.blendermcp_server.stop()
            del bpy.types.blendermcp_server

        scene.blendermcp_server_running = False

        return {'FINISHED'}

@bpy.app.handlers.persistent
def _sync_server_status(_dummy=None):
    """Re-sync blendermcp_server_running after file load (File → New / Open)"""
    actually_running = (
        hasattr(bpy.types, "blendermcp_server")
        and bpy.types.blendermcp_server is not None
        and getattr(bpy.types.blendermcp_server, "running", False)
    )
    for scene in bpy.data.scenes:
        scene.blendermcp_server_running = actually_running


# Registration functions
def register():
    bpy.types.Scene.blendermcp_port = IntProperty(
        name="Port",
        description="Port for the BlenderMCP server",
        default=9876,
        min=1024,
        max=65535
    )

    bpy.types.Scene.blendermcp_server_running = bpy.props.BoolProperty(
        name="Server Running",
        default=False
    )

    bpy.types.Scene.blendermcp_use_polyhaven = bpy.props.BoolProperty(
        name="Use Poly Haven",
        description="Enable Poly Haven asset integration",
        default=False
    )

    bpy.types.Scene.blendermcp_use_hyper3d = bpy.props.BoolProperty(
        name="Use Hyper3D Rodin",
        description="Enable Hyper3D Rodin generation integration",
        default=False
    )

    bpy.types.Scene.blendermcp_hyper3d_mode = bpy.props.EnumProperty(
        name="Rodin Mode",
        description="Choose the platform used to call Rodin APIs",
        items=[
            ("MAIN_SITE", "hyper3d.ai", "hyper3d.ai"),
            ("FAL_AI", "fal.ai", "fal.ai"),
        ],
        default="MAIN_SITE"
    )

    bpy.types.Scene.blendermcp_hyper3d_api_key = bpy.props.StringProperty(
        name="Hyper3D API Key",
        subtype="PASSWORD",
        description="API Key provided by Hyper3D",
        default=""
    )

    bpy.types.Scene.blendermcp_use_sketchfab = bpy.props.BoolProperty(
        name="Use Sketchfab",
        description="Enable Sketchfab asset integration",
        default=False
    )

    bpy.types.Scene.blendermcp_sketchfab_api_key = bpy.props.StringProperty(
        name="Sketchfab API Key",
        subtype="PASSWORD",
        description="API Key provided by Sketchfab",
        default=""
    )

    bpy.utils.register_class(MODELFORGE_PT_Panel)
    bpy.utils.register_class(MODELFORGE_OT_SetFreeTrialHyper3DAPIKey)
    bpy.utils.register_class(MODELFORGE_OT_StartServer)
    bpy.utils.register_class(MODELFORGE_OT_StopServer)

    # Re-sync server status after File → New / File → Open
    bpy.app.handlers.load_post.append(_sync_server_status)

    print("ModelForge Blender addon registered")

def unregister():
    # Stop the server if it's running
    if hasattr(bpy.types, "blendermcp_server") and bpy.types.blendermcp_server:
        bpy.types.blendermcp_server.stop()
        del bpy.types.blendermcp_server

    for cls in (MODELFORGE_OT_StopServer, MODELFORGE_OT_StartServer,
                MODELFORGE_OT_SetFreeTrialHyper3DAPIKey, MODELFORGE_PT_Panel):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass

    # Remove load_post handler
    if _sync_server_status in bpy.app.handlers.load_post:
        bpy.app.handlers.load_post.remove(_sync_server_status)

    props = [
        "blendermcp_port", "blendermcp_server_running", "blendermcp_use_polyhaven",
        "blendermcp_use_hyper3d", "blendermcp_hyper3d_mode", "blendermcp_hyper3d_api_key",
        "blendermcp_use_sketchfab", "blendermcp_sketchfab_api_key",
    ]
    for prop in props:
        try:
            delattr(bpy.types.Scene, prop)
        except AttributeError:
            pass

    print("ModelForge Blender addon unregistered")

if __name__ == "__main__":
    register()

