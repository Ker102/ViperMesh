# MCP Tools Available — Copilot Reminder

> This file exists to remind the AI assistant about powerful MCP tools
> available in this workspace. USE THEM when they'd help.

## 🔍 Web Search & Scraping

### Firecrawl Search (`firecrawl_search`)
- **Best for**: Finding docs, Stack Overflow answers, latest API changes, tutorials
- **Example**: Search for "Blender 4.x Python API breaking changes" or "Next.js 16 app router streaming"
- Supports operators: `site:`, `intitle:`, `""` exact match, `-` exclude

### Firecrawl Scrape (`firecrawl_scrape`)
- **Best for**: Getting full content from a known URL
- **Example**: Scrape official Blender API docs, Supabase docs, Prisma docs

### Firecrawl Map (`firecrawl_map`)
- **Best for**: Discovering all URLs on a site before scraping

### Firecrawl Extract (`firecrawl_extract`)
- **Best for**: Pulling structured data (prices, versions, specs) from pages

### Generic Fetch (`fetch`)
- Simple URL fetch with markdown extraction
- Good for quick checks on any URL

## 📚 Documentation Lookup

### Context7 (`resolve-library-id` → `get-library-docs`)
- **Best for**: Getting up-to-date docs for ANY library
- **Workflow**: First `resolve-library-id` with library name, then `get-library-docs` with the ID
- **Example libraries**: next.js, prisma, supabase, langchain, electron, tailwindcss, shadcn/ui, zod
- Can focus on specific topics: "routing", "hooks", "auth", "streaming"

### GitHub Docs (`fetch_generic_documentation`, `search_generic_documentation`)
- **Best for**: Getting docs/README from any GitHub repo
- **Example**: `owner: "blender"`, `repo: "blender"` for Blender source docs

### GitHub Code Search (`search_generic_code`)
- **Best for**: Finding implementation patterns in open-source repos
- **Example**: Search how other projects implement MCP servers, Electron IPC, etc.

## 🌐 Browser Automation

### Playwright Browser (`browser_navigate`, `browser_snapshot`, `browser_click`, etc.)
- **Best for**: Checking console messages, reading page structure, quick interactions
- Can navigate to `http://localhost:3000` and interact with the app
- Use `browser_snapshot` (accessibility tree) and `browser_console_messages` for fast checks
- ⚠️ **AVOID `browser_take_screenshot`** — it's very slow. Only use when visual verification is explicitly needed and no other tool suffices.
- **Use for**: Verifying structural/accessibility correctness and console/network behavior
- **Cannot confirm**: Pixel-perfect visual appearance — these tools verify DOM/accessibility structure, not rendered visuals. Visual verification requires user confirmation (or an explicitly allowed `browser_take_screenshot` despite performance concerns).

## 🔧 When to Use These Tools

| Situation | Tool |
|-----------|------|
| "How does X work in Blender 4.x?" | `firecrawl_search` or `get-library-docs` |
| "What's the latest Electron API for Y?" | `resolve-library-id` → `get-library-docs` |
| Need to check if a package version exists | `firecrawl_search` |
| Debugging a Supabase/Prisma issue | `get-library-docs` with topic |
| Checking how another project solved Z | `search_generic_code` on GitHub |
| Verifying the UI looks correct after changes | `browser_navigate` + `browser_snapshot` |
| Need official docs for an error message | `firecrawl_search` with the error |
| Finding best practices for security/a11y | `firecrawl_search` |
| Checking Blender Python API reference | `firecrawl_scrape` on docs.blender.org |
| Looking up shadcn/ui component API | `get-library-docs` with topic |

## 💡 Tips
- Prefer `firecrawl_search` WITHOUT formats first, then scrape specific results
- `get-library-docs` is fast and focused — use it for known libraries
- Browser tools are great for verifying changes without asking the user to check
- Combine tools: search → find URL → scrape for full context
- Don't hesitate to use these for ANY uncertainty — they're faster than guessing
