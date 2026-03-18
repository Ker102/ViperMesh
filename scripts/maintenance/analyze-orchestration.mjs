import { readFile } from 'fs/promises'
import { stat } from 'fs/promises'
import path from 'path'

const DEFAULT_LOG_PATH = path.resolve(process.cwd(), 'logs/orchestration.ndjson')

async function readLogFile(filePath) {
  try {
    await stat(filePath)
  } catch {
    console.error(`No orchestration log found at ${filePath}. Run a chat session first.`)
    process.exit(1)
  }

  const content = await readFile(filePath, 'utf8')
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        console.warn('Skipping malformed log entry:', line)
        return null
      }
    })
    .filter(Boolean)
}

function summarize(entries) {
  const summary = {
    total: entries.length,
    successes: 0,
    fallbacks: 0,
    failures: 0,
  }

  const failedRequests = []
  const failedTools = new Map()
  const errorMessages = new Map()

  for (const entry of entries) {
    if (entry.success) {
      summary.successes += 1
    } else {
      summary.failures += 1
      failedRequests.push({
        request: entry.request,
        error: entry.planErrors?.join('; ') || 'Unknown error',
      })
    }

    if (entry.fallbackUsed) {
      summary.fallbacks += 1
    }

    const failedCommands = Array.isArray(entry.failedCommands)
      ? entry.failedCommands
      : []
    for (const command of failedCommands) {
      const key = command.tool || 'unknown'
      failedTools.set(key, (failedTools.get(key) ?? 0) + 1)
      if (command.error) {
        errorMessages.set(command.error, (errorMessages.get(command.error) ?? 0) + 1)
      }
    }
  }

  return {
    summary,
    failedRequests,
    failedTools: Array.from(failedTools.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
    errorMessages: Array.from(errorMessages.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
  }
}

async function main() {
  const logPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_LOG_PATH
  const entries = await readLogFile(logPath)

  if (entries.length === 0) {
    console.log('Log file is empty. Run a few conversations first.')
    return
  }

  const { summary, failedRequests, failedTools, errorMessages } = summarize(entries)

  console.log('\n=== Orchestration Summary ===')
  console.table(summary)

  if (failedTools.length) {
    console.log('\nTop failing tools:')
    failedTools.forEach(([tool, count]) => {
      console.log(`- ${tool}: ${count}`)
    })
  }

  if (errorMessages.length) {
    console.log('\nFrequent error messages:')
    errorMessages.forEach(([message, count]) => {
      console.log(`- (${count}) ${message}`)
    })
  }

  if (failedRequests.length) {
    console.log('\nRecent failed requests:')
    failedRequests.slice(-5).forEach((item) => {
      console.log(`• ${item.request} → ${item.error}`)
    })
  }

  console.log('\nUse `node scripts/analyze-orchestration.mjs [path]` to re-run with a different log file.')
}

main().catch((error) => {
  console.error('Failed to analyze orchestration log:', error)
  process.exit(1)
})
