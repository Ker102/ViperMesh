<div align="center">

# 🐍 ViperMesh

**AI-Powered Blender Assistant & Neural 3D Hub**

<p align="center">
  Transform your 3D workflow with AI-powered Blender automation and neural generation.<br>
  Create, modify, and enhance your Blender projects through natural conversation and visual tools.
</p>

<!-- Tech Stack Header -->
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,supabase,electron,python,blender" />
  </a>
</p>
<p align="center">
  <b>Next.js 16 • TypeScript • Tailwind • Supabase • LangChain • Electron • Blender</b>
</p>

<br>

[Features](#-features) • [Agent Tools](#-agent-tools) • [Quick Start](#-quick-start) • [Neural Pipeline](#-neural-3d-pipeline) • [Contributing](#-contributing)

</div>

---

## 🚀 Features

ViperMesh is a comprehensive platform that brings next-gen AI capabilities to Blender through an intelligent agent, a proprietary RAG pipeline, dynamic addon adaptation, and hybrid neural 3D generation.

### 🤖 LangChain v1 Agent
- **ReAct Loop**: Built on LangChain 1.x `createAgent` + LangGraph with hallucinated tool-call recovery
- **22 Native Tools**: Direct Blender manipulation without writing Python (transforms, modifiers, parenting, export, and more)
- **Middleware Stack**: Viewport screenshots after code execution, RAG context injection
- **Session Persistence**: `MemorySaver` with `thread_id` keyed to project ID

### 🧠 Dynamic Addon Detection
- **Auto-Discovery**: Agent calls `list_installed_addons` to introspect enabled Blender addons at session start
- **Addon Registry**: Known addon profiles (Node Wrangler, Rigify, LoopTools, Bool Tool, etc.)
- **Prompt Injection**: System prompt is dynamically extended with addon-specific operators and usage tips
- **Zero Configuration**: Install an addon → the agent adapts automatically

### 📚 Hybrid RAG Pipeline
- **Context-Aware Generation**: Leverages professional Blender scripts for accurate code generation
- **Semantic Search**: Uses Gemini embeddings for high-quality retrieval
- **CRAG Architecture**: Corrective RAG with quality grading and fallback strategies
- **Knowledge Base**: Covers modeling, rigging, shading, geometry nodes, animation, and lighting

### 🌐 Premium Web Dashboard UI
- **Dual Modes**: 
  - **Autopilot**: Conversational AI assistant for procedural generation.
  - **Studio**: Full-page, immersive workspace with an icon-sidebar and interactive tool-card grid.
- **Teal Design System**: Professional, high-end visual aesthetics (#0d9488 focus) with interactive 3D hero sections and animated SVGs.
- **Supabase Auth**: Secure authentication with Google and GitHub OAuth.

### 🔌 Blender MCP Bridge
- **Socket Bridge**: Executes generated Python directly in Blender via TCP
- **Bidirectional**: Commands sent, results returned as JSON
- **Viewport Capture**: Base64-encoded screenshots for visual feedback loops

---

## 🎨 Neural 3D Pipeline
ViperMesh incorporates a powerful 3-tier hybrid generation architecture for neural assets:
1. **Hosted APIs**: Integration with Fal.ai (Hunyuan3D 2.1, TRELLIS 2) and proprietary YVO3D for premium texturing.
2. **Serverless GPUs**: Custom model deployment via RunPod for high-demand tasks.
3. **Scale-to-Zero**: Optimized routing for cost-effective handling of self-hosted volumetric models.

---

## 🛠️ Agent Tools

The ViperMesh agent has **22 native tools** that it can call directly — no Python code required:

| Category | Tools |
|---|---|
| **Scene Analysis** | `get_scene_info`, `get_object_info`, `get_all_object_info`, `get_viewport_screenshot` |
| **Code Execution** | `execute_code`, `list_materials` |
| **Object Management** | `delete_object`, `rename_object`, `duplicate_object`, `join_objects` |
| **Transforms** | `set_object_transform`, `apply_transforms` |
| **Modifiers** | `add_modifier`, `apply_modifier`, `shade_smooth` |
| **Hierarchy** | `parent_set`, `parent_clear` |
| **Organization** | `set_origin`, `move_to_collection`, `set_visibility` |
| **Export** | `export_object` (GLB, GLTF, FBX, OBJ, STL) |
| **Detection** | `list_installed_addons` |

Plus **integration tools** when enabled: PolyHaven, Sketchfab, Hyper3D Rodin.

---

## 🧩 Dynamic Addon Detection

ViperMesh is the first AI agent that **auto-adapts to your installed Blender addons**.

**Currently recognized addons:**

| Addon | Category | What the Agent Gains |
|---|---|---|
| Node Wrangler | Shading | PBR texture auto-connect |
| Rigify | Rigging | Meta-rig to full rig generation |
| LoopTools | Mesh | Relax, circle, bridge operations |
| Bool Tool | Object | Quick boolean unions/differences |
| Images as Planes | Import | Import reference images |
| Extra Mesh Objects | Add Mesh | Procedural gears, gems, stars |
| Extra Curve Objects | Add Curve | Spirals, torus knots |
| F2 | Mesh | Extended face-filling |
| 3D-Print Toolbox | Mesh | Print quality checks |
| Animation Nodes | Animation | Procedural node trees |
| BlenderKit | Import | Asset library downloads |

---

## 🏗️ Technology Stack

<table>
<tr>
<td><b>Frontend</b></td>
<td>
<br>
<img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind" />
<br><br>
<b>Next.js 16 • React 19 • TypeScript 5.6 • Tailwind CSS</b>
<br><br>
</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>
<br>
<img src="https://skillicons.dev/icons?i=nodejs,supabase" />
<br><br>
<b>Node.js 24+ • Supabase (Auth + Postgres) • Stripe</b>
<br><br>
</td>
</tr>
<tr>
<td><b>AI & Desktop</b></td>
<td>
<br>
<img src="https://skillicons.dev/icons?i=gcp,python,electron,blender" />
<br><br>
<b>ViperAgent 2.0 • LangChain v1 • LangGraph • Electron • Blender Python API</b>
<br><br>
</td>
</tr>
</table>

## 📋 Quick Start

### Prerequisites

- Node.js 18+ (24+ recommended)
- Supabase project (or local instance)
- Blender 4.0+ (5.0 compatible)
- Python 3.10+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ker102/ModelForge.git
   cd ModelForge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure `.env` with your Supabase URL/keys, and Gemini API key (used for ViperAgent 2.0 and RAG).

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Connect Blender**
   - Install the ViperMesh addon in Blender (`public/downloads/vipermesh-addon.py`)
   - Click "Start Server" in Blender's sidebar panel
   - The agent connects automatically via TCP socket

## 🔄 Roadmap

- [x] LangChain v1 agent with ReAct loop
- [x] 22 native Blender tools
- [x] Dynamic addon detection + registry
- [x] Hybrid RAG Pipeline
- [x] Supabase Auth (Google + GitHub OAuth)
- [x] Stripe subscription integration
- [x] Viewport screenshot analysis
- [x] Electron desktop shell
- [x] Premium Redesign (ViperMesh Branding & Teal Interface)
- [x] Interactive Studio Workspaces
- [ ] Manual verification of all tool categories
- [ ] Production desktop packaging
- [ ] Dynamic addon operator discovery
- [ ] Community addon marketplace page

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the [LICENSE](LICENSE) file.

---

<div align="center">

Built with ❤️ by the ViperMesh team

[Website](#) • [Documentation](README.md) • [Addons](/addons)

</div>
