# Two-Phase Planning/Execution Architecture for Gemini-Blender MCP Application

## Table of Contents
- [System Architecture Overview](#system-architecture-overview)
- [Phase 1: Planning Layer](#phase-1-planning-layer)
- [Phase 2: Execution Layer](#phase-2-execution-layer)
- [Complete Integration](#complete-integration)
- [Architecture Benefits](#architecture-benefits)
- [Next Steps](#next-steps)

---

## System Architecture Overview

### Current Flow
```
User → Gemini 2.5 Pro → MCP Server (server.py) → Socket (localhost:port) → Blender Addon (addon.py) → Blender Python API
```

### Enhanced Two-Phase System
```
User → [Phase 1: Planner] → [Phase 2: Executor with Monitoring] → MCP Server → Blender
         ↓                      ↓
    Plan Generation        Tool Filtering + Validation
```

The orchestration logic sits **between Gemini and the MCP Server**, adding intelligent planning and validation before commands reach Blender.

---

## Phase 1: Planning Layer

### 1.1 Plan Generation Module

Create a dedicated planner that generates structured execution plans before any Blender commands are sent.

```python
# orchestrator.py - Add this to your application

import json
from datetime import datetime
import asyncio

class BlenderTaskPlanner:
    def __init__(self, gemini_model):
        self.model = gemini_model
        self.planning_prompt_template = """You are a Blender automation planner. Given a user request, create a detailed execution plan.

Available Blender MCP Tools:
- get_scene_info(): Returns current scene state (objects, materials, camera, lights)
- create_primitive(type, name, location, scale): Creates cube/sphere/cylinder/cone/plane
- modify_object(name, property, value): Modifies object properties (location/rotation/scale)
- apply_material(object_name, color_rgba, metallic, roughness): Applies PBR materials
- set_camera(location, rotation, lens): Positions the camera
- add_light(type, location, energy, color): Adds light sources
- execute_python(code): Runs arbitrary Python code in Blender (use sparingly)
- render_scene(output_path): Renders the current scene

CRITICAL RULES:
1. ALWAYS start with get_scene_info() to understand current state
2. Create objects BEFORE applying materials to them
3. Use descriptive names for objects (no spaces, use underscores)
4. Coordinates are [x, y, z] in Blender units
5. Colors are [R, G, B, A] in range 0.0-1.0
6. Only use execute_python() for complex operations not covered by other tools

User Request: {user_request}

Generate a step-by-step plan in this JSON format:
{{
  "plan_summary": "Brief description of what will be accomplished",
  "steps": [
    {{
      "step_number": 1,
      "action": "tool_name",
      "parameters": {{}},
      "rationale": "Why this step is needed",
      "expected_outcome": "What should happen"
    }},
    ...
  ],
  "dependencies": [
    "step 2 depends on step 1",
    ...
  ]
}}
"""

    def generate_plan(self, user_request: str) -> dict:
        """Phase 1: Generate execution plan"""
        prompt = self.planning_prompt_template.format(user_request=user_request)
        
        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        plan = json.loads(response.text)
        
        # Validate plan structure
        if not self._validate_plan(plan):
            # Retry with corrections
            return self._regenerate_plan(user_request, plan)
        
        return plan
    
    def _validate_plan(self, plan: dict) -> bool:
        """Ensure plan has required structure and logical flow"""
        if "steps" not in plan or len(plan["steps"]) == 0:
            return False
        
        # Check if first step is get_scene_info (best practice)
        if plan["steps"][0]["action"] != "get_scene_info":
            print("Warning: Plan doesn't start with get_scene_info")
        
        # Validate tool names exist
        valid_tools = {
            "get_scene_info", "create_primitive", "modify_object",
            "apply_material", "set_camera", "add_light", 
            "execute_python", "render_scene"
        }
        
        for step in plan["steps"]:
            if step["action"] not in valid_tools:
                print(f"Invalid tool: {step['action']}")
                return False
        
        return True
    
    def _regenerate_plan(self, user_request: str, failed_plan: dict) -> dict:
        """Attempt to fix invalid plan"""
        correction_prompt = f"""The previous plan was invalid:
{json.dumps(failed_plan, indent=2)}

Please generate a corrected plan for: {user_request}
"""
        response = self.model.generate_content(correction_prompt)
        return json.loads(response.text)
```

### 1.2 Dynamic Tool Filtering

Filter tools based on task complexity to improve Gemini's selection accuracy and reduce token usage.

```python
class ToolFilter:
    """Dynamically filter tools based on task context"""
    
    TOOL_CATEGORIES = {
        "inspection": ["get_scene_info"],
        "creation": ["create_primitive", "apply_material"],
        "modification": ["modify_object", "apply_material"],
        "camera": ["set_camera"],
        "lighting": ["add_light"],
        "rendering": ["render_scene"],
        "advanced": ["execute_python"]
    }
    
    def filter_tools_for_task(self, user_request: str, plan: dict) -> list:
        """Return only relevant tools for current task"""
        request_lower = user_request.lower()
        
        # Analyze what categories are needed
        needed_categories = set(["inspection"])  # Always include inspection
        
        if any(word in request_lower for word in ["create", "add", "new", "make"]):
            needed_categories.add("creation")
        
        if any(word in request_lower for word in ["move", "rotate", "scale", "modify", "change"]):
            needed_categories.add("modification")
        
        if any(word in request_lower for word in ["camera", "view", "angle"]):
            needed_categories.add("camera")
        
        if any(word in request_lower for word in ["light", "illuminate", "bright", "shadow"]):
            needed_categories.add("lighting")
        
        if any(word in request_lower for word in ["render", "image", "output"]):
            needed_categories.add("rendering")
        
        # Check plan complexity
        if len(plan.get("steps", [])) > 5 or "complex" in request_lower:
            needed_categories.add("advanced")
        
        # Collect tools from needed categories
        filtered_tools = []
        for category in needed_categories:
            filtered_tools.extend(self.TOOL_CATEGORIES[category])
        
        return list(set(filtered_tools))  # Remove duplicates
```

---

## Phase 2: Execution Layer

### 2.1 Step-by-Step Executor with Validation

Execute the plan one step at a time with validation between steps to catch and recover from failures early.

```python
class BlenderTaskExecutor:
    def __init__(self, mcp_client, gemini_model):
        self.mcp_client = mcp_client  # Your MCP client that connects to server.py
        self.model = gemini_model
        self.execution_history = []
        self.scene_state = {}
    
    async def execute_plan(self, plan: dict, user_request: str) -> dict:
        """Phase 2: Execute plan step-by-step with monitoring"""
        results = {
            "success": True,
            "completed_steps": [],
            "failed_steps": [],
            "final_state": None
        }
        
        print(f"\n🎬 Executing plan: {plan['plan_summary']}")
        print(f"📋 Total steps: {len(plan['steps'])}\n")
        
        for step in plan["steps"]:
            step_num = step["step_number"]
            tool_name = step["action"]
            params = step["parameters"]
            
            print(f"⚙️  Step {step_num}: {tool_name}")
            print(f"   Rationale: {step['rationale']}")
            
            try:
                # Execute the tool through MCP
                result = await self._execute_tool(tool_name, params)
                
                # Validate the result
                validation = await self._validate_step_result(
                    step, result, user_request
                )
                
                if validation["success"]:
                    print(f"✅ Step {step_num} completed successfully")
                    results["completed_steps"].append({
                        "step": step_num,
                        "tool": tool_name,
                        "result": result
                    })
                    
                    # Update scene state if get_scene_info was called
                    if tool_name == "get_scene_info":
                        self.scene_state = result
                    
                else:
                    print(f"⚠️  Step {step_num} validation failed: {validation['reason']}")
                    
                    # Attempt recovery
                    recovery_result = await self._recover_from_failure(
                        step, result, validation, user_request
                    )
                    
                    if recovery_result["recovered"]:
                        print(f"🔄 Recovery successful")
                        results["completed_steps"].append(recovery_result)
                    else:
                        print(f"❌ Recovery failed, aborting plan")
                        results["failed_steps"].append({
                            "step": step_num,
                            "tool": tool_name,
                            "error": validation['reason']
                        })
                        results["success"] = False
                        break
                
                # Small delay to ensure Blender processes command
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Step {step_num} threw exception: {str(e)}")
                results["failed_steps"].append({
                    "step": step_num,
                    "tool": tool_name,
                    "error": str(e)
                })
                results["success"] = False
                break
        
        # Get final scene state
        final_state = await self._execute_tool("get_scene_info", {})
        results["final_state"] = final_state
        
        return results
    
    async def _execute_tool(self, tool_name: str, params: dict):
        """Execute a single tool via MCP → Socket → Blender"""
        # Your existing MCP client call
        result = await self.mcp_client.call_tool(tool_name, params)
        
        # Log for monitoring
        self.execution_history.append({
            "timestamp": datetime.now().isoformat(),
            "tool": tool_name,
            "params": params,
            "result": result
        })
        
        return result
    
    async def _validate_step_result(self, step: dict, result: any, user_request: str) -> dict:
        """Use Gemini to validate if step succeeded"""
        validation_prompt = f"""You are validating a Blender automation step.

User's original request: {user_request}

Step that was executed:
- Action: {step['action']}
- Parameters: {json.dumps(step['parameters'])}
- Expected outcome: {step['expected_outcome']}

Actual result from Blender:
{json.dumps(result, indent=2)}

Evaluate if this step succeeded. Respond in JSON:
{{
  "success": true/false,
  "reason": "Explanation of why it succeeded or failed",
  "concerns": ["Any warnings or issues noticed"]
}}
"""
        
        response = self.model.generate_content(
            validation_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        return json.loads(response.text)
    
    async def _recover_from_failure(self, step: dict, result: any, validation: dict, user_request: str) -> dict:
        """Attempt to recover from failed step"""
        recovery_prompt = f"""A Blender automation step failed. Suggest a recovery action.

Failed step: {step['action']} with params {step['parameters']}
Failure reason: {validation['reason']}
Result received: {json.dumps(result)}

Current scene state:
{json.dumps(self.scene_state, indent=2)}

Original user request: {user_request}

Suggest ONE corrective action in JSON:
{{
  "recovery_action": "tool_name",
  "recovery_params": {{}},
  "explanation": "Why this should fix the issue"
}}

If recovery is impossible, set recovery_action to null.
"""
        
        response = self.model.generate_content(
            recovery_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        recovery = json.loads(response.text)
        
        if recovery["recovery_action"]:
            print(f"🔄 Attempting recovery: {recovery['explanation']}")
            try:
                recovery_result = await self._execute_tool(
                    recovery["recovery_action"],
                    recovery["recovery_params"]
                )
                return {
                    "recovered": True,
                    "recovery_result": recovery_result
                }
            except Exception as e:
                return {"recovered": False, "error": str(e)}
        
        return {"recovered": False}
```

### 2.2 Monitoring and Telemetry

Track execution for debugging and continuous improvement of the system.

```python
class ExecutionMonitor:
    """Monitor and log all executions for debugging"""
    
    def __init__(self, log_file="blender_executions.jsonl"):
        self.log_file = log_file
    
    def log_execution(self, user_request: str, plan: dict, results: dict):
        """Log complete execution trace"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_request": user_request,
            "plan_summary": plan.get("plan_summary"),
            "total_steps": len(plan["steps"]),
            "completed_steps": len(results["completed_steps"]),
            "failed_steps": len(results["failed_steps"]),
            "success": results["success"],
            "execution_details": results
        }
        
        with open(self.log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def analyze_failures(self) -> dict:
        """Analyze common failure patterns"""
        failures = []
        
        with open(self.log_file, "r") as f:
            for line in f:
                entry = json.loads(line)
                if not entry["success"]:
                    failures.append(entry)
        
        # Identify patterns
        failure_analysis = {
            "total_failures": len(failures),
            "common_failed_tools": {},
            "common_error_messages": {}
        }
        
        for failure in failures:
            for failed_step in failure["failed_steps"]:
                tool = failed_step["tool"]
                failure_analysis["common_failed_tools"][tool] = \
                    failure_analysis["common_failed_tools"].get(tool, 0) + 1
        
        return failure_analysis
```

---

## Complete Integration

### Main Application Flow

Putting all components together into a cohesive application.

```python
# main_app.py - Your main application entry point

import google.generativeai as genai
from blender_mcp_client import BlenderMCPClient  # Your existing MCP client

class BlenderAIApplication:
    def __init__(self, gemini_api_key: str, mcp_server_url: str):
        # Initialize Gemini
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Initialize MCP client (connects to your server.py)
        self.mcp_client = BlenderMCPClient(mcp_server_url)
        
        # Initialize orchestration components
        self.planner = BlenderTaskPlanner(self.model)
        self.tool_filter = ToolFilter()
        self.executor = BlenderTaskExecutor(self.mcp_client, self.model)
        self.monitor = ExecutionMonitor()
    
    async def process_user_request(self, user_request: str) -> dict:
        """
        Main entry point: Two-phase planning + execution
        """
        print(f"\n{'='*60}")
        print(f"🎯 User Request: {user_request}")
        print(f"{'='*60}\n")
        
        # ============ PHASE 1: PLANNING ============
        print("📝 PHASE 1: Planning\n")
        
        # Generate plan
        plan = self.planner.generate_plan(user_request)
        print(f"✓ Generated plan with {len(plan['steps'])} steps")
        print(f"  Summary: {plan['plan_summary']}\n")
        
        # Filter tools
        relevant_tools = self.tool_filter.filter_tools_for_task(user_request, plan)
        print(f"✓ Filtered to {len(relevant_tools)} relevant tools:")
        print(f"  {', '.join(relevant_tools)}\n")
        
        # ============ PHASE 2: EXECUTION ============
        print("⚡ PHASE 2: Execution\n")
        
        # Execute step-by-step
        results = await self.executor.execute_plan(plan, user_request)
        
        # ============ POST-EXECUTION ============
        print(f"\n{'='*60}")
        if results["success"]:
            print("✅ Execution completed successfully!")
        else:
            print("⚠️  Execution completed with errors")
        
        print(f"\nCompleted: {len(results['completed_steps'])}/{len(plan['steps'])} steps")
        
        if results["failed_steps"]:
            print("\nFailed steps:")
            for failed in results["failed_steps"]:
                print(f"  - Step {failed['step']}: {failed['error']}")
        
        print(f"{'='*60}\n")
        
        # Log execution
        self.monitor.log_execution(user_request, plan, results)
        
        return {
            "plan": plan,
            "results": results,
            "final_scene_state": results["final_state"]
        }


# Usage Example
async def main():
    app = BlenderAIApplication(
        gemini_api_key="YOUR_API_KEY",
        mcp_server_url="http://localhost:8000"  # Your MCP server
    )
    
    # Example requests
    requests = [
        "Create a red cube at the origin",
        "Make a scene with a blue sphere, green plane, and yellow light",
        "Position the camera to look at the sphere from 5 units away"
    ]
    
    for request in requests:
        result = await app.process_user_request(request)
        print(f"Final scene: {result['final_scene_state']}\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## Architecture Benefits

This two-phase approach provides several key advantages:

### 1. **Improved Tool Selection**
Gemini generates a complete plan before acting, reducing impulsive incorrect tool calls that would occur with direct execution.

### 2. **Better Error Handling**
Validation after each step catches failures early, allowing the system to attempt recovery before the entire operation fails.

### 3. **Reduced Token Usage**
Tool filtering shows only relevant tools for the current task, reducing context size and improving response quality.

### 4. **Enhanced Debuggability**
Comprehensive monitoring shows exactly where and why failures occur, enabling rapid iteration and improvement.

### 5. **Iterative Improvement**
Execution logs enable you to identify patterns in failures and success, allowing you to refine prompts and tool descriptions over time.

### 6. **Transparency**
Users can see the plan before execution, understand what will happen, and potentially modify it if needed.

### 7. **Recovery Capabilities**
Automatic recovery from common failure modes (e.g., trying to modify a non-existent object) improves overall success rate.

---

## Next Steps

### Implementation Roadmap

1. **Start Simple**: Implement just the planner first, manually review plans before execution to ensure quality
   
2. **Add Validation**: Implement the executor with step validation to catch errors early
   
3. **Integrate Monitoring**: Add logging to identify failure patterns and common issues
   
4. **Iterate on Prompts**: Use failure logs to improve your planning and validation prompts over time
   
5. **Consider Caching**: Cache successful plans for similar requests to reduce latency and API costs

### Advanced Enhancements

- **User Confirmation**: Add a step where users can review and approve plans before execution
- **Plan Optimization**: Use Gemini to optimize plans by combining steps or removing redundancies
- **Parallel Execution**: For independent steps, execute them in parallel to improve performance
- **Learning System**: Build a feedback loop where successful patterns inform future planning
- **Visual Preview**: Generate a preview visualization of what the plan will create before execution

### Testing Strategy

1. Start with simple single-object creation tasks
2. Progress to multi-object scenes
3. Test modification operations on existing scenes
4. Validate camera and lighting adjustments
5. Test error recovery with intentionally problematic requests

---

## Conclusion

This architecture transforms your raw Gemini→MCP connection into a robust orchestration system that rivals the capabilities of Claude Desktop and Cursor. By separating planning from execution and adding validation at each step, you create a system that:

- Makes smarter tool choices
- Handles errors gracefully
- Provides visibility into its operation
- Continuously improves through logging and analysis

The key insight is that advanced AI applications succeed not just through powerful models, but through intelligent orchestration layers that guide those models toward success.