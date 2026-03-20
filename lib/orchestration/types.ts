import type { StrategyDecision } from "./strategy-types"
import type { WorkflowProposal, WorkflowStepStatus } from "./workflow-types"
import type { LogEntry, SessionSummary } from "@/lib/monitoring"

export interface PlanStep {
  stepNumber: number
  action: string
  parameters: Record<string, unknown>
  rationale: string
  expectedOutcome: string
}

export interface PlanAnalysis {
  components: string[]
  materialGuidelines: string[]
  minimumMeshObjects?: number
  requireLighting?: boolean
  requireCamera?: boolean
  notes?: string[]
}

export interface ExecutionPlan {
  planSummary: string
  steps: PlanStep[]
  dependencies?: string[]
  warnings?: string[]
}

export interface PlanGenerationResult {
  plan: ExecutionPlan | null
  rawResponse: string
  errors?: string[]
  retries?: number
  analysis?: PlanAnalysis
}

export interface ResearchSource {
  title: string
  url: string
  snippet?: string
}

export interface ToolMetadata {
  name: string
  description: string
  category: ToolCategory
  parameters?: string
}

export type ToolCategory =
  | "inspection"
  | "geometry"
  | "materials"
  | "lighting"
  | "camera"
  | "assets"
  | "advanced"
  | "other"

export interface ExecutionLogEntry {
  timestamp: string
  tool: string
  parameters: Record<string, unknown>
  result?: unknown
  error?: string
  /** Log entry type for filtering/display */
  logType?: "plan" | "execute" | "validate" | "recover" | "vision" | "audit" | "reasoning" | "system"
  /** Human-readable description of what happened */
  detail?: string
  /** Visual validation result (if vision feedback is enabled) */
  visualValidation?: {
    screenshot?: string
    analysis?: {
      description: string
      assessment: string
      issues: string[]
      suggestions: string[]
    }
    matches?: boolean
    differences?: string[]
  }
}

/**
 * Base fields shared by all agent stream events
 */
interface AgentEventBase {
  timestamp: string
}

interface AgentPlanningStart extends AgentEventBase { type: "agent:planning_start" }
interface AgentPlanningReasoning extends AgentEventBase { type: "agent:planning_reasoning"; reasoning: string }
interface AgentPlanningComplete extends AgentEventBase { type: "agent:planning_complete"; stepCount: number; summary: string }
interface AgentStepStart extends AgentEventBase { type: "agent:step_start"; stepIndex: number; stepCount: number; action: string; rationale: string }
interface AgentStepResult extends AgentEventBase { type: "agent:step_result"; stepIndex: number; action: string; result: unknown; success: boolean }
interface AgentStepValidate extends AgentEventBase { type: "agent:step_validate"; stepIndex: number; action: string; valid: boolean; reason?: string }
interface AgentStepRecover extends AgentEventBase { type: "agent:step_recover"; stepIndex: number; action: string; recoveryAction: string; rationale: string }
interface AgentStepError extends AgentEventBase { type: "agent:step_error"; stepIndex: number; action: string; error: string; attempt: number }
interface AgentVision extends AgentEventBase { type: "agent:vision"; stepIndex?: number; assessment: string; issues: string[] }
interface AgentAudit extends AgentEventBase { type: "agent:audit"; success: boolean; reason?: string }
interface AgentComplete extends AgentEventBase { type: "agent:complete"; success: boolean; completedCount: number; failedCount: number }
interface AgentCodeGeneration extends AgentEventBase { type: "agent:code_generation"; stepIndex: number; description: string }
interface AgentVisualAnalysis extends AgentEventBase { type: "agent:visual_analysis"; iteration: number; description: string }
interface AgentVisualCorrection extends AgentEventBase { type: "agent:visual_correction"; iteration: number; description: string; issues: string[] }
interface AgentNeuralGeneration extends AgentEventBase { type: "agent:neural_generation"; provider: string; stage: string; status: string; progress?: number }
interface AgentHybridPipeline extends AgentEventBase { type: "agent:hybrid_pipeline"; stagesCompleted: number; stagesTotal: number; currentStage: string }
interface AgentStrategyClassification extends AgentEventBase { type: "agent:strategy_classification"; strategy: string; confidence: number; reasoning: string; method: string }
interface AgentWorkflowProposal extends AgentEventBase { type: "agent:workflow_proposal"; proposal: WorkflowProposal }
interface AgentWorkflowStepUpdate extends AgentEventBase { type: "agent:workflow_step_update"; stepId: string; status: WorkflowStepStatus; message?: string; error?: string; durationMs?: number }
interface AgentMonitoringLog extends AgentEventBase { type: "agent:monitoring_log"; entry: LogEntry }
interface AgentMonitoringSummary extends AgentEventBase { type: "agent:monitoring_summary"; summary: SessionSummary }
interface AgentStepScreenshot extends AgentEventBase { type: "agent:step_screenshot"; stepIndex: number; description: string }
interface AgentToolCall extends AgentEventBase { type: "agent:tool_call"; toolName: string; status: "started" | "completed" | "failed" }
interface AgentToolResult extends AgentEventBase { type: "agent:tool_result"; toolName: string; success: boolean; summary?: string }
interface AgentReasoning extends AgentEventBase { type: "agent:reasoning"; content: string }

/**
 * Real-time stream event types sent during agent execution
 */
export type AgentStreamEvent =
  | AgentPlanningStart
  | AgentPlanningReasoning
  | AgentPlanningComplete
  | AgentStepStart
  | AgentStepResult
  | AgentStepValidate
  | AgentStepRecover
  | AgentStepError
  | AgentVision
  | AgentAudit
  | AgentComplete
  | AgentCodeGeneration
  | AgentVisualAnalysis
  | AgentVisualCorrection
  | AgentNeuralGeneration
  | AgentHybridPipeline
  | AgentStrategyClassification
  | AgentWorkflowProposal
  | AgentWorkflowStepUpdate
  | AgentMonitoringLog
  | AgentMonitoringSummary
  | AgentStepScreenshot
  | AgentToolCall
  | AgentToolResult
  | AgentReasoning

export interface PlanningMetadata {
  planSummary: string
  planSteps: PlanStep[]
  rawPlan: string
  retries: number
  executionSuccess: boolean
  errors?: string[]
  fallbackUsed?: boolean
  executionLog?: ExecutionLogEntry[]
  sceneSnapshot?: string | null
  analysis?: PlanAnalysis
  researchSummary?: string
  researchSources?: ResearchSource[]
  strategyDecision?: StrategyDecision
}
