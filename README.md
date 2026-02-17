# Claude Hack Night - Task Manager

A task management app built with [Skybridge](https://docs.skybridge.tech), featuring a kanban board with drag-and-drop, status management, and real-time sync via Supabase.

## Prerequisites

### Node.js (v24.13+)

- macOS: `brew install node`
- Linux / other: [nodejs.org/en/download](https://nodejs.org/en/download)

### pnpm

[pnpm.io/installation](https://pnpm.io/installation)

```bash
npm install -g pnpm
```

### Supabase CLI

- macOS: `brew install supabase/tap/supabase`
- Linux / other: [supabase.com/docs/guides/cli/getting-started](https://supabase.com/docs/guides/cli/getting-started)

### Supabase Project

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). You'll need:

- **Project URL** (`SUPABASE_URL`)
- **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) — found in Settings > API

### Clerk Project

Create a project at [clerk.com/dashboard](https://clerk.com/dashboard). You'll need:

- **Secret Key** (`CLERK_SECRET_KEY`)
- **Publishable Key** (`CLERK_PUBLISHABLE_KEY`)

### Claude Code (optional, for AI-assisted development)

[docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)

```bash
npm install -g @anthropic-ai/claude-code
```

## Setup

**1. Install dependencies**

```bash
pnpm i
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Fill in your keys:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

**3. Link your Supabase project and push migrations**

```bash
supabase link
supabase db push
```

This creates the `tasks` table and the `toggle_task` RPC function.

**4. Start the dev server**

```bash
pnpm dev
```

The server runs at `http://localhost:3000`. For testing, we recommend using the Skybridge devtools available at [http://localhost:3000](http://localhost:3000) (no `/mcp` suffix).

## Connecting to Claude

When you're ready to test with Claude, tunnel your local server with [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) to expose the MCP endpoint at `/mcp`:

```bash
cloudflared tunnel --url http://localhost:3000
```

Then add your tunnel URL with `/mcp` appended (e.g. `https://xxx.trycloudflare.com/mcp`) as a remote MCP server in Claude settings.

## Supabase Commands

```bash
# Link your local project to a remote Supabase project (required once)
supabase link

# Push local migrations to the remote database
supabase db push

# Reset the remote database (drops all data, re-applies migrations)
supabase db reset --linked

# Create a new migration file
supabase migration new <migration_name>

# Check migration status
supabase migration list
```

Migrations live in `supabase/migrations/`. After editing or adding a migration file, run `supabase db push` to apply it to your remote database.

## Deploy to Production

Use [Alpic](https://alpic.ai/) to deploy your app to production:

[![Deploy on Alpic](https://assets.alpic.ai/button.svg)](https://app.alpic.ai/new/clone?repositoryUrl=https%3A%2F%2Fgithub.com%2Falpic-ai%2Fclaude-hacknight-starter-20-02-2026)

Then add your deployed URL with `/mcp` appended (e.g. `https://your-app-name.alpic.live/mcp`) as a remote MCP server in Claude settings.

## Resources

- [Skybridge Documentation](https://docs.skybridge.tech/)
- [Apps SDK Documentation](https://developers.openai.com/apps-sdk)
- [MCP Apps Documentation](https://github.com/modelcontextprotocol/ext-apps/tree/main)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Alpic Documentation](https://docs.alpic.ai/)
