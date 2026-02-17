import { McpServer } from "skybridge/server";
import { z } from "zod";
import { env } from "./env.js";
import { executeActions, fetchTasks } from "./supabase.js";

const SERVER_URL = "http://localhost:3000";

const ActionSchema = z.object({
  type: z.enum(["add", "delete", "toggle", "move"]),
  title: z.string().optional().describe("Task title (required for add)"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Task priority"),
  dueDate: z.string().optional().describe("Due date (ISO string)"),
  taskId: z.string().optional().describe("Task ID (required for delete/toggle/move)"),
  status: z.enum(["todo", "in_progress", "done"]).optional().describe("Target status (required for move)"),
});

const server = new McpServer(
  { name: "todo-app", version: "0.0.1" },
  { capabilities: {} },
).registerWidget(
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
      "Manage tasks: view all, add new, toggle completion, or delete. Supports batch actions in a single call.",
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
    const userId = (extra.authInfo?.extra as any)?.userId as
      | string
      | undefined;

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
);

export default server;
export type AppType = typeof server;
