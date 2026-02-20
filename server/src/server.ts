import { McpServer } from "skybridge/server";
import { z } from "zod";
import { env } from "./env.js";
import { executeActions, fetchTasks } from "./supabase.js";
import { fetchFullGraph } from "./neo4j.js";

const SERVER_URL = "http://localhost:3000";

const ActionSchema = z.object({
  type: z.enum(["add", "delete", "toggle", "move"]),
  title: z.string().optional().describe("Task title (required for add)"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Task priority"),
  dueDate: z.string().optional().describe("Due date (ISO string)"),
  taskId: z
    .string()
    .optional()
    .describe("Task ID (required for delete/toggle/move)"),
  status: z
    .enum(["todo", "in_progress", "done"])
    .optional()
    .describe("Target status (required for move)"),
});

const server = new McpServer(
  { name: "todo-app", version: "0.0.1" },
  { capabilities: {} },
)
  .registerWidget(
    "manage-tasks",
    {
      description: "View and manage your to-do list",
      _meta: {
        ui: {
          csp: {
            resourceDomains: ["https://fonts.googleapis.com"],
            connectDomains: [env.SUPABASE_URL],
          },
        },
      },
    },
    {
      description:
        "Call with no arguments to display the user's task board. Pass an `actions` array to add, move, or delete tasks — all actions are applied before returning the updated list.",
      inputSchema: {
        actions: z
          .array(ActionSchema)
          .optional()
          .describe("Actions to perform before returning the task list"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ actions }, extra) => {
      const nodeEnv = process.env.NODE_ENV || "development";
      let userId = (extra.authInfo?.extra as any)?.userId as string | undefined;

      // In development, use a test user if not authenticated
      if (!userId && nodeEnv !== "production") {
        userId = "dev-user";
      }

      if (!userId) {
        return {
          content: [
            { type: "text", text: "Please sign in to manage your tasks." },
          ],
          isError: true,
          _meta: {
            "mcp/www_authenticate": [
              `Bearer resource_metadata="${SERVER_URL}/.well-known/oauth-protected-resource/mcp"`,
            ],
          },
        };
      }

      if (actions && actions.length > 0) {
        await executeActions(userId, actions);
      }

      const { tasks, error } = await fetchTasks(userId);

      if (error) {
        return {
          content: [
            { type: "text", text: `Error fetching tasks: ${error.message}` },
          ],
          isError: true,
        };
      }

      const todo = tasks.filter((t) => t.status === "todo").length;
      const inProgress = tasks.filter((t) => t.status === "in_progress").length;
      const done = tasks.filter((t) => t.status === "done").length;

      return {
        structuredContent: { tasks },
        content: [
          {
            type: "text",
            text: `${todo} todo, ${inProgress} in progress, ${done} done. ${tasks.length} total tasks.`,
          },
        ],
      };
    },
  )
  .registerWidget(
    "webcam-test",
    {
      description: "Test webcam streaming in an MCP App",
      _meta: {
        ui: {
          permissions: {
            camera: {},
          },
        },
      },
    },
    {
      description:
        "Opens a webcam test widget to verify camera streaming works in MCP Apps.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Webcam test widget loaded. Click 'Start Webcam' to test camera access.",
          },
        ],
      };
    },
  )
  .registerWidget(
    "bug-reporter",
    {
      description: "Capture screenshots to help debug UI issues",
      _meta: {
        ui: {
          permissions: {
            "display-capture": {},
          },
        },
      },
    },
    {
      description:
        "Opens a bug reporter widget that captures screenshots for Claude to analyze. Use this when the user wants help debugging a visual bug or UI issue.",
      inputSchema: {
        action: z
          .enum(["open", "analyze"])
          .optional()
          .describe(
            "Action to perform - 'open' shows the widget, 'analyze' processes a screenshot",
          ),
        image: z
          .string()
          .optional()
          .describe("Base64 encoded image data (for analyze action)"),
        description: z
          .string()
          .optional()
          .describe("User's description of the bug"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ action, image, description }) => {
      if (action === "analyze" && image) {
        // Extract base64 data (remove data:image/png;base64, prefix if present)
        const base64Data = image.includes(",") ? image.split(",")[1] : image;

        return {
          content: [
            {
              type: "text",
              text: description
                ? `User reports: "${description}"\n\nPlease analyze this screenshot and identify any UI bugs, layout issues, or visual problems.`
                : "Please analyze this screenshot and identify any UI bugs, layout issues, or visual problems.",
            },
            {
              type: "image",
              data: base64Data,
              mimeType: "image/png",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "Bug reporter ready. Capture a screenshot of the issue you're seeing.",
          },
        ],
      };
    },
  )
  .registerWidget(
    "knowledge-graph",
    {
      description: "Visualize and explore a Neo4j knowledge graph",
    },
    {
      description:
        "Opens an interactive visualization of the Lord of the Rings knowledge graph. Shows characters, locations, items, events, and their relationships.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      try {
        const graphData = await fetchFullGraph();

        const nodeCount = graphData.nodes.length;
        const edgeCount = graphData.edges.length;

        // Group nodes by type for summary
        const nodeTypes: Record<string, number> = {};
        for (const node of graphData.nodes) {
          nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
        }

        const typeSummary = Object.entries(nodeTypes)
          .map(([type, count]) => `${count} ${type}`)
          .join(", ");

        return {
          structuredContent: graphData,
          content: [
            {
              type: "text",
              text: `Knowledge Graph loaded: ${nodeCount} nodes (${typeSummary}), ${edgeCount} relationships.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error loading knowledge graph: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

export default server;
export type AppType = typeof server;
