import { tool } from "langchain"
import { z } from "zod"

// Test 1: Can we mutate a tool's description?
const testTool = tool(
  async () => "test",
  {
    name: "test_tool",
    description: "original desc",
    schema: z.object({}),
  }
)

console.log("BEFORE:", JSON.stringify(testTool.description))
testTool.description = testTool.description + "\n\n--- GUIDE ---\nCamera must be 8m away"
console.log("AFTER:", JSON.stringify(testTool.description))
console.log("MUTATION_WORKED:", testTool.description.includes("GUIDE"))

// Test 2: Check if the property descriptor allows writing
const desc = Object.getOwnPropertyDescriptor(testTool, "description")
console.log("PROPERTY_DESCRIPTOR:", JSON.stringify(desc))

// If direct assignment fails, check prototype
const protoDesc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(testTool), "description")
console.log("PROTO_DESCRIPTOR:", JSON.stringify(protoDesc))

process.exit(0)
