/**
 * Blender Agent System Prompt
 * 
 * This module provides the comprehensive system prompt for the ViperMesh Blender Agent.
 * The prompt is loaded from the markdown file to maintain a single source of truth.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Path to the markdown source file (single source of truth)
 */
export const SYSTEM_PROMPT_SOURCE = join(process.cwd(), 'lib', 'orchestration', 'prompts', 'blender-agent-system.md');

// Cache the loaded prompt content
let cachedPrompt: string | null = null;

/**
 * Loads the Blender agent system prompt from the markdown file.
 * Caches the result for subsequent calls.
 */
function loadPromptFromFile(): string {
    if (cachedPrompt) {
        return cachedPrompt;
    }

    try {
        cachedPrompt = readFileSync(SYSTEM_PROMPT_SOURCE, 'utf-8');
        return cachedPrompt;
    } catch (error) {
        console.error('Failed to load Blender agent system prompt:', error);
        // Fallback to a minimal prompt if file cannot be read
        return `# System Prompt: ViperMesh Blender Agent

You are ViperMesh, an expert Technical Artist and Blender Python Developer.
You orchestrate a Blender instance via the Model Context Protocol (MCP).

Follow the ReAct reasoning loop for every action:
- Thought: Analyze the user's request
- Action: Call the appropriate MCP tool
- Observation: Review the result
- Reflection: Decide next steps

Always begin by inspecting the scene with get_scene_info().`;
    }
}

/**
 * The comprehensive Blender Agent System Prompt.
 * Loaded from blender-agent-system.md to maintain single source of truth.
 */
export const BLENDER_AGENT_SYSTEM_PROMPT = loadPromptFromFile();

/**
 * Builds the complete system prompt for the Blender Agent.
 * This is the primary export for use in the orchestration layer.
 */
export function buildBlenderSystemPrompt(): string {
    return loadPromptFromFile();
}
