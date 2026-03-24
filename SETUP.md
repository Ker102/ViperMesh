# ViperMesh - Quick Setup Guide

## Prerequisites

Before you start, make sure you have:
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- A Stripe account (for payment integration)
- Git for version control

## Local Development Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example
cp .env.example .env
```

Then edit `.env` and fill in these values:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://user:password@localhost:5432/modelforge"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase Auth - Get from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Stripe Price IDs - Create products in Stripe Dashboard
STRIPE_STARTER_MONTHLY_PRICE_ID="price_..."
STRIPE_STARTER_YEARLY_PRICE_ID="price_..."
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."

# LLM Provider
GEMINI_API_KEY="your-gemini-api-key"

# Blender MCP bridge
BLENDER_MCP_HOST="127.0.0.1"
BLENDER_MCP_PORT="9876"
```

### Local LLM Providers (Optional)

Free-tier accounts must configure a local provider before using the chat assistant. We support:

- **Ollama** – install from [ollama.com](https://ollama.com), run `ollama serve`, then `ollama pull llama3.1`.
- **LM Studio** – download from [lmstudio.ai](https://lmstudio.ai) and enable the OpenAI-compatible server (default URL `http://localhost:1234`).

Once the provider is running, open **Dashboard → Settings → Local LLM Configuration** and enter:

1. Provider (`Ollama` or `LM Studio`).
2. Base URL (e.g. `http://localhost:11434`).
3. Model name (exact string exposed by the provider).
4. Optional API key (only if LM Studio server auth is enabled).

Use the **Test connection** button to confirm we can reach your runtime, then click **Save configuration**.

### 2. Database Setup (Neon Serverless)

ViperMesh uses [Neon](https://neon.tech) for serverless PostgreSQL and vector embeddings.

1. **Create a Project**:
   - Sign up at [Neon Console](https://console.neon.tech).
   - Create a new project (e.g., "vipermesh").

2. **Get Connection Strings**:
   - In the Neon Dashboard, look for "Connection Details".
   - Copy the **pooled** connection string for `DATABASE_URL`.
   - Copy the **direct** connection string for `DIRECT_URL`.

3. **Enable pgvector**:
   - Go to the **SQL Editor** in Neon.
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

4. **Update .env**:
   Ensure your `.env` file has both URL variants:

   ```env
   DATABASE_URL="postgres://user:pass@ep-xyz-pool.region.aws.neon.tech/modelforge?sslmode=require"
   DIRECT_URL="postgres://user:pass@ep-xyz-direct.region.aws.neon.tech/modelforge?sslmode=require"
   ```

### 3. Initialize the Project

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Set Up Stripe

1. **Create a Stripe Account**: https://dashboard.stripe.com/register

2. **Get API Keys**:
   - Go to Developers → API keys
   - Copy your keys to `.env`

3. **Create Products**:
   - Go to Products → Add Product
   - Create "ViperMesh Starter"
     - Monthly price: $12
     - Yearly price: $99
   - Create "ViperMesh Pro"
     - Monthly price: $29
     - Yearly price: $249
   - Copy all price IDs to `.env`

4. **Set Up Webhooks**:
   - Go to Developers → Webhooks
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
   - Copy webhook signing secret to `.env`

5. **Test Webhooks Locally**:
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

### Optional: Firecrawl Web Research

The assistant can pull design inspiration from the web through Firecrawl. This is disabled by default.

1. Sign up for Firecrawl and grab an API key.
2. Add it to your local environment:
   ```
   FIRECRAWL_API_KEY="fc_live_or_test_key"
   ```
3. Restart `npm run dev`.
4. In the project chat panel, enable **Allow web research (Firecrawl)** to let the planner fetch summaries when you explicitly ask for references or trends.

## Project Structure

```
vipermesh/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── dashboard/      # Protected dashboard pages
│   ├── login/          # Authentication pages
│   └── page.tsx        # Homepage
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── landing/       # Landing page sections
│   ├── dashboard/     # Dashboard components
│   └── auth/          # Auth forms
├── lib/               # Utility libraries
│   ├── auth.ts       # Supabase auth helper (drop-in session provider)
│   ├── db.ts         # Prisma client
│   ├── stripe.ts     # Stripe client
│   ├── supabase/     # Supabase client/server/middleware helpers
│   └── utils.ts      # Helper functions
├── prisma/
│   └── schema.prisma # Database schema
└── README.md         # Full documentation
```

## Common Tasks

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes (dev)
npm run db:migrate      # Run migrations (prod)
npm run db:studio       # Open Prisma Studio
```

## Testing the Application

1. **Sign Up**: Go to `/signup` and create an account
2. **Login**: Go to `/login` and sign in
3. **Dashboard**: View your projects at `/dashboard`
4. **Create Project**: Click "New Project" button
5. **Settings**: Manage subscription at `/dashboard/settings`

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -U postgres -d modelforge -c "SELECT version();"

# Check pgvector
psql -U postgres -d modelforge -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Prisma Issues

```bash
# Reset database (WARNING: deletes all data)
npm run db:push -- --force-reset

# Regenerate client
npm run db:generate
```

### Stripe Webhook Issues

- Make sure webhook endpoint is accessible
- Verify webhook secret matches dashboard
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

## Blender MCP Bridge

To enable direct Blender automation you will need the community [blender-mcp](https://github.com/ahujasid/blender-mcp) addon and server:

1. Install Blender ≥ 3.0, Python ≥ 3.10, Git, and the [`uv`](https://docs.astral.sh/uv/getting-started/installation/) package manager.
2. Obtain the addon:
   - Direct download: [`/downloads/vipermesh-addon.py`](/downloads/vipermesh-addon.py)
   - Or clone the upstream repository: `git clone https://github.com/ahujasid/blender-mcp.git`
3. Install the addon via Blender → Preferences → Add-ons → Install.
4. Launch the MCP server with `uvx blender-mcp` (consult the upstream README for IDE integrations). Keep the `.env` variables `BLENDER_MCP_HOST` and `BLENDER_MCP_PORT` aligned with the server.
5. Start Blender, enable the addon, and click **Connect to Claude** (or the ViperMesh desktop app once available).

See `blendermcpreadme.md` in this repository for a full offline copy of the official setup guide.

### Installing `uv`

Install `uv` before running `uvx blender-mcp`:

- **Linux**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
  Add the path printed by the installer (commonly `~/.cargo/bin` or `~/.local/bin`) to your `PATH`.

- **macOS**
  ```bash
  brew install uv
  ```
  or use the same curl script as Linux if you prefer.

- **Windows**
  ```powershell
  powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
  Then append `%USERPROFILE%\.local\bin` to your `PATH`.

Confirm the installation with:

```bash
uv --version
```

### Create a local test user

Run the seeding script to provision a Pro-tier test account:

```bash
npm run test:user
```

Defaults to email `test@vipermesh.dev` with password `TestPass123!`. Override using `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` environment variables when running the command.

## Next Steps

Auth migration complete. Current priorities:

- [x] Supabase Auth migration (NextAuth fully removed)
- [x] Electron desktop app (dev mode working)
- [x] AI chat with Gemini (streaming + orchestration)
- [x] Vector embeddings for project memory (pgvector)
- [x] Two-phase orchestration (plan → code gen → execute → validate)
- [x] Blender 5.x API compatibility (all code/prompts updated)
- [x] RAG re-ingestion with new embedding model (113 docs, gte-modernbert-base)
- [x] Full TypeScript build passes clean
- [ ] Test end-to-end Blender MCP scene generation
- [ ] Deploy to production
- [ ] Set up production database
- [ ] Configure production Stripe webhooks
- [ ] Package Electron app for distribution

## Need Help?

Check the [full README](./README.md) for comprehensive documentation, or open an issue on GitHub.

---

Built with Next.js, PostgreSQL, and Stripe
